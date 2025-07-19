const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que o arquivo .env.local existe com:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUsers() {
  console.log('🔍 Verificando usuários admin...\n');

  try {
    // Consultar todos os usuários admin
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao consultar usuários admin:', error);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️  Nenhum usuário admin encontrado!');
      console.log('\nPara criar um admin, execute:');
      console.log('1. Crie um usuário no Supabase Auth');
      console.log('2. Execute o script: supabase-sql/05_superadmin.sql');
      return;
    }

    console.log(`✅ Encontrados ${adminUsers.length} usuário(s) admin:\n`);

    adminUsers.forEach((user, index) => {
      console.log(`👤 Admin #${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name || 'Não informado'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Telefone: ${user.phone || 'Não informado'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Atualizado em: ${user.updated_at ? new Date(user.updated_at).toLocaleString('pt-BR') : 'Não atualizado'}`);
      console.log('');
    });

    // Verificar se há usuários não-admin também
    const { data: regularUsers, error: regularError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('role', 'suporte')
      .order('created_at', { ascending: false });

    if (!regularError && regularUsers && regularUsers.length > 0) {
      console.log(`📋 Usuários de suporte (${regularUsers.length}):`);
      regularUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'Sem nome'} (${user.email}) - ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
      });
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

checkAdminUsers(); 