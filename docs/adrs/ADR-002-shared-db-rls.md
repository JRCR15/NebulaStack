# ADR-002: Shared PostgreSQL with RLS

## Status

Accepted

## Context

CON-06 prefers Shared DB + RLS for Standard plan; DB-per-tenant is Enterprise stretch.

## Decision

Single CoreDB with `tenant_id` columns and `SET LOCAL app.current_tenant_id` + RLS policies for tenants, catalog, appointments, outbox.

## Consequences

Simpler ops for the prototype; strict middleware discipline required to set tenant context every transaction.

Local Compose uses role `nebulastack_app` (NOSUPERUSER, NOBYPASSRLS). The Postgres bootstrap superuser bypasses even `FORCE ROW LEVEL SECURITY`, so application services must not connect as superuser.
