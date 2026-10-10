# api-gateway — integration

Contracts: `contracts/openapi/gateway-routes.yaml`

| Upstream path | Downstream |
|---------------|------------|
| `/api/v1/auth/*` | auth-tenant-service:8082 |
| `/api/v1/tenants/*` | auth-tenant-service:8082 |
| `/api/v1/catalog/*` | catalog-service:8083 |
| `/api/v1/schedules/*` | scheduling-engine:8081 |

Public auth token endpoint skips JWT validation.
