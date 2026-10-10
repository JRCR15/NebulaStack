# api-gateway — design

Edge reverse proxy for NebulaStack.

## Responsibilities

- Validate JWT (`iss`, `aud`, `exp`, required `tenant_id` claim).
- Overwrite `x-tenant-id` from claim (ignore client value).
- Propagate / generate `x-correlation-id`.
- Token-bucket rate limit per tenant in Redis (`tenant:{id}:ratelimit`, 100 rps default).
- Proxy routes defined in `contracts/openapi/gateway-routes.yaml`.

## Non-responsibilities

Business logic for scheduling, payments, catalog.

## Runtime

TypeScript / Fastify container on ECS (AWS) or Compose (local).
