import axios from "axios";
import { MongoClient } from "mongodb";

const MOCK_URL = process.env.MOCK_GATEWAY_URL || "http://external-mocks:8090";
const SCHEDULING_URL = process.env.SCHEDULING_URL || "http://scheduling-engine:8081";
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/nebulastack";

let mongoClient;
let collection;

async function getCollection() {
  if (!collection) {
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
    const db = mongoClient.db();
    collection = db.collection("conversation_logs");
    await collection.createIndex({ tenant_id: 1, created_at: -1 });
  }
  return collection;
}

async function sendWhatsApp(recipient, body) {
  let attempt = 0;
  let delay = 200;
  while (attempt < 4) {
    try {
      const res = await axios.post(
        `${MOCK_URL}/v1/whatsapp/messages`,
        { to: recipient, text: body },
        { timeout: 3000, validateStatus: () => true }
      );
      if (res.status < 500) return res.data;
    } catch {
      // retry
    }
    attempt += 1;
    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }
  throw new Error("WhatsApp mock failed after retries");
}

export async function processPaymentSucceeded(cloudEvent) {
  const data = cloudEvent.data || {};
  const col = await getCollection();
  const recipient = data.customer_phone || data.customer_email || "unknown";
  const messageBody = `Your appointment ${data.appointment_id} is CONFIRMED. tx=${data.transaction_id}`;

  await col.insertOne({
    tenant_id: String(data.tenant_id),
    appointment_id: String(data.appointment_id),
    channel: data.customer_phone ? "WHATSAPP" : "EMAIL",
    recipient,
    message_body: messageBody,
    direction: "OUTBOUND",
    status: "QUEUED",
    trace_id: cloudEvent.id,
    created_at: new Date(),
  });

  await sendWhatsApp(recipient, messageBody);
  await col.updateOne(
    { appointment_id: String(data.appointment_id), trace_id: cloudEvent.id },
    { $set: { status: "SENT" } }
  );

  await axios.post(`${SCHEDULING_URL}/internal/events/payment-result`, {
    appointment_id: data.appointment_id,
    tenant_id: data.tenant_id,
    outcome: "CONFIRMED",
    transaction_id: data.transaction_id,
  });

  return { status: "SENT" };
}

export async function handler(event) {
  for (const record of event.Records || []) {
    await processPaymentSucceeded(JSON.parse(record.body));
  }
  return { ok: true };
}
