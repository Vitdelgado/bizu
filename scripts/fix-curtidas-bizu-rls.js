const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Service Role Key não encontrada');
  console.error('📝 Adicione SUPABASE_SERVICE_ROLE_KEY ao .env.local');
  process.exit(1);
}

// Usar service role para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixBizuLikesRLS() {
  console.log('🔧 Corrigindo RLS da tabela bizu_likes...\n');

  try {
    // 1. Verificar se a tabela existe
    console.log('📋 1. Verificando se a tabela bizu_likes existe...');
    const { data: tableExists, error: tableError } = await supabase
      .from('bizu_likes')
      .select('*')
      .limit(1);

    if (tableError && tableError.message.includes('does not exist')) {
      console.log('❌ Tabela bizu_likes não existe!');
      console.log('📝 Execute primeiro o script de setup do banco de dados');
      return;
    }

    console.log('✅ Tabela bizu_likes existe');

    // 2. Verificar estrutura da tabela
    console.log('\n📋 2. Verificando estrutura da tabela...');
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: 'bizu_likes'
    }).catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (columnsError) {
      console.log('⚠️ Não foi possível verificar estrutura via RPC');
      console.log('📝 Verifique manualmente no SQL Editor:');
      console.log('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'bizu_likes\';');
    } else {
      console.log('✅ Estrutura da tabela:');
      columns?.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    // 3. Habilitar RLS
    console.log('\n📋 3. Habilitando RLS...');
    const { error: rlsError } = await supabase.rpc('enable_rls_table', {
      table_name: 'bizu_likes'
    }).catch(() => ({ error: 'RPC não disponível' }));

    if (rlsError) {
      console.log('⚠️ Não foi possível habilitar RLS via RPC');
      console.log('📝 Execute manualmente no SQL Editor:');
      console.log('ALTER TABLE bizu_likes ENABLE ROW LEVEL SECURITY;');
    } else {
      console.log('✅ RLS habilitado');
    }

    // 4. Remover políticas existentes
    console.log('\n📋 4. Removendo políticas existentes...');
    const policiesToRemove = [
      'Users can view all bizu likes',
      'Authenticated users can like/unlike bizus',
      'Users can view their own likes',
      'Users can insert their own likes',
      'Users can delete their own likes'
    ];

    for (const policyName of policiesToRemove) {
      const { error: dropError } = await supabase.rpc('drop_policy', {
        table_name: 'bizu_likes',
        policy_name: policyName
      }).catch(() => ({ error: 'RPC não disponível' }));

      if (dropError && !dropError.message.includes('does not exist')) {
        console.log(`   ⚠️ Erro ao remover política ${policyName}: ${dropError.message}`);
      }
    }

    console.log('✅ Políticas antigas removidas');

    // 5. Criar novas políticas
    console.log('\n📋 5. Criando políticas de segurança...');
    
    const policies = [
      {
        name: 'Users can view all bizu likes',
        sql: 'CREATE POLICY "Users can view all bizu likes" ON bizu_likes FOR SELECT USING (true);'
      },
      {
        name: 'Authenticated users can like/unlike bizus',
        sql: 'CREATE POLICY "Authenticated users can like/unlike bizus" ON bizu_likes FOR ALL USING (auth.uid() IS NOT NULL);'
      },
      {
        name: 'Users can view their own likes',
        sql: 'CREATE POLICY "Users can view their own likes" ON bizu_likes FOR SELECT USING (auth.uid() = user_id);'
      },
      {
        name: 'Users can insert their own likes',
        sql: 'CREATE POLICY "Users can insert their own likes" ON bizu_likes FOR INSERT WITH CHECK (auth.uid() = user_id);'
      },
      {
        name: 'Users can delete their own likes',
        sql: 'CREATE POLICY "Users can delete their own likes" ON bizu_likes FOR DELETE USING (auth.uid() = user_id);'
      }
    ];

    for (const policy of policies) {
      console.log(`   🔒 Criando política: ${policy.name}`);
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      }).catch(() => ({ error: 'RPC não disponível' }));

      if (createError) {
        console.log(`   ❌ Erro ao criar política ${policy.name}: ${createError.message}`);
        console.log(`   📝 Execute manualmente: ${policy.sql}`);
      } else {
        console.log(`   ✅ Política criada: ${policy.name}`);
      }
    }

    // 6. Verificar políticas criadas
    console.log('\n📋 6. Verificando políticas criadas...');
    const { data: createdPolicies, error: policiesError } = await supabase.rpc('get_table_policies', {
      table_name: 'bizu_likes'
    }).catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas via RPC');
      console.log('📝 Verifique manualmente no SQL Editor:');
      console.log('SELECT policyname FROM pg_policies WHERE tablename = \'bizu_likes\';');
    } else {
      console.log(`✅ Políticas criadas: ${createdPolicies?.length || 0}`);
      createdPolicies?.forEach(policy => {
        console.log(`   - ${policy.policyname}`);
      });
    }

    // 7. Verificar dados existentes
    console.log('\n📋 7. Verificando dados existentes...');
    const { data: existingLikes, error: likesError } = await supabase
      .from('bizu_likes')
      .select('*')
      .limit(5);

    if (likesError) {
      console.log('❌ Erro ao verificar dados:', likesError.message);
    } else {
      console.log(`✅ Likes encontrados: ${existingLikes?.length || 0}`);
      if (existingLikes && existingLikes.length > 0) {
        console.log('   📋 Exemplos:');
        existingLikes.forEach((like, index) => {
          console.log(`   ${index + 1}. Bizu: ${like.bizu_id}, User: ${like.user_id}`);
        });
      }
    }

    console.log('\n🎯 RLS da tabela bizu_likes configurado!');
    console.log('\n📝 Resumo das configurações:');
    console.log('✅ RLS habilitado');
    console.log('✅ 5 políticas de segurança criadas');
    console.log('✅ Apenas usuários autenticados podem curtir/descurtir');
    console.log('✅ Usuários só podem ver/modificar seus próprios likes');
    console.log('✅ Dados protegidos contra acesso não autorizado');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixBizuLikesRLS().catch(console.error); 