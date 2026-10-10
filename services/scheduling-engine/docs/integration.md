# scheduling-engine — integration

Contract: `contracts/openapi/scheduling.yaml`

Reads catalog prices via SQL under RLS (same CoreDB) for MVP speed.
Publishes CloudEvents to RabbitMQ exchange `nebulastack.events`.
Consumes payment results via queue binding + HTTP internal callback fallback.
