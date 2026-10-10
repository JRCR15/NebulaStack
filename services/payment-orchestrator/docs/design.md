# payment-orchestrator — design

FaaS 1 (TypeScript): consumes `nebula.scheduling.hold.created`, charges mock gateway behind Circuit Breaker (timeout 3s, errorThreshold 50%, reset 10s), emits succeeded/failed CloudEvents.
