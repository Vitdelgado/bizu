const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Service Role Key não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkExistingTriggers() {
  console.log('🔍 Verificando triggers e funções existentes...\n');

  try {
    // 1. Verificar triggers na tabela auth.users
    console.log('📋 1. TRIGGERS NA TABELA auth.users:');
    const { data: authTriggers, error: authTriggersError } = await supabase.rpc('get_table_triggers', {
      table_name: 'auth.users'
    }).catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (authTriggersError) {
      console.log('   ⚠️ Não foi possível verificar via RPC');
      console.log('   📝 Verifique manualmente no SQL Editor:');
      console.log('   SELECT trigger_name, event_manipulation FROM information_schema.triggers WHERE event_object_table = \'users\' AND trigger_schema = \'auth\';');
    } else {
      if (authTriggers && authTriggers.length > 0) {
        console.log('   🔍 Triggers encontrados:');
        authTriggers.forEach(trigger => {
          console.log(`      - ${trigger.trigger_name}: ${trigger.event_manipulation}`);
        });
      } else {
        console.log('   ✅ Nenhum trigger encontrado');
      }
    }

    // 2. Verificar triggers na tabela public.users
    console.log('\n📋 2. TRIGGERS NA TABELA public.users:');
    const { data: publicTriggers, error: publicTriggersError } = await supabase.rpc('get_table_triggers', {
      table_name: 'public.users'
    }).catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (publicTriggersError) {
      console.log('   ⚠️ Não foi possível verificar via RPC');
      console.log('   📝 Verifique manualmente no SQL Editor:');
      console.log('   SELECT trigger_name, event_manipulation FROM information_schema.triggers WHERE event_object_table = \'users\' AND trigger_schema = \'public\';');
    } else {
      if (publicTriggers && publicTriggers.length > 0) {
        console.log('   🔍 Triggers encontrados:');
        publicTriggers.forEach(trigger => {
          console.log(`      - ${trigger.trigger_name}: ${trigger.event_manipulation}`);
        });
      } else {
        console.log('   ✅ Nenhum trigger encontrado');
      }
    }

    // 3. Verificar funções existentes
    console.log('\n📋 3. FUNÇÕES EXISTENTES:');
    const functionsToCheck = [
      'handle_new_user',
      'sync_user_names',
      'sync_users_to_auth',
      'promote_demote_user',
      'log_bizu_edit'
    ];

    for (const funcName of functionsToCheck) {
      const { data: funcExists, error: funcError } = await supabase.rpc('check_function_exists', {
        function_name: funcName
      }).catch(() => ({ data: null, error: 'RPC não disponível' }));

      if (funcError) {
        console.log(`   ⚠️ Não foi possível verificar função ${funcName} via RPC`);
      } else {
        console.log(`   ${funcExists ? '✅' : '❌'} ${funcName}: ${funcExists ? 'Existe' : 'Não existe'}`);
      }
    }

    // 4. Verificar SQL manualmente
    console.log('\n📋 4. VERIFICAÇÃO MANUAL (SQL):');
    console.log('   Execute este SQL no Supabase SQL Editor para verificar:');
    console.log(`
-- Verificar triggers na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'
ORDER BY trigger_name;

-- Verificar triggers na tabela public.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'public'
ORDER BY trigger_name;

-- Verificar funções existentes
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'sync_user_names', 'sync_users_to_auth')
AND routine_schema = 'public'
ORDER BY routine_name;
    `);

    // 5. Identificar possíveis conflitos
    console.log('\n📋 5. POSSÍVEIS CONFLITOS:');
    console.log('   ⚠️ CONFLITO 1: Trigger handle_new_user');
    console.log('      - Pode existir um trigger que cria perfil na tabela users');
    console.log('      - Nosso trigger sync_user_names pode conflitar');
    console.log('      - SOLUÇÃO: Usar DROP TRIGGER IF EXISTS');
    
    console.log('   ⚠️ CONFLITO 2: Função handle_new_user');
    console.log('      - Pode existir uma função que insere dados na tabela users');
    console.log('      - Nosso trigger sync_users_to_auth pode executar em loop');
    console.log('      - SOLUÇÃO: Adicionar condição para evitar loop');
    
    console.log('   ⚠️ CONFLITO 3: Múltiplos triggers UPDATE');
    console.log('      - Pode haver outros triggers na tabela users');
    console.log('      - Ordem de execução pode ser importante');
    console.log('      - SOLUÇÃO: Verificar ordem dos triggers');

    // 6. Recomendação de execução segura
    console.log('\n📋 6. RECOMENDAÇÃO DE EXECUÇÃO SEGURA:');
    console.log('   🛡️ PASSO 1: Fazer backup dos dados');
    console.log('   🛡️ PASSO 2: Verificar triggers existentes');
    console.log('   🛡️ PASSO 3: Executar com DROP IF EXISTS');
    console.log('   🛡️ PASSO 4: Testar em ambiente de desenvolvimento');
    console.log('   🛡️ PASSO 5: Monitorar logs após execução');

    // 7. SQL seguro para execução
    console.log('\n📋 7. SQL SEGURO PARA EXECUÇÃO:');
    console.log(`
-- VERSÃO SEGURA DO SCRIPT
-- 1. Verificar triggers existentes primeiro
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name IN ('sync_auth_to_users', 'sync_users_to_auth');

-- 2. Remover triggers se existirem (seguro)
DROP TRIGGER IF EXISTS sync_auth_to_users ON auth.users;
DROP TRIGGER IF EXISTS sync_users_to_auth ON public.users;

-- 3. Remover funções se existirem (seguro)
DROP FUNCTION IF EXISTS sync_user_names();
DROP FUNCTION IF EXISTS sync_users_to_auth();

-- 4. Criar funções e triggers (seguro)
-- [resto do script...]
    `);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkExistingTriggers().catch(console.error); 