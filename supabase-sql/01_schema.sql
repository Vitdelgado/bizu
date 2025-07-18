-- Criação do enum para roles
CREATE TYPE role_type AS ENUM ('admin', 'suporte');

-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    role role_type NOT NULL DEFAULT 'suporte',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Tabela de bizus
CREATE TABLE bizus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    keywords TEXT[],
    content TEXT NOT NULL,
    image_url TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Tabela de auditoria de edições de bizus
CREATE TABLE bizu_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bizu_id UUID REFERENCES bizus(id) ON DELETE CASCADE,
    editor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changes JSONB
);

-- Tabela de auditoria geral
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    target_user UUID REFERENCES users(id) ON DELETE SET NULL,
    target_bizu UUID REFERENCES bizus(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
); 