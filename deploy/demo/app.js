import { PITCH_SLIDES, ARCHITECTURE_SVG } from "./pitch-content.js";

/** Festivos Colombia (fecha local YYYY-MM-DD) usados en la demo. */
const COLOMBIA_HOLIDAYS = new Set([
  // 2025
  "2025-01-01",
  "2025-01-06",
  "2025-03-24",
  "2025-04-17",
  "2025-04-18",
  "2025-05-01",
  "2025-06-02",
  "2025-06-23",
  "2025-06-30",
  "2025-07-20",
  "2025-08-07",
  "2025-08-18",
  "2025-10-13",
  "2025-11-03",
  "2025-11-17",
  "2025-12-08",
  "2025-12-25",
  // 2026
  "2026-01-01",
  "2026-01-12",
  "2026-03-23",
  "2026-04-02",
  "2026-04-03",
  "2026-05-01",
  "2026-05-18",
  "2026-06-08",
  "2026-06-15",
  "2026-06-29",
  "2026-07-20",
  "2026-08-07",
  "2026-08-17",
  "2026-10-12",
  "2026-11-02",
  "2026-11-16",
  "2026-12-08",
  "2026-12-25",
  // 2027
  "2027-01-01",
  "2027-01-11",
  "2027-03-22",
  "2027-03-25",
  "2027-03-26",
  "2027-05-01",
  "2027-05-17",
  "2027-06-07",
  "2027-06-14",
  "2027-07-05",
  "2027-07-20",
  "2027-08-07",
  "2027-08-16",
  "2027-10-18",
  "2027-11-01",
  "2027-11-15",
  "2027-12-08",
  "2027-12-25",
]);

const TENANTS = {
  cda: {
    slug: "cda",
    name: "CDA Colombia",
    short: "CDA Colombia",
    badge: "CDA",
    vertical: "Automotriz",
    catalogLabel: "Servicios",
    bookingLabel: "Nuevo Servicio",
    email: "cliente@cda.example",
    happyServiceId: "cda11111-1111-4111-8111-111111111111",
    failServiceId: "cda66666-6666-4666-8666-666666666666",
    cbServiceId: "cda99999-9999-4999-8999-999999999999",
    hoursLabel:
      "Lun–Vie 8:00–18:00 · Sáb/Dom y festivos 9:00–15:00",
    hours: {
      weekday: { open: "08:00", close: "18:00" },
      weekend: { open: "09:00", close: "15:00" },
      holiday: { open: "09:00", close: "15:00" },
      closedOnHolidays: false,
    },
  },
  odonto: {
    slug: "odonto",
    name: "Clínica Odontológica Sonrisa Andina",
    short: "Sonrisa Andina",
    badge: "SA",
    vertical: "Salud dental",
    catalogLabel: "Servicios",
    bookingLabel: "Nuevo Servicio",
    email: "cliente@odonto.example",
    happyServiceId: "0d011111-1111-4111-8111-111111111111",
    failServiceId: "0d066666-6666-4666-8666-666666666666",
    cbServiceId: "0d099999-9999-4999-8999-999999999999",
    hoursLabel:
      "Lun–Vie 8:00–17:00 · Sáb/Dom 8:00–14:00 · Festivos: cerrado",
    hours: {
      weekday: { open: "08:00", close: "17:00" },
      weekend: { open: "08:00", close: "14:00" },
      holiday: null,
      closedOnHolidays: true,
    },
  },
};

const STATUS_LABEL = {
  HOLD: "Reservada",
  PAID: "Pagada",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  REFUNDED: "Cancelada · devolución",
};

/** Teléfono demo usado en hold (mismo que notification-service / WhatsApp mock). */
const DEMO_CUSTOMER_PHONE = "+573001234567";

const PRODUCT_CHIPS = [
  { id: "gateway", label: "Seguridad" },
  { id: "multitenant", label: "Datos aislados" },
  { id: "redis", label: "Cupos protegidos" },
  { id: "outbox", label: "Proceso confiable" },
  { id: "saga", label: "Cobro confiable" },
  { id: "cb", label: "Resiliencia" },
  { id: "faas", label: "Avisos" },
];

const SCRIPT = [
  {
    id: "enter-cda",
    title: "Entrar a CDA",
    hint: "Abre el workspace automotriz.",
    codeKey: "auth-cda",
    run: async () => loginAs("cda"),
  },
  {
    id: "book-cda",
    title: "Confirmar revisión CDA",
    hint: "Agenda el servicio principal hasta Confirmada.",
    codeKey: "hold-cda",
    run: async () => {
      if (state.tenantSlug !== "cda") await loginAs("cda");
      await bookService(TENANTS.cda.happyServiceId, "CONFIRMED");
    },
  },
  {
    id: "switch-odonto",
    title: "Cambiar a Sonrisa Andina",
    hint: "Misma plataforma, otra organización.",
    codeKey: "switch-odonto",
    run: async () => loginAs("odonto"),
  },
  {
    id: "book-odonto",
    title: "Confirmar cita dental",
    hint: "Flujo feliz odontológico.",
    codeKey: "hold-odonto",
    run: async () => {
      if (state.tenantSlug !== "odonto") await loginAs("odonto");
      await bookService(TENANTS.odonto.happyServiceId, "CONFIRMED");
    },
  },
  {
    id: "saga-fail",
    title: "Pago rechazado",
    hint: "El cupo se libera al fallar el cobro.",
    codeKey: "saga-fail",
    run: async () => runSagaProbe(),
  },
  {
    id: "circuit-breaker",
    title: "Pasarela sin respuesta",
    hint: "Corte controlado y cancelación.",
    codeKey: "circuit-breaker",
    run: async () => runCbProbe(),
  },
  {
    id: "double-booking",
    title: "Mismo cupo, dos clientes",
    hint: "Uno gana el cupo; el otro recibe conflicto.",
    codeKey: "double-booking",
    run: async () => runDoubleBooking(),
  },
  {
    id: "closing",
    title: "Cierre",
    hint: "Resume valor de producto.",
    codeKey: "closing",
    run: async () => {
      markChipAllDone();
      pushFeed("Workspace listo para conversar el siguiente paso", "ok");
      setMeta("listo");
      log(
        [
          "Recorrido completado",
          "",
          "✓ Dos organizaciones con marca propia",
          "✓ Cita → cobro → confirmación",
          "✓ Recuperación ante fallos de cobro",
          "✓ Cupos sin doble reserva",
        ].join("\n"),
        "ok"
      );
      renderCodePanel("closing");
    },
  },
];

const state = {
  mode: "pitch",
  pitchIndex: 0,
  screen: "picker",
  scriptIndex: 0,
  tenantSlug: null,
  token: null,
  sessionEmail: null,
  sessionPhone: null,
  tenantMe: null,
  services: [],
  selectedServiceId: null,
  appointment: null,
  checkout: null,
  reservations: [],
  rescheduleFrom: null,
  paymentMethod: {
    brand: "Visa",
    last4: "1111",
    holder: "Cliente Demo",
    exp: "12/28",
    numberMasked: "4111 1111 1111 1111",
  },
  seenStatuses: new Set(),
  chips: Object.fromEntries(PRODUCT_CHIPS.map((c) => [c.id, false])),
  feed: [],
  codeMap: {},
  demoReady: false,
  busy: false,
  assistantOpen: false,
  appView: "agenda",
};

