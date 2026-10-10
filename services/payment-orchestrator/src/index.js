import Fastify from "fastify";
import amqp from "amqplib";
import { processHoldCreated } from "./handler.js";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 8084);
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672/";
const EXCHANGE = "nebulastack.events";

let channel;

async function publish(event) {
  channel.publish(EXCHANGE, event.type, Buffer.from(JSON.stringify(event)), {
    contentType: "application/json",
    persistent: true,
  });
}

async function connectWithRetry(retries = 30) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      const q = await channel.assertQueue("payment.hold.created", { durable: true });
      await channel.bindQueue(q.queue, EXCHANGE, "nebula.scheduling.hold.created");
      channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        try {
          const cloudEvent = JSON.parse(msg.content.toString());
          await processHoldCreated(cloudEvent, publish);
          channel.ack(msg);
        } catch (err) {
          app.log.error(err);
          channel.nack(msg, false, false);
        }
      });
      return;
    } catch (err) {
      lastErr = err;
      app.log.warn(`rabbit connect retry ${i + 1}/${retries}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}

app.get("/healthz", async () => ({ status: "ok", service: "payment-orchestrator" }));

app.post("/internal/process-hold", async (request) => {
  return processHoldCreated(request.body, publish);
});

await connectWithRetry();
await app.listen({ port, host: "0.0.0.0" });
