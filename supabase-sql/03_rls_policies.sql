-- =====================================================
-- 03 - RLS E POLÍTICAS DE SEGURANÇA (TERCEIRO A EXECUTAR)
-- =====================================================

-- Ativar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bizus ENABLE ROW LEVEL SECURITY;
ALTER TABLE bizu_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bizu_likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABELA USERS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON users;
DROP POLICY IF EXISTS "Admins podem inserir usuários" ON users;
DROP POLICY IF EXISTS "Admins podem atualizar usuários" ON users;
DROP POLICY IF EXISTS "Admins podem deletar usuários" ON users;

-- Criar políticas para tabela users
CREATE POLICY "Admins podem ver todos os usuários" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem inserir usuários" ON users
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "Admins podem atualizar usuários" ON users
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "Admins podem deletar usuários" ON users
  FOR DELETE USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- =====================================================
-- POLÍTICAS PARA TABELA BIZUS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Suporte pode inserir bizus" ON bizus;
DROP POLICY IF EXISTS "Suporte pode editar seus próprios bizus" ON bizus;
DROP POLICY IF EXISTS "Todos podem ver bizus" ON bizus;

-- Criar políticas para tabela bizus
CREATE POLICY "Suporte pode inserir bizus" ON bizus
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Suporte pode editar seus próprios bizus" ON bizus
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Todos podem ver bizus" ON bizus
  FOR SELECT USING (TRUE);

-- =====================================================
-- POLÍTICAS PARA TABELA BIZU_EDITS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Todos podem inserir edits" ON bizu_edits;
DROP POLICY IF EXISTS "Admin pode ver edits" ON bizu_edits;
DROP POLICY IF EXISTS "Editor pode ver seus edits" ON bizu_edits;

-- Criar políticas para tabela bizu_edits
CREATE POLICY "Todos podem inserir edits" ON bizu_edits
  FOR INSERT WITH CHECK (auth.uid() = editor_id);

CREATE POLICY "Admin pode ver edits" ON bizu_edits
  FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "Editor pode ver seus edits" ON bizu_edits
  FOR SELECT USING (editor_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA TABELA AUDIT_LOGS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Todos podem inserir logs" ON audit_logs;
DROP POLICY IF EXISTS "Admin pode ver logs" ON audit_logs;
DROP POLICY IF EXISTS "Usuário pode ver logs que realizou" ON audit_logs;

-- Criar políticas para tabela audit_logs
CREATE POLICY "Todos podem inserir logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode ver logs" ON audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "Usuário pode ver logs que realizou" ON audit_logs
  FOR SELECT USING (performed_by = auth.uid());

-- =====================================================
-- POLÍTICAS PARA TABELA BIZU_LIKES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view all bizu likes" ON bizu_likes;
DROP POLICY IF EXISTS "Authenticated users can like/unlike bizus" ON bizu_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON bizu_likes;

-- Criar políticas para tabela bizu_likes
CREATE POLICY "Users can view all bizu likes" ON bizu_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like/unlike bizus" ON bizu_likes
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own likes" ON bizu_likes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes" ON bizu_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON bizu_likes
    FOR DELETE USING (auth.uid() = user_id); 