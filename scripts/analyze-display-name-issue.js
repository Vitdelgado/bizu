const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Service Role Key não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDisplayNameIssue() {
  console.log('🔍 Analisando problema da coluna display_name...\n');

  try {
    // 1. Verificar estrutura da tabela auth.users
    console.log('📋 1. ESTRUTURA DA TABELA auth.users:');
    console.log('   🔐 Colunas principais:');
    console.log('      - id (UUID)');
    console.log('      - email (TEXT)');
    console.log('      - display_name (TEXT) ← PROBLEMA AQUI!');
    console.log('      - email_confirmed_at (TIMESTAMPTZ)');
    console.log('      - created_at (TIMESTAMPTZ)');
    console.log('      - updated_at (TIMESTAMPTZ)');
    console.log('      - raw_user_meta_data (JSONB)');
    console.log('      - raw_app_meta_data (JSONB)\n');

    // 2. Verificar estrutura da tabela public.users
    console.log('📋 2. ESTRUTURA DA TABELA public.users:');
    console.log('   🎯 Colunas principais:');
    console.log('      - id (UUID)');
    console.log('      - email (TEXT)');
    console.log('      - name (TEXT) ← EQUIVALENTE AO display_name');
    console.log('      - phone (TEXT)');
    console.log('      - role (ENUM: admin, suporte)');
    console.log('      - created_at (TIMESTAMPTZ)');
    console.log('      - updated_at (TIMESTAMPTZ)\n');

    // 3. Verificar dados atuais
    console.log('📋 3. DADOS ATUAIS:');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao listar usuários do Auth:', authError.message);
    } else {
      console.log('   🔐 Usuários no Auth:');
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      - ID: ${user.id}`);
        console.log(`      - Display Name: ${user.user_metadata?.display_name || 'Não definido'}`);
        console.log(`      - Raw Meta: ${JSON.stringify(user.user_metadata)}`);
      });
    }

    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*');

    if (publicError) {
      console.error('❌ Erro ao listar usuários da tabela users:', publicError.message);
    } else {
      console.log('\n   🎯 Usuários na tabela users:');
      publicUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      - ID: ${user.id}`);
        console.log(`      - Name: ${user.name || 'Não definido'}`);
        console.log(`      - Role: ${user.role}`);
      });
    }

    // 4. Identificar problemas
    console.log('\n📋 4. PROBLEMAS IDENTIFICADOS:');
    console.log('   ❌ Inconsistência de dados:');
    console.log('      - Auth pode ter display_name');
    console.log('      - Tabela users tem name');
    console.log('      - Dados podem ficar dessincronizados');
    console.log('   ❌ Limitações funcionais:');
    console.log('      - Supabase Auth usa display_name para UI');
    console.log('      - Sua aplicação usa name da tabela users');
    console.log('      - Pode haver conflito de nomes');
    console.log('   ❌ Problemas de sincronização:');
    console.log('      - Trigger só copia email, não display_name');
    console.log('      - Mudanças no Auth não refletem na tabela users');
    console.log('      - Mudanças na tabela users não refletem no Auth');

    // 5. Cenários problemáticos
    console.log('\n📋 5. CENÁRIOS PROBLEMÁTICOS:');
    console.log('   🚨 Usuário atualiza display_name no Auth:');
    console.log('      → Tabela users não é atualizada');
    console.log('      → Nome fica inconsistente');
    console.log('   🚨 Usuário atualiza name na tabela users:');
    console.log('      → Auth não é atualizado');
    console.log('      → Supabase UI mostra nome antigo');
    console.log('   🚨 Aplicação não sabe qual nome usar:');
    console.log('      → Auth.display_name ou users.name?');
    console.log('      → Qual tem prioridade?');

    // 6. Soluções possíveis
    console.log('\n📋 6. SOLUÇÕES POSSÍVEIS:');
    console.log('   ✅ SOLUÇÃO 1: Sincronizar automaticamente');
    console.log('      - Trigger atualiza name quando display_name muda');
    console.log('      - Função atualiza display_name quando name muda');
    console.log('   ✅ SOLUÇÃO 2: Usar apenas uma fonte');
    console.log('      - Desabilitar display_name no Auth');
    console.log('      - Usar apenas name da tabela users');
    console.log('   ✅ SOLUÇÃO 3: Definir prioridade clara');
    console.log('      - Auth.display_name tem prioridade');
    console.log('      - Tabela users.name é backup');
    console.log('   ✅ SOLUÇÃO 4: Unificar em uma coluna');
    console.log('      - Adicionar display_name na tabela users');
    console.log('      - Manter sincronização bidirecional');

    // 7. Verificar se há dados inconsistentes
    console.log('\n📋 7. VERIFICANDO INCONSISTÊNCIAS:');
    
    if (authUsers && publicUsers) {
      const inconsistencies = [];
      
      authUsers.users.forEach(authUser => {
        const publicUser = publicUsers.find(pu => pu.id === authUser.id);
        if (publicUser) {
          const authName = authUser.user_metadata?.display_name || '';
          const publicName = publicUser.name || '';
          
          if (authName !== publicName) {
            inconsistencies.push({
              email: authUser.email,
              authName,
              publicName,
              type: 'name_mismatch'
            });
          }
        }
      });

      if (inconsistencies.length > 0) {
        console.log('   ⚠️ Inconsistências encontradas:');
        inconsistencies.forEach(inc => {
          console.log(`      - ${inc.email}:`);
          console.log(`        Auth: "${inc.authName}"`);
          console.log(`        Public: "${inc.publicName}"`);
        });
      } else {
        console.log('   ✅ Nenhuma inconsistência encontrada');
      }
    }

    // 8. Recomendação
    console.log('\n📋 8. RECOMENDAÇÃO:');
    console.log('   🎯 SOLUÇÃO RECOMENDADA: Sincronização automática');
    console.log('   📝 Implementar:');
    console.log('      1. Trigger para atualizar name quando display_name muda');
    console.log('      2. Função para atualizar display_name quando name muda');
    console.log('      3. Política clara: qual nome tem prioridade');
    console.log('      4. Documentação para desenvolvedores');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

analyzeDisplayNameIssue().catch(console.error); 