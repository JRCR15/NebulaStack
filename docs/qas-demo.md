# QAS demo procedures

## QAS — no double booking

1. Issue two concurrent `POST /api/v1/schedules/hold` with same `service_id` + `start_time`.
2. Expect one `201` and one `409`.
3. Verify single Redis key owner and single `HOLD`/`CONFIRMED` appointment.

## QAS — Circuit Breaker (Delivery 4 required tactic)

1. Hold using catalog service priced `999.00` (mock delays 5s / 504).
2. Observe payment-orchestrator breaker open / fallback.
3. Expect `nebula.payment.failed` and appointment `CANCELLED`.

## QAS — Saga compensation

1. Hold using catalog service priced `666.00`.
2. Mock returns `402 INSUFFICIENT_FUNDS`.
3. Expect `CANCELLED` and Redis lock released.

## QAS — tenant isolation

1. JWT for tenant A cannot read tenant B appointments/catalog (RLS + gateway overwrite).
