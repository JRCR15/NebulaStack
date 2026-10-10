# NebulaStack

Multi-tenant B2B scheduling SaaS prototype (Delivery 4). Contract-first monorepo with local Docker Compose and Terraform for AWS.

## Quick start (local)

Prerequisites: Docker Desktop, Compose v2.

```powershell
cd deploy/compose
copy .env.example .env
docker compose up --build -d
```

Wait until `api-gateway` is healthy, then:

```powershell
cd ../..
.\deploy\scripts\e2e-hold-pay-notify.ps1
```

Happy path uses catalog service `11111111-1111-1111-1111-111111111111` (`price_amount=75` → `CONFIRMED`).

Compensation demo:

```powershell
.\deploy\scripts\e2e-hold-pay-notify.ps1 -ServiceId "22222222-2222-2222-2222-222222222222" -ExpectedStatus "CANCELLED"
```

Circuit Breaker demo (`999` amount / timeout):

```powershell
.\deploy\scripts\e2e-hold-pay-notify.ps1 -ServiceId "33333333-3333-3333-3333-333333333333" -ExpectedStatus "CANCELLED"
```

Gateway: `http://localhost:8080`  
RabbitMQ UI: `http://localhost:15672` (guest/guest)

## Architecture

See:

- [docs/baseline-d4.md](docs/baseline-d4.md)
- [docs/architecture/integration-matrix.md](docs/architecture/integration-matrix.md)
- [docs/architecture/fsm-appointment.md](docs/architecture/fsm-appointment.md)

### Services

| Path | Lang | Role |
|------|------|------|
| `services/api-gateway` | TypeScript | JWT, `x-tenant-id`, rate limit, proxy |
| `services/auth-tenant-service` | TypeScript | Demo tokens + tenants |
| `services/catalog-service` | TypeScript | Bookable services / prices |
| `services/scheduling-engine` | Python FastAPI | Hold + Outbox + FSM |
| `services/payment-orchestrator` | TypeScript FaaS | Saga + Circuit Breaker |
| `services/notification-service` | TypeScript FaaS | Mongo + WhatsApp mock |
| `services/external-mocks` | TypeScript | Payment / WhatsApp / OpenAI fakes |
| `services/ai-service` | stub | Post-D4 |

### Contracts

Canonical specs live under [`contracts/`](contracts/) (OpenAPI, CloudEvents, SQL+RLS, Mongo).

### Appointment states (English only)

`CREATED` → `HOLD` → `PAID` → `CONFIRMED` (+ `EXPIRED` / `CANCELLED`)

## Terraform / secrets

See [infra/terraform/README.md](infra/terraform/README.md).

```bash
export TF_VAR_db_password='...'
export TF_VAR_jwt_secret='...'
cd infra/terraform
terraform init
terraform plan -var-file=env/staging.tfvars
```

Never commit `.env`, `*.tfvars`, or plaintext passwords.

## Demo credentials (local only)

- Tenant slug: `demo-salon`
- Client: `demo-client` / `demo-secret`
- JWT secret: from `.env` (`JWT_SECRET`)
