const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que o arquivo .env.local existe com:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave');
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key (recomendado)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  const adminData = {
    email: 'agenciatektus@gmail.com',
    password: 'Tektus717271@',
    name: 'Tektus',
    phone: '+5521977357727',
    role: 'admin'
  };

  console.log('👑 Criando Super Admin...\n');
  console.log(`📧 Email: ${adminData.email}`);
  console.log(`👤 Nome: ${adminData.name}`);
  console.log(`📱 Telefone: ${adminData.phone}`);
  console.log(`🔑 Role: ${adminData.role}\n`);

  try {
    // Verificar se o usuário já existe no Auth
    const { data: existingAuthUser, error: authCheckError } = await supabase.auth.admin.listUsers();
    
    let userExists = false;
    if (!authCheckError && existingAuthUser) {
      userExists = existingAuthUser.users.some(user => user.email === adminData.email);
    }

    if (userExists) {
      console.log('⚠️  Usuário já existe no Supabase Auth!');
      console.log('Vou apenas atualizar o perfil na tabela users...');
    } else {
      // Criar usuário no Supabase Auth
      console.log('🔐 Criando usuário no Supabase Auth...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          name: adminData.name,
          phone: adminData.phone
        }
      });

      if (authError) {
        console.error('❌ Erro ao criar usuário no Auth:', authError.message);
        if (authError.message.includes('service_role')) {
          console.log('\n💡 Dica: Para criar usuários no Auth, você precisa da service_role key.');
          console.log('1. Vá ao Supabase Dashboard');
          console.log('2. Settings → API');
          console.log('3. Copie a "service_role" key');
          console.log('4. Adicione ao .env.local: SUPABASE_SERVICE_ROLE_KEY=sua_chave');
        }
        return;
      }

      console.log('✅ Usuário criado no Supabase Auth!');
      console.log(`   ID: ${authUser.user.id}`);
    }

    // Verificar se já existe na tabela users
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminData.email)
      .single();

    if (existingUser) {
      console.log('📋 Usuário já existe na tabela users. Atualizando...');
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: adminData.name,
          phone: adminData.phone,
          role: adminData.role,
          updated_at: new Date().toISOString()
        })
        .eq('email', adminData.email)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError);
        return;
      }

      console.log('✅ Usuário atualizado na tabela users!');
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Nome: ${updatedUser.name}`);
      console.log(`   Telefone: ${updatedUser.phone}`);
    } else {
      console.log('📋 Criando perfil na tabela users...');
      
      // Buscar o ID do usuário no Auth
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users.find(u => u.email === adminData.email);
      
      if (!authUser) {
        console.error('❌ Usuário não encontrado no Auth para criar perfil!');
        return;
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: authUser.id,
          email: adminData.email,
          name: adminData.name,
          phone: adminData.phone,
          role: adminData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar perfil do usuário:', insertError);
        return;
      }

      console.log('✅ Perfil criado na tabela users!');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Role: ${newUser.role}`);
    }

    // Verificar usuários admin atuais
    const { data: admins } = await supabase
      .from('users')
      .select('email, name, role, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    console.log('\n👑 Administradores atuais:');
    if (admins && admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name || 'Sem nome'} (${admin.email})`);
      });
    } else {
      console.log('   Nenhum admin encontrado');
    }

    console.log('\n🎉 Super Admin criado com sucesso!');
    console.log('📝 Credenciais de login:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Senha: ${adminData.password}`);

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

createSuperAdmin(); 