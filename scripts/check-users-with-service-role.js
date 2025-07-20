const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltando');
  console.error('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltando');
  console.error('');
  console.error('📝 Para configurar a Service Role Key:');
  console.error('1. Vá para https://supabase.com > Seu Projeto > Settings > API');
  console.error('2. Copie a "service_role" key (não a anon key)');
  console.error('3. Adicione ao .env.local: SUPABASE_SERVICE_ROLE_KEY=sua_service_key');
  process.exit(1);
}

// Usar service role key para contornar RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsersWithServiceRole() {
  console.log('🔍 Verificando usuários com Service Role (contorna RLS)...\n');

  try {
    // 1. Verificar usuários na tabela users
    console.log('📋 1. Verificando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.log('❌ Erro na tabela users:', usersError.message);
    } else {
      console.log('✅ Usuários encontrados na tabela users:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('📋 Lista de usuários:');
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.name || 'Sem nome'}`);
        });
      }
    }

    // 2. Verificar usuários no Supabase Auth
    console.log('\n📋 2. Verificando usuários no Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.log('❌ Erro ao listar usuários do Auth:', authError.message);
    } else {
      console.log('✅ Usuários encontrados no Auth:', authUsers?.users?.length || 0);
      if (authUsers?.users && authUsers.users.length > 0) {
        console.log('📋 Lista de usuários do Auth:');
        authUsers.users.forEach((user, index) => {
          const confirmed = user.email_confirmed_at ? '✅ Confirmado' : '❌ Não confirmado';
          console.log(`   ${index + 1}. ${user.email} - ${confirmed} - ${user.created_at}`);
        });
      }
    }

    // 3. Verificar se há discrepância entre Auth e tabela users
    console.log('\n📋 3. Verificando discrepâncias...');
    if (users && authUsers?.users) {
      const authEmails = authUsers.users.map(u => u.email);
      const tableEmails = users.map(u => u.email);
      
      const onlyInAuth = authEmails.filter(email => !tableEmails.includes(email));
      const onlyInTable = tableEmails.filter(email => !authEmails.includes(email));
      
      if (onlyInAuth.length > 0) {
        console.log('⚠️ Usuários apenas no Auth (não estão na tabela users):');
        onlyInAuth.forEach(email => console.log(`   - ${email}`));
      }
      
      if (onlyInTable.length > 0) {
        console.log('⚠️ Usuários apenas na tabela users (não estão no Auth):');
        onlyInTable.forEach(email => console.log(`   - ${email}`));
      }
      
      if (onlyInAuth.length === 0 && onlyInTable.length === 0) {
        console.log('✅ Todos os usuários estão sincronizados entre Auth e tabela users');
      }
    }

    // 4. Verificar políticas RLS da tabela users
    console.log('\n📋 4. Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'users' })
      .catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas via RPC');
      console.log('📝 Verifique manualmente no SQL Editor:');
      console.log('SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check FROM pg_policies WHERE tablename = \'users\';');
    } else {
      console.log('✅ Políticas RLS encontradas:', policies?.length || 0);
      if (policies && policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname} - ${policy.cmd}`);
        });
      }
    }

    console.log('\n🎯 Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkUsersWithServiceRole().catch(console.error); 