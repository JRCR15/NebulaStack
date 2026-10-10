# ADR-004: Language pin

## Status

Accepted

## Context

Prompt MD mixed Go/Python/TypeScript without a pin.

## Decision

- Python FastAPI: `scheduling-engine`
- TypeScript: `api-gateway`, `auth-tenant-service`, `catalog-service`, `payment-orchestrator`, `notification-service`, `external-mocks`

## Consequences

Faster MVP delivery; clear ownership per service folder; Lambda-friendly TS for FaaS.
