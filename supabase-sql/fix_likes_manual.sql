-- =====================================================
-- CORREÇÃO DA ESTRUTURA DE LIKES - EXECUTAR MANUALMENTE
-- =====================================================

-- 1. Adicionar colunas na tabela bizus
ALTER TABLE bizus ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE bizus ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. Criar tabela de likes
CREATE TABLE IF NOT EXISTS bizu_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bizu_id UUID REFERENCES bizus(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(bizu_id, user_id)
);

-- 3. Criar função para atualizar contador de likes
CREATE OR REPLACE FUNCTION update_bizu_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE bizus SET likes = likes + 1 WHERE id = NEW.bizu_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE bizus SET likes = likes - 1 WHERE id = OLD.bizu_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para atualizar contador de likes
DROP TRIGGER IF EXISTS trigger_update_bizu_likes_count ON bizu_likes;
CREATE TRIGGER trigger_update_bizu_likes_count
    AFTER INSERT OR DELETE ON bizu_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_bizu_likes_count();

-- 5. Ativar RLS na tabela bizu_likes
ALTER TABLE bizu_likes ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para likes
DROP POLICY IF EXISTS "Users can view all bizu likes" ON bizu_likes;
CREATE POLICY "Users can view all bizu likes" ON bizu_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like/unlike bizus" ON bizu_likes;
CREATE POLICY "Authenticated users can like/unlike bizus" ON bizu_likes
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_bizu_likes_bizu_id ON bizu_likes(bizu_id);
CREATE INDEX IF NOT EXISTS idx_bizu_likes_user_id ON bizu_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_bizus_likes_views ON bizus(likes DESC, views DESC);

-- 8. Função para verificar se usuário curtiu um bizu
CREATE OR REPLACE FUNCTION has_user_liked_bizu(bizu_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM bizu_likes
        WHERE bizu_id = bizu_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função para obter top bizus por likes
CREATE OR REPLACE FUNCTION get_top_bizus_by_likes(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title TEXT,
    category TEXT,
    keywords TEXT[],
    content TEXT,
    image_url TEXT,
    author_id UUID,
    likes INTEGER,
    views INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.title,
        b.category,
        b.keywords,
        b.content,
        b.image_url,
        b.author_id,
        b.likes,
        b.views,
        b.created_at,
        b.updated_at
    FROM bizus b
    ORDER BY b.likes DESC, b.views DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICAÇÃO - Execute estas queries para confirmar
-- =====================================================

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bizus' 
AND column_name IN ('likes', 'views');

-- Verificar se a tabela bizu_likes foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'bizu_likes';

-- Verificar se as funções foram criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('update_bizu_likes_count', 'has_user_liked_bizu', 'get_top_bizus_by_likes');

-- Verificar se os triggers foram criados
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_bizu_likes_count'; 