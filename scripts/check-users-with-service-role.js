const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersWithServiceRole() {
  console.log('🔍 Verificando usuários com service role...\n');

  try {
    // Verificar usuários no Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao listar usuários do Auth:', authError.message);
      return;
    }

    console.log(`👥 Usuários no Supabase Auth (${authUsers.users.length}):`);
    authUsers.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}`);
    });

    // Verificar usuários na tabela users (com service role)
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ Erro ao consultar tabela users:', dbError);
      return;
    }

    console.log(`\n📋 Usuários na tabela 'users' (${dbUsers?.length || 0}):`);
    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'Sem nome'} (${user.email}) - ${user.role} - ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
      });
    } else {
      console.log('   Nenhum usuário encontrado');
    }

    // Verificar admins especificamente
    if (dbUsers && dbUsers.length > 0) {
      const admins = dbUsers.filter(user => user.role === 'admin');
      console.log(`\n👑 Administradores (${admins.length}):`);
      if (admins.length > 0) {
        admins.forEach((admin, index) => {
          console.log(`   ${index + 1}. ${admin.name || 'Sem nome'} (${admin.email})`);
          console.log(`      Telefone: ${admin.phone || 'Não informado'}`);
          console.log(`      Criado: ${new Date(admin.created_at).toLocaleString('pt-BR')}`);
        });
      } else {
        console.log('   Nenhum admin encontrado');
      }
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

checkUsersWithServiceRole(); 