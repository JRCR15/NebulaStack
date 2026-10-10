# payment-orchestrator — integration

In: `nebula.scheduling.hold.created`  
Out: `nebula.payment.succeeded` | `nebula.payment.failed`  
HTTP: `POST {MOCK_GATEWAY_URL}/v1/charge` with `Idempotency-Key`.

Local runtime: HTTP worker + RabbitMQ consumer (same handler as Lambda).
