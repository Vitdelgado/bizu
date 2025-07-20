const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔍 Testando autenticação...\n');

  try {
    // 1. Testar configuração básica
    console.log('📋 1. Verificando configuração...');
    console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltando');
    console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Faltando');

    // 2. Testar conexão com o banco
    console.log('\n📋 2. Testando conexão com o banco...');
    const { data: testData, error: testError } = await supabase
      .from('bizus')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('❌ Erro na conexão:', testError.message);
    } else {
      console.log('✅ Conexão com banco OK');
    }

    // 3. Testar autenticação anônima
    console.log('\n📋 3. Testando autenticação anônima...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('✅ Sessão obtida:', session ? 'Sim' : 'Não');
    }

    // 4. Testar tabela users
    console.log('\n📋 4. Testando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(3);

    if (usersError) {
      console.log('❌ Erro na tabela users:', usersError.message);
    } else {
      console.log('✅ Tabela users OK, usuários encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('   Primeiro usuário:', users[0]);
      }
    }

    // 5. Testar tabela bizu_likes
    console.log('\n📋 5. Testando tabela bizu_likes...');
    const { data: likes, error: likesError } = await supabase
      .from('bizu_likes')
      .select('*')
      .limit(1);

    if (likesError) {
      console.log('❌ Erro na tabela bizu_likes:', likesError.message);
    } else {
      console.log('✅ Tabela bizu_likes OK');
    }

    // 6. Testar RLS
    console.log('\n📋 6. Testando RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('bizus')
      .select('id, title')
      .limit(1);

    if (rlsError && rlsError.message.includes('row-level security policy')) {
      console.log('⚠️ RLS está ativo (isso é normal para usuários anônimos)');
    } else if (rlsError) {
      console.log('❌ Erro de RLS:', rlsError.message);
    } else {
      console.log('✅ RLS configurado corretamente');
    }

    // 7. Testar login com credenciais conhecidas
    console.log('\n📋 7. Testando login...');
    const testEmail = 'agenciatektus@gmail.com';
    const testPassword = 'test123'; // Senha de teste

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login bem-sucedido:', loginData.user?.id);
      
      // Testar busca de perfil após login
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (profileError) {
        console.log('❌ Erro ao buscar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil encontrado:', profile);
      }

      // Fazer logout
      await supabase.auth.signOut();
      console.log('✅ Logout realizado');
    }

    console.log('\n🎯 Teste de autenticação concluído!');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testAuth().catch(console.error); 