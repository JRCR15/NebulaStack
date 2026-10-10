# C4 — Containers

| Container | Tech | Responsibility |
|-----------|------|----------------|
| api-gateway | TypeScript / Fastify | JWT validation, `x-tenant-id` injection, rate limit, reverse proxy |
| auth-tenant-service | TypeScript / Fastify | Demo token issuance, tenant metadata |
| catalog-service | TypeScript / Fastify | Bookable services and prices (PostgreSQL) |
| scheduling-engine | Python / FastAPI | Hold lock, appointment FSM, outbox |
| payment-orchestrator | TypeScript FaaS | Saga charge + Circuit Breaker |
| notification-service | TypeScript FaaS | Confirmations to Mongo + WhatsApp mock |
| external-mocks | TypeScript / Fastify | Payment / WhatsApp / OpenAI fakes |
| ai-service | stub | Out of D4 E2E path |
| CoreDB | PostgreSQL 15 | Tenants, catalog, appointments, outbox + RLS |
| ReservationCache | Redis 7 | Slot locks + rate limits |
| MessageDocDB | MongoDB 6 | conversation_logs |
| Broker | RabbitMQ local / SQS AWS | CloudEvents transport |

## Local ports (Compose)

| Service | Port |
|---------|------|
| api-gateway | 8080 |
| auth-tenant-service | 8082 |
| catalog-service | 8083 |
| scheduling-engine | 8081 |
| payment-orchestrator | 8084 |
| notification-service | 8085 |
| external-mocks | 8090 |
| postgres | 5432 |
| redis | 6379 |
| rabbitmq | 5672 (mgmt 15672) |
| mongo | 27017 |
