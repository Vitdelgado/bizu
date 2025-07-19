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

async function checkAllUsers() {
  console.log('🔍 Verificando todos os usuários no sistema...\n');

  try {
    // Consultar todos os usuários
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao consultar usuários:', error);
      return;
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no sistema!');
      console.log('\nPara criar usuários:');
      console.log('1. Acesse a aplicação e faça cadastro');
      console.log('2. Ou crie diretamente no Supabase Auth');
      return;
    }

    console.log(`✅ Encontrados ${allUsers.length} usuário(s) no total:\n`);

    // Separar por role
    const admins = allUsers.filter(user => user.role === 'admin');
    const suporte = allUsers.filter(user => user.role === 'suporte');

    if (admins.length > 0) {
      console.log(`👑 Administradores (${admins.length}):`);
      admins.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'Sem nome'} (${user.email})`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Telefone: ${user.phone || 'Não informado'}`);
        console.log(`      Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Nenhum administrador encontrado!');
    }

    if (suporte.length > 0) {
      console.log(`👥 Usuários de Suporte (${suporte.length}):`);
      suporte.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'Sem nome'} (${user.email})`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Telefone: ${user.phone || 'Não informado'}`);
        console.log(`      Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Nenhum usuário de suporte encontrado!');
    }

    // Estatísticas
    console.log('📊 Estatísticas:');
    console.log(`   Total de usuários: ${allUsers.length}`);
    console.log(`   Administradores: ${admins.length}`);
    console.log(`   Usuários de suporte: ${suporte.length}`);

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

checkAllUsers(); 