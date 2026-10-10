# ADR-003: RabbitMQ local, SQS on AWS

## Status

Accepted

## Context

Delivery 4 needs local developer UX and AWS FaaS triggers.

## Decision

Business payloads are CloudEvents v1.0 JSON. Local transport is RabbitMQ AMQP; AWS transport is SQS. Application code depends on an `EventBus` abstraction.

## Consequences

Same event schemas; thin adapters per environment; no dual business logic.
