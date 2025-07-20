-- =====================================================
-- CORRIGIR RLS DA TABELA bizu_likes
-- =====================================================

-- 1. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bizu_likes'
ORDER BY ordinal_position;

-- 2. Habilitar RLS
ALTER TABLE bizu_likes ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view all bizu likes" ON bizu_likes;
DROP POLICY IF EXISTS "Authenticated users can like/unlike bizus" ON bizu_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON bizu_likes;

-- 4. Criar políticas de segurança

-- Política para visualizar likes (todos podem ver)
CREATE POLICY "Users can view all bizu likes" ON bizu_likes
    FOR SELECT USING (true);

-- Política para usuários autenticados curtirem/descurtirem
CREATE POLICY "Authenticated users can like/unlike bizus" ON bizu_likes
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para usuários verem apenas seus próprios likes
CREATE POLICY "Users can view their own likes" ON bizu_likes
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários inserirem apenas seus próprios likes
CREATE POLICY "Users can insert their own likes" ON bizu_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários deletarem apenas seus próprios likes
CREATE POLICY "Users can delete their own likes" ON bizu_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'bizu_likes'
ORDER BY policyname;

-- 6. Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bizu_likes';

-- 7. Testar inserção (opcional - remover após teste)
-- INSERT INTO bizu_likes (bizu_id, user_id) 
-- VALUES ('test-bizu-id', 'test-user-id')
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar total de likes
SELECT COUNT(*) as total_likes FROM bizu_likes;

-- Verificar likes por bizu
SELECT bizu_id, COUNT(*) as likes_count 
FROM bizu_likes 
GROUP BY bizu_id 
ORDER BY likes_count DESC 
LIMIT 5;

-- Verificar se há dados de teste
SELECT * FROM bizu_likes LIMIT 3; 