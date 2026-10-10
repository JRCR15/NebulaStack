INSERT INTO tenants (id, slug, name, status, plan)
VALUES (
    '2a7f8e12-32a1-4b12-98ab-1234567890ab',
    'demo-salon',
    'Demo Salon NebulaStack',
    'ACTIVE',
    'STANDARD'
)
ON CONFLICT (id) DO NOTHING;
