import Fastify from "fastify";
import amqp from "amqplib";
import { processPaymentSucceeded } from "./handler.js";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 8085);
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672/";
const EXCHANGE = "nebulastack.events";

async function connectWithRetry(retries = 30) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      const q = await channel.assertQueue("notification.payment.succeeded", { durable: true });
      await channel.bindQueue(q.queue, EXCHANGE, "nebula.payment.succeeded");
      channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        try {
          await processPaymentSucceeded(JSON.parse(msg.content.toString()));
          channel.ack(msg);
        } catch (err) {
          app.log.error(err);
          channel.nack(msg, false, true);
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

app.get("/healthz", async () => ({ status: "ok", service: "notification-service" }));

await connectWithRetry();
await app.listen({ port, host: "0.0.0.0" });
