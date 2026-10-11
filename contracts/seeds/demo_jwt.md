# Demo JWT — multi-tenant

## Tenants

| Slug | Name | Tenant ID |
|------|------|-----------|
| `cda` | CDA Colombia | `cda00000-0000-4000-8000-000000000001` |
| `odonto` | Clínica Odontológica Sonrisa Andina | `0d071000-0000-4000-8000-000000000001` |

## Claims contract

```json
{
  "iss": "https://auth.nebulastack.local",
  "sub": "user-uuid-per-tenant",
  "aud": "nebulastack-api",
  "tenant_id": "<tenant uuid>",
  "roles": ["tenant_admin", "scheduler"],
  "email": "admin@cda.example"
}
```

## Workspace login (password grant)

Usuarios de prueba para la UI (`http://localhost:3000`):

| Email | Password | Tenant |
|-------|----------|--------|
| `admin@cda.example` | `Demo123!` | `cda` |
| `admin@odonto.example` | `Demo123!` | `odonto` |

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/token \
  -H 'content-type: application/json' \
  -d '{"grant_type":"password","tenant_slug":"cda","username":"admin@cda.example","password":"Demo123!"}'
```

## Issue locally (client_credentials — scripts E2E)

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/token \
  -H 'content-type: application/json' \
  -d '{"grant_type":"client_credentials","tenant_slug":"cda","client_id":"demo-client","client_secret":"demo-secret"}'
```

Use `tenant_slug":"odonto"` for the dental clinic.

Gateway overwrites any client `x-tenant-id` using the `tenant_id` claim.

## Catalog service IDs (happy path)

| Tenant | Service | ID | Amount COP |
|--------|---------|-----|------------|
| cda | Revisión tecnomecánica | `cda11111-1111-4111-8111-111111111111` | 150000 |
| odonto | Limpieza dental | `0d011111-1111-4111-8111-111111111111` | 120000 |
| either | Saga probe | `*66666-...` | 666000 |
| either | Circuit Breaker probe | `*99999-...` | 999000 |
