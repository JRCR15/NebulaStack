import Fastify from "fastify";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 8090);

app.get("/healthz", async () => ({ status: "ok", service: "external-mocks" }));

app.post("/v1/charge", async (request, reply) => {
  const { amount, idempotency_key: idempotencyKey } = request.body || {};
  const numericAmount = Number(amount);

  if (numericAmount === 999) {
    await new Promise((r) => setTimeout(r, 5000));
    return reply.status(504).send({ error: "GATEWAY_TIMEOUT", idempotency_key: idempotencyKey });
  }

  if (numericAmount === 666) {
    return reply.status(402).send({
      status: "FAILED",
      reason: "INSUFFICIENT_FUNDS",
      idempotency_key: idempotencyKey,
    });
  }

  return reply.status(200).send({
    status: "SUCCESS",
    tx_id: `tx_mock_${Math.random().toString(36).slice(2, 10)}`,
    amount: numericAmount,
    idempotency_key: idempotencyKey,
  });
});

app.post("/v1/whatsapp/messages", async (_request, reply) => {
  return reply.status(200).send({
    messaging_product: "whatsapp",
    contacts: [{ input: "ok" }],
    messages: [{ id: "wamid.mock123" }],
  });
});

app.post("/v1/chat/completions", async (_request, reply) => {
  return reply.status(200).send({
    choices: [
      {
        message: {
          role: "assistant",
          content: "Understood, processing your scheduling request.",
        },
      },
    ],
  });
});

await app.listen({ port, host: "0.0.0.0" });
