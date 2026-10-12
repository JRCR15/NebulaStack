# NebulaStack — Delivery 4 Baseline

## Scope

Prototype that materializes the Team B design (D1–D3) for Delivery 4:

- End-to-end scenario: authenticate → hold slot → payment saga → notification (or compensating cancel).
- Patterns: API Gateway, Redis `SET NX PX` lock, Transactional Outbox, Saga, Circuit Breaker.
- At least two FaaS components: `payment-orchestrator`, `notification-service`.
- Persistence paradigms: PostgreSQL (+ RLS), Redis, MongoDB, message broker.
- Containers locally via Docker Compose; AWS via Terraform (no hardcoded secrets).
- **Build & Deployment:** blue-green cutover demonstrable locally (edge nginx + blue/green app fleets); single-stack Compose remains the dev/E2E path. See [deployment-blue-green.md](deployment-blue-green.md).
- Interactive HTML demo at `http://localhost:3000` with two Colombian tenants.

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
| Demo tenants | `cda` (CDA Colombia) and `odonto` (Clínica Odontológica Sonrisa Andina) |

## Demo tenants

| Slug | Business | Currency |
|------|----------|----------|
| `cda` | Centro de Diagnóstico Automotriz | COP |
| `odonto` | Clínica odontológica | COP |

Interactive presentation: [deploy/demo](../deploy/demo) → `http://localhost:3000`.

## Demo scenario (happy path)

1. Obtain JWT (`tenant_slug=cda` or `odonto`) via gateway.
2. `POST /api/v1/schedules/hold` with `Authorization` + `Idempotency-Key`.
3. Scheduling locks Redis, writes appointment `HOLD` + outbox event.
4. Payment FaaS charges mock (`150000` / `120000` COP) → `nebula.payment.succeeded`.
5. Notification FaaS writes Mongo + WhatsApp mock → `CONFIRMED`.

## Demo scenario (compensation)

Catalog probe `price_amount = 666000` → mock `402` → `nebula.payment.failed` → `CANCELLED` + Redis unlock.

## QA tactic (demonstrable)

Circuit Breaker: probe `999000` → mock delay 5s / 504; breaker timeout 3s → `CANCELLED`.

## Out of scope for D4 critical path

- Full conversational `ai-service` (contract/docs stub only).
- Chaos Mesh / multi-AZ failover labs (optional stretch).
- Production OIDC provider (demo JWT stub is sufficient).

## Delivery evidence checklist

- [ ] `docker compose up` healthy stack (+ `demo-ui` on :3000) **or** `bg-up.ps1` via edge
- [ ] HTML demo steps CDA → Odonto → compensation → CB
- [ ] E2E script green (single-stack)
- [ ] Circuit Breaker reproducible
- [ ] Blue-green: `bg-deploy` switches standby; `bg-switch` rollback
- [ ] Terraform: `infra/terraform/validate.ps1` (+ `TF_VAR_*` workflow; no paid apply required)
- [ ] Repository link + README demo steps
