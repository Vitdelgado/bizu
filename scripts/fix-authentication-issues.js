const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Service Role Key não encontrada');
  console.error('📝 Adicione SUPABASE_SERVICE_ROLE_KEY ao .env.local');
  process.exit(1);
}

// Usar service role para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAuthenticationIssues() {
  console.log('🔧 Corrigindo problemas de autenticação...\n');

  try {
    // 1. Confirmar emails não confirmados
    console.log('📋 1. Confirmando emails não confirmados...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('❌ Erro ao listar usuários:', authError.message);
      return;
    }

    const unconfirmedUsers = authUsers.users.filter(user => !user.email_confirmed_at);
    console.log(`   Encontrados ${unconfirmedUsers.length} usuários não confirmados`);

    for (const user of unconfirmedUsers) {
      console.log(`   📧 Confirmando email: ${user.email}`);
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.log(`   ❌ Erro ao confirmar ${user.email}:`, confirmError.message);
      } else {
        console.log(`   ✅ Email confirmado: ${user.email}`);
      }
    }

    // 2. Redefinir senhas para usuários existentes
    console.log('\n📋 2. Redefinindo senhas...');
    
    const usersToReset = [
      { email: 'agenciatektus@gmail.com', newPassword: 'tektus123' },
      { email: 'vitoria.mdelgado96@gmail.com', newPassword: 'vitoria123' },
      { email: 'suporte@curseduca.com', newPassword: 'suporte123' }
    ];

    for (const userData of usersToReset) {
      console.log(`   🔑 Redefinindo senha: ${userData.email}`);
      
      // Encontrar o usuário no Auth
      const user = authUsers.users.find(u => u.email === userData.email);
      if (!user) {
        console.log(`   ⚠️ Usuário não encontrado no Auth: ${userData.email}`);
        continue;
      }

      const { error: resetError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: userData.newPassword }
      );

      if (resetError) {
        console.log(`   ❌ Erro ao redefinir senha: ${resetError.message}`);
      } else {
        console.log(`   ✅ Senha redefinida: ${userData.email} -> ${userData.newPassword}`);
      }
    }

    // 3. Adicionar usuário faltando na tabela users
    console.log('\n📋 3. Adicionando usuário faltando na tabela users...');
    
    const missingUser = authUsers.users.find(u => u.email === 'suporte@curseduca.com');
    if (missingUser) {
      console.log(`   👤 Adicionando: ${missingUser.email}`);
      
      // Desabilitar RLS temporariamente
      await supabase.rpc('disable_rls_users').catch(() => {
        console.log('   ⚠️ Não foi possível desabilitar RLS via RPC');
      });

      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: missingUser.id,
          email: missingUser.email,
          name: 'Suporte Curseduca',
          role: 'suporte',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        console.log(`   ❌ Erro ao inserir usuário: ${insertError.message}`);
        console.log(`   📝 Execute manualmente no SQL Editor:`);
        console.log(`   INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES ('${missingUser.id}', '${missingUser.email}', 'Suporte Curseduca', 'suporte', NOW(), NOW());`);
      } else {
        console.log(`   ✅ Usuário adicionado: ${insertData.email}`);
      }

      // Reabilitar RLS
      await supabase.rpc('enable_rls_users').catch(() => {
        console.log('   ⚠️ Não foi possível reabilitar RLS via RPC');
      });
    }

    console.log('\n🎯 Correções aplicadas!');
    console.log('\n📝 Credenciais atualizadas:');
    console.log('👑 Admin: agenciatektus@gmail.com / tektus123');
    console.log('👩 Suporte: vitoria.mdelgado96@gmail.com / vitoria123');
    console.log('👨 Suporte: suporte@curseduca.com / suporte123');
    console.log('🧪 Teste: teste@bizu.com / teste123');
    console.log('🔧 Admin: admin@bizu.com / admin123');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixAuthenticationIssues().catch(console.error); 