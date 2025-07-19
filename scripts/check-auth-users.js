const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que o arquivo .env.local existe com:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave');
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key (opcional)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthUsers() {
  console.log('🔍 Verificando usuários no Supabase Auth...\n');

  try {
    // Tentar listar usuários do Auth (requer service role key)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.log('⚠️  Não foi possível listar usuários do Auth (requer service role key)');
      console.log('Erro:', authError.message);
      console.log('\nPara verificar usuários do Auth, você precisa:');
      console.log('1. Ir ao Supabase Dashboard');
      console.log('2. Settings → API');
      console.log('3. Copiar a "service_role" key');
      console.log('4. Adicionar ao .env.local: SUPABASE_SERVICE_ROLE_KEY=sua_chave');
      return;
    }

    if (!authUsers || authUsers.users.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no Supabase Auth!');
      return;
    }

    console.log(`✅ Encontrados ${authUsers.users.length} usuário(s) no Supabase Auth:\n`);

    authUsers.users.forEach((user, index) => {
      console.log(`👤 Usuário #${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}`);
      console.log(`   Status: ${user.banned_until ? 'Banido' : 'Ativo'}`);
      console.log('');
    });

    // Verificar se há usuários na tabela users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ Erro ao consultar tabela users:', dbError);
      return;
    }

    console.log(`📋 Usuários na tabela 'users': ${dbUsers?.length || 0}\n`);

    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
      });
    }

    // Verificar sincronização
    if (authUsers.users.length > 0 && (!dbUsers || dbUsers.length === 0)) {
      console.log('\n⚠️  ATENÇÃO: Há usuários no Auth mas nenhum na tabela users!');
      console.log('Isso indica que os usuários não foram sincronizados.');
      console.log('\nPara sincronizar, execute:');
      console.log('1. Faça login na aplicação');
      console.log('2. Ou execute o script de setup do banco');
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

checkAuthUsers(); 