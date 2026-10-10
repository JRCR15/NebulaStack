import Fastify from "fastify";
import pg from "pg";

const { Pool } = pg;
const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 8083);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function problem(reply, status, title, detail) {
  return reply
    .status(status)
    .header("content-type", "application/problem+json")
    .send({ type: "about:blank", title, status, detail });
}

async function withTenant(tenantId, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

app.get("/healthz", async () => ({ status: "ok", service: "catalog-service" }));

app.get("/api/v1/catalog/services", async (request, reply) => {
  const tenantId = request.headers["x-tenant-id"];
  if (!tenantId) return problem(reply, 400, "Bad Request", "x-tenant-id required");
  const rows = await withTenant(tenantId, async (client) => {
    const res = await client.query(
      `SELECT id, tenant_id, name, description, duration_minutes,
              price_amount::float8 AS price_amount, currency, status
       FROM catalog_services
       WHERE status = 'ACTIVE'
       ORDER BY name`
    );
    return res.rows;
  });
  return { items: rows };
});

app.get("/api/v1/catalog/services/:service_id", async (request, reply) => {
  const tenantId = request.headers["x-tenant-id"];
  if (!tenantId) return problem(reply, 400, "Bad Request", "x-tenant-id required");
  const row = await withTenant(tenantId, async (client) => {
    const res = await client.query(
      `SELECT id, tenant_id, name, description, duration_minutes,
              price_amount::float8 AS price_amount, currency, status
       FROM catalog_services WHERE id = $1`,
      [request.params.service_id]
    );
    return res.rows[0];
  });
  if (!row) return problem(reply, 404, "Not Found", "Service not found");
  return row;
});

await app.listen({ port, host: "0.0.0.0" });
