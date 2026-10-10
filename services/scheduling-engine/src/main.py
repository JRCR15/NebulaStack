import asyncio
import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import aio_pika
import asyncpg
import redis.asyncio as redis
from fastapi import FastAPI, Header, HTTPException, Response
from pydantic import BaseModel, EmailStr, Field

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://nebulastack:change-me-local@postgres:5432/nebulastack"
)
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
HOLD_TTL_SECONDS = int(os.getenv("HOLD_TTL_SECONDS", "120"))
EXCHANGE_NAME = "nebulastack.events"

app = FastAPI(title="scheduling-engine")
db_pool: Optional[asyncpg.Pool] = None
redis_client: Optional[redis.Redis] = None
rabbit_connection: Optional[aio_pika.RobustConnection] = None
rabbit_channel: Optional[aio_pika.Channel] = None
exchange: Optional[aio_pika.Exchange] = None


class HoldSlotRequest(BaseModel):
    service_id: uuid.UUID
    start_time: datetime
    customer_email: EmailStr
    customer_phone: Optional[str] = None


class PaymentResult(BaseModel):
    appointment_id: uuid.UUID
    tenant_id: uuid.UUID
    outcome: str = Field(description="SUCCEEDED | FAILED | CONFIRMED")
    transaction_id: Optional[str] = None
    reason: Optional[str] = None


def problem(status: int, title: str, detail: str) -> HTTPException:
    return HTTPException(
        status_code=status,
        detail={"type": "about:blank", "title": title, "status": status, "detail": detail},
    )


async def set_tenant(conn: asyncpg.Connection, tenant_id: str) -> None:
    await conn.execute("SELECT set_config('app.current_tenant_id', $1, true)", tenant_id)


