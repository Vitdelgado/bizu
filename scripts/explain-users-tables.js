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

async function explainUsersTables() {
  console.log('📚 Explicando as Tabelas de Usuários...\n');

  try {
    // 1. Verificar tabela auth.users (Supabase Auth)
    console.log('📋 1. TABELA auth.users (Supabase Auth):');
    console.log('   🔐 Gerenciada automaticamente pelo Supabase');
    console.log('   📝 Contém: email, senha, confirmação, tokens, etc.');
    console.log('   🚫 Não pode ser modificada diretamente');
    console.log('   🔗 Usada para autenticação e sessões\n');

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários do Auth:', authError.message);
    } else {
      console.log(`   👥 Total de usuários no Auth: ${authUsers.users.length}`);
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.email_confirmed_at ? '✅ Confirmado' : '❌ Não confirmado'}`);
      });
    }

    // 2. Verificar tabela public.users (Tabela personalizada)
    console.log('\n📋 2. TABELA public.users (Tabela personalizada):');
    console.log('   🎯 Criada por você para o projeto');
    console.log('   📝 Contém: role, nome, telefone, dados específicos');
    console.log('   ✏️ Pode ser modificada e consultada');
    console.log('   🔗 Referenciada por outras tabelas do projeto\n');

    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*');

    if (publicError) {
      console.error('❌ Erro ao listar usuários da tabela users:', publicError.message);
    } else {
      console.log(`   👥 Total de usuários na tabela users: ${publicUsers.length}`);
      publicUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.name || 'Sem nome'}`);
      });
    }

    // 3. Verificar sincronização
    console.log('\n📋 3. SINCRONIZAÇÃO ENTRE AS TABELAS:');
    
    if (authUsers && publicUsers) {
      const authEmails = authUsers.users.map(u => u.email);
      const publicEmails = publicUsers.map(u => u.email);
      
      const onlyInAuth = authEmails.filter(email => !publicEmails.includes(email));
      const onlyInPublic = publicEmails.filter(email => !authEmails.includes(email));
      const inBoth = authEmails.filter(email => publicEmails.includes(email));
      
      console.log(`   ✅ Em ambas as tabelas: ${inBoth.length}`);
      inBoth.forEach(email => console.log(`      - ${email}`));
      
      if (onlyInAuth.length > 0) {
        console.log(`   ⚠️ Apenas no Auth: ${onlyInAuth.length}`);
        onlyInAuth.forEach(email => console.log(`      - ${email}`));
      }
      
      if (onlyInPublic.length > 0) {
        console.log(`   ⚠️ Apenas na tabela users: ${onlyInPublic.length}`);
        onlyInPublic.forEach(email => console.log(`      - ${email}`));
      }
    }

    // 4. Verificar trigger de sincronização
    console.log('\n📋 4. TRIGGER DE SINCRONIZAÇÃO:');
    console.log('   🔄 Quando um usuário se registra no Auth, um trigger deve criar o perfil na tabela users');
    console.log('   📝 Trigger: handle_new_user()');
    console.log('   🎯 Executa: AFTER INSERT ON auth.users\n');

    // 5. Verificar se o trigger existe
    const { data: triggers, error: triggerError } = await supabase.rpc('get_table_triggers', {
      table_name: 'auth.users'
    }).catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (triggerError) {
      console.log('   ⚠️ Não foi possível verificar triggers via RPC');
      console.log('   📝 Verifique manualmente no SQL Editor:');
      console.log('   SELECT trigger_name, event_manipulation FROM information_schema.triggers WHERE event_object_table = \'users\' AND trigger_schema = \'auth\';');
    } else {
      console.log('   ✅ Triggers encontrados:', triggers?.length || 0);
      triggers?.forEach(trigger => {
        console.log(`      - ${trigger.trigger_name}: ${trigger.event_manipulation}`);
      });
    }

    // 6. Explicar o fluxo
    console.log('\n📋 5. FLUXO DE AUTENTICAÇÃO:');
    console.log('   1. Usuário se registra → auth.users');
    console.log('   2. Trigger executa → cria perfil em public.users');
    console.log('   3. Usuário faz login → Supabase Auth gerencia sessão');
    console.log('   4. Aplicação consulta → public.users para dados do perfil');
    console.log('   5. RLS protege → public.users baseado no auth.uid()');

    // 7. Verificar problemas comuns
    console.log('\n📋 6. PROBLEMAS COMUNS:');
    console.log('   ❌ Trigger não existe → usuário no Auth mas não na tabela users');
    console.log('   ❌ RLS mal configurado → não consegue inserir/consultar');
    console.log('   ❌ Políticas conflitantes → operações bloqueadas');
    console.log('   ❌ Sessão expirada → auth.uid() retorna null');

    // 8. Verificar RLS da tabela users
    console.log('\n📋 7. RLS DA TABELA users:');
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('get_table_rls_status', {
      table_name: 'users'
    }).catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (rlsError) {
      console.log('   ⚠️ Não foi possível verificar RLS via RPC');
      console.log('   📝 Verifique manualmente:');
      console.log('   SELECT rowsecurity FROM pg_tables WHERE tablename = \'users\';');
    } else {
      console.log('   ✅ RLS verificado:', rlsStatus);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

explainUsersTables().catch(console.error); 