const TENANTS = {
  cda: {
    slug: "cda",
    name: "CDA Colombia",
    happyServiceId: "cda11111-1111-4111-8111-111111111111",
    failServiceId: "cda66666-6666-4666-8666-666666666666",
    cbServiceId: "cda99999-9999-4999-8999-999999999999",
  },
  odonto: {
    slug: "odonto",
    name: "Clínica Odontológica Sonrisa Andina",
    happyServiceId: "0d011111-1111-4111-8111-111111111111",
    failServiceId: "0d066666-6666-4666-8666-666666666666",
    cbServiceId: "0d099999-9999-4999-8999-999999999999",
  },
};

const STEPS = [
  {
    id: "context",
    label: "Contexto Delivery 4",
    title: "Prototipo cloud-native multi-tenant",
    body: "NebulaStack demuestra el diseño D1–D3: API Gateway, hold con Redis+Outbox, Saga de pago (FaaS), notificación (FaaS) y aislamiento por tenant. Dos inquilinos reales de Colombia: CDA automotriz y clínica odontológica.",
    runnable: false,
  },
  {
    id: "auth-cda",
    label: "Auth · tenant CDA",
    title: "Autenticar como CDA Colombia",
    body: "Emitimos un JWT con claim tenant_id del CDA. El gateway validará el token e inyectará x-tenant-id. Observa email admin@cda.example en la respuesta decodificada implícita del flujo.",
    runnable: true,
    run: async (ctx) => runAuth(ctx, "cda"),
  },
  {
    id: "catalog-cda",
    label: "Catálogo CDA",
    title: "Listar servicios del CDA",
    body: "Solo deben aparecer servicios automotrices en COP (tecnomecánica, OBD y probes). RLS + x-tenant-id impiden ver el catálogo odontológico.",
    runnable: true,
    run: async (ctx) => runCatalog(ctx),
  },
  {
    id: "hold-cda",
    label: "Hold → CONFIRMED (CDA)",
    title: "Reservar revisión tecnomecánica",
    body: "Hold atómico → Outbox → Payment FaaS → Notification FaaS. La cita debe terminar en CONFIRMED. Este es el escenario E2E feliz de Delivery 4.",
    runnable: true,
    run: async (ctx) => runHold(ctx, TENANTS.cda.happyServiceId, "CONFIRMED"),
  },
  {
    id: "switch-odonto",
    label: "Cambiar a Odonto",
    title: "Aislamiento: entrar como Sonrisa Andina",
    body: "Nuevo JWT para odonto y listado de catálogo. Debe ser distinto al del CDA — prueba visual de multi-tenant isolation (CON-03 / RLS).",
    runnable: true,
    run: async (ctx) => {
      await runAuth(ctx, "odonto");
      await runCatalog(ctx);
    },
  },
  {
    id: "hold-odonto",
    label: "Hold → CONFIRMED (Odonto)",
    title: "Reservar limpieza dental",
    body: "Mismo pipeline de saga, otro tenant y otro catálogo. Demuestra que el motor de agendamiento es multi-tenant, no un silo por vertical.",
    runnable: true,
    run: async (ctx) => runHold(ctx, TENANTS.odonto.happyServiceId, "CONFIRMED"),
  },
  {
    id: "saga-fail",
    label: "Saga compensación",
    title: "Pago fallido → CANCELLED",
    body: "Usamos el probe 666000 COP del tenant activo. El mock responde 402; Payment emite payment.failed; Scheduling cancela y libera el lock Redis.",
    runnable: true,
    run: async (ctx) => {
      const t = TENANTS[ctx.tenantSlug];
      await runHold(ctx, t.failServiceId, "CANCELLED");
    },
  },
  {
    id: "circuit-breaker",
    label: "Circuit Breaker",
    title: "Táctica QA: timeout de pasarela",
    body: "Probe 999000 COP: el mock retrasa 5s y devuelve 504. El Circuit Breaker (3s) falla/abre y la saga termina en CANCELLED. Táctica de resiliencia demostrable.",
    runnable: true,
    run: async (ctx) => {
      const t = TENANTS[ctx.tenantSlug];
      await runHold(ctx, t.cbServiceId, "CANCELLED");
    },
  },
  {
    id: "closing",
    label: "Cierre D4",
    title: "Checklist de entrega",
    body: "E2E, ≥2 FaaS, multi-persistencia, contenedores, IaC, Circuit Breaker y aislamiento CDA vs Odonto. Abre el panel de código para narrar cada evidencia ante el jurado.",
    runnable: false,
  },
];

