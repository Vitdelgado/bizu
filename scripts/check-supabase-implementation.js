const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseImplementation() {
  console.log('🔍 Verificando implementação no Supabase...\n');

  try {
    // 1. Verificar tabelas
    console.log('📋 1. VERIFICANDO TABELAS...');
    
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

    // 2. Verificar triggers
    console.log('\n📋 2. VERIFICANDO TRIGGERS...');
    
    const { data: triggers, error: triggersError } = await supabase
      .rpc('get_triggers_info');
    
    if (triggersError) {
      console.log('   ❌ Erro ao verificar triggers:', triggersError.message);
      console.log('   📝 Verificando manualmente...');
      
      // Verificar triggers conhecidos
      const knownTriggers = [
        'on_auth_user_created',
        'sync_users_to_auth_metadata_trigger',
        'trigger_update_bizu_likes_count',
        'trigger_update_bizu_views_count'
      ];
      
      for (const triggerName of knownTriggers) {
        try {
          const { data, error } = await supabase
            .rpc('check_trigger_exists', { trigger_name: triggerName });
          
          if (error) {
            console.log(`   ⚠️ Trigger ${triggerName}: Não foi possível verificar`);
          } else {
            console.log(`   ✅ Trigger ${triggerName}: Existe`);
          }
        } catch (err) {
          console.log(`   ❌ Trigger ${triggerName}: ${err.message}`);
        }
      }
    } else {
      console.log('   ✅ Triggers verificados:', triggers?.length || 0);
    }

    // 3. Verificar funções
    console.log('\n📋 3. VERIFICANDO FUNÇÕES...');
    
    const functions = [
      'handle_new_user',
      'sync_users_to_auth_metadata',
      'update_bizu_likes_count',
      'update_bizu_views_count',
      'promote_demote_user',
      'log_bizu_edit',
      'has_user_liked_bizu',
      'get_top_bizus_by_likes'
    ];
    
    for (const funcName of functions) {
      try {
        const { data, error } = await supabase
          .rpc('check_function_exists', { function_name: funcName });
        
        if (error) {
          console.log(`   ⚠️ Função ${funcName}: Não foi possível verificar`);
        } else {
          console.log(`   ✅ Função ${funcName}: Existe`);
        }
      } catch (err) {
        console.log(`   ❌ Função ${funcName}: ${err.message}`);
      }
    }

    // 4. Verificar RLS (Row Level Security)
    console.log('\n📋 4. VERIFICANDO RLS (Row Level Security)...');
    
    const rlsTables = ['users', 'bizus', 'bizu_likes', 'bizu_edits', 'audit_logs', 'error_logs'];
    
    for (const table of rlsTables) {
      try {
        const { data, error } = await supabase
          .rpc('check_rls_enabled', { table_name: table });
        
        if (error) {
          console.log(`   ⚠️ RLS ${table}: Não foi possível verificar`);
        } else {
          console.log(`   ✅ RLS ${table}: ${data?.enabled ? 'Habilitado' : 'Desabilitado'}`);
        }
      } catch (err) {
        console.log(`   ❌ RLS ${table}: ${err.message}`);
      }
    }

    // 5. Verificar políticas RLS
    console.log('\n📋 5. VERIFICANDO POLÍTICAS RLS...');
    
    for (const table of rlsTables) {
      try {
        const { data, error } = await supabase
          .rpc('get_rls_policies', { table_name: table });
        
        if (error) {
          console.log(`   ⚠️ Políticas ${table}: Não foi possível verificar`);
        } else {
          console.log(`   ✅ Políticas ${table}: ${data?.length || 0} políticas encontradas`);
        }
      } catch (err) {
        console.log(`   ❌ Políticas ${table}: ${err.message}`);
      }
    }

    // 6. Verificar dados de usuários
    console.log('\n📋 6. VERIFICANDO DADOS DE USUÁRIOS...');
    
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

    // 7. Verificar sincronização Auth ↔ Users
    console.log('\n📋 7. VERIFICANDO SINCRONIZAÇÃO AUTH ↔ USERS...');
    
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log('   ❌ Erro ao verificar Auth:', authError.message);
      } else {
        console.log(`   ✅ Usuários no Auth: ${authUsers?.users?.length || 0}`);
        
        // Verificar sincronização
        const { data: syncCheck, error: syncError } = await supabase
          .rpc('check_auth_users_sync');
        
        if (syncError) {
          console.log('   ⚠️ Não foi possível verificar sincronização automaticamente');
          console.log('   📝 Verificando manualmente...');
          
          if (authUsers?.users && users) {
            const authEmails = authUsers.users.map(u => u.email);
            const tableEmails = users.map(u => u.email);
            
            const onlyInAuth = authEmails.filter(email => !tableEmails.includes(email));
            const onlyInTable = tableEmails.filter(email => !authEmails.includes(email));
            
            if (onlyInAuth.length > 0) {
              console.log('   ⚠️ Usuários apenas no Auth:', onlyInAuth);
            }
            if (onlyInTable.length > 0) {
              console.log('   ⚠️ Usuários apenas na tabela:', onlyInTable);
            }
            if (onlyInAuth.length === 0 && onlyInTable.length === 0) {
              console.log('   ✅ Sincronização OK');
            }
          }
        } else {
          console.log('   ✅ Sincronização verificada automaticamente');
        }
      }
    } catch (err) {
      console.log('   ❌ Erro ao verificar sincronização:', err.message);
    }

    // 8. Verificar dados de bizus
    console.log('\n📋 8. VERIFICANDO DADOS DE BIZUS...');
    
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

    // 9. Verificar estrutura das tabelas
    console.log('\n📋 9. VERIFICANDO ESTRUTURA DAS TABELAS...');
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .rpc('get_table_structure', { table_name: table });
        
        if (error) {
          console.log(`   ⚠️ Estrutura ${table}: Não foi possível verificar`);
        } else {
          console.log(`   ✅ Estrutura ${table}: ${data?.length || 0} colunas`);
        }
      } catch (err) {
        console.log(`   ❌ Estrutura ${table}: ${err.message}`);
      }
    }

    // 10. Resumo final
    console.log('\n📋 10. RESUMO FINAL...');
    console.log('   🎯 Verificação concluída!');
    console.log('   📝 Verifique os resultados acima para identificar problemas.');
    console.log('   💡 Se houver erros, execute os scripts SQL correspondentes.');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar verificação
checkSupabaseImplementation(); 