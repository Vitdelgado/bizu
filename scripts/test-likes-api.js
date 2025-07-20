const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configuração do Supabase não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLikesAPI() {
  console.log('🧪 Testando API de Likes...\n');

  try {
    // 1. Fazer login
    console.log('📋 1. Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'agenciatektus@gmail.com',
      password: 'tektus123'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado:', authData.user.email);

    // 2. Verificar sessão
    console.log('\n📋 2. Verificando sessão...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError.message);
      return;
    }

    if (!session) {
      console.error('❌ Nenhuma sessão encontrada');
      return;
    }

    console.log('✅ Sessão válida:', session.user.id);

    // 3. Buscar um bizu para testar
    console.log('\n📋 3. Buscando bizu para testar...');
    const { data: bizus, error: bizusError } = await supabase
      .from('bizus')
      .select('id, title')
      .limit(1);

    if (bizusError) {
      console.error('❌ Erro ao buscar bizus:', bizusError.message);
      return;
    }

    if (!bizus || bizus.length === 0) {
      console.error('❌ Nenhum bizu encontrado');
      return;
    }

    const testBizu = bizus[0];
    console.log('✅ Bizu encontrado:', testBizu.title, `(ID: ${testBizu.id})`);

    // 4. Verificar likes existentes
    console.log('\n📋 4. Verificando likes existentes...');
    const { data: existingLikes, error: likesError } = await supabase
      .from('bizu_likes')
      .select('*')
      .eq('bizu_id', testBizu.id)
      .eq('user_id', session.user.id);

    if (likesError) {
      console.error('❌ Erro ao verificar likes:', likesError.message);
      console.log('📝 Detalhes do erro:', likesError);
    } else {
      console.log(`✅ Likes encontrados: ${existingLikes?.length || 0}`);
      if (existingLikes && existingLikes.length > 0) {
        console.log('   📋 Likes do usuário:', existingLikes.map(l => l.id));
      }
    }

    // 5. Testar inserção direta na tabela
    console.log('\n📋 5. Testando inserção direta na tabela bizu_likes...');
    const { data: insertData, error: insertError } = await supabase
      .from('bizu_likes')
      .insert({
        bizu_id: testBizu.id,
        user_id: session.user.id
      })
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir like diretamente:', insertError.message);
      console.log('📝 Detalhes do erro:', insertError);
      
      // Verificar se é erro de RLS
      if (insertError.message.includes('row-level security') || insertError.message.includes('policy')) {
        console.log('🔒 Problema de RLS detectado!');
        console.log('📝 Execute o SQL para corrigir as políticas:');
        console.log(`
-- Habilitar RLS
ALTER TABLE bizu_likes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view all bizu likes" ON bizu_likes;
DROP POLICY IF EXISTS "Authenticated users can like/unlike bizus" ON bizu_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON bizu_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON bizu_likes;

-- Criar políticas corretas
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
        `);
      }
    } else {
      console.log('✅ Like inserido com sucesso:', insertData);
    }

    // 6. Verificar estrutura da tabela
    console.log('\n📋 6. Verificando estrutura da tabela bizu_likes...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('bizu_likes')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao verificar estrutura:', tableError.message);
    } else {
      console.log('✅ Tabela acessível');
      if (tableInfo && tableInfo.length > 0) {
        console.log('   📋 Colunas:', Object.keys(tableInfo[0]));
      }
    }

    // 7. Verificar RLS
    console.log('\n📋 7. Verificando RLS...');
    const { data: rlsInfo, error: rlsError } = await supabase.rpc('get_table_rls_status', {
      table_name: 'bizu_likes'
    }).catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (rlsError) {
      console.log('⚠️ Não foi possível verificar RLS via RPC');
      console.log('📝 Verifique manualmente no SQL Editor:');
      console.log('SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = \'bizu_likes\';');
    } else {
      console.log('✅ RLS verificado:', rlsInfo);
    }

    // 8. Testar API via fetch
    console.log('\n📋 8. Testando API via fetch...');
    const response = await fetch(`https://bizu-do-suporte.vercel.app/api/bizus/${testBizu.id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${session.access_token}`
      }
    });

    console.log('📋 Status da resposta:', response.status);
    const responseText = await response.text();
    console.log('📋 Resposta:', responseText);

    if (response.ok) {
      console.log('✅ API funcionando corretamente');
    } else {
      console.log('❌ API retornou erro');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    // Logout
    await supabase.auth.signOut();
    console.log('\n👋 Logout realizado');
  }
}

testLikesAPI().catch(console.error); 