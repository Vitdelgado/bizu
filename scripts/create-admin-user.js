const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  console.log('🔧 Criando usuário admin...\n');

  try {
    const adminEmail = 'admin@bizu.com';
    const adminPassword = 'admin123';
    const adminName = 'Administrador';

    console.log('📝 Dados do admin:');
    console.log('Email:', adminEmail);
    console.log('Senha:', adminPassword);
    console.log('Nome:', adminName);

    // 1. Criar usuário no Supabase Auth
    console.log('\n📋 1. Criando usuário no Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          name: adminName
        }
      }
    });

    if (authError) {
      console.log('❌ Erro ao criar usuário no Auth:', authError.message);
      
      // Se o usuário já existe, tentar fazer login
      if (authError.message.includes('already registered')) {
        console.log('⚠️ Usuário já existe, tentando fazer login...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
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
          await createUserProfile(loginData.user, 'admin');
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
      await createUserProfile(authData.user, 'admin');
      
      // 3. Fazer logout
      await supabase.auth.signOut();
      console.log('✅ Logout realizado');
    }

    console.log('\n🎯 Usuário admin criado com sucesso!');
    console.log('📝 Use as credenciais para testar o login:');
    console.log('Email:', adminEmail);
    console.log('Senha:', adminPassword);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function createUserProfile(user, role = 'suporte') {
  try {
    console.log('📋 2. Criando perfil na tabela users...');
    
    // Primeiro, desabilitar RLS temporariamente
    console.log('📋 2.1. Desabilitando RLS temporariamente...');
    const { error: rlsError } = await supabase.rpc('disable_rls_users').catch(() => ({ error: 'RPC não disponível' }));
    
    if (rlsError) {
      console.log('⚠️ Não foi possível desabilitar RLS via RPC, tentando inserção direta...');
    }

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'Usuário Admin',
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (profileError) {
      console.log('❌ Erro ao criar perfil:', profileError.message);
      console.log('📝 Execute manualmente no SQL Editor:');
      console.log(`-- Desabilitar RLS temporariamente`);
      console.log(`ALTER TABLE users DISABLE ROW LEVEL SECURITY;`);
      console.log(`-- Inserir usuário`);
      console.log(`INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES ('${user.id}', '${user.email}', '${user.user_metadata?.name || 'Usuário Admin'}', '${role}', NOW(), NOW());`);
      console.log(`-- Reabilitar RLS`);
      console.log(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);
    } else {
      console.log('✅ Perfil criado:', profileData);
    }
  } catch (error) {
    console.error('❌ Erro ao criar perfil:', error.message);
  }
}

createAdminUser().catch(console.error); 