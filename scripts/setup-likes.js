const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const likesSQL = `
-- Adicionar coluna de likes na tabela bizus
ALTER TABLE bizus ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE bizus ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Tabela de likes para rastrear quem curtiu
CREATE TABLE IF NOT EXISTS bizu_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bizu_id UUID REFERENCES bizus(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(bizu_id, user_id)
);

-- Tabela de visualizações para rastrear quem visualizou
CREATE TABLE IF NOT EXISTS bizu_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bizu_id UUID REFERENCES bizus(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Função para atualizar contador de likes
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

-- Trigger para atualizar contador de likes
DROP TRIGGER IF EXISTS trigger_update_bizu_likes_count ON bizu_likes;
CREATE TRIGGER trigger_update_bizu_likes_count
    AFTER INSERT OR DELETE ON bizu_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_bizu_likes_count();

-- Função para atualizar contador de visualizações
CREATE OR REPLACE FUNCTION update_bizu_views_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bizus SET views = views + 1 WHERE id = NEW.bizu_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de visualizações
DROP TRIGGER IF EXISTS trigger_update_bizu_views_count ON bizu_views;
CREATE TRIGGER trigger_update_bizu_views_count
    AFTER INSERT ON bizu_views
    FOR EACH ROW
    EXECUTE FUNCTION update_bizu_views_count();

-- Função para verificar se usuário curtiu um bizu
CREATE OR REPLACE FUNCTION has_user_liked_bizu(bizu_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM bizu_likes 
        WHERE bizu_id = bizu_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter top bizus por likes
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

-- Políticas RLS para likes
ALTER TABLE bizu_likes ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver likes de todos os bizus
CREATE POLICY "Users can view all bizu likes" ON bizu_likes
    FOR SELECT USING (true);

-- Usuários autenticados podem curtir/descurtir
CREATE POLICY "Authenticated users can like/unlike bizus" ON bizu_likes
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas RLS para visualizações
ALTER TABLE bizu_views ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver visualizações de todos os bizus
CREATE POLICY "Users can view all bizu views" ON bizu_views
    FOR SELECT USING (true);

-- Usuários autenticados podem registrar visualizações
CREATE POLICY "Authenticated users can register views" ON bizu_views
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bizu_likes_bizu_id ON bizu_likes(bizu_id);
CREATE INDEX IF NOT EXISTS idx_bizu_likes_user_id ON bizu_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_bizu_views_bizu_id ON bizu_views(bizu_id);
CREATE INDEX IF NOT EXISTS idx_bizus_likes_views ON bizus(likes DESC, views DESC);
`;

async function setupLikes() {
  console.log('🚀 Configurando sistema de likes...');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: likesSQL });
    
    if (error) {
      console.log('❌ Erro ao executar SQL de likes:', error.message);
      console.log('⚠️ Execute manualmente no SQL Editor do Supabase:');
      console.log(likesSQL);
      return;
    }

    console.log('✅ Sistema de likes configurado com sucesso!');
    console.log('📝 Funcionalidades adicionadas:');
    console.log('   - Colunas likes e views na tabela bizus');
    console.log('   - Tabela bizu_likes para rastrear curtidas');
    console.log('   - Tabela bizu_views para rastrear visualizações');
    console.log('   - Triggers para atualizar contadores automaticamente');
    console.log('   - Funções para verificar likes e obter top bizus');
    console.log('   - Políticas RLS para segurança');
    console.log('   - Índices para performance');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('⚠️ Execute manualmente no SQL Editor do Supabase:');
    console.log(likesSQL);
  }
}

setupLikes(); 