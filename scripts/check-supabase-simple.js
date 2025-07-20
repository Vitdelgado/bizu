const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseSimple() {
  console.log('🔍 Verificando implementação no Supabase (versão simples)...\n');

  try {
    // 1. Verificar tabelas básicas
    console.log('📋 1. VERIFICANDO TABELAS BÁSICAS...');
    
    const tables = ['users', 'bizus', 'bizu_likes', 'bizu_edits', 'audit_logs', 'error_logs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ Tabela ${table}: ${err.message}`);
      }
    }

    // 2. Verificar dados de usuários
    console.log('\n📋 2. VERIFICANDO DADOS DE USUÁRIOS...');
    
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      if (usersError) {
        console.log('   ❌ Erro ao verificar usuários:', usersError.message);
      } else {
        console.log(`   ✅ Usuários na tabela users: ${users?.length || 0}`);
        
        if (users && users.length > 0) {
          console.log('   📝 Lista de usuários:');
          users.forEach((user, index) => {
            console.log(`      ${index + 1}. ${user.email} (${user.role}) - ${user.name || 'Sem nome'}`);
          });
        }
      }
    } catch (err) {
      console.log('   ❌ Erro ao verificar usuários:', err.message);
    }

    // 3. Verificar dados de bizus
    console.log('\n📋 3. VERIFICANDO DADOS DE BIZUS...');
    
    try {
      const { data: bizus, error: bizusError } = await supabase
        .from('bizus')
        .select('*');
      
      if (bizusError) {
        console.log('   ❌ Erro ao verificar bizus:', bizusError.message);
      } else {
        console.log(`   ✅ Bizus na tabela: ${bizus?.length || 0}`);
        
        if (bizus && bizus.length > 0) {
          console.log('   📝 Primeiros 3 bizus:');
          bizus.slice(0, 3).forEach((bizu, index) => {
            console.log(`      ${index + 1}. ${bizu.title} (${bizu.category}) - Likes: ${bizu.likes || 0}`);
          });
        }
      }
    } catch (err) {
      console.log('   ❌ Erro ao verificar bizus:', err.message);
    }

    // 4. Verificar dados de likes
    console.log('\n📋 4. VERIFICANDO DADOS DE LIKES...');
    
    try {
      const { data: likes, error: likesError } = await supabase
        .from('bizu_likes')
        .select('*');
      
      if (likesError) {
        console.log('   ❌ Erro ao verificar likes:', likesError.message);
      } else {
        console.log(`   ✅ Likes na tabela: ${likes?.length || 0}`);
      }
    } catch (err) {
      console.log('   ❌ Erro ao verificar likes:', err.message);
    }

    // 5. Verificar dados de edições
    console.log('\n📋 5. VERIFICANDO DADOS DE EDIÇÕES...');
    
    try {
      const { data: edits, error: editsError } = await supabase
        .from('bizu_edits')
        .select('*');
      
      if (editsError) {
        console.log('   ❌ Erro ao verificar edições:', editsError.message);
      } else {
        console.log(`   ✅ Edições na tabela: ${edits?.length || 0}`);
      }
    } catch (err) {
      console.log('   ❌ Erro ao verificar edições:', err.message);
    }

    // 6. Verificar dados de auditoria
    console.log('\n📋 6. VERIFICANDO DADOS DE AUDITORIA...');
    
    try {
      const { data: audit, error: auditError } = await supabase
        .from('audit_logs')
        .select('*');
      
      if (auditError) {
        console.log('   ❌ Erro ao verificar auditoria:', auditError.message);
      } else {
        console.log(`   ✅ Logs de auditoria: ${audit?.length || 0}`);
      }
    } catch (err) {
      console.log('   ❌ Erro ao verificar auditoria:', err.message);
    }

    // 7. Verificar dados de erros
    console.log('\n📋 7. VERIFICANDO DADOS DE ERROS...');
    
    try {
      const { data: errors, error: errorsError } = await supabase
        .from('error_logs')
        .select('*');
      
      if (errorsError) {
        console.log('   ❌ Erro ao verificar logs de erro:', errorsError.message);
      } else {
        console.log(`   ✅ Logs de erro: ${errors?.length || 0}`);
      }
    } catch (err) {
      console.log('   ❌ Erro ao verificar logs de erro:', err.message);
    }

    // 8. Testar função de top bizus
    console.log('\n📋 8. TESTANDO FUNÇÃO TOP BIZUS...');
    
    try {
      const { data: topBizus, error: topError } = await supabase
        .rpc('get_top_bizus_by_likes', { limit_count: 5 });
      
      if (topError) {
        console.log('   ❌ Erro ao testar função top bizus:', topError.message);
      } else {
        console.log(`   ✅ Função top bizus: ${topBizus?.length || 0} bizus retornados`);
      }
    } catch (err) {
      console.log('   ❌ Erro ao testar função top bizus:', err.message);
    }

    // 9. Testar função de verificar like
    console.log('\n📋 9. TESTANDO FUNÇÃO VERIFICAR LIKE...');
    
    try {
      const { data: hasLiked, error: likeError } = await supabase
        .rpc('has_user_liked_bizu', { 
          bizu_uuid: '00000000-0000-0000-0000-000000000000',
          user_uuid: '00000000-0000-0000-0000-000000000000'
        });
      
      if (likeError) {
        console.log('   ❌ Erro ao testar função verificar like:', likeError.message);
      } else {
        console.log(`   ✅ Função verificar like: ${hasLiked ? 'Sim' : 'Não'}`);
      }
    } catch (err) {
      console.log('   ❌ Erro ao testar função verificar like:', err.message);
    }

    // 10. Verificar estrutura das tabelas
    console.log('\n📋 10. VERIFICANDO ESTRUTURA DAS TABELAS...');
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (error) {
          console.log(`   ❌ Estrutura ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Estrutura ${table}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ Estrutura ${table}: ${err.message}`);
      }
    }

    // 11. Resumo final
    console.log('\n📋 11. RESUMO FINAL...');
    console.log('   🎯 Verificação concluída!');
    console.log('   📝 Para verificação completa de triggers e funções, execute o SQL:');
    console.log('   💡 supabase-sql/check_current_state.sql');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar verificação
checkSupabaseSimple(); 