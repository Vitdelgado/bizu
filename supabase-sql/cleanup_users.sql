-- =====================================================
-- LIMPEZA MANUAL DE USUÁRIOS
-- =====================================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Limpar tabela users completamente
DELETE FROM users;

-- 3. Verificar usuários no Auth (execute no SQL Editor)
-- SELECT id, email, email_confirmed_at, created_at 
-- FROM auth.users 
-- ORDER BY created_at;

-- 4. Inserir apenas os usuários válidos
-- (Substitua os IDs pelos IDs reais dos usuários no Auth)

-- Usuário Admin: agenciatektus@gmail.com
INSERT INTO users (id, email, name, role, created_at, updated_at) 
VALUES (
  'ID_DO_TEKTUS_AQUI', -- Substitua pelo ID real do agenciatektus@gmail.com
  'agenciatektus@gmail.com', 
  'Tektus', 
  'admin', 
  NOW(), 
  NOW()
);

-- Usuário Suporte: vitoria.mdelgado@gmail.com
INSERT INTO users (id, email, name, role, created_at, updated_at) 
VALUES (
  'ID_DA_VITORIA_AQUI', -- Substitua pelo ID real do vitoria.mdelgado@gmail.com
  'vitoria.mdelgado@gmail.com', 
  'Vitória', 
  'suporte', 
  NOW(), 
  NOW()
);

-- 5. Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Verificar resultado
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY created_at;

-- =====================================================
-- COMANDOS PARA REMOVER USUÁRIOS DO AUTH (execute no Supabase Dashboard)
-- =====================================================

-- 1. Vá para https://supabase.com > Seu Projeto > Auth > Users
-- 2. Remova os seguintes usuários:
--    - teste@bizu.com
--    - admin@bizu.com
--    - suporte@curseduca.com
--    - vitoria.mdelgado96@gmail.com (se diferente de vitoria.mdelgado@gmail.com)

-- 3. Mantenha apenas:
--    - agenciatektus@gmail.com
--    - vitoria.mdelgado@gmail.com

-- =====================================================
-- CONFIRMAR EMAILS E REDEFINIR SENHAS (via Supabase Dashboard)
-- =====================================================

-- 1. Para agenciatektus@gmail.com:
--    - Confirmar email
--    - Definir senha: tektus123

-- 2. Para vitoria.mdelgado@gmail.com:
--    - Confirmar email  
--    - Definir senha: vitoria123

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar usuários na tabela
SELECT COUNT(*) as total_users FROM users;

-- Verificar usuários no Auth
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- Verificar se os usuários estão sincronizados
SELECT 
  u.email as table_email,
  u.role as table_role,
  a.email as auth_email,
  a.email_confirmed_at as auth_confirmed
FROM users u
LEFT JOIN auth.users a ON u.id = a.id
ORDER BY u.created_at; 