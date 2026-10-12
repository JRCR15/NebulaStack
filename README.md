# NebulaStack

Multi-tenant B2B scheduling SaaS prototype (Delivery 4). Contract-first monorepo with local Docker Compose and Terraform for AWS.

## Interactive demo (recommended)

Prerequisites: Docker Desktop, Compose v2.

### Dev / E2E single-stack

```powershell
cd deploy/compose
copy .env.example .env   # if needed
docker compose down -v   # recreate DB when seeds change
docker compose up --build -d
```

### Blue-green deployment demo (Unit 6)

Traffic via edge nginx; two app fleets share one data plane. See [docs/deployment-blue-green.md](docs/deployment-blue-green.md).

```powershell
# Stop single-stack first if :3000/:8080 are busy
cd deploy\compose; docker compose down; cd ..\..
.\deploy\scripts\bg-up.ps1
.\deploy\scripts\bg-deploy.ps1          # build standby (git SHA), switch
.\deploy\scripts\bg-switch.ps1 -Color blue   # rollback
.\deploy\scripts\bg-status.ps1
```

Open the presentation: **[http://localhost:3000](http://localhost:3000)**

1. **Pitch comercial** (clientes): producto → arquitectura justificada → CTA  
2. **Workspace PoC**: login (`admin@cda.example` / `admin@odonto.example` · `Demo123!`) → servicios de negocio → confirmar cita → panel Actividad; “Qué pasa si…” y detalle técnico opcionales

Guion: [deploy/demo/README.md](deploy/demo/README.md).

## CLI E2E

```powershell
cd ../..   # repo root
.\deploy\scripts\e2e-hold-pay-notify.ps1
# Odonto happy path:
.\deploy\scripts\e2e-hold-pay-notify.ps1 -TenantSlug odonto -ServiceId "0d011111-1111-4111-8111-111111111111"
# Saga compensation (CDA):
.\deploy\scripts\e2e-hold-pay-notify.ps1 -ServiceId "cda66666-6666-4666-8666-666666666666" -ExpectedStatus "CANCELLED"
# Circuit Breaker:
.\deploy\scripts\e2e-hold-pay-notify.ps1 -ServiceId "cda99999-9999-4999-8999-999999999999" -ExpectedStatus "CANCELLED"
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Demo presentation |
| http://localhost:8080 | API Gateway |
| http://localhost:15672 | RabbitMQ UI (`guest`/`guest`) |

## Demo tenants (Colombia)

| Slug | Name | Happy service | Amount |
|------|------|---------------|--------|
| `cda` | CDA Colombia | Revisión tecnomecánica | 150000 COP |
| `odonto` | Clínica Odontológica Sonrisa Andina | Limpieza dental | 120000 COP |

Probes: `666000` → saga fail · `999000` → Circuit Breaker.

Login UI: `admin@cda.example` / `admin@odonto.example` · `Demo123!`.  
Scripts E2E: `demo-client` / `demo-secret`.

## Architecture

See:

- [docs/baseline-d4.md](docs/baseline-d4.md)
- [docs/architecture/integration-matrix.md](docs/architecture/integration-matrix.md)
- [docs/architecture/fsm-appointment.md](docs/architecture/fsm-appointment.md)
- [deploy/demo/README.md](deploy/demo/README.md)

### Services

| Path | Lang | Role |
|------|------|------|
| `services/api-gateway` | TypeScript | JWT, `x-tenant-id`, CORS, rate limit, proxy |
| `services/auth-tenant-service` | TypeScript | Demo tokens + tenants |
| `services/catalog-service` | TypeScript | Bookable services / prices |
| `services/scheduling-engine` | Python FastAPI | Hold + Outbox + FSM |
| `services/payment-orchestrator` | TypeScript FaaS | Saga + Circuit Breaker |
| `services/notification-service` | TypeScript FaaS | Mongo + WhatsApp mock |
| `services/external-mocks` | TypeScript | Payment / WhatsApp / OpenAI fakes |
| `deploy/demo` | HTML/JS | Interactive Delivery 4 presentation |
| `services/ai-service` | stub | Post-D4 |

### Appointment states (English only)

`CREATED` → `HOLD` → `PAID` → `CONFIRMED` (+ `EXPIRED` / `CANCELLED`)

## Terraform / secrets

AWS IaC is under [infra/terraform](infra/terraform). Classroom: `.\infra\terraform\validate.ps1` (no paid `apply` required). Full blue-green story: [docs/deployment-blue-green.md](docs/deployment-blue-green.md). Never commit `.env`, `*.tfvars`, or plaintext passwords.
