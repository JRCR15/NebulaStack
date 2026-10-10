-- Happy path service (amount 75)
INSERT INTO catalog_services (id, tenant_id, name, description, duration_minutes, price_amount, currency, status)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '2a7f8e12-32a1-4b12-98ab-1234567890ab',
    'Brow Design',
    'Standard brow design appointment',
    60,
    75.00,
    'USD',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- Compensation probe (amount 666 → mock payment failure)
INSERT INTO catalog_services (id, tenant_id, name, description, duration_minutes, price_amount, currency, status)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '2a7f8e12-32a1-4b12-98ab-1234567890ab',
    'Payment Failure Probe',
    'Triggers mock INSUFFICIENT_FUNDS',
    30,
    666.00,
    'USD',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- Circuit Breaker probe (amount 999 → mock timeout)
INSERT INTO catalog_services (id, tenant_id, name, description, duration_minutes, price_amount, currency, status)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '2a7f8e12-32a1-4b12-98ab-1234567890ab',
    'Circuit Breaker Probe',
    'Triggers mock gateway timeout for CB demo',
    30,
    999.00,
    'USD',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;
