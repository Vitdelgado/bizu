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

// Usuários que devem permanecer
const validUsers = [
  { email: 'agenciatektus@gmail.com', role: 'admin', name: 'Tektus' },
  { email: 'vitoria.mdelgado@gmail.com', role: 'suporte', name: 'Vitória' }
];

async function cleanupUsers() {
  console.log('🧹 Limpando usuários desnecessários...\n');

  try {
    // 1. Listar todos os usuários atuais
    console.log('📋 1. Listando usuários atuais...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('❌ Erro ao listar usuários:', authError.message);
      return;
    }

    console.log(`   Total de usuários no Auth: ${authUsers.users.length}`);
    authUsers.users.forEach((user, index) => {
      const isValid = validUsers.some(v => v.email === user.email);
      const status = isValid ? '✅ Manter' : '❌ Remover';
      console.log(`   ${index + 1}. ${user.email} - ${status}`);
    });

    // 2. Remover usuários inválidos do Auth
    console.log('\n📋 2. Removendo usuários inválidos do Auth...');
    const usersToRemove = authUsers.users.filter(user => 
      !validUsers.some(v => v.email === user.email)
    );

    console.log(`   Usuários para remover: ${usersToRemove.length}`);
    for (const user of usersToRemove) {
      console.log(`   🗑️ Removendo: ${user.email}`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.log(`   ❌ Erro ao remover ${user.email}:`, deleteError.message);
      } else {
        console.log(`   ✅ Removido: ${user.email}`);
      }
    }

    // 3. Limpar tabela users
    console.log('\n📋 3. Limpando tabela users...');
    
    // Desabilitar RLS temporariamente
    console.log('   🔓 Desabilitando RLS...');
    const { error: rlsError } = await supabase.rpc('disable_rls_users').catch(() => ({ error: 'RPC não disponível' }));
    if (rlsError) {
      console.log('   ⚠️ Não foi possível desabilitar RLS via RPC');
    }

    // Remover todos os usuários da tabela
    const { error: deleteAllError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

    if (deleteAllError) {
      console.log('   ❌ Erro ao limpar tabela users:', deleteAllError.message);
    } else {
      console.log('   ✅ Tabela users limpa');
    }

    // 4. Recriar usuários válidos
    console.log('\n📋 4. Recriando usuários válidos...');
    
    for (const validUser of validUsers) {
      console.log(`   👤 Configurando: ${validUser.email}`);
      
      // Verificar se o usuário existe no Auth
      const existingUser = authUsers.users.find(u => u.email === validUser.email);
      
      if (!existingUser) {
        console.log(`   ⚠️ Usuário não encontrado no Auth: ${validUser.email}`);
        console.log(`   📝 Crie manualmente no Supabase Dashboard > Auth > Users`);
        continue;
      }

      // Confirmar email se necessário
      if (!existingUser.email_confirmed_at) {
        console.log(`   📧 Confirmando email: ${validUser.email}`);
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.log(`   ❌ Erro ao confirmar email: ${confirmError.message}`);
        } else {
          console.log(`   ✅ Email confirmado: ${validUser.email}`);
        }
      }

      // Definir senha padrão
      const defaultPassword = validUser.role === 'admin' ? 'tektus123' : 'vitoria123';
      console.log(`   🔑 Definindo senha: ${validUser.email} -> ${defaultPassword}`);
      
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: defaultPassword }
      );
      
      if (passwordError) {
        console.log(`   ❌ Erro ao definir senha: ${passwordError.message}`);
      } else {
        console.log(`   ✅ Senha definida: ${validUser.email}`);
      }

      // Inserir na tabela users
      console.log(`   📝 Inserindo na tabela users: ${validUser.email}`);
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: existingUser.id,
          email: validUser.email,
          name: validUser.name,
          role: validUser.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        console.log(`   ❌ Erro ao inserir na tabela: ${insertError.message}`);
      } else {
        console.log(`   ✅ Usuário inserido: ${insertData.email} (${insertData.role})`);
      }
    }

    // 5. Reabilitar RLS
    console.log('\n📋 5. Reabilitando RLS...');
    const { error: enableRlsError } = await supabase.rpc('enable_rls_users').catch(() => ({ error: 'RPC não disponível' }));
    if (enableRlsError) {
      console.log('   ⚠️ Não foi possível reabilitar RLS via RPC');
    } else {
      console.log('   ✅ RLS reabilitado');
    }

    // 6. Verificação final
    console.log('\n📋 6. Verificação final...');
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*')
      .order('created_at');

    if (finalError) {
      console.log('❌ Erro na verificação final:', finalError.message);
    } else {
      console.log(`✅ Usuários finais na tabela: ${finalUsers?.length || 0}`);
      if (finalUsers && finalUsers.length > 0) {
        finalUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.name}`);
        });
      }
    }

    console.log('\n🎯 Limpeza concluída!');
    console.log('\n📝 Credenciais finais:');
    console.log('👑 Admin: agenciatektus@gmail.com / tektus123');
    console.log('👩 Suporte: vitoria.mdelgado@gmail.com / vitoria123');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

cleanupUsers().catch(console.error); 