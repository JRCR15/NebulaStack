# ADR-001: Saga choreography instead of 2PC

## Status

Accepted

## Context

Payment and scheduling span multiple services and an external gateway. Distributed 2PC is unavailable across HTTP/FaaS boundaries.

## Decision

Use a choreographed Saga: `hold.created` → charge → `payment.succeeded` / `payment.failed` with compensating `CANCELLED` + Redis unlock.

## Consequences

Eventual consistency; requires idempotent consumers and outbox publishing.
