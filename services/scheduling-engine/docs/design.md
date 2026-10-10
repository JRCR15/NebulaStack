# scheduling-engine — design

Core booking engine (Python FastAPI):

1. Redis `SET key NX EX 120` for slot lock.
2. PostgreSQL transaction with RLS: insert appointment `HOLD` + outbox row.
3. Outbox publisher emits `nebula.scheduling.hold.created`.
4. On payment result: `PAID`→`CONFIRMED` or `CANCELLED` + unlock.

FSM: see `docs/architecture/fsm-appointment.md`.