const el = {
  pitchView: document.getElementById("pitchView"),
  demoView: document.getElementById("demoView"),
  pitchKicker: document.getElementById("pitchKicker"),
  pitchTitle: document.getElementById("pitchTitle"),
  pitchSubtitle: document.getElementById("pitchSubtitle"),
  pitchBullets: document.getElementById("pitchBullets"),
  pitchCards: document.getElementById("pitchCards"),
  pitchReasons: document.getElementById("pitchReasons"),
  pitchArch: document.getElementById("pitchArch"),
  pitchCtaWrap: document.getElementById("pitchCtaWrap"),
  pitchCtaBtn: document.getElementById("pitchCtaBtn"),
  pitchPrev: document.getElementById("pitchPrev"),
  pitchNext: document.getElementById("pitchNext"),
  pitchCounter: document.getElementById("pitchCounter"),
  pitchProgressBar: document.getElementById("pitchProgressBar"),
  skipToDemoBtn: document.getElementById("skipToDemoBtn"),
  backToPitchBtn: document.getElementById("backToPitchBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsDrawer: document.getElementById("settingsDrawer"),
  settingsBackdrop: document.getElementById("settingsBackdrop"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  portalPicker: document.getElementById("portalPicker"),
  portalApp: document.getElementById("portalApp"),
  loginForm: document.getElementById("loginForm"),
  loginTenant: document.getElementById("loginTenant"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginBtn: document.getElementById("loginBtn"),
  loginError: document.getElementById("loginError"),
  tenantBadge: document.getElementById("tenantBadge"),
  tenantName: document.getElementById("tenantName"),
  tenantPlan: document.getElementById("tenantPlan"),
  switchTenantBtn: document.getElementById("switchTenantBtn"),
  bookingHeading: document.getElementById("bookingHeading"),
  serviceSelect: document.getElementById("serviceSelect"),
  bookingForm: document.getElementById("bookingForm"),
  bookingDate: document.getElementById("bookingDate"),
  bookingTime: document.getElementById("bookingTime"),
  bookingSlotHint: document.getElementById("bookingSlotHint"),
  bookingSlotError: document.getElementById("bookingSlotError"),
  hoursBanner: document.getElementById("hoursBanner"),
  bookingEmail: document.getElementById("bookingEmail"),
  bookBtn: document.getElementById("bookBtn"),
  checkoutOverlay: document.getElementById("checkoutOverlay"),
  checkoutMerchant: document.getElementById("checkoutMerchant"),
  checkoutService: document.getElementById("checkoutService"),
  checkoutWhen: document.getElementById("checkoutWhen"),
  checkoutAmount: document.getElementById("checkoutAmount"),
  checkoutStatus: document.getElementById("checkoutStatus"),
  payConfirmBtn: document.getElementById("payConfirmBtn"),
  payCancelBtn: document.getElementById("payCancelBtn"),
  reservationsList: document.getElementById("reservationsList"),
  reservationsEmpty: document.getElementById("reservationsEmpty"),
  newBookingBtn: document.getElementById("newBookingBtn"),
  rescheduleBanner: document.getElementById("rescheduleBanner"),
  rescheduleBannerText: document.getElementById("rescheduleBannerText"),
  cancelRescheduleBtn: document.getElementById("cancelRescheduleBtn"),
  profileAvatar: document.getElementById("profileAvatar"),
  profileName: document.getElementById("profileName"),
  profileEmail: document.getElementById("profileEmail"),
  profilePhone: document.getElementById("profilePhone"),
  profileOrg: document.getElementById("profileOrg"),
  profilePlan: document.getElementById("profilePlan"),
  profileRole: document.getElementById("profileRole"),
  profileLogoutBtn: document.getElementById("profileLogoutBtn"),
  profileCardBrand: document.getElementById("profileCardBrand"),
  profileCardNumber: document.getElementById("profileCardNumber"),
  profileCardHolder: document.getElementById("profileCardHolder"),
  profileCardExp: document.getElementById("profileCardExp"),
  payName: document.getElementById("payName"),
  payCard: document.getElementById("payCard"),
  payExp: document.getElementById("payExp"),
  whatIfBtn: document.getElementById("whatIfBtn"),
  whatIfMenu: document.getElementById("whatIfMenu"),
  probeSagaBtn: document.getElementById("probeSagaBtn"),
  probeCbBtn: document.getElementById("probeCbBtn"),
  probeRaceBtn: document.getElementById("probeRaceBtn"),
  presenterBar: document.getElementById("presenterBar"),
  presenterTitle: document.getElementById("presenterTitle"),
  presenterHint: document.getElementById("presenterHint"),
  presenterCounter: document.getElementById("presenterCounter"),
  presenterPrev: document.getElementById("presenterPrev"),
  presenterNext: document.getElementById("presenterNext"),
  presenterRun: document.getElementById("presenterRun"),
  presenterHide: document.getElementById("presenterHide"),
  d4Chips: document.getElementById("d4Chips"),
  activityFeed: document.getElementById("activityFeed"),
  techDetailToggle: document.getElementById("techDetailToggle"),
  techDetail: document.getElementById("techDetail"),
  consoleOut: document.getElementById("consoleOut"),
  consoleMeta: document.getElementById("consoleMeta"),
  statusDot: document.getElementById("statusDot"),
  portalLive: document.getElementById("portalLive"),
  toggleLiveBtn: document.getElementById("toggleLiveBtn"),
  openCodeBtn: document.getElementById("openCodeBtn"),
  codeDrawer: document.getElementById("codeDrawer"),
  codeDrawerBackdrop: document.getElementById("codeDrawerBackdrop"),
  closeCodeBtn: document.getElementById("closeCodeBtn"),
  codeTitle: document.getElementById("codeTitle"),
  codeCards: document.getElementById("codeCards"),
  gatewayUrl: document.getElementById("gatewayUrl"),
};

function gateway() {
  return el.gatewayUrl.value.replace(/\/$/, "");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function uuid() {
  return crypto.randomUUID();
}

function tenant() {
  return TENANTS[state.tenantSlug] || null;
}

function setMode(mode) {
  state.mode = mode;
  const isPitch = mode === "pitch";
  el.pitchView.hidden = !isPitch;
  el.demoView.hidden = isPitch;
  if (!isPitch && !state.demoReady) initDemo();
}

function renderPitch() {
  const slide = PITCH_SLIDES[state.pitchIndex];
  const total = PITCH_SLIDES.length;
  el.pitchKicker.textContent = slide.kicker || "";
  el.pitchTitle.innerHTML = slide.titleHtml || escapeHtml(slide.title || "");
  el.pitchSubtitle.textContent = slide.subtitle || "";
  el.pitchCounter.textContent = `${state.pitchIndex + 1} / ${total}`;
  el.pitchProgressBar.style.width = `${((state.pitchIndex + 1) / total) * 100}%`;
  el.pitchPrev.disabled = state.pitchIndex === 0;
  el.pitchNext.textContent =
    state.pitchIndex === total - 1 ? "Probar el workspace →" : "Siguiente →";

  const bullets = slide.bullets || [];
  el.pitchBullets.hidden = bullets.length === 0;
  el.pitchBullets.innerHTML = bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("");

  const cards = slide.cards || [];
  el.pitchCards.hidden = cards.length === 0;
  el.pitchCards.innerHTML = cards
    .map((c, i) => {
      const klass = i === 0 ? "automotriz" : "salud";
      return `<article class="pitch-card ${klass}">
        <span class="tag">${escapeHtml(c.tag)}</span>
        <h3>${escapeHtml(c.name)}</h3>
        <p>${escapeHtml(c.detail)}</p>
      </article>`;
    })
    .join("");

  const reasons = slide.reasons || [];
  el.pitchReasons.hidden = reasons.length === 0;
  el.pitchReasons.innerHTML = reasons
    .map(
      (r) => `<article class="reason">
        <strong>${escapeHtml(r.benefit)}</strong>
        <span class="tag">${escapeHtml(r.tag)}</span>
        <p>${escapeHtml(r.detail)}</p>
      </article>`
    )
    .join("");

  el.pitchArch.hidden = !slide.architecture;
  if (slide.architecture) el.pitchArch.innerHTML = ARCHITECTURE_SVG;

  const cta = slide.cta;
  el.pitchCtaWrap.hidden = !cta;
  if (cta) {
    el.pitchCtaBtn.textContent = cta.label;
    el.pitchCtaBtn.dataset.action = cta.action || "";
  }
}

function log(lines, kind = "") {
  el.consoleOut.textContent = typeof lines === "string" ? lines : lines.join("\n");
  el.statusDot.className = "status-dot" + (kind ? ` ${kind}` : "");
}

function setMeta(text) {
  el.consoleMeta.textContent = text;
}

function pushFeed(message, kind = "") {
  const time = new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  state.feed.unshift({ time, message, kind });
  state.feed = state.feed.slice(0, 40);
  renderFeed();
}

function renderFeed() {
  if (!state.feed.length) {
    el.activityFeed.innerHTML =
      '<li class="feed-empty">Los eventos del workspace aparecerán aquí.</li>';
    return;
  }
  el.activityFeed.innerHTML = state.feed
    .map(
      (f) =>
        `<li class="feed-item ${f.kind}">
          <time>${escapeHtml(f.time)}</time>
          <span>${escapeHtml(f.message)}</span>
        </li>`
    )
    .join("");
}

function markChip(id) {
  if (!(id in state.chips)) return;
  state.chips[id] = true;
  renderChips();
}

function markChipAllDone() {
  Object.keys(state.chips).forEach((k) => {
    state.chips[k] = true;
  });
  renderChips();
}

function renderChips() {
  el.d4Chips.innerHTML = PRODUCT_CHIPS.map(
    (c) =>
      `<span class="d4-chip ${state.chips[c.id] ? "done" : ""}" data-id="${c.id}">${escapeHtml(
        c.label
      )}</span>`
  ).join("");
}

function renderCodePanel(stepId) {
  const entry = state.codeMap[stepId] || { title: "Cómo está hecho", files: [] };
  el.codeTitle.textContent = entry.title || "Cómo está hecho";
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

function showScreen(screen) {
  state.screen = screen;
  el.portalPicker.hidden = screen !== "picker";
  el.portalApp.hidden = screen !== "app";
  if (screen === "picker") {
    document.body.removeAttribute("data-tenant");
    closeWhatIf();
  }
}

function showLoginError(msg) {
  if (!msg) {
    el.loginError.hidden = true;
    el.loginError.textContent = "";
    return;
  }
  el.loginError.hidden = false;
  el.loginError.textContent = msg;
}

function syncLoginDefaults() {
  const slug = el.loginTenant.value;
  el.loginEmail.value = slug === "odonto" ? "admin@odonto.example" : "admin@cda.example";
}

function isProbeService(s) {
  const name = String(s.name || "");
  const id = String(s.id || "");
  if (/^probe/i.test(name)) return true;
  if (id.includes("66666") || id.includes("99999")) return true;
  const amount = Number(s.price_amount);
  return amount === 666000 || amount === 999000;
}

function logout() {
  state.token = null;
  state.sessionEmail = null;
  state.sessionPhone = null;
  state.tenantSlug = null;
  state.tenantMe = null;
  state.services = [];
  state.selectedServiceId = null;
  state.appointment = null;
  state.checkout = null;
  state.reservations = [];
  state.rescheduleFrom = null;
  state.feed = [];
  closeCheckout();
  syncRescheduleBanner();
  renderServices();
  renderReservations();
  renderFeed();
  showScreen("picker");
  showLoginError("");
  setMeta("sesión cerrada");
}

function ensurePaymentMethod() {
  if (!state.paymentMethod) {
    state.paymentMethod = {
      brand: "Visa",
      last4: "1111",
      holder: "Cliente Demo",
      exp: "12/28",
      numberMasked: "4111 1111 1111 1111",
    };
  }
  const email = state.sessionEmail || el.loginEmail?.value || "";
  const local = email.includes("@") ? email.split("@")[0] : "";
  if (local && state.paymentMethod.holder === "Cliente Demo") {
    state.paymentMethod.holder = local
      .replace(/[._-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return state.paymentMethod;
}

function renderProfile() {
  const t = tenant();
  const me = state.tenantMe || {};
  const email =
    state.sessionEmail ||
    el.loginEmail?.value ||
    (t ? `admin@${t.slug}.example` : "—");
  const local = email.includes("@") ? email.split("@")[0] : "usuario";
  const prettyName = local
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const initials = prettyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  if (el.profileAvatar) el.profileAvatar.textContent = initials || t?.badge || "U";
  if (el.profileName) el.profileName.textContent = prettyName || "—";
  if (el.profileEmail) el.profileEmail.textContent = email || "—";
  if (el.profilePhone) {
    el.profilePhone.textContent = state.sessionPhone || DEMO_CUSTOMER_PHONE;
  }
  if (el.profileOrg) el.profileOrg.textContent = me.name || t?.short || "—";
  if (el.profilePlan) el.profilePlan.textContent = me.plan || "STANDARD";
  if (el.profileRole) el.profileRole.textContent = "Administrador";

  const pm = ensurePaymentMethod();
  if (el.profileCardBrand) el.profileCardBrand.textContent = pm.brand || "Visa";
  if (el.profileCardNumber) {
    el.profileCardNumber.textContent = `•••• •••• •••• ${pm.last4 || "1111"}`;
  }
  if (el.profileCardHolder) el.profileCardHolder.textContent = pm.holder || "—";
  if (el.profileCardExp) el.profileCardExp.textContent = pm.exp || "—";
}

/** Mensaje amigable del aviso al cliente (WhatsApp). */
function buildClientNotice({ phone, whenLabel, serviceName }) {
  const servicio = serviceName || "tu servicio";
  const cuando = whenLabel || "la fecha acordada";
  return {
    channel: "WhatsApp",
    recipient: phone || state.sessionPhone || DEMO_CUSTOMER_PHONE,
    body: `Tu cita de ${servicio} quedó confirmada para ${cuando}. ¡Te esperamos!`,
    status: "Enviado",
  };
}

function setAppView(view) {
  const resolved =
    view === "services" || view === "activity" ? "agenda" : view || "agenda";
  state.appView = resolved;
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === resolved);
  });

  const agendaPanel = document.querySelector('[data-panel="agenda"]');
  const reservationsPanel = document.querySelector('[data-panel="reservations"]');
  const profilePanel = document.querySelector('[data-panel="profile"]');

  const showAgenda = resolved === "agenda";
  const showReservations = resolved === "reservations";
  const showProfile = resolved === "profile";

  if (agendaPanel) agendaPanel.hidden = !showAgenda;
  if (reservationsPanel) reservationsPanel.hidden = !showReservations;
  if (profilePanel) profilePanel.hidden = !showProfile;

  if (showAgenda && agendaPanel) {
    agendaPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else if (showReservations) {
    renderReservations();
    reservationsPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else if (showProfile) {
    renderProfile();
    profilePanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function profileEmail() {
  return (
    state.sessionEmail ||
    el.loginEmail?.value?.trim() ||
    (tenant() ? `admin@${tenant().slug}.example` : "")
  );
}

function syncBookingEmailFromProfile() {
  if (!el.bookingEmail) return;
  const email = profileEmail();
  if (email) el.bookingEmail.value = email;
}

function applyTenantTheme(slug) {
  document.body.setAttribute("data-tenant", slug);
  const t = TENANTS[slug];
  el.tenantBadge.textContent = t.badge;
  el.tenantName.textContent = t.short;
  el.tenantPlan.textContent = state.tenantMe?.plan || "STANDARD";
  el.bookingHeading.textContent = t.bookingLabel;
  syncBookingEmailFromProfile();
  if (el.hoursBanner) {
    el.hoursBanner.textContent = `Horario: ${t.hoursLabel}`;
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function localTimeStr(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function hourTimeStr(d = new Date()) {
  return `${pad2(d.getHours())}:00`;
}

function minutesFromHHMM(hhmm) {
  const [h, m] = String(hhmm).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

/** Cupos solo a hora en punto (sin minutos). */
function snapToHour(date) {
  const d = new Date(date.getTime());
  d.setMinutes(0, 0, 0);
  return d;
}

function ceilToNextHour(date) {
  const d = new Date(date.getTime());
  if (d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0) {
    return d;
  }
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

/** Etiqueta amigable sin minutos: "9 a. m." */
function hourOptionLabel(hhmm) {
  const hour = Number(String(hhmm).slice(0, 2));
  const d = new Date(2000, 0, 1, hour, 0, 0, 0);
  return d.toLocaleTimeString("es-CO", { hour: "numeric" });
}

/** Horas en punto disponibles para una fecha (según tenant y “ahora”). */
function availableHourSlotsForDate(dateStr, t = tenant()) {
  if (!dateStr) return [];
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d, 12, 0, 0, 0);
  const win = businessWindowFor(day, t);
  if (!win) return [];

  const openH = Math.ceil(minutesFromHHMM(win.open) / 60);
  const lastH = Math.floor((minutesFromHHMM(win.close) - 60) / 60);
  const now = new Date();
  const today = localDateStr(now);
  let minH = openH;
  if (dateStr === today) {
    const next = ceilToNextHour(new Date(now.getTime() + 1000));
    minH = Math.max(minH, next.getHours());
    if (localDateStr(next) !== today) return [];
  }

  const slots = [];
  for (let h = minH; h <= lastH; h++) {
    slots.push(`${pad2(h)}:00`);
  }
  return slots;
}

function fillBookingHourOptions(preferred = "") {
  const dateStr = el.bookingDate.value;
  const slots = availableHourSlotsForDate(dateStr);
  const prev = preferred || el.bookingTime.value || "";
  const keep = slots.includes(prev) ? prev : slots[0] || "";

  el.bookingTime.innerHTML = slots.length
    ? slots
        .map(
          (hhmm) =>
            `<option value="${hhmm}">${escapeHtml(hourOptionLabel(hhmm))}</option>`
        )
        .join("")
    : `<option value="">Sin horas disponibles</option>`;

  el.bookingTime.value = keep;
  el.bookingTime.disabled = slots.length === 0;
  return slots;
}

function isHolidayDate(dateStr) {
  return COLOMBIA_HOLIDAYS.has(dateStr);
}

function dayKindForDate(dateObj) {
  const dateStr = localDateStr(dateObj);
  if (isHolidayDate(dateStr)) return "holiday";
  const dow = dateObj.getDay(); // 0=Dom … 6=Sáb
  if (dow === 0 || dow === 6) return "weekend";
  return "weekday";
}

/** Ventana de atención del tenant para una fecha (null = cerrado). */
function businessWindowFor(dateObj, t = tenant()) {
  if (!t?.hours) return null;
  const kind = dayKindForDate(dateObj);
  if (kind === "holiday") {
    if (t.hours.closedOnHolidays || !t.hours.holiday) return null;
    return { ...t.hours.holiday, kind: "festivo" };
  }
  if (kind === "weekend") {
    return { ...t.hours.weekend, kind: "fin de semana" };
  }
  return { ...t.hours.weekday, kind: "hábil" };
}

function formatWindowLabel(win) {
  if (!win) return "cerrado";
  return `${win.open}–${win.close}`;
}

function formSlotDate() {
  const date = el.bookingDate.value;
  const time = (el.bookingTime.value || "").slice(0, 5);
  if (!date || !time || !/^\d{2}:\d{2}$/.test(time)) return new Date(NaN);
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mi] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mi, 0, 0);
}

function showBookingSlotError(msg) {
  if (!el.bookingSlotError) return;
  if (!msg) {
    el.bookingSlotError.hidden = true;
    el.bookingSlotError.textContent = "";
    return;
  }
  el.bookingSlotError.hidden = false;
  el.bookingSlotError.textContent = msg;
}

function updateBookingSlotHint() {
  if (!el.bookingSlotHint) return;
  const t = tenant();
  const slot = formSlotDate();
  const now = new Date();
  const hoursLine = t ? `Atención: ${t.hoursLabel}.` : "";

  if (Number.isNaN(slot.getTime())) {
    el.bookingSlotHint.textContent = `${hoursLine} Elige fecha y hora dentro del horario.`;
    el.bookingSlotHint.classList.remove("is-past");
    return;
  }

  const win = businessWindowFor(slot, t);
  const when = slot.toLocaleString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (slot.getTime() <= now.getTime()) {
    el.bookingSlotHint.textContent = `${when} — ya pasó (ahora ${localTimeStr(now)}). ${hoursLine}`;
    el.bookingSlotHint.classList.add("is-past");
    return;
  }
  if (!win) {
    const kind = dayKindForDate(slot);
    const kindLabel =
      kind === "holiday" ? "festivo" : kind === "weekend" ? "fin de semana" : "hábil";
    el.bookingSlotHint.textContent = `${when} — sin atención (${kindLabel}). ${hoursLine}`;
    el.bookingSlotHint.classList.add("is-past");
    return;
  }
  const mins = slot.getHours() * 60 + slot.getMinutes();
  const openM = minutesFromHHMM(win.open);
  const closeM = minutesFromHHMM(win.close);
  if (mins < openM || mins >= closeM) {
    el.bookingSlotHint.textContent = `${when} — fuera de horario (${formatWindowLabel(win)} ese día). ${hoursLine}`;
    el.bookingSlotHint.classList.add("is-past");
    return;
  }

  el.bookingSlotHint.textContent = `Cita ${when} · horario ${formatWindowLabel(win)} (${win.kind}).`;
  el.bookingSlotHint.classList.remove("is-past");
}

/** Actualiza fecha mínima y el listado de horas exactas del día. */
function enforceFutureBookingInputs() {
  const now = new Date();
  const today = localDateStr(now);
  el.bookingDate.min = today;

  if (!el.bookingDate.value || el.bookingDate.value < today) {
    el.bookingDate.value = today;
  }

  fillBookingHourOptions();
  updateBookingSlotHint();
}

/** Próximo cupo válido (hora en punto) dentro del horario de atención. */
function nextBusinessSlot(from = new Date(), t = tenant()) {
  let cursor = ceilToNextHour(new Date(from.getTime() + 1000));
  for (let i = 0; i < 24 * 14; i++) {
    const win = businessWindowFor(cursor, t);
    if (win) {
      const mins = cursor.getHours() * 60;
      const openM = minutesFromHHMM(win.open);
      const lastM = minutesFromHHMM(win.close) - 60;
      if (mins < openM) {
        cursor.setHours(Math.floor(openM / 60), 0, 0, 0);
        continue;
      }
      if (mins <= lastM) return snapToHour(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }
  return snapToHour(new Date(from.getTime() + 24 * 3600 * 1000));
}

function defaultBookingSlot() {
  const slot = nextBusinessSlot(new Date(), tenant() || TENANTS.cda);
  el.bookingDate.value = localDateStr(slot);
  showBookingSlotError("");
  fillBookingHourOptions(hourTimeStr(slot));
  updateBookingSlotHint();
}

/** Bloquea confirmación si está en el pasado o fuera del horario del tenant. */
function assertFutureSlot() {
  const dateStr = el.bookingDate.value;
  const time = el.bookingTime.value;
  const slots = availableHourSlotsForDate(dateStr);
  if (!dateStr || !time || !slots.includes(time)) {
    throw new Error(
      slots.length
        ? "Elige una hora de la lista (solo horas exactas)."
        : "No hay horas disponibles en esa fecha. Elige otro día."
    );
  }

  const slot = formSlotDate();
  const now = new Date();
  if (Number.isNaN(slot.getTime())) {
    throw new Error("Fecha u hora inválida");
  }
  if (slot.getTime() <= now.getTime()) {
    throw new Error(
      `No puedes confirmar una cita en el pasado. Ahora son las ${localTimeStr(now)}.`
    );
  }

  const t = tenant();
  const win = businessWindowFor(slot, t);
  if (!win) {
    if (t?.hours?.closedOnHolidays && isHolidayDate(localDateStr(slot))) {
      throw new Error(
        `${t.short} no atiende festivos. Elige un día hábil o fin de semana según el horario.`
      );
    }
    throw new Error(
      `${t?.short || "Esta organización"} no atiende en esa fecha. Horario: ${t?.hoursLabel || "—"}.`
    );
  }
  return slot;
}

function slotIsoFromForm() {
  const local = assertFutureSlot();
  return local.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function randomSlotIso() {
  const slot = nextBusinessSlot(
    new Date(Date.now() + 2 * 3600 * 1000),
    tenant() || TENANTS.cda
  );
  slot.setHours(slot.getHours() + Math.floor(Math.random() * 3), 0, 0, 0);
  return snapToHour(slot).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function resetTimeline() {
  state.seenStatuses = new Set();
  state.appointment = null;
}

function updateTimeline(status) {
  if (status) state.seenStatuses.add(status);
}

function statusBadgeClass(status) {
  if (status === "CONFIRMED" || status === "PAID") return "ok";
  if (status === "REFUNDED") return "refund";
  if (status === "CANCELLED") return "err";
  return "run";
}

function reservationStatusLabel(r) {
  if (r.status === "CANCELLED" && r.refunded) return STATUS_LABEL.REFUNDED;
  return STATUS_LABEL[r.status] || r.status || "—";
}

function canManageReservation(r) {
  return r.status === "CONFIRMED" || r.status === "PAID";
}

function upsertReservation(entry) {
  const idx = state.reservations.findIndex((r) => r.holdId === entry.holdId);
  if (idx >= 0) state.reservations[idx] = { ...state.reservations[idx], ...entry };
  else state.reservations.unshift(entry);
  renderReservations();
}

function renderReservations() {
  if (!el.reservationsList) return;
  const items = state.reservations;
  el.reservationsEmpty.hidden = items.length > 0;
  el.reservationsList.innerHTML = items
    .map((r) => {
      const amount = `${Number(r.amount || 0).toLocaleString("es-CO")} ${r.currency || "COP"}`;
      const manageable = canManageReservation(r);
      const refundRow =
        r.refunded || r.status === "REFUNDED"
          ? `<div><dt>Devolución</dt><dd>${escapeHtml(
              r.refundNote || "Reembolso procesado en NebulaPay al medio de pago original."
            )}</dd></div>`
          : "";
      const noticeBlock = r.notice
        ? `<div class="reservation-notice">
            <h4>Aviso al cliente</h4>
            <p><span class="notice-channel">${escapeHtml(r.notice.channel)}</span> · ${escapeHtml(
              r.notice.status
            )} · ${escapeHtml(r.notice.recipient)}</p>
            <blockquote>${escapeHtml(r.notice.body)}</blockquote>
          </div>`
        : "";
      const actions = manageable
        ? `<div class="reservation-actions">
            <button type="button" class="btn-ghost compact" data-res-action="reschedule" data-hold="${escapeHtml(
              r.holdId
            )}">Modificar</button>
            <button type="button" class="btn-text danger" data-res-action="cancel" data-hold="${escapeHtml(
              r.holdId
            )}">Cancelar cita</button>
          </div>`
        : "";
      return `<article class="reservation-card" data-hold="${escapeHtml(r.holdId || "")}">
        <header>
          <strong>${escapeHtml(r.serviceName || "Servicio")}</strong>
          <span class="res-badge ${statusBadgeClass(
            r.refunded ? "REFUNDED" : r.status
          )}">${escapeHtml(reservationStatusLabel(r))}</span>
        </header>
        <dl>
          <div><dt>Fecha y hora</dt><dd>${escapeHtml(r.whenLabel || "—")}</dd></div>
          <div><dt>Monto</dt><dd>${escapeHtml(amount)}</dd></div>
          <div><dt>Correo</dt><dd>${escapeHtml(r.email || "—")}</dd></div>
          <div><dt>Referencia</dt><dd>${escapeHtml(
            r.holdId ? String(r.holdId).slice(0, 13) + "…" : "—"
          )}</dd></div>
          <div><dt>Organización</dt><dd>${escapeHtml(r.org || tenant()?.short || "—")}</dd></div>
          ${refundRow}
        </dl>
        ${noticeBlock}
        ${actions}
      </article>`;
    })
    .join("");
}

function syncRescheduleBanner() {
  const r = state.rescheduleFrom;
  if (!el.rescheduleBanner) return;
  if (!r) {
    el.rescheduleBanner.hidden = true;
    el.bookBtn.textContent = "Reservar y pagar";
    if (el.serviceSelect) el.serviceSelect.disabled = false;
    if (el.bookingHeading && tenant()) {
      el.bookingHeading.textContent = tenant().bookingLabel;
    }
    return;
  }
  el.rescheduleBanner.hidden = false;
  el.rescheduleBannerText.textContent = `Modificando “${r.serviceName}” (${r.whenLabel}). Elige la nueva fecha u hora; se reagenda la misma cita sin cobro ni devolución.`;
  el.bookBtn.textContent = "Confirmar nueva fecha";
  if (el.bookingHeading) el.bookingHeading.textContent = "Modificar cita";
  if (el.serviceSelect) el.serviceSelect.disabled = true;
}

function clearRescheduleMode() {
  state.rescheduleFrom = null;
  syncRescheduleBanner();
}

function beginReschedule(holdId) {
  const r = state.reservations.find((x) => x.holdId === holdId);
  if (!r || !canManageReservation(r)) return;
  state.rescheduleFrom = { ...r, clientKey: r.clientKey || r.holdId };
  if (r.serviceId) {
    state.selectedServiceId = r.serviceId;
    if (el.serviceSelect) el.serviceSelect.value = r.serviceId;
  }
  syncBookingEmailFromProfile();
  defaultBookingSlot();
  syncRescheduleBanner();
  setAppView("agenda");
  showBookingSlotError("");
  setMeta("modificar cita");
  pushFeed("Elige nueva fecha u hora para reagendar", "run");
}

async function apiCancelAppointment(holdId, reason) {
  const res = await api(`/api/v1/schedules/appointments/${holdId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  log(
    [
      `>>> POST /api/v1/schedules/appointments/${holdId}/cancel`,
      `<<< HTTP ${res.status}`,
      JSON.stringify(res.body, null, 2),
    ].join("\n"),
    res.ok ? "ok" : "err"
  );
  return res;
}

async function cancelPaidReservation(holdId) {
  const r = state.reservations.find((x) => x.holdId === holdId);
  if (!r || !canManageReservation(r)) return;
  const ok = window.confirm(
    `¿Cancelar “${r.serviceName}” (${r.whenLabel})?\n\nSe liberará el cupo y se devolverá el dinero al medio de pago usado en NebulaPay.`
  );
  if (!ok) return;

  setMeta("Cancelando cita…");
  pushFeed("Cancelando cita pagada…", "run");
  const res = await apiCancelAppointment(holdId, "USER_CANCELLED_PAID");
  if (!res.ok && res.status !== 404) {
    throw new Error(`No se pudo cancelar (HTTP ${res.status})`);
  }

  const refundNote = `Devolución de ${Number(r.amount || 0).toLocaleString("es-CO")} ${
    r.currency || "COP"
  } a la tarjeta **** ${r.cardLast4 || "1111"} vía NebulaPay.`;
  upsertReservation({
    ...r,
    status: "CANCELLED",
    refunded: true,
    refundNote,
  });
  markChip("saga");
  pushFeed("Cita cancelada · devolución en proceso", "ok");
  setAppView("reservations");
  setMeta("devolución");
}

/** Reemplaza la cita en la lista (una sola tarjeta; sin devolución). */
function replaceReservation(oldHoldId, entry) {
  const old = state.reservations.find((r) => r.holdId === oldHoldId) || state.rescheduleFrom;
  state.reservations = state.reservations.filter(
    (r) => r.holdId !== oldHoldId && r.holdId !== entry.holdId
  );
  state.reservations.unshift({
    ...entry,
    clientKey: old?.clientKey || oldHoldId,
    serviceName: entry.serviceName || old?.serviceName,
    amount: old?.amount ?? entry.amount,
    currency: old?.currency || entry.currency,
    email: entry.email || old?.email,
    phone: entry.phone || old?.phone || DEMO_CUSTOMER_PHONE,
    org: entry.org || old?.org,
    cardLast4: old?.cardLast4 || entry.cardLast4 || "1111",
    paid: true,
    refunded: false,
    refundNote: null,
    notice: entry.notice || null,
  });
  renderReservations();
}

/** Reagenda sin pasarela ni devolución: misma cita, nueva fecha/hora. */
async function rescheduleAppointment(serviceId) {
  const old = state.rescheduleFrom;
  if (!old?.holdId) throw new Error("No hay cita para modificar");

  showBookingSlotError("");
  setMeta("Reagendando…");
  pushFeed("Reagendando cita…", "run");

  const checkout = await createHold(serviceId);
  const last = await pollAppointment(checkout.holdId, { silentFeed: true });
  const final = last?.status;
  if (final !== "CONFIRMED" && final !== "PAID") {
    if (checkout.holdId) {
      await apiCancelAppointment(checkout.holdId, "RESCHEDULE_ABORTED");
    }
    throw new Error(
      final === "CANCELLED"
        ? "No se pudo confirmar el nuevo horario. Tu cita original se mantiene."
        : "Tiempo de espera agotado al reagendar. Tu cita original se mantiene."
    );
  }

  const cancelRes = await apiCancelAppointment(old.holdId, "USER_RESCHEDULED");
  if (!cancelRes.ok && cancelRes.status !== 404) {
    pushFeed("Nuevo horario listo; revisa la cita anterior en actividad.", "err");
  }

  replaceReservation(old.holdId, {
    holdId: checkout.holdId,
    serviceId: checkout.serviceId || serviceId,
    serviceName: checkout.serviceName,
    whenLabel: checkout.whenLabel,
    amount: checkout.amount,
    currency: checkout.currency,
    email: checkout.email,
    phone: checkout.phone || DEMO_CUSTOMER_PHONE,
    status: "CONFIRMED",
    org: tenant()?.short,
    notice: buildClientNotice({
      phone: checkout.phone || DEMO_CUSTOMER_PHONE,
      whenLabel: checkout.whenLabel,
      serviceName: checkout.serviceName,
    }),
  });

  clearRescheduleMode();
  markChip("redis");
  markChip("faas");
  pushFeed(`Cita reagendada a ${checkout.whenLabel}`, "ok");
  pushFeed("Aviso de confirmación enviado por WhatsApp", "ok");
  setAppView("reservations");
  setMeta("cita reagendada");
}

function friendlyHoldError(status, body) {
  const detail =
    body?.detail?.detail ||
    body?.detail ||
    (typeof body === "string" ? body : "") ||
    "";
  const text = String(detail);
  if (status === 409 || /SLOT_ALREADY_LOCKED|Conflict/i.test(text)) {
    return "Ese horario ya no está disponible. Elige otra fecha u hora e inténtalo de nuevo.";
  }
  if (status === 400) return "No se pudo crear la reserva. Revisa los datos e inténtalo de nuevo.";
  return `No se pudo reservar (HTTP ${status}).`;
}

async function finishCheckoutToReservations(payload) {
  closeCheckout();
  state.checkout = null;
  const paid = payload.status === "CONFIRMED" || payload.status === "PAID";
  const entry = {
    holdId: payload.holdId,
    clientKey: payload.holdId,
    serviceId: payload.serviceId || state.selectedServiceId,
    serviceName: payload.serviceName,
    whenLabel: payload.whenLabel,
    amount: payload.amount,
    currency: payload.currency,
    email: payload.email || el.bookingEmail?.value,
    phone: payload.phone || DEMO_CUSTOMER_PHONE,
    status: payload.status,
    org: tenant()?.short,
    paid,
    cardLast4: payload.cardLast4 || "1111",
    refunded: false,
  };
  if (paid) {
    entry.notice = buildClientNotice({
      phone: entry.phone,
      whenLabel: entry.whenLabel,
      serviceName: entry.serviceName,
    });
  }
  upsertReservation(entry);
  if (entry.notice) {
    pushFeed("Aviso de confirmación enviado por WhatsApp", "ok");
    log(
      [
        "Aviso al cliente (notification-service → WhatsApp mock)",
        `Canal=${entry.notice.channel}`,
        `Para=${entry.notice.recipient}`,
        entry.notice.body,
      ].join("\n"),
      "ok"
    );
    markChip("faas");
  }
  clearRescheduleMode();
  setAppView("reservations");
  setMeta(STATUS_LABEL[payload.status] || payload.status);
}

function renderServices() {
  const items = state.services || [];
  if (!el.serviceSelect) return;

  el.serviceSelect.innerHTML = items.length
    ? items
        .map(
          (s) =>
            `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} — ${Number(
              s.price_amount
            ).toLocaleString("es-CO")} ${escapeHtml(s.currency || "COP")}</option>`
        )
        .join("")
    : `<option value="">Sin servicios disponibles</option>`;

  if (state.selectedServiceId && items.some((s) => s.id === state.selectedServiceId)) {
    el.serviceSelect.value = state.selectedServiceId;
  } else if (items[0]) {
    state.selectedServiceId = items[0].id;
    el.serviceSelect.value = items[0].id;
  } else {
    state.selectedServiceId = null;
  }
}

function setAssistantOpen(open) {
  state.assistantOpen = open;
  el.presenterBar.hidden = !open;
  if (open) renderPresenter();
}

function renderPresenter() {
  const step = SCRIPT[state.scriptIndex];
  const total = SCRIPT.length;
  el.presenterTitle.textContent = step.title;
  el.presenterHint.textContent = step.hint;
  el.presenterCounter.textContent = `${state.scriptIndex + 1} / ${total}`;
  el.presenterPrev.disabled = state.scriptIndex === 0;
  el.presenterNext.disabled = state.scriptIndex === total - 1;
  el.presenterRun.disabled = state.busy;
  renderCodePanel(step.codeKey);
}

function closeWhatIf() {
  el.whatIfMenu.hidden = true;
}

async function api(path, options = {}) {
  const headers = {
    "content-type": "application/json",
    ...(options.headers || {}),
  };
  if (state.token && !headers.Authorization && options.auth !== false) {
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

async function runAuthPassword(slug, username, password) {
  setMeta("Iniciando sesión…");
  log("Autenticando usuario…", "run");
  const payload = {
    grant_type: "password",
    tenant_slug: slug,
    username,
    password,
  };
  const { ok, status, body } = await api("/api/v1/auth/token", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
    headers: {},
  });
  if (!ok) {
    const detail = body?.detail || JSON.stringify(body);
    throw new Error(detail || `No se pudo iniciar sesión (HTTP ${status})`);
  }
  state.token = body.access_token;
  state.tenantSlug = slug;
  state.sessionEmail = username;
  state.sessionPhone = DEMO_CUSTOMER_PHONE;
  syncBookingEmailFromProfile();
  const me = await api("/api/v1/tenants/me");
  state.tenantMe = me.body;
  markChip("gateway");
  markChip("multitenant");
  pushFeed(`Sesión iniciada · ${TENANTS[slug].short}`, "ok");
  log(
    [
      ">>> POST /api/v1/auth/token",
      JSON.stringify({ ...payload, password: "[oculto]" }, null, 2),
      "",
      `<<< HTTP ${status}`,
      JSON.stringify(
        { token_type: body.token_type, expires_in: body.expires_in, access_token: "[oculto]" },
        null,
        2
      ),
      "",
      "<<< GET /api/v1/tenants/me",
      JSON.stringify(me.body, null, 2),
    ].join("\n"),
    "ok"
  );
  setMeta("sesión activa");
}

async function loadCatalog() {
  if (!state.token) throw new Error("Primero entra a una organización");
  setMeta("Cargando servicios…");
  log("GET /api/v1/catalog/services …", "run");
  const { ok, status, body } = await api("/api/v1/catalog/services");
  if (!ok) throw new Error(`Servicios HTTP ${status}: ${JSON.stringify(body)}`);
  const all = body.items || [];
  state.services = all.filter((s) => !isProbeService(s));
  const happy = tenant()?.happyServiceId;
  state.selectedServiceId =
    state.services.find((s) => s.id === happy)?.id || state.services[0]?.id || null;
  renderServices();
  markChip("multitenant");
  pushFeed(`${state.services.length} servicios de ${tenant()?.short}`, "ok");
  const lines = state.services.map(
    (s) => `• ${s.name} — ${Number(s.price_amount).toLocaleString("es-CO")} ${s.currency}`
  );
  log(
    [
      `Organización: ${state.tenantSlug}`,
      `${state.services.length} servicios visibles (${all.length - state.services.length} internos ocultos)`,
      "",
      ...lines,
      "",
      JSON.stringify({ items: state.services }, null, 2),
    ].join("\n"),
    "ok"
  );
  setMeta("servicios listos");
}

function setCheckoutStatus(msg, kind = "") {
  el.checkoutStatus.textContent = msg;
  el.checkoutStatus.className = "checkout-status" + (kind ? ` ${kind}` : "");
}

function openCheckout(checkout) {
  state.checkout = checkout;
  el.checkoutMerchant.textContent = tenant()?.short || "NebulaStack";
  el.checkoutService.textContent = checkout.serviceName;
  el.checkoutWhen.textContent = checkout.whenLabel;
  el.checkoutAmount.textContent = `${Number(checkout.amount).toLocaleString("es-CO")} ${
    checkout.currency || "COP"
  }`;
  setCheckoutStatus(
    "Cupo reservado. Confirma el pago o vuelve para cambiar fecha u hora."
  );
  const pm = ensurePaymentMethod();
  if (el.payName) el.payName.value = pm.holder || "Cliente Demo";
  if (el.payCard) el.payCard.value = pm.numberMasked || "4111 1111 1111 1111";
  if (el.payExp) el.payExp.value = pm.exp || "12/28";
  el.payConfirmBtn.disabled = false;
  el.payCancelBtn.disabled = false;
  el.checkoutOverlay.hidden = false;
}

function closeCheckout() {
  el.checkoutOverlay.hidden = true;
}

async function pollAppointment(holdId, { silentFeed = false } = {}) {
  let last = null;
  let sawPaid = false;
  for (let i = 1; i <= 30; i++) {
    setMeta(`Actualizando ${i}/30`);
    const appt = await api(`/api/v1/schedules/appointments/${holdId}`);
    last = appt.body;
    state.appointment = last;
    if (last?.status) {
      updateTimeline(last.status);
      if (last.status === "PAID" && !sawPaid) {
        sawPaid = true;
        if (!silentFeed) pushFeed("Cobro OK", "ok");
        markChip("outbox");
        markChip("faas");
        markChip("saga");
      }
      if (last.status === "CONFIRMED") {
        if (!silentFeed) {
          pushFeed("Cita confirmada · aviso WhatsApp enviado", "ok");
        }
        markChip("faas");
        markChip("outbox");
      }
      if (last.status === "CANCELLED") {
        if (!silentFeed) pushFeed("Cita cancelada · cupo liberado", "err");
      }
    }
    log(
      [
        `GET /api/v1/schedules/appointments/${holdId}`,
        `Estado=${last?.status} (${STATUS_LABEL[last?.status] || "—"}) intento ${i}`,
        "",
        JSON.stringify(last, null, 2),
      ].join("\n"),
      "run"
    );
    if (last?.status === "CONFIRMED" || last?.status === "CANCELLED") break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return last;
}

async function createHold(serviceId, options = {}) {
  if (!state.token) throw new Error("Primero entra a una organización");
  const startIso = options.startIso || slotIsoFromForm();
  const email = options.email || el.bookingEmail.value || profileEmail() || tenant()?.email;
  const service =
    state.services.find((s) => s.id === serviceId) ||
    ({ id: serviceId, name: "Servicio", price_amount: 0, currency: "COP" });
  const idem = uuid();
  const req = {
    service_id: serviceId,
    start_time: startIso,
    customer_email: email,
    customer_phone: DEMO_CUSTOMER_PHONE,
  };
  resetTimeline();
  updateTimeline("HOLD");
  setMeta("Reservando…");
  pushFeed("Reservando cupo…", "run");
  log([">>> POST /api/v1/schedules/hold", JSON.stringify(req, null, 2)].join("\n"), "run");
  const holdRes = await api("/api/v1/schedules/hold", {
    method: "POST",
    headers: { "Idempotency-Key": idem },
    body: JSON.stringify(req),
  });
  if (!holdRes.ok) {
    const msg = friendlyHoldError(holdRes.status, holdRes.body);
    showBookingSlotError(msg);
    log(
      [`<<< HTTP ${holdRes.status}`, JSON.stringify(holdRes.body, null, 2)].join("\n"),
      "err"
    );
    throw new Error(msg);
  }
  markChip("redis");
  const holdId = holdRes.body.hold_id;
  updateTimeline(holdRes.body.status || "HOLD");
  pushFeed("Cupo reservado", "ok");
  log(
    [`<<< HTTP ${holdRes.status}`, JSON.stringify(holdRes.body, null, 2)].join("\n"),
    "ok"
  );
  const slot = options.startIso ? new Date(options.startIso) : formSlotDate();
  const whenLabel = slot.toLocaleString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    holdId,
    serviceId,
    serviceName: service.name,
    amount: holdRes.body.amount ?? service.price_amount,
    currency: holdRes.body.currency || service.currency || "COP",
    whenLabel,
    email,
    phone: DEMO_CUSTOMER_PHONE,
    holdBody: holdRes.body,
  };
}

async function payCheckout() {
  const checkout = state.checkout;
  if (!checkout?.holdId) return;
  el.payConfirmBtn.disabled = true;
  el.payCancelBtn.disabled = true;
  setCheckoutStatus("Procesando pago en NebulaPay…", "is-busy");
  pushFeed("Pago en pasarela…", "run");
  markChip("saga");
  try {
    const last = await pollAppointment(checkout.holdId);
    const final = last?.status;
    if (!final) throw new Error("Tiempo de espera agotado en el cobro");
    if (final === "CONFIRMED") {
      markChip("faas");
      markChip("outbox");
      setCheckoutStatus("Pago aprobado. Confirmando cita…", "is-busy");
      pushFeed("Cita confirmada", "ok");
    } else if (final === "CANCELLED") {
      setCheckoutStatus("El cobro no pudo completarse.", "is-err");
      markChip("saga");
      pushFeed("Pago no completado", "err");
    }
    await finishCheckoutToReservations({
      status: final,
      serviceId: checkout.serviceId,
      serviceName: checkout.serviceName,
      whenLabel: checkout.whenLabel,
      amount: checkout.amount,
      currency: checkout.currency,
      holdId: checkout.holdId,
      email: checkout.email,
      phone: checkout.phone || DEMO_CUSTOMER_PHONE,
      transactionId: last?.transaction_id,
      cardLast4: ensurePaymentMethod().last4 || "1111",
    });
  } catch (err) {
    setCheckoutStatus(String(err.message || err), "is-err");
    el.payConfirmBtn.disabled = false;
    el.payCancelBtn.disabled = false;
    throw err;
  }
}

/** Abandona la pasarela: libera el cupo y vuelve a la agenda para editar. */
async function cancelCheckout() {
  const checkout = state.checkout;
  if (!checkout?.holdId) {
    closeCheckout();
    setAppView("agenda");
    return;
  }
  el.payConfirmBtn.disabled = true;
  el.payCancelBtn.disabled = true;
  setCheckoutStatus("Liberando cupo para que puedas editar la cita…", "is-busy");
  pushFeed("Pago omitido · volviendo a editar", "run");
  try {
    const res = await api(`/api/v1/schedules/appointments/${checkout.holdId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason: "USER_CANCELLED_CHECKOUT" }),
    });
    log(
      [
        `>>> POST /api/v1/schedules/appointments/${checkout.holdId}/cancel`,
        `<<< HTTP ${res.status}`,
        JSON.stringify(res.body, null, 2),
      ].join("\n"),
      res.ok ? "ok" : "err"
    );
    if (!res.ok) {
      await pollAppointment(checkout.holdId, { silentFeed: true });
    }
    state.checkout = null;
    state.appointment = null;
    closeCheckout();
    setAppView("agenda");
    showBookingSlotError("");
    enforceFutureBookingInputs();
    pushFeed("Cupo liberado. Puedes cambiar fecha u hora y volver a reservar.", "ok");
    setMeta("editar cita");
    if (el.bookingDate) el.bookingDate.focus();
  } catch (err) {
    setCheckoutStatus(String(err.message || err), "is-err");
    el.payConfirmBtn.disabled = false;
    el.payCancelBtn.disabled = false;
    throw err;
  }
}

/** Flujo producto: hold → pasarela → Mis reservas (o reagendar sin cobro). */
async function startCheckoutFlow(serviceId) {
  showBookingSlotError("");
  if (state.rescheduleFrom?.holdId) {
    await rescheduleAppointment(serviceId);
    return;
  }
  const checkout = await createHold(serviceId);
  openCheckout(checkout);
  setMeta("en pasarela");
}

/** Flujo técnico (asistente / probes): hold + poll sin UI de pasarela. */
async function bookService(serviceId, expected, options = {}) {
  const checkout = await createHold(serviceId, options);
  log("Procesando cobro y confirmación…", "run");
  const last = await pollAppointment(checkout.holdId);
  const final = last?.status;
  if (!final) throw new Error("Tiempo de espera agotado");
  if (expected && final !== expected) {
    throw new Error(`Se esperaba ${expected}, se obtuvo ${final}`);
  }
  if (final === "CONFIRMED") {
    markChip("saga");
    markChip("faas");
    markChip("outbox");
  }
  if (final === "CANCELLED" && options.markSaga) markChip("saga");
  if (final === "CANCELLED" && options.markCb) markChip("cb");
  log(
    [
      `Estado final: ${final} (${STATUS_LABEL[final]})`,
      `organización=${state.tenantSlug}`,
      "",
      JSON.stringify(last, null, 2),
    ].join("\n"),
    "ok"
  );
  setMeta(STATUS_LABEL[final] || final);
  return last;
}

async function loginAs(slug, username, password) {
  const email = username || (slug === "odonto" ? "admin@odonto.example" : "admin@cda.example");
  const pass = password || "Demo123!";
  showScreen("app");
  setAppView("agenda");
  resetTimeline();
  await runAuthPassword(slug, email, pass);
  applyTenantTheme(slug);
  renderProfile();
  await loadCatalog();
  defaultBookingSlot();
  renderCodePanel(slug === "cda" ? "auth-cda" : "switch-odonto");
  setMeta(`${TENANTS[slug].short}`);
}

async function runSagaProbe() {
  closeWhatIf();
  const t = tenant() || TENANTS.cda;
  if (state.tenantSlug !== t.slug) await loginAs(t.slug);
  renderCodePanel("saga-fail");
  pushFeed("Simulando rechazo de pago…", "run");
  await bookService(t.failServiceId, "CANCELLED", {
    startIso: randomSlotIso(),
    markSaga: true,
  });
  markChip("saga");
}

async function runCbProbe() {
  closeWhatIf();
  const t = tenant() || TENANTS.cda;
  if (!state.token) await loginAs(t.slug);
  renderCodePanel("circuit-breaker");
  pushFeed("Simulando pasarela sin respuesta…", "run");
  await bookService(t.cbServiceId, "CANCELLED", {
    startIso: randomSlotIso(),
    markCb: true,
  });
  markChip("cb");
}

async function runDoubleBooking() {
  closeWhatIf();
  const t = tenant() || TENANTS.cda;
  if (!state.token) await loginAs(t.slug);
  renderCodePanel("double-booking");
  const startIso = randomSlotIso();
  const req = {
    service_id: t.happyServiceId,
    start_time: startIso,
    customer_email: `cliente1@${t.slug}.example`,
    customer_phone: DEMO_CUSTOMER_PHONE,
  };
  setMeta("Comprobando cupo…");
  pushFeed("Dos clientes piden el mismo cupo…", "run");
  log(
    [
      "Dos POST /hold concurrentes al mismo horario",
      JSON.stringify(req, null, 2),
    ].join("\n"),
    "run"
  );
  const [a, b] = await Promise.all([
    api("/api/v1/schedules/hold", {
      method: "POST",
      headers: { "Idempotency-Key": uuid() },
      body: JSON.stringify(req),
    }),
    api("/api/v1/schedules/hold", {
      method: "POST",
      headers: { "Idempotency-Key": uuid() },
      body: JSON.stringify({ ...req, customer_email: `cliente2@${t.slug}.example` }),
    }),
  ]);
  const statuses = [a.status, b.status].sort((x, y) => x - y);
  markChip("redis");
  const okRace =
    (statuses.includes(201) || statuses.includes(200)) && statuses.includes(409);
  if (okRace) {
    pushFeed("Un cupo asignado · el otro recibió conflicto de agenda", "ok");
  } else {
    pushFeed(`Resultado inesperado: ${statuses.join(" + ")}`, "err");
  }
  log(
    [
      `Respuesta A: HTTP ${a.status}`,
      JSON.stringify(a.body, null, 2),
      "",
      `Respuesta B: HTTP ${b.status}`,
      JSON.stringify(b.body, null, 2),
    ].join("\n"),
    okRace ? "ok" : "err"
  );
  if (okRace) {
    setMeta("cupo protegido");
    const winner = a.ok ? a.body : b.body;
    if (winner?.hold_id) {
      state.appointment = winner;
      updateTimeline(winner.status || "HOLD");
      await pollAppointment(winner.hold_id);
    }
  } else {
    setMeta("revisar conflicto");
  }
}

async function withBusy(fn) {
  if (state.busy) return;
  state.busy = true;
  setBusyUi(true);
  try {
    await fn();
  } catch (err) {
    pushFeed(String(err.message || err), "err");
    log(String(err.message || err), "err");
    setMeta("error");
  } finally {
    state.busy = false;
    setBusyUi(false);
  }
}

function setBusyUi(busy) {
  el.bookBtn.disabled = busy;
  el.presenterRun.disabled = busy;
  el.probeSagaBtn.disabled = busy;
  el.probeCbBtn.disabled = busy;
  el.probeRaceBtn.disabled = busy;
  if (el.loginBtn) el.loginBtn.disabled = busy;
}

function initDemo() {
  state.demoReady = true;
  showScreen("picker");
  renderChips();
  renderFeed();
  renderPresenter();
  setAssistantOpen(false);
  defaultBookingSlot();
  pingGateway();
}

async function pingGateway() {
  try {
    const h = await fetch(`${gateway()}/healthz`);
    if (h.ok) setMeta("conectado");
  } catch {
    setMeta("sin conexión — revisa Ajustes");
  }
}

/* ========== Events ========== */

el.pitchPrev.addEventListener("click", () => {
  if (state.pitchIndex > 0) {
    state.pitchIndex -= 1;
    renderPitch();
  }
});

el.pitchNext.addEventListener("click", () => {
  if (state.pitchIndex < PITCH_SLIDES.length - 1) {
    state.pitchIndex += 1;
    renderPitch();
  } else {
    setMode("demo");
  }
});

el.pitchCtaBtn.addEventListener("click", () => setMode("demo"));
el.skipToDemoBtn.addEventListener("click", () => setMode("demo"));

el.settingsBtn.addEventListener("click", () => {
  el.settingsDrawer.hidden = false;
});
el.closeSettingsBtn.addEventListener("click", () => {
  el.settingsDrawer.hidden = true;
});
el.settingsBackdrop.addEventListener("click", () => {
  el.settingsDrawer.hidden = true;
});
el.backToPitchBtn.addEventListener("click", () => {
  el.settingsDrawer.hidden = true;
  setMode("pitch");
  renderPitch();
});

el.loginTenant.addEventListener("change", () => syncLoginDefaults());

el.loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showLoginError("");
  const slug = el.loginTenant.value;
  const username = el.loginEmail.value.trim();
  const password = el.loginPassword.value;
  withBusy(async () => {
    try {
      state.scriptIndex = slug === "cda" ? 0 : 2;
      renderPresenter();
      await loginAs(slug, username, password);
    } catch (err) {
      showScreen("picker");
      showLoginError(String(err.message || err));
      throw err;
    }
  });
});

el.switchTenantBtn.addEventListener("click", () => {
  logout();
});

el.profileLogoutBtn?.addEventListener("click", () => {
  logout();
});

function onBookingDateEdit() {
  showBookingSlotError("");
  enforceFutureBookingInputs();
}

function onBookingHourEdit() {
  showBookingSlotError("");
  updateBookingSlotHint();
}

el.bookingDate.addEventListener("change", onBookingDateEdit);
el.bookingDate.addEventListener("input", onBookingDateEdit);
el.bookingTime.addEventListener("change", onBookingHourEdit);
el.serviceSelect?.addEventListener("change", () => {
  state.selectedServiceId = el.serviceSelect.value || null;
});

el.bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showBookingSlotError("");
  enforceFutureBookingInputs();
  try {
    assertFutureSlot();
  } catch (err) {
    const msg = String(err.message || err);
    showBookingSlotError(msg);
    pushFeed(msg, "err");
    setMeta("hora inválida");
    el.bookBtn.disabled = false;
    return;
  }
  const serviceId = el.serviceSelect.value || state.selectedServiceId;
  withBusy(async () => {
    renderCodePanel(state.tenantSlug === "odonto" ? "hold-odonto" : "hold-cda");
    await startCheckoutFlow(serviceId);
  });
});

el.payConfirmBtn.addEventListener("click", () => {
  withBusy(() => payCheckout());
});

el.payCancelBtn.addEventListener("click", () => {
  withBusy(() => cancelCheckout());
});

el.newBookingBtn?.addEventListener("click", () => {
  clearRescheduleMode();
  defaultBookingSlot();
  showBookingSlotError("");
  setAppView("agenda");
  setMeta("agenda");
});

el.cancelRescheduleBtn?.addEventListener("click", () => {
  clearRescheduleMode();
  setAppView("reservations");
  setMeta("mis reservas");
});

el.reservationsList?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-res-action]");
  if (!btn) return;
  const holdId = btn.dataset.hold;
  const action = btn.dataset.resAction;
  if (action === "reschedule") {
    beginReschedule(holdId);
  } else if (action === "cancel") {
    withBusy(() => cancelPaidReservation(holdId));
  }
});

el.whatIfBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  el.whatIfMenu.hidden = !el.whatIfMenu.hidden;
});

el.probeSagaBtn.addEventListener("click", () => withBusy(() => runSagaProbe()));
el.probeCbBtn.addEventListener("click", () => withBusy(() => runCbProbe()));
el.probeRaceBtn.addEventListener("click", () => withBusy(() => runDoubleBooking()));

document.addEventListener("click", (e) => {
  if (!el.whatIfMenu.hidden && !e.target.closest(".whatif-wrap")) closeWhatIf();
});

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => setAppView(btn.dataset.view));
});

