-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS DA TABELA USERS
-- =====================================================

-- 1. Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Desabilitar RLS temporariamente para inserção
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Inserir usuário de teste manualmente (se necessário)
-- INSERT INTO users (id, email, name, role, created_at) 
-- VALUES ('8b390cc1-f23f-44ac-9807-17fd1f1ccc5f', 'teste@bizu.com', 'Usuário Teste', 'suporte', NOW());

-- 4. Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas existentes
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON users;
DROP POLICY IF EXISTS "Admins podem inserir usuários" ON users;
DROP POLICY IF EXISTS "Admins podem atualizar usuários" ON users;
DROP POLICY IF EXISTS "Admins podem deletar usuários" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 6. Criar políticas corretas
-- Política para visualizar usuários (todos autenticados podem ver)
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política para inserir perfil próprio (quando usuário se registra)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para atualizar perfil próprio
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Política para admins gerenciarem usuários
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 8. Testar inserção de usuário
-- (Execute manualmente se necessário)
-- INSERT INTO users (id, email, name, role, created_at) 
-- VALUES ('test-id', 'test@example.com', 'Test User', 'suporte', NOW());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se o usuário de teste existe
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'teste@bizu.com';

-- Verificar todas as políticas da tabela users
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'; 