-- ========== CDA Colombia ==========
INSERT INTO catalog_services (id, tenant_id, name, description, duration_minutes, price_amount, currency, status)
VALUES
(
    'cda11111-1111-4111-8111-111111111111',
    'cda00000-0000-4000-8000-000000000001',
    'Revisión tecnomecánica',
    'Inspección tecnomecánica completa para vehículos livianos',
    60,
    150000.00,
    'COP',
    'ACTIVE'
),
(
    'cda22222-2222-4222-8222-222222222222',
    'cda00000-0000-4000-8000-000000000001',
    'Diagnóstico OBD',
    'Lectura de códigos y diagnóstico electrónico OBD-II',
    45,
    80000.00,
    'COP',
    'ACTIVE'
),
(
    'cda66666-6666-4666-8666-666666666666',
    'cda00000-0000-4000-8000-000000000001',
    'Probe pago fallido (Saga)',
    'Monto 666000 dispara INSUFFICIENT_FUNDS en mock',
    30,
    666000.00,
    'COP',
    'ACTIVE'
),
(
    'cda99999-9999-4999-8999-999999999999',
    'cda00000-0000-4000-8000-000000000001',
    'Probe Circuit Breaker',
    'Monto 999000 dispara timeout en mock de pasarela',
    30,
    999000.00,
    'COP',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- ========== Clínica Odontológica Sonrisa Andina ==========
INSERT INTO catalog_services (id, tenant_id, name, description, duration_minutes, price_amount, currency, status)
VALUES
(
    '0d011111-1111-4111-8111-111111111111',
    '0d071000-0000-4000-8000-000000000001',
    'Limpieza dental',
    'Profilaxis y limpieza dental profesional',
    45,
    120000.00,
    'COP',
    'ACTIVE'
),
(
    '0d022222-2222-4222-8222-222222222222',
    '0d071000-0000-4000-8000-000000000001',
    'Valoración ortodoncia',
    'Consulta de valoración para tratamiento de ortodoncia',
    30,
    90000.00,
    'COP',
    'ACTIVE'
),
(
    '0d066666-6666-4666-8666-666666666666',
    '0d071000-0000-4000-8000-000000000001',
    'Probe pago fallido (Saga)',
    'Monto 666000 dispara INSUFFICIENT_FUNDS en mock',
    30,
    666000.00,
    'COP',
    'ACTIVE'
),
(
    '0d099999-9999-4999-8999-999999999999',
    '0d071000-0000-4000-8000-000000000001',
    'Probe Circuit Breaker',
    'Monto 999000 dispara timeout en mock de pasarela',
    30,
    999000.00,
    'COP',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;
