const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestUser() {
  console.log('🔧 Inserindo usuário de teste no banco...\n');

  try {
    // Primeiro, fazer login para obter o ID do usuário
    console.log('📋 1. Fazendo login para obter ID do usuário...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'teste@bizu.com',
      password: 'teste123'
    });

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      return;
    }

    const userId = loginData.user.id;
    console.log('✅ Login bem-sucedido, ID do usuário:', userId);

    // Verificar se o usuário já existe na tabela users
    console.log('📋 2. Verificando se usuário já existe na tabela users...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (checkError && !checkError.message.includes('No rows found')) {
      console.log('❌ Erro ao verificar usuário:', checkError.message);
      return;
    }

    if (existingUser) {
      console.log('✅ Usuário já existe na tabela users:', existingUser);
      await supabase.auth.signOut();
      return;
    }

    // Tentar inserir o usuário usando RPC para contornar RLS
    console.log('📋 3. Inserindo usuário na tabela users...');
    const { data: insertData, error: insertError } = await supabase.rpc('insert_user_profile', {
      user_id: userId,
      user_email: loginData.user.email,
      user_name: 'Usuário Teste',
      user_role: 'suporte'
    }).catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (insertError) {
      console.log('❌ Erro ao inserir via RPC:', insertError);
      console.log('⚠️ Tentando inserção direta...');
      
      // Tentar inserção direta (pode falhar devido ao RLS)
      const { data: directInsert, error: directError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: loginData.user.email,
          name: 'Usuário Teste',
          role: 'suporte',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (directError) {
        console.log('❌ Erro na inserção direta:', directError.message);
        console.log('📝 Execute manualmente no SQL Editor:');
        console.log(`INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES ('${userId}', '${loginData.user.email}', 'Usuário Teste', 'suporte', NOW(), NOW());`);
      } else {
        console.log('✅ Usuário inserido com sucesso:', directInsert);
      }
    } else {
      console.log('✅ Usuário inserido via RPC:', insertData);
    }

    // Fazer logout
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');

    console.log('\n🎯 Usuário de teste configurado!');
    console.log('📝 Credenciais para teste:');
    console.log('Email: teste@bizu.com');
    console.log('Senha: teste123');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

insertTestUser().catch(console.error); 