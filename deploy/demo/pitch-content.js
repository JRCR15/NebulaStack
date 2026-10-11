/** Pitch comercial NebulaStack — copy orientado a clientes potenciales */

export const PITCH_SLIDES = [
  {
    id: "hero",
    kicker: "Plataforma SaaS B2B",
    titleHtml: `<img class="hero-logo" src="./logo-nebula-stack.png" alt="Nebula Stack" />`,
    subtitle:
      "Agenda, cobra y confirma citas para múltiples empresas — sin mezclar datos, sin doble reserva y con notificaciones al instante.",
    bullets: [],
    cta: null,
  },
  {
    id: "problem",
    kicker: "El desafío",
    titleHtml: "Operar citas en varias sedes no debería ser un riesgo",
    subtitle:
      "Los negocios de servicios pierden confianza y dinero cuando el software no aísla ni coordina bien el ciclo completo.",
    bullets: [
      "Cupos vendidos dos veces en horarios pico",
      "Información de un cliente o sede visible para otra",
      "Pagos a medias que dejan citas fantasma",
      "Confirmaciones que no llegan por WhatsApp o correo",
    ],
    cta: null,
  },
  {
    id: "solution",
    kicker: "La solución",
    titleHtml: "Un solo motor. Cada empresa, su mundo.",
    subtitle:
      "NebulaStack orquesta catálogo, retención de cupo, cobro y confirmación en un flujo continuo listo para la nube.",
    bullets: [
      "Catálogo de servicios y precios por empresa",
      "Retención atómica del horario mientras se cobra",
      "Cobro con recuperación automática si algo falla",
      "Confirmación al cliente por canal digital",
    ],
    cta: null,
  },
  {
    id: "verticals",
    kicker: "Mismo producto, distintas industrias",
    titleHtml: "De un CDA a una clínica odontológica",
    subtitle:
      "Demostramos el aislamiento real con dos clientes colombianos sobre la misma plataforma.",
    cards: [
      {
        tag: "Automotriz",
        name: "CDA Colombia",
        detail: "Revisión tecnomecánica, diagnóstico OBD y agenda de bahías.",
      },
      {
        tag: "Salud",
        name: "Sonrisa Andina",
        detail: "Limpieza dental, valoración de ortodoncia y cobro en COP.",
      },
    ],
    cta: null,
  },
  {
    id: "architecture",
    kicker: "Cómo está construido",
    titleHtml: "Arquitectura pensada para operar, no solo para lucir",
    subtitle:
      "Cada capa tiene un trabajo claro: proteger el borde, reservar con certeza, cobrar con resiliencia y notificar sin bloquear el resto del sistema.",
    architecture: true,
    cta: null,
  },
  {
    id: "why",
    kicker: "Por qué esta arquitectura",
    titleHtml: "Decisiones técnicas con retorno de negocio",
    subtitle: "No elegimos complejidad por moda: cada patrón resuelve un dolor concreto del cliente.",
    reasons: [
      {
        benefit: "Cada empresa ve solo lo suyo",
        detail: "Aislamiento estricto de datos por inquilino en API y base de datos.",
        tag: "Multi-tenant · RLS",
      },
      {
        benefit: "Sin overbooking en horarios críticos",
        detail: "Bloqueo atómico del cupo antes de confirmar el cobro.",
        tag: "Lock distribuido",
      },
      {
        benefit: "Si el pago falla, el cupo se libera",
        detail: "Orquestación con compensación: no quedan citas a medias.",
        tag: "Saga",
      },
      {
        benefit: "La pasarela lenta no tumba la operación",
        detail: "Límites de tiempo y corte automático ante fallos externos.",
        tag: "Circuit Breaker",
      },
      {
        benefit: "Escala por eventos, no por un solo servidor",
        detail: "Cobro y notificación se ejecutan como funciones bajo demanda.",
        tag: "Event-driven · FaaS",
      },
    ],
    cta: null,
  },
  {
    id: "trust",
    kicker: "Confianza",
    titleHtml: "Listo para crecer con ustedes",
    subtitle: "Diseñado para operación profesional desde el primer día.",
    bullets: [
      "Identidad y permisos por empresa",
      "Trazabilidad del recorrido cita → pago → confirmación",
      "Despliegue en contenedores e infraestructura como código",
      "Integraciones de pago y mensajería desacopladas",
    ],
    cta: null,
  },
  {
    id: "cta",
    kicker: "Siguiente paso",
    titleHtml: "Veamos NebulaStack en acción",
    subtitle:
      "Prueba el workspace como CDA Colombia o Sonrisa Andina: misma plataforma, marca propia y datos separados.",
    bullets: [],
    cta: { label: "Probar el workspace", action: "start-demo" },
  },
];

