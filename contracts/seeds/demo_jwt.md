# Demo JWT

## Claims contract

```json
{
  "iss": "https://auth.nebulastack.local",
  "sub": "11111111-aaaa-bbbb-cccc-111111111111",
  "aud": "nebulastack-api",
  "tenant_id": "2a7f8e12-32a1-4b12-98ab-1234567890ab",
  "roles": ["tenant_admin", "scheduler"],
  "email": "admin@demo-tenant.example"
}
```

## Issue locally

```bash
# from repo root, with JWT_SECRET set (never commit the secret)
./deploy/scripts/issue-demo-jwt.sh
# or
curl -s -X POST http://localhost:8080/api/v1/auth/token \
  -H 'content-type: application/json' \
  -d '{"grant_type":"client_credentials","tenant_slug":"demo-salon","client_id":"demo-client","client_secret":"demo-secret"}'
```

Gateway overwrites any client `x-tenant-id` using the `tenant_id` claim.
