# Integration matrix

| Producer | Contract | Consumer | Notes |
|----------|----------|----------|-------|
| Client | `POST /api/v1/auth/token` | auth-tenant-service | Returns JWT with `tenant_id` |
| Client | `POST /api/v1/schedules/hold` | api-gateway → scheduling-engine | Headers: `Authorization`, `Idempotency-Key` |
| api-gateway | injects `x-tenant-id`, `x-correlation-id` | downstream HTTP services | Client-supplied `x-tenant-id` overwritten |
| scheduling-engine | reads catalog | catalog-service or CoreDB `catalog_services` | Resolves `price_amount` |
| scheduling-engine | Redis `SET NX PX` | Redis | Key `tenant:{tenant_id}:slot:{service_id}:{start_time}` |
| scheduling-engine | outbox → `nebula.scheduling.hold.created` | payment-orchestrator | CloudEvents JSON |
| payment-orchestrator | `POST /v1/charge` | external-mocks | Circuit Breaker (opossum) |
| payment-orchestrator | `nebula.payment.succeeded` | notification-service | Happy path |
| payment-orchestrator | `nebula.payment.failed` | scheduling-engine | Compensation → `CANCELLED` |
| notification-service | Mongo insert | MessageDocDB | `conversation_logs` |
| notification-service | `POST /v1/whatsapp/messages` | external-mocks | Exponential backoff on 500 |
| notification-service | HTTP callback / event | scheduling-engine | Transition `PAID` → `CONFIRMED` |

## Shared headers

| Header | Required | Set by |
|--------|----------|--------|
| `Authorization` | Yes (gateway) | Client |
| `Idempotency-Key` | Yes (mutations) | Client |
| `x-tenant-id` | Yes (downstream) | api-gateway from JWT |
| `x-correlation-id` | Yes | api-gateway (or propagate) |

## Error model

Problem details RFC 7807 (`application/problem+json`) for HTTP 4xx/5xx on public APIs.
