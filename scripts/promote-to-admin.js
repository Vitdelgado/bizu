const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function promoteToAdmin(email) {
  console.log(`🔍 Promovendo usuário ${email} a admin...\n`);

  try {
    // Primeiro, verificar se o usuário existe
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !user) {
      console.error(`❌ Usuário ${email} não encontrado!`);
      console.log('\nUsuários disponíveis:');
      
      const { data: allUsers } = await supabase
        .from('users')
        .select('email, role, created_at')
        .order('created_at', { ascending: false });

      if (allUsers && allUsers.length > 0) {
        allUsers.forEach((u, index) => {
          console.log(`   ${index + 1}. ${u.email} (${u.role})`);
        });
      }
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name || 'Sem nome'} (${user.email})`);
    console.log(`   Role atual: ${user.role}`);

    if (user.role === 'admin') {
      console.log('⚠️  Usuário já é admin!');
      return;
    }

    // Promover a admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao promover usuário:', updateError);
      return;
    }

    console.log('✅ Usuário promovido a admin com sucesso!');
    console.log(`   Novo role: ${updatedUser.role}`);
    console.log(`   Atualizado em: ${new Date(updatedUser.updated_at).toLocaleString('pt-BR')}`);

    // Verificar usuários admin atuais
    const { data: admins } = await supabase
      .from('users')
      .select('email, name, role, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (admins && admins.length > 0) {
      console.log('\n👑 Administradores atuais:');
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name || 'Sem nome'} (${admin.email})`);
      });
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Verificar se foi passado um email como argumento
const email = process.argv[2];

if (!email) {
  console.log('❌ Email não fornecido!');
  console.log('\nUso: node scripts/promote-to-admin.js <email>');
  console.log('\nExemplo: node scripts/promote-to-admin.js vitoria.mdelgado96@gmail.com');
  process.exit(1);
}

promoteToAdmin(email); 