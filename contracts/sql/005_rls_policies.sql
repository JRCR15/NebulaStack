ALTER TABLE catalog_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_tenant_isolation ON catalog_services;
CREATE POLICY catalog_tenant_isolation ON catalog_services
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

DROP POLICY IF EXISTS appointments_tenant_isolation ON appointments;
CREATE POLICY appointments_tenant_isolation ON appointments
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

DROP POLICY IF EXISTS outbox_tenant_isolation ON outbox_events;
CREATE POLICY outbox_tenant_isolation ON outbox_events
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- Publisher drain: allow SELECT across tenants (permissive policies OR together).
DROP POLICY IF EXISTS outbox_publisher_select ON outbox_events;
CREATE POLICY outbox_publisher_select ON outbox_events
    FOR SELECT
    USING (true);

-- Enforce tenant isolation even for table owner on tenant data tables.
-- Note: PostgreSQL superusers still bypass RLS; app connects as nebulastack_app.
ALTER TABLE catalog_services FORCE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;