const state = {
  stepIndex: 0,
  tenantSlug: null,
  token: null,
  codeMap: {},
};

const el = {
  nav: document.getElementById("stepNav"),
  title: document.getElementById("slideTitle"),
  body: document.getElementById("slideBody"),
  runBtn: document.getElementById("runBtn"),
  nextBtn: document.getElementById("nextBtn"),
  consoleOut: document.getElementById("consoleOut"),
  consoleMeta: document.getElementById("consoleMeta"),
  statusDot: document.getElementById("statusDot"),
  codeTitle: document.getElementById("codeTitle"),
  codeCards: document.getElementById("codeCards"),
  gatewayUrl: document.getElementById("gatewayUrl"),
  pillCda: document.getElementById("pillCda"),
  pillOdonto: document.getElementById("pillOdonto"),
};

function gateway() {
  return el.gatewayUrl.value.replace(/\/$/, "");
}

function log(lines, kind = "") {
  el.consoleOut.textContent = typeof lines === "string" ? lines : lines.join("\n");
  el.statusDot.className = "status-dot" + (kind ? ` ${kind}` : "");
}

function setMeta(text) {
  el.consoleMeta.textContent = text;
}

function updatePills() {
  el.pillCda.classList.toggle("active", state.tenantSlug === "cda");
  el.pillOdonto.classList.toggle("active", state.tenantSlug === "odonto");
}

