# C4 — System context

NebulaStack is a multi-tenant B2B SaaS for appointment scheduling, payments, and notifications.

## Actors

- **Tenant admin / staff**: manages catalog and views bookings.
- **Customer**: books a slot (via API client or future WhatsApp channel).
- **External payment gateway** (mocked): card charges.
- **External WhatsApp / LLM APIs** (mocked): outbound messages and AI (post-D4).

## System boundary

NebulaStack exposes HTTPS APIs behind `api-gateway`, isolates tenants via JWT `tenant_id` + PostgreSQL RLS, and orchestrates async payment/notification via CloudEvents.
