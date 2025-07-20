-- =====================================================
-- CORRIGIR RLS DA TABELA curtidas_bizu
-- =====================================================

-- 1. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'curtidas_bizu'
ORDER BY ordinal_position;

-- 2. Habilitar RLS
ALTER TABLE curtidas_bizu ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view all bizu likes" ON curtidas_bizu;
DROP POLICY IF EXISTS "Authenticated users can like/unlike bizus" ON curtidas_bizu;
DROP POLICY IF EXISTS "Users can view their own likes" ON curtidas_bizu;
DROP POLICY IF EXISTS "Users can insert their own likes" ON curtidas_bizu;
DROP POLICY IF EXISTS "Users can delete their own likes" ON curtidas_bizu;

-- 4. Criar políticas de segurança

-- Política para visualizar likes (todos podem ver)
CREATE POLICY "Users can view all bizu likes" ON curtidas_bizu
    FOR SELECT USING (true);

-- Política para usuários autenticados curtirem/descurtirem
CREATE POLICY "Authenticated users can like/unlike bizus" ON curtidas_bizu
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Política para usuários verem apenas seus próprios likes
CREATE POLICY "Users can view their own likes" ON curtidas_bizu
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários inserirem apenas seus próprios likes
CREATE POLICY "Users can insert their own likes" ON curtidas_bizu
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários deletarem apenas seus próprios likes
CREATE POLICY "Users can delete their own likes" ON curtidas_bizu
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'curtidas_bizu'
ORDER BY policyname;

-- 6. Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'curtidas_bizu';

-- 7. Testar inserção (opcional - remover após teste)
-- INSERT INTO curtidas_bizu (bizu_id, user_id) 
-- VALUES ('test-bizu-id', 'test-user-id')
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar total de likes
SELECT COUNT(*) as total_likes FROM curtidas_bizu;

-- Verificar likes por bizu
SELECT bizu_id, COUNT(*) as likes_count 
FROM curtidas_bizu 
GROUP BY bizu_id 
ORDER BY likes_count DESC 
LIMIT 5;

-- Verificar se há dados de teste
SELECT * FROM curtidas_bizu LIMIT 3; 