async def publish_event(event: dict[str, Any]) -> None:
    assert exchange is not None
    routing_key = event["type"]
    body = json.dumps(event).encode()
    await exchange.publish(
        aio_pika.Message(body=body, content_type="application/json", delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
        routing_key=routing_key,
    )


async def outbox_publisher_loop() -> None:
    assert db_pool is not None
    while True:
        try:
            async with db_pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT id, tenant_id, event_type, payload
                    FROM outbox_events
                    WHERE processed = FALSE
                    ORDER BY created_at
                    LIMIT 20
                    """
                )
                for row in rows:
                    await set_tenant(conn, str(row["tenant_id"]))
                    payload = row["payload"]
                    if isinstance(payload, str):
                        payload = json.loads(payload)
                    await publish_event(payload)
                    await conn.execute(
                        "UPDATE outbox_events SET processed = TRUE WHERE id = $1", row["id"]
                    )
        except Exception as exc:  # noqa: BLE001
            print(f"outbox publisher error: {exc}")
        await asyncio.sleep(1)


async def payment_consumer_loop() -> None:
    assert rabbit_channel is not None
    queue = await rabbit_channel.declare_queue("scheduling.payment.results", durable=True)
    await queue.bind(exchange, routing_key="nebula.payment.succeeded")
    await queue.bind(exchange, routing_key="nebula.payment.failed")

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                event = json.loads(message.body.decode())
                data = event.get("data", {})
                outcome = "SUCCEEDED" if event["type"].endswith("succeeded") else "FAILED"
                # Event consumer only moves HOLD → PAID / CANCELLED.
                # Notification service calls HTTP with outcome=CONFIRMED afterwards.
                await apply_payment_result(
                    PaymentResult(
                        appointment_id=uuid.UUID(data["appointment_id"]),
                        tenant_id=uuid.UUID(data["tenant_id"]),
                        outcome=outcome,
                        transaction_id=data.get("transaction_id"),
                        reason=data.get("reason"),
                    )
                )


@app.on_event("startup")
async def startup() -> None:
    global db_pool, redis_client, rabbit_connection, rabbit_channel, exchange
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    last_err: Exception | None = None
    for attempt in range(30):
        try:
            rabbit_connection = await aio_pika.connect_robust(RABBITMQ_URL)
            rabbit_channel = await rabbit_connection.channel()
            exchange = await rabbit_channel.declare_exchange(
                EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=True
            )
            last_err = None
            break
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            print(f"rabbit connect retry {attempt + 1}/30: {exc}")
            await asyncio.sleep(2)
    if last_err:
        raise last_err
    asyncio.create_task(outbox_publisher_loop())
    asyncio.create_task(payment_consumer_loop())


@app.on_event("shutdown")
async def shutdown() -> None:
    if rabbit_connection:
        await rabbit_connection.close()
    if redis_client:
        await redis_client.close()
    if db_pool:
        await db_pool.close()


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "scheduling-engine"}


@app.get("/readyz")
async def readyz() -> dict[str, str]:
    assert db_pool is not None and redis_client is not None
    async with db_pool.acquire() as conn:
        await conn.fetchval("SELECT 1")
    await redis_client.ping()
    return {"status": "ready"}


@app.post("/api/v1/schedules/hold", status_code=201)
async def hold_slot(
    body: HoldSlotRequest,
    response: Response,
    x_tenant_id: str = Header(...),
    idempotency_key: uuid.UUID = Header(..., alias="Idempotency-Key"),
    x_correlation_id: Optional[str] = Header(None),
) -> dict[str, Any]:
    assert db_pool is not None and redis_client is not None
    start = body.start_time
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    start_key = start.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    redis_key = f"tenant:{x_tenant_id}:slot:{body.service_id}:{start_key}"
    hold_token = str(uuid.uuid4())

    async with db_pool.acquire() as conn:
        async with conn.transaction():
            await set_tenant(conn, x_tenant_id)
            existing = await conn.fetchrow(
                "SELECT id, status, start_time, service_id, amount, currency FROM appointments WHERE idempotency_key = $1",
                idempotency_key,
            )
            if existing:
                expires_at = existing["start_time"]  # placeholder; return held entity
                return {
                    "hold_id": str(existing["id"]),
                    "tenant_id": x_tenant_id,
                    "service_id": str(existing["service_id"]),
                    "start_time": existing["start_time"].isoformat(),
                    "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=HOLD_TTL_SECONDS)).isoformat(),
                    "status": existing["status"],
                    "amount": float(existing["amount"]),
                    "currency": existing["currency"],
                }

            service = await conn.fetchrow(
                """
                SELECT id, duration_minutes, price_amount::float8 AS price_amount, currency, status
                FROM catalog_services WHERE id = $1 AND status = 'ACTIVE'
                """,
                body.service_id,
            )
            if not service:
                raise problem(422, "Unprocessable Entity", "Unknown or inactive service_id")

            acquired = await redis_client.set(redis_key, hold_token, nx=True, ex=HOLD_TTL_SECONDS)
            if not acquired:
                raise problem(409, "Conflict", "SLOT_ALREADY_LOCKED")

            appointment_id = uuid.uuid4()
            end_time = start + timedelta(minutes=int(service["duration_minutes"]))
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=HOLD_TTL_SECONDS)
            amount = float(service["price_amount"])
            currency = service["currency"]

            try:
                await conn.execute(
                    """
                    INSERT INTO appointments (
                        id, tenant_id, service_id, customer_email, customer_phone,
                        start_time, end_time, status, amount, currency, idempotency_key
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'HOLD',$8,$9,$10)
                    """,
                    appointment_id,
                    uuid.UUID(x_tenant_id),
                    body.service_id,
                    body.customer_email,
                    body.customer_phone,
                    start,
                    end_time,
                    amount,
                    currency,
                    idempotency_key,
                )

                cloud_event = {
                    "specversion": "1.0",
                    "type": "nebula.scheduling.hold.created",
                    "source": f"/scheduling-engine/tenants/{x_tenant_id}",
                    "id": str(uuid.uuid4()),
                    "time": datetime.now(timezone.utc).isoformat(),
                    "datacontenttype": "application/json",
                    "idempotency_key": str(idempotency_key),
                    "data": {
                        "appointment_id": str(appointment_id),
                        "tenant_id": x_tenant_id,
                        "service_id": str(body.service_id),
                        "customer_email": body.customer_email,
                        "customer_phone": body.customer_phone,
                        "start_time": start.isoformat(),
                        "amount": amount,
                        "currency": currency,
                        "status": "HOLD",
                        "expires_at": expires_at.isoformat(),
                        "payment_method_id": "pm_card_visa_mock",
                        "correlation_id": x_correlation_id,
                    },
                }
                await conn.execute(
                    """
                    INSERT INTO outbox_events (
                        tenant_id, aggregate_type, aggregate_id, event_type, payload
                    ) VALUES ($1,'APPOINTMENT',$2,'nebula.scheduling.hold.created',$3::jsonb)
                    """,
                    uuid.UUID(x_tenant_id),
                    appointment_id,
                    json.dumps(cloud_event),
                )
            except Exception:
                await redis_client.delete(redis_key)
                raise

    response.headers["x-tenant-id"] = x_tenant_id
    return {
        "hold_id": str(appointment_id),
        "tenant_id": x_tenant_id,
        "service_id": str(body.service_id),
        "start_time": start.isoformat(),
        "expires_at": expires_at.isoformat(),
        "status": "HOLD",
        "amount": amount,
        "currency": currency,
    }


@app.get("/api/v1/schedules/appointments/{appointment_id}")
async def get_appointment(
    appointment_id: uuid.UUID,
    x_tenant_id: str = Header(...),
) -> dict[str, Any]:
    assert db_pool is not None
    async with db_pool.acquire() as conn:
        # set_config(..., is_local=true) only survives inside a transaction
        async with conn.transaction():
            await set_tenant(conn, x_tenant_id)
            row = await conn.fetchrow(
                """
                SELECT id, tenant_id, service_id, customer_email, start_time, end_time,
                       status, amount::float8 AS amount, currency
                FROM appointments WHERE id = $1
                """,
                appointment_id,
            )
    if not row:
        raise problem(404, "Not Found", "Appointment not found")
    return {
        "id": str(row["id"]),
        "tenant_id": str(row["tenant_id"]),
        "service_id": str(row["service_id"]),
        "customer_email": row["customer_email"],
        "start_time": row["start_time"].isoformat(),
        "end_time": row["end_time"].isoformat(),
        "status": row["status"],
        "amount": float(row["amount"]),
        "currency": row["currency"],
    }


@app.post("/api/v1/schedules/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: uuid.UUID,
    x_tenant_id: str = Header(...),
) -> dict[str, Any]:
    result = await apply_payment_result(
        PaymentResult(
            appointment_id=appointment_id,
            tenant_id=uuid.UUID(x_tenant_id),
            outcome="FAILED",
            reason="EXPLICIT_CANCEL",
        )
    )
    return result


@app.post("/internal/events/payment-result")
async def payment_result_http(body: PaymentResult) -> dict[str, Any]:
    return await apply_payment_result(body)


async def apply_payment_result(body: PaymentResult) -> dict[str, Any]:
    assert db_pool is not None and redis_client is not None
    tenant_id = str(body.tenant_id)
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            await set_tenant(conn, tenant_id)
            row = await conn.fetchrow(
                "SELECT id, service_id, start_time, status FROM appointments WHERE id = $1",
                body.appointment_id,
            )
            if not row:
                raise problem(404, "Not Found", "Appointment not found")

            start_key = row["start_time"].astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            redis_key = f"tenant:{tenant_id}:slot:{row['service_id']}:{start_key}"

            if body.outcome == "SUCCEEDED":
                # Payment saga success → PAID; notification path promotes to CONFIRMED.
                new_status = "PAID"
                await conn.execute(
                    "UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2",
                    new_status,
                    body.appointment_id,
                )
            elif body.outcome == "CONFIRMED":
                new_status = "CONFIRMED"
                await conn.execute(
                    "UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2",
                    new_status,
                    body.appointment_id,
                )
            else:
                new_status = "CANCELLED"
                await conn.execute(
                    "UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2",
                    new_status,
                    body.appointment_id,
                )
                await redis_client.delete(redis_key)

    return {
        "id": str(body.appointment_id),
        "tenant_id": tenant_id,
        "status": new_status,
        "reason": body.reason,
        "transaction_id": body.transaction_id,
    }
