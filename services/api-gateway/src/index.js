import Fastify from "fastify";
import proxy from "@fastify/http-proxy";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import { randomUUID } from "crypto";

const app = Fastify({ logger: true, trustProxy: true });
const port = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.JWT_SECRET || "change-me-jwt-secret-min-32-chars-long";
const JWT_ISSUER = process.env.JWT_ISSUER || "https://auth.nebulastack.local";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "nebulastack-api";
const RATE_LIMIT_RPS = Number(process.env.RATE_LIMIT_RPS || 100);

const AUTH_URL = process.env.AUTH_URL || "http://auth-tenant-service:8082";
const CATALOG_URL = process.env.CATALOG_URL || "http://catalog-service:8083";
const SCHEDULING_URL = process.env.SCHEDULING_URL || "http://scheduling-engine:8081";

const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379/0");

function problem(reply, status, title, detail) {
  return reply
    .status(status)
    .header("content-type", "application/problem+json")
    .send({ type: "about:blank", title, status, detail });
}

async function rateLimit(tenantId) {
  const key = `tenant:${tenantId}:ratelimit`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 1);
  return count <= RATE_LIMIT_RPS;
}

app.get("/healthz", async () => ({ status: "ok", service: "api-gateway" }));

app.addHook("onRequest", async (request, reply) => {
  request.headers["x-correlation-id"] =
    request.headers["x-correlation-id"] || randomUUID();

  const path = request.url.split("?")[0];
  if (path === "/healthz" || path === "/api/v1/auth/token") return;

  if (!path.startsWith("/api/")) return;

  const auth = request.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return problem(reply, 401, "Unauthorized", "Missing bearer token");
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (!payload.tenant_id) {
      return problem(reply, 401, "Unauthorized", "tenant_id claim required");
    }
    // Overwrite any client-supplied tenant header
    request.headers["x-tenant-id"] = String(payload.tenant_id);
    request.tenantId = String(payload.tenant_id);

    const allowed = await rateLimit(request.tenantId);
    if (!allowed) {
      return problem(reply, 429, "Too Many Requests", "Tenant rate limit exceeded");
    }
  } catch (err) {
    return problem(reply, 401, "Unauthorized", err.message);
  }
});

await app.register(proxy, {
  upstream: AUTH_URL,
  prefix: "/api/v1/auth",
  rewritePrefix: "/api/v1/auth",
});
await app.register(proxy, {
  upstream: AUTH_URL,
  prefix: "/api/v1/tenants",
  rewritePrefix: "/api/v1/tenants",
});
await app.register(proxy, {
  upstream: CATALOG_URL,
  prefix: "/api/v1/catalog",
  rewritePrefix: "/api/v1/catalog",
});
await app.register(proxy, {
  upstream: SCHEDULING_URL,
  prefix: "/api/v1/schedules",
  rewritePrefix: "/api/v1/schedules",
});

await app.listen({ port, host: "0.0.0.0" });
