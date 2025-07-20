const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de usuários existentes para teste
const testUsers = [
  { email: 'agenciatektus@gmail.com', password: 'test123', name: 'Tektus (Admin)' },
  { email: 'vitoria.mdelgado96@gmail.com', password: 'test123', name: 'Vitória (Suporte)' },
  { email: 'suporte@curseduca.com', password: 'test123', name: 'Suporte (Faltando na tabela)' },
  { email: 'teste@bizu.com', password: 'teste123', name: 'Teste (Não confirmado)' },
  { email: 'admin@bizu.com', password: 'admin123', name: 'Admin (Não confirmado)' }
];

async function testSpecificLogins() {
  console.log('🔍 Testando login com usuários existentes...\n');

  for (const user of testUsers) {
    console.log(`📋 Testando: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        
        if (error.message.includes('Email not confirmed')) {
          console.log('   💡 Solução: Confirmar email no Supabase Auth');
        } else if (error.message.includes('Invalid login credentials')) {
          console.log('   💡 Solução: Verificar senha ou criar nova senha');
        }
      } else {
        console.log(`   ✅ Login bem-sucedido!`);
        console.log(`   👤 ID: ${data.user.id}`);
        console.log(`   📧 Email confirmado: ${data.user.email_confirmed_at ? 'Sim' : 'Não'}`);
        
        // Verificar se o usuário está na tabela users
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.log(`   ⚠️ Usuário não encontrado na tabela users: ${profileError.message}`);
        } else {
          console.log(`   ✅ Perfil encontrado: ${profile.role}`);
        }
      }
      
      // Fazer logout
      await supabase.auth.signOut();
      
    } catch (error) {
      console.log(`   ❌ Erro geral: ${error.message}`);
    }
    
    console.log(''); // Linha em branco
  }

  console.log('🎯 Teste de login concluído!');
  console.log('\n📝 Resumo dos problemas encontrados:');
  console.log('1. Usuários não confirmados precisam confirmar email');
  console.log('2. Senhas podem estar incorretas');
  console.log('3. Usuário suporte@curseduca.com não está na tabela users');
}

testSpecificLogins().catch(console.error); 