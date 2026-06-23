CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  document TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  plan TEXT NOT NULL DEFAULT 'Essencial',
  status TEXT NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS condominiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT UNIQUE NOT NULL,
  document TEXT,
  address TEXT,
  city TEXT NOT NULL,
  district TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  manager_email TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'CLIENT_ADMIN', 'ADMIN', 'MANAGER', 'GUARD')),
  phone TEXT,
  registration TEXT,
  shift TEXT,
  status TEXT NOT NULL DEFAULT 'Disponivel',
  condominium_id UUID REFERENCES condominiums(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  qr_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Operacional',
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patrols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  guard_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patrol_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patrol_id UUID NOT NULL REFERENCES patrols(id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_url TEXT,
  notes TEXT,
  UNIQUE (patrol_id, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID REFERENCES condominiums(id) ON DELETE SET NULL,
  patrol_id UUID REFERENCES patrols(id) ON DELETE SET NULL,
  guard_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  location TEXT,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Media',
  status TEXT NOT NULL DEFAULT 'Aberta',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_condominiums_company ON condominiums(company_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_condominium ON checkpoints(condominium_id);
CREATE INDEX IF NOT EXISTS idx_patrols_status ON patrols(status);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

ALTER TABLE condominiums ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.check_constraints
    WHERE constraint_name = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPER_ADMIN', 'CLIENT_ADMIN', 'ADMIN', 'MANAGER', 'GUARD'));
