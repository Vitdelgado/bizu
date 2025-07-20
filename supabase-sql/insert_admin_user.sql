-- =====================================================
-- INSERIR USUÁRIO ADMIN MANUALMENTE
-- =====================================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Inserir usuário admin
INSERT INTO users (id, email, name, role, created_at, updated_at) 
VALUES (
  '8df564b4-620e-4240-a867-28d119b5debb', 
  'admin@bizu.com', 
  'Administrador', 
  'admin', 
  NOW(), 
  NOW()
);

-- 3. Inserir usuário de teste também
INSERT INTO users (id, email, name, role, created_at, updated_at) 
VALUES (
  '8b390cc1-f23f-44ac-9807-17fd1f1ccc5f', 
  'teste@bizu.com', 
  'Usuário Teste', 
  'suporte', 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se os usuários foram inseridos
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se o usuário admin existe
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'admin@bizu.com';

-- Verificar se o usuário de teste existe
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'teste@bizu.com';

-- Contar total de usuários
SELECT COUNT(*) as total_users FROM users; 