function renderCodePanel(stepId) {
  const entry = state.codeMap[stepId] || { title: "Código", files: [] };
  el.codeTitle.textContent = entry.title || "Código asociado";
  el.codeCards.innerHTML = (entry.files || [])
    .map(
      (f) => `
      <article class="code-card">
        <div class="path">${escapeHtml(f.path)}</div>
        <div class="title">${escapeHtml(f.title || "")}</div>
        <pre>${escapeHtml(f.snippet || "")}</pre>
      </article>`
    )
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderNav() {
  el.nav.innerHTML = STEPS.map(
    (s, i) => `
    <button type="button" class="step-btn ${i === state.stepIndex ? "active" : ""}" data-i="${i}">
      <span class="num">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(s.label)}
    </button>`
  ).join("");
  el.nav.querySelectorAll(".step-btn").forEach((btn) => {
    btn.addEventListener("click", () => selectStep(Number(btn.dataset.i)));
  });
}

function selectStep(i) {
  state.stepIndex = i;
  const step = STEPS[i];
  el.title.textContent = step.title;
  el.body.textContent = step.body;
  el.runBtn.disabled = !step.runnable;
  el.runBtn.textContent = step.runnable ? "Ejecutar este paso" : "Solo narración";
  renderNav();
  renderCodePanel(step.id);
  updatePills();
}

async function api(path, options = {}) {
  const headers = {
    "content-type": "application/json",
    ...(options.headers || {}),
  };
  if (state.token && !headers.Authorization) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const res = await fetch(`${gateway()}${path}`, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function runAuth(ctx, slug) {
  setMeta("POST /api/v1/auth/token");
  log("Solicitando JWT…", "run");
  const payload = {
    grant_type: "client_credentials",
    tenant_slug: slug,
    client_id: "demo-client",
    client_secret: "demo-secret",
  };
  const { ok, status, body } = await api("/api/v1/auth/token", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {},
  });
  if (!ok) throw new Error(`Auth falló HTTP ${status}: ${JSON.stringify(body)}`);
  state.token = body.access_token;
  state.tenantSlug = slug;
  updatePills();
  const me = await api("/api/v1/tenants/me");
  log(
    [
      ">>> REQUEST",
      JSON.stringify(payload, null, 2),
      "",
      `<<< TOKEN HTTP ${status}`,
      JSON.stringify({ token_type: body.token_type, expires_in: body.expires_in, access_token: "[redacted]" }, null, 2),
      "",
      "<<< GET /api/v1/tenants/me",
      JSON.stringify(me.body, null, 2),
    ].join("\n"),
    "ok"
  );
}

async function runCatalog() {
  if (!state.token) throw new Error("Primero autentica un tenant");
  setMeta("GET /api/v1/catalog/services");
  log("Listando catálogo…", "run");
  const { ok, status, body } = await api("/api/v1/catalog/services");
  if (!ok) throw new Error(`Catálogo HTTP ${status}: ${JSON.stringify(body)}`);
  const lines = (body.items || []).map(
    (s) => `• ${s.name} — ${Number(s.price_amount).toLocaleString("es-CO")} ${s.currency} (${s.id.slice(0, 8)}…)`
  );
  log(
    [
      `Tenant activo: ${state.tenantSlug}`,
      `HTTP ${status} — ${body.items?.length || 0} servicios`,
      "",
      ...lines,
      "",
      JSON.stringify(body, null, 2),
    ].join("\n"),
    "ok"
  );
}

function uuid() {
  return crypto.randomUUID();
}

async function runHold(ctx, serviceId, expected) {
  if (!state.token) throw new Error("Primero autentica un tenant");
  const start = new Date(Date.now() + 24 * 3600 * 1000);
  start.setUTCHours(15, 0, 0, 0);
  // stagger by random minutes to avoid slot collisions across demo clicks
  start.setUTCMinutes(Math.floor(Math.random() * 50));
  const startIso = start.toISOString().replace(/\.\d{3}Z$/, "Z");
  const idem = uuid();
  const req = {
    service_id: serviceId,
    start_time: startIso,
    customer_email: `cliente@${state.tenantSlug}.example`,
    customer_phone: "+573001234567",
  };
  setMeta("POST /api/v1/schedules/hold");
  log(["Creando HOLD…", JSON.stringify(req, null, 2)].join("\n"), "run");
  const holdRes = await api("/api/v1/schedules/hold", {
    method: "POST",
    headers: { "Idempotency-Key": idem },
    body: JSON.stringify(req),
  });
  if (!holdRes.ok) {
    throw new Error(`Hold HTTP ${holdRes.status}: ${JSON.stringify(holdRes.body)}`);
  }
  const holdId = holdRes.body.hold_id;
  let final = null;
  let last = holdRes.body;
  for (let i = 1; i <= 30; i++) {
    setMeta(`poll appointment ${i}/30`);
    const appt = await api(`/api/v1/schedules/appointments/${holdId}`);
    last = appt.body;
    log(
      [
        `HOLD creado: ${holdId}`,
        `status=${last.status} (try ${i})`,
        "",
        JSON.stringify(last, null, 2),
      ].join("\n"),
      "run"
    );
    if (last.status === "CONFIRMED" || last.status === "CANCELLED") {
      final = last.status;
      break;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (!final) throw new Error("Timeout esperando CONFIRMED/CANCELLED");
  if (final !== expected) throw new Error(`Esperado ${expected}, obtuvo ${final}`);
  log(
    [
      `✓ E2E OK — status=${final}`,
      `tenant=${state.tenantSlug}`,
      `service_id=${serviceId}`,
      "",
      JSON.stringify(last, null, 2),
    ].join("\n"),
    "ok"
  );
}

el.runBtn.addEventListener("click", async () => {
  const step = STEPS[state.stepIndex];
  if (!step.runnable) return;
  el.runBtn.disabled = true;
  try {
    await step.run(state);
    setMeta("listo");
  } catch (err) {
    log(String(err.message || err), "err");
    setMeta("error");
  } finally {
    el.runBtn.disabled = !STEPS[state.stepIndex].runnable;
  }
});

el.nextBtn.addEventListener("click", () => {
  if (state.stepIndex < STEPS.length - 1) selectStep(state.stepIndex + 1);
});

const map = await fetch("./code-map.json").then((r) => r.json());
state.codeMap = map;
selectStep(0);

// health ping
try {
  const h = await fetch(`${gateway()}/healthz`);
  if (h.ok) setMeta("gateway ok");
} catch {
  setMeta("gateway offline — ¿Compose up?");
}
