const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLikes() {
  console.log('🔧 Corrigindo estrutura de likes...\n');

  try {
    // 1. Adicionar coluna likes na tabela bizus
    console.log('📋 Adicionando coluna likes na tabela bizus...');
    const { error: likesError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE bizus ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;'
    }).catch(() => ({ error: 'Função exec_sql não disponível' }));

    if (likesError) {
      console.log('⚠️ Execute manualmente no SQL Editor:');
      console.log('ALTER TABLE bizus ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;');
    } else {
      console.log('✅ Coluna likes adicionada');
    }

    // 2. Adicionar coluna views na tabela bizus
    console.log('📋 Adicionando coluna views na tabela bizus...');
    const { error: viewsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE bizus ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;'
    }).catch(() => ({ error: 'Função exec_sql não disponível' }));

    if (viewsError) {
      console.log('⚠️ Execute manualmente no SQL Editor:');
      console.log('ALTER TABLE bizus ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;');
    } else {
      console.log('✅ Coluna views adicionada');
    }

    // 3. Criar tabela bizu_likes
    console.log('📋 Criando tabela bizu_likes...');
    const createLikesTable = `
      CREATE TABLE IF NOT EXISTS bizu_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bizu_id UUID REFERENCES bizus(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(bizu_id, user_id)
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createLikesTable
    }).catch(() => ({ error: 'Função exec_sql não disponível' }));

    if (tableError) {
      console.log('⚠️ Execute manualmente no SQL Editor:');
      console.log(createLikesTable);
    } else {
      console.log('✅ Tabela bizu_likes criada');
    }

    // 4. Criar função de atualização de likes
    console.log('📋 Criando função de atualização de likes...');
    const createFunction = `
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
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: createFunction
    }).catch(() => ({ error: 'Função exec_sql não disponível' }));

    if (functionError) {
      console.log('⚠️ Execute manualmente no SQL Editor:');
      console.log(createFunction);
    } else {
      console.log('✅ Função update_bizu_likes_count criada');
    }

    // 5. Criar trigger
    console.log('📋 Criando trigger...');
    const createTrigger = `
      DROP TRIGGER IF EXISTS trigger_update_bizu_likes_count ON bizu_likes;
      CREATE TRIGGER trigger_update_bizu_likes_count
        AFTER INSERT OR DELETE ON bizu_likes
        FOR EACH ROW
        EXECUTE FUNCTION update_bizu_likes_count();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: createTrigger
    }).catch(() => ({ error: 'Função exec_sql não disponível' }));

    if (triggerError) {
      console.log('⚠️ Execute manualmente no SQL Editor:');
      console.log(createTrigger);
    } else {
      console.log('✅ Trigger criado');
    }

    // 6. Ativar RLS na tabela bizu_likes
    console.log('📋 Ativando RLS na tabela bizu_likes...');
    const enableRLS = `
      ALTER TABLE bizu_likes ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Users can view all bizu likes" ON bizu_likes;
      CREATE POLICY "Users can view all bizu likes" ON bizu_likes
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Authenticated users can like/unlike bizus" ON bizu_likes;
      CREATE POLICY "Authenticated users can like/unlike bizus" ON bizu_likes
        FOR ALL USING (auth.uid() IS NOT NULL);
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: enableRLS
    }).catch(() => ({ error: 'Função exec_sql não disponível' }));

    if (rlsError) {
      console.log('⚠️ Execute manualmente no SQL Editor:');
      console.log(enableRLS);
    } else {
      console.log('✅ RLS ativado na tabela bizu_likes');
    }

    // 7. Criar índices
    console.log('📋 Criando índices...');
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_bizu_likes_bizu_id ON bizu_likes(bizu_id);
      CREATE INDEX IF NOT EXISTS idx_bizu_likes_user_id ON bizu_likes(user_id);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexes
    }).catch(() => ({ error: 'Função exec_sql não disponível' }));

    if (indexError) {
      console.log('⚠️ Execute manualmente no SQL Editor:');
      console.log(createIndexes);
    } else {
      console.log('✅ Índices criados');
    }

    console.log('\n🎉 Estrutura de likes corrigida!');
    console.log('📝 Se algum passo falhou, execute manualmente no SQL Editor do Supabase.');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixLikes().catch(console.error); 