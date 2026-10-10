# notification-service — design

FaaS 2 (TypeScript): on `nebula.payment.succeeded`, write Mongo `conversation_logs`, call WhatsApp mock with exponential backoff, notify scheduling to move appointment to `CONFIRMED`.
