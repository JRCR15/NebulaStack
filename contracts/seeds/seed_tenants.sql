-- CDA: Centro de Diagnóstico Automotriz (Colombia)
INSERT INTO tenants (id, slug, name, status, plan)
VALUES (
    'cda00000-0000-4000-8000-000000000001',
    'cda',
    'CDA Colombia',
    'ACTIVE',
    'STANDARD'
)
ON CONFLICT (id) DO NOTHING;

-- Clínica Odontológica Sonrisa Andina (Colombia)
INSERT INTO tenants (id, slug, name, status, plan)
VALUES (
    '0d071000-0000-4000-8000-000000000001',
    'odonto',
    'Clínica Odontológica Sonrisa Andina',
    'ACTIVE',
    'STANDARD'
)
ON CONFLICT (id) DO NOTHING;
