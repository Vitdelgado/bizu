const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🔧 Criando usuário de teste...\n');

  try {
    const testEmail = 'teste@bizu.com';
    const testPassword = 'teste123';
    const testName = 'Usuário Teste';

    console.log('📝 Dados do usuário:');
    console.log('Email:', testEmail);
    console.log('Senha:', testPassword);
    console.log('Nome:', testName);

    // 1. Criar usuário no Supabase Auth
    console.log('\n📋 1. Criando usuário no Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName
        }
      }
    });

    if (authError) {
      console.log('❌ Erro ao criar usuário no Auth:', authError.message);
      
      // Se o usuário já existe, tentar fazer login
      if (authError.message.includes('already registered')) {
        console.log('⚠️ Usuário já existe, tentando fazer login...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });

        if (loginError) {
          console.log('❌ Erro no login:', loginError.message);
          return;
        }

        console.log('✅ Login bem-sucedido:', loginData.user?.id);
        
        // Verificar se o perfil existe na tabela users
        const { data: existingProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', loginData.user.id)
          .single();

        if (profileError || !existingProfile) {
          console.log('⚠️ Perfil não encontrado na tabela users, criando...');
          await createUserProfile(loginData.user);
        } else {
          console.log('✅ Perfil já existe:', existingProfile);
        }

        await supabase.auth.signOut();
        return;
      }
      return;
    }

    if (authData.user) {
      console.log('✅ Usuário criado no Auth:', authData.user.id);
      
      // 2. Criar perfil na tabela users
      await createUserProfile(authData.user);
      
      // 3. Fazer logout
      await supabase.auth.signOut();
      console.log('✅ Logout realizado');
    }

    console.log('\n🎯 Usuário de teste criado com sucesso!');
    console.log('📝 Use as credenciais para testar o login:');
    console.log('Email:', testEmail);
    console.log('Senha:', testPassword);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function createUserProfile(user) {
  try {
    console.log('📋 2. Criando perfil na tabela users...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'Usuário Teste',
        role: 'suporte',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (profileError) {
      console.log('❌ Erro ao criar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil criado:', profileData);
    }
  } catch (error) {
    console.error('❌ Erro ao criar perfil:', error.message);
  }
}

createTestUser().catch(console.error); 