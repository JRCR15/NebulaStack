# NebulaStack — Delivery 4 Baseline

## Scope

Prototype that materializes the Team B design (D1–D3) for Delivery 4:

- End-to-end scenario: authenticate → hold slot → payment saga → notification (or compensating cancel).
- Patterns: API Gateway, Redis `SET NX PX` lock, Transactional Outbox, Saga, Circuit Breaker.
- At least two FaaS components: `payment-orchestrator`, `notification-service`.
- Persistence paradigms: PostgreSQL (+ RLS), Redis, MongoDB, message broker.
- Containers locally via Docker Compose; AWS via Terraform (no hardcoded secrets).

## Frozen decisions

| Topic | Decision |
|-------|----------|
| Repo layout | Single monorepo |
| Catalog store | PostgreSQL CoreDB (not Mongo) |
| Async workers | FaaS (Lambda on AWS; containerized handlers locally) |
| Local broker | RabbitMQ |
| AWS broker | SQS with identical CloudEvents JSON |
| Languages | TypeScript (gateway, auth, catalog, payment, notification, mocks); Python FastAPI (scheduling) |
| Appointment FSM | English enums only: `CREATED`, `HOLD`, `PAID`, `CONFIRMED`, `EXPIRED`, `CANCELLED` |

## Demo scenario (happy path)

1. Obtain JWT from `auth-tenant-service` (`POST /api/v1/auth/token`).
2. `POST /api/v1/schedules/hold` through `api-gateway` with `Authorization` + `Idempotency-Key`.
3. Scheduling locks Redis key, writes appointment `HOLD` + outbox event.
4. Payment FaaS charges mock gateway (`price_amount = 75`) → `nebula.payment.succeeded`.
5. Notification FaaS writes Mongo log + WhatsApp mock → appointment `CONFIRMED`.

## Demo scenario (compensation)

Use catalog service with `price_amount = 666` → mock returns payment failure → `nebula.payment.failed` → scheduling sets `CANCELLED` and releases Redis lock.

## QA tactic (demonstrable)

Circuit Breaker on payment outbound calls: catalog/service amount `999` (or mock delay) opens breaker (3s timeout, 50% error threshold, 10s reset).

## Out of scope for D4 critical path

- Full conversational `ai-service` (contract/docs stub only).
- Chaos Mesh / multi-AZ failover labs (optional stretch).
- Production OIDC provider (demo JWT stub is sufficient).

## Delivery evidence checklist

- [ ] `docker compose up` healthy stack
- [ ] E2E script green (happy + compensation)
- [ ] Circuit Breaker reproducible
- [ ] Terraform modules + `TF_VAR_*` secrets workflow
- [ ] Repository link + README demo steps
