-- =====================================================
-- CORRIGIR RLS DA TABELA bizu_likes - VERSÃO SIMPLES
-- =====================================================

-- 1. Habilitar RLS
ALTER TABLE bizu_likes ENABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view all bizu likes" ON bizu_likes;
DROP POLICY IF EXISTS "Authenticated users can like/unlike bizus" ON bizu_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Users can view all bizu views" ON bizu_likes;
DROP POLICY IF EXISTS "Authenticated users can register views" ON bizu_likes;

-- 3. Criar política simples e permissiva para testes
CREATE POLICY "Enable all operations for authenticated users" ON bizu_likes
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bizu_likes';

-- 5. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename = 'bizu_likes'
ORDER BY policyname;

-- 6. Testar inserção (opcional)
-- INSERT INTO bizu_likes (bizu_id, user_id) 
-- VALUES ('test-bizu-id', 'test-user-id')
-- ON CONFLICT DO NOTHING; 