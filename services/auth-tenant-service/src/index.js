import Fastify from "fastify";
import jwt from "jsonwebtoken";
import pg from "pg";

const { Pool } = pg;
const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 8082);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const JWT_SECRET = process.env.JWT_SECRET || "change-me-jwt-secret-min-32-chars-long";
const JWT_ISSUER = process.env.JWT_ISSUER || "https://auth.nebulastack.local";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "nebulastack-api";
const DEMO_CLIENT_ID = process.env.DEMO_CLIENT_ID || "demo-client";
const DEMO_CLIENT_SECRET = process.env.DEMO_CLIENT_SECRET || "demo-secret";

const TENANT_IDENTITY = {
  cda: {
    sub: "cda00000-user-4000-8000-0000000000a1",
    email: "admin@cda.example",
  },
  odonto: {
    sub: "0d071000-user-4000-8000-0000000000a1",
    email: "admin@odonto.example",
  },
};

/** Local demo users for grant_type=password (UI workspace login). */
const DEMO_USERS = {
  "admin@cda.example": { password: "Demo123!", tenant_slug: "cda" },
  "admin@odonto.example": { password: "Demo123!", tenant_slug: "odonto" },
};

function problem(reply, status, title, detail) {
  return reply
    .status(status)
    .header("content-type", "application/problem+json")
    .send({ type: "about:blank", title, status, detail });
}

function resolvePasswordLogin(body) {
  const username = String(body.username || body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  if (!username || !password) {
    return { error: "username and password are required" };
  }
  const user = DEMO_USERS[username];
  if (!user || user.password !== password) {
    return { error: "Invalid username or password" };
  }
  const requestedSlug = String(body.tenant_slug || user.tenant_slug).trim().toLowerCase();
  if (requestedSlug !== user.tenant_slug) {
    return { error: "User does not belong to the selected organization" };
  }
  return { slug: user.tenant_slug, email: username };
}

app.get("/healthz", async () => ({ status: "ok", service: "auth-tenant-service" }));

app.post("/api/v1/auth/token", async (request, reply) => {
  const body = request.body || {};
  if (body.grant_type !== "client_credentials" && body.grant_type !== "password") {
    return problem(reply, 400, "Invalid grant", "Unsupported grant_type");
  }

  let slug = body.tenant_slug || "cda";
  let emailOverride = null;

  if (body.grant_type === "client_credentials") {
    if (body.client_id !== DEMO_CLIENT_ID || body.client_secret !== DEMO_CLIENT_SECRET) {
      return problem(reply, 401, "Unauthorized", "Invalid client credentials");
    }
  } else {
    const login = resolvePasswordLogin(body);
    if (login.error) {
      return problem(reply, 401, "Unauthorized", login.error);
    }
    slug = login.slug;
    emailOverride = login.email;
  }

  const { rows } = await pool.query(
    "SELECT id, slug, name, status, plan FROM tenants WHERE slug = $1",
    [slug]
  );
  if (!rows.length || rows[0].status !== "ACTIVE") {
    return problem(reply, 401, "Unauthorized", "Tenant not found or inactive");
  }
  const tenant = rows[0];
  const baseIdentity = TENANT_IDENTITY[tenant.slug] || {
    sub: "11111111-aaaa-bbbb-cccc-111111111111",
    email: `admin@${tenant.slug}.example`,
  };
  const email = emailOverride || baseIdentity.email;
  const expiresIn = 3600;
  const accessToken = jwt.sign(
    {
      sub: baseIdentity.sub,
      tenant_id: tenant.id,
      roles: ["tenant_admin", "scheduler"],
      email,
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn,
    }
  );
  return { access_token: accessToken, token_type: "Bearer", expires_in: expiresIn };
});

app.get("/api/v1/tenants/me", async (request, reply) => {
  const auth = request.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return problem(reply, 401, "Unauthorized", "Missing bearer token");
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const { rows } = await pool.query(
      "SELECT id, slug, name, status, plan FROM tenants WHERE id = $1",
      [payload.tenant_id]
    );
    if (!rows.length) return problem(reply, 404, "Not Found", "Tenant not found");
    return rows[0];
  } catch (err) {
    return problem(reply, 401, "Unauthorized", err.message);
  }
});

app.get("/api/v1/tenants/:tenant_id", async (request, reply) => {
  const { rows } = await pool.query(
    "SELECT id, slug, name, status, plan FROM tenants WHERE id = $1",
    [request.params.tenant_id]
  );
  if (!rows.length) return problem(reply, 404, "Not Found", "Tenant not found");
  return rows[0];
});

await app.listen({ port, host: "0.0.0.0" });
