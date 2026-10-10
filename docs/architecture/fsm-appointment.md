# Appointment finite state machine

Canonical machine used in API, PostgreSQL `CHECK`, CloudEvents payloads, code, and technical docs.

```
CREATED → HOLD → PAID → CONFIRMED
              ↘ EXPIRED
HOLD → CANCELLED   (payment.failed compensation or explicit cancel)
```

| State | Meaning |
|-------|---------|
| `CREATED` | Initial row before lock (optional; MVP may insert directly as `HOLD`) |
| `HOLD` | Redis lock held (`SET NX PX` TTL 120s); awaiting payment |
| `PAID` | Payment saga succeeded |
| `CONFIRMED` | Notification dispatched; booking final |
| `EXPIRED` | Hold TTL elapsed without successful payment |
| `CANCELLED` | Compensating action after `nebula.payment.failed` or explicit cancel |

Spanish narrative in reports may describe these states, but identifiers remain English enums everywhere.
