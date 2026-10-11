# QAS demo procedures

Interactive UI: [http://localhost:3000](http://localhost:3000)

## Bootstrap local (stack real + stub externo)

Los microservicios, Postgres, Redis, Mongo y RabbitMQ son reales. Solo cobro/WhatsApp HTTP viven en `external-mocks` (contrato externo, no un mock del dominio).

```powershell
cd deploy/compose
copy .env.example .env   # si aún no existe
docker compose down -v   # recrea BD si cambian seeds/SQL
docker compose up --build -d
```

Espera healthchecks (`http://localhost:8080/healthz`) y luego ejecuta los E2E desde la raíz del repo.

## E2E + verificación de BD

El script [`deploy/scripts/e2e-hold-pay-notify.ps1`](../deploy/scripts/e2e-hold-pay-notify.ps1) hace hold → poll API y luego asserts en:

| Store | Qué valida |
|-------|------------|
| Postgres `appointments` | `status`, `service_id`, `customer_email` |
| Postgres `outbox_events` | `nebula.scheduling.hold.created` con `processed = true` |
| Mongo `conversation_logs` | documento `SENT` (solo si `CONFIRMED`) |
| Redis | lock liberado si `CANCELLED`; en `CONFIRMED` el lock puede quedar hasta el HOLD TTL |

Inspección manual de un `hold_id`:

```powershell
.\deploy\scripts\verify-persistence.ps1 -HoldId "<uuid>"
```

### Matriz de escenarios

| Escenario | Comando | Assert clave |
|-----------|---------|--------------|
| Happy CDA | `.\deploy\scripts\e2e-hold-pay-notify.ps1` | `CONFIRMED` + Mongo SENT |
| Happy Odonto | `.\deploy\scripts\e2e-hold-pay-notify.ps1 -TenantSlug odonto -ServiceId "0d011111-1111-4111-8111-111111111111"` | `CONFIRMED` tenant odonto |
| Saga fail | `.\deploy\scripts\e2e-hold-pay-notify.ps1 -ServiceId "cda66666-6666-4666-8666-666666666666" -ExpectedStatus CANCELLED` | `CANCELLED` + Redis liberado |
| Circuit breaker | `.\deploy\scripts\e2e-hold-pay-notify.ps1 -ServiceId "cda99999-9999-4999-8999-999999999999" -ExpectedStatus CANCELLED` | `CANCELLED` + Redis liberado |

Bash equivalente: `TENANT_SLUG=… SERVICE_ID=… EXPECTED_STATUS=… ./deploy/scripts/e2e-hold-pay-notify.sh`

Escape hatch: `-SkipDbAsserts` / `SKIP_DB_ASSERTS=1`.

## QAS — no double booking

1. Issue two concurrent `POST /api/v1/schedules/hold` with same `service_id` + `start_time` (same tenant).
2. Expect one `201` and one `409`.
3. Verify single Redis key owner and single `HOLD`/`CONFIRMED` appointment.

## QAS — Circuit Breaker (Delivery 4 required tactic)

1. Hold using probe priced `999000` COP (CDA `cda99999-…` or Odonto `0d099999-…`).
2. Mock delays 5s / returns 504; payment Circuit Breaker times out (3s).
3. Expect `nebula.payment.failed` and appointment `CANCELLED`.

## QAS — Saga compensation

1. Hold using probe priced `666000` COP.
2. Mock returns `402 INSUFFICIENT_FUNDS`.
3. Expect `CANCELLED` and Redis lock released.

## QAS — tenant isolation (CDA vs Odonto)

1. Authenticate as `cda` → catalog shows only automotive services.
2. Authenticate as `odonto` → catalog shows only dental services.
3. JWT for tenant A cannot read tenant B appointments (RLS + gateway overwrites `x-tenant-id`).