export const ARCHITECTURE_SVG = `
<svg class="arch-svg" viewBox="0 0 920 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Arquitectura NebulaStack">
  <defs>
    <linearGradient id="nodeFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4c1d95"/>
      <stop offset="55%" stop-color="#5b21b6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="#64748b"/>
    </marker>
  </defs>
  <line x1="130" y1="70" x2="210" y2="70" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="310" y1="70" x2="390" y2="70" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="490" y1="70" x2="570" y2="70" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="670" y1="70" x2="750" y2="70" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="440" y1="110" x2="440" y2="170" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="620" y1="110" x2="620" y2="170" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="800" y1="110" x2="800" y2="170" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>

  <g class="arch-node">
    <rect x="20" y="35" width="110" height="70" rx="12" fill="#fff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="75" y="68" text-anchor="middle" font-size="13" font-family="DM Sans,sans-serif" fill="#0f172a" font-weight="600">Cliente</text>
    <text x="75" y="88" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#64748b">App / API</text>
  </g>
  <g class="arch-node">
    <rect x="210" y="35" width="100" height="70" rx="12" fill="url(#nodeFill)"/>
    <text x="260" y="68" text-anchor="middle" font-size="12" font-family="DM Sans,sans-serif" fill="#fff" font-weight="600">Gateway</text>
    <text x="260" y="88" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#e0f2fe">Seguridad</text>
  </g>
  <g class="arch-node">
    <rect x="390" y="35" width="100" height="70" rx="12" fill="url(#nodeFill)"/>
    <text x="440" y="68" text-anchor="middle" font-size="12" font-family="DM Sans,sans-serif" fill="#fff" font-weight="600">Agenda</text>
    <text x="440" y="88" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#e0f2fe">Cupos</text>
  </g>
  <g class="arch-node">
    <rect x="570" y="35" width="100" height="70" rx="12" fill="url(#nodeFill)"/>
    <text x="620" y="68" text-anchor="middle" font-size="12" font-family="DM Sans,sans-serif" fill="#fff" font-weight="600">Pagos</text>
    <text x="620" y="88" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#e0f2fe">Función</text>
  </g>
  <g class="arch-node">
    <rect x="750" y="35" width="110" height="70" rx="12" fill="url(#nodeFill)"/>
    <text x="805" y="68" text-anchor="middle" font-size="12" font-family="DM Sans,sans-serif" fill="#fff" font-weight="600">Avisos</text>
    <text x="805" y="88" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#e0f2fe">Función</text>
  </g>

  <g>
    <rect x="360" y="180" width="160" height="56" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="440" y="205" text-anchor="middle" font-size="12" font-family="DM Sans,sans-serif" fill="#0f172a" font-weight="600">Datos seguros</text>
    <text x="440" y="222" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#64748b">PostgreSQL · Redis</text>
  </g>
  <g>
    <rect x="540" y="180" width="160" height="56" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="620" y="205" text-anchor="middle" font-size="12" font-family="DM Sans,sans-serif" fill="#0f172a" font-weight="600">Eventos</text>
    <text x="620" y="222" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#64748b">Cola / mensajería</text>
  </g>
  <g>
    <rect x="720" y="180" width="160" height="56" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="800" y="205" text-anchor="middle" font-size="12" font-family="DM Sans,sans-serif" fill="#0f172a" font-weight="600">Mensajería</text>
    <text x="800" y="222" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#64748b">Mongo · WhatsApp</text>
  </g>
</svg>
`;
