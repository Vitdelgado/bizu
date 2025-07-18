const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testando conexão com o Supabase...\n');
  
  console.log('📊 Configuração:');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
  console.log('');

  try {
    // Teste 1: Verificar se a tabela bizus existe
    console.log('🧪 Teste 1: Verificando se a tabela bizus existe...');
    const { data: bizusData, error: bizusError } = await supabase
      .from('bizus')
      .select('*')
      .limit(1);

    console.log('Resultado:', { 
      data: bizusData?.length || 0, 
      error: bizusError ? bizusError.message : null 
    });

    if (bizusError) {
      console.error('❌ Erro na tabela bizus:', bizusError);
    } else {
      console.log('✅ Tabela bizus acessível!');
    }
    console.log('');

    // Teste 2: Verificar se a tabela users existe
    console.log('🧪 Teste 2: Verificando se a tabela users existe...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    console.log('Resultado:', { 
      data: usersData?.length || 0, 
      error: usersError ? usersError.message : null 
    });

    if (usersError) {
      console.error('❌ Erro na tabela users:', usersError);
    } else {
      console.log('✅ Tabela users acessível!');
    }
    console.log('');

    // Teste 3: Verificar RLS
    console.log('🧪 Teste 3: Verificando políticas RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('bizus')
      .select('id, title')
      .limit(5);

    console.log('Resultado RLS:', { 
      data: rlsTest?.length || 0, 
      error: rlsError ? rlsError.message : null 
    });

    if (rlsError) {
      console.error('❌ Erro RLS:', rlsError);
      console.log('');
      console.log('🔧 Possíveis soluções:');
      console.log('1. Verifique se as políticas RLS foram criadas corretamente');
      console.log('2. Verifique se o RLS está ativado na tabela bizus');
      console.log('3. Verifique se a política "Todos podem ver bizus" existe');
    } else {
      console.log('✅ RLS funcionando corretamente!');
    }
    console.log('');

    // Teste 4: Tentar inserir um bizu de teste (deve falhar sem autenticação)
    console.log('🧪 Teste 4: Tentando inserir bizu sem autenticação...');
    const { data: insertData, error: insertError } = await supabase
      .from('bizus')
      .insert([{
        title: 'Teste',
        category: 'Teste',
        keywords: ['teste'],
        content: 'Teste de inserção'
      }])
      .select();

    console.log('Resultado inserção:', { 
      data: insertData?.length || 0, 
      error: insertError ? insertError.message : null 
    });

    if (insertError) {
      console.log('✅ Inserção bloqueada corretamente (sem autenticação)');
    } else {
      console.log('⚠️  Inserção permitida sem autenticação (problema de segurança)');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }

  console.log('');
  console.log('📝 Resumo dos testes:');
  console.log('Se todos os testes passaram, o problema pode estar na aplicação.');
  console.log('Se algum teste falhou, execute novamente os scripts SQL no Supabase.');
}

testConnection(); 