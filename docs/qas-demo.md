# QAS demo procedures

Interactive UI: [http://localhost:3000](http://localhost:3000)

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
