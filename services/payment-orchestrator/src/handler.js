import axios from "axios";
import CircuitBreaker from "opossum";
import { randomUUID } from "crypto";

const MOCK_PAYMENT_GATEWAY_URL =
  process.env.MOCK_GATEWAY_URL || "http://external-mocks:8090";
const CHARGE_URL = `${MOCK_PAYMENT_GATEWAY_URL}/v1/charge`;

const breaker = new CircuitBreaker(
  async (paymentData) => {
    const response = await axios.post(CHARGE_URL, paymentData, {
      headers: { "Idempotency-Key": paymentData.idempotency_key },
      timeout: 3000,
      validateStatus: () => true,
    });
    if (response.status >= 200 && response.status < 300) {
      return { status: "SUCCESS", tx_id: response.data.tx_id };
    }
    return {
      status: "FAILED",
      reason: response.data?.reason || `HTTP_${response.status}`,
    };
  },
  {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000,
  }
);

breaker.fallback(() => ({
  status: "FAILED",
  reason: "CIRCUIT_BREAKER_OPEN_OR_TIMEOUT",
}));

export async function processHoldCreated(cloudEvent, publish) {
  const data = cloudEvent.data || {};
  const idempotencyKey = cloudEvent.idempotency_key || data.appointment_id;

  const result = await breaker.fire({
    appointment_id: data.appointment_id,
    tenant_id: data.tenant_id,
    amount: data.amount,
    currency: data.currency || "USD",
    idempotency_key: idempotencyKey,
  });

  if (result.status === "SUCCESS" || result.status === "PAID") {
    await publish({
      specversion: "1.0",
      type: "nebula.payment.succeeded",
      source: "/payment-orchestrator",
      id: randomUUID(),
      time: new Date().toISOString(),
      datacontenttype: "application/json",
      idempotency_key: idempotencyKey,
      data: {
        appointment_id: data.appointment_id,
        tenant_id: data.tenant_id,
        transaction_id: result.tx_id,
        amount: data.amount,
        currency: data.currency || "USD",
        status: "PAID",
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
      },
    });
    return { outcome: "SUCCEEDED", ...result };
  }

  await publish({
    specversion: "1.0",
    type: "nebula.payment.failed",
    source: "/payment-orchestrator",
    id: randomUUID(),
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    idempotency_key: idempotencyKey,
    data: {
      appointment_id: data.appointment_id,
      tenant_id: data.tenant_id,
      reason: result.reason || "PAYMENT_FAILED",
      status: "CANCELLED",
    },
  });
  return { outcome: "FAILED", ...result };
}

/** AWS Lambda entrypoint shape (SQS) */
export async function handler(event) {
  const records = event.Records || [];
  for (const record of records) {
    const cloudEvent = JSON.parse(record.body);
    // In AWS, publish would use SQS/SNS SDK — local runtime wires publish separately.
    await processHoldCreated(cloudEvent, async () => {});
  }
  return { ok: true };
}