el.presenterPrev.addEventListener("click", () => {
  if (state.scriptIndex > 0) {
    state.scriptIndex -= 1;
    renderPresenter();
  }
});

el.presenterNext.addEventListener("click", () => {
  if (state.scriptIndex < SCRIPT.length - 1) {
    state.scriptIndex += 1;
    renderPresenter();
  }
});

el.presenterRun.addEventListener("click", () => {
  const step = SCRIPT[state.scriptIndex];
  withBusy(async () => {
    await step.run();
    if (state.scriptIndex < SCRIPT.length - 1) {
      state.scriptIndex += 1;
      renderPresenter();
    }
  });
});

el.presenterHide.addEventListener("click", () => setAssistantOpen(false));

el.toggleLiveBtn.addEventListener("click", () => {
  const collapsed = el.portalLive.classList.toggle("collapsed");
  el.toggleLiveBtn.textContent = collapsed ? "Mostrar" : "Ocultar";
});

el.techDetailToggle.addEventListener("change", () => {
  el.techDetail.hidden = !el.techDetailToggle.checked;
});

el.openCodeBtn.addEventListener("click", () => {
  el.codeDrawer.hidden = false;
});
el.closeCodeBtn.addEventListener("click", () => {
  el.codeDrawer.hidden = true;
});
el.codeDrawerBackdrop.addEventListener("click", () => {
  el.codeDrawer.hidden = true;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
    if (state.mode === "demo" && state.screen === "app") {
      e.preventDefault();
      setAssistantOpen(!state.assistantOpen);
    }
    return;
  }
  if (state.mode !== "pitch") return;
  if (e.key === "ArrowRight" || e.key === " ") {
    e.preventDefault();
    el.pitchNext.click();
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    el.pitchPrev.click();
  }
});

const map = await fetch("./code-map.json").then((r) => r.json());
state.codeMap = map;
renderPitch();
setMode("pitch");
