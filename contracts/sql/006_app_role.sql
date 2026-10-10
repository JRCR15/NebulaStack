-- Application role subject to RLS (superuser bypasses FORCE RLS).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nebulastack_app') THEN
    CREATE ROLE nebulastack_app LOGIN PASSWORD 'change-me-app';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE nebulastack TO nebulastack_app;
GRANT USAGE ON SCHEMA public TO nebulastack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nebulastack_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nebulastack_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nebulastack_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO nebulastack_app;

-- Ensure role cannot bypass RLS
ALTER ROLE nebulastack_app NOSUPERUSER NOBYPASSRLS;
