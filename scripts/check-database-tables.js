const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('Certifique-se de que o arquivo .env.local existe com:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=...');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Verificando tabelas do banco de dados...\n');

  const tables = [
    'bizus',
    'users', 
    'bizu_likes',
    'bizu_edits',
    'audit_logs'
  ];

  for (const tableName of tables) {
    try {
      console.log(`📋 Verificando tabela: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Erro na tabela ${tableName}:`, error.message);
        
        // Verificar se é erro de tabela não existente
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   → Tabela ${tableName} não existe!`);
        }
      } else {
        console.log(`✅ Tabela ${tableName} existe`);
        
        // Verificar estrutura da tabela bizus
        if (tableName === 'bizus') {
          const { data: columns, error: columnsError } = await supabase
            .rpc('get_table_columns', { table_name: tableName })
            .catch(() => ({ data: null, error: 'RPC não disponível' }));
          
          if (!columnsError && columns) {
            console.log(`   → Colunas: ${columns.map(c => c.column_name).join(', ')}`);
          }
        }
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar ${tableName}:`, err.message);
    }
    console.log('');
  }

  // Verificar se a coluna likes existe na tabela bizus
  console.log('🔍 Verificando coluna likes na tabela bizus...');
  try {
    const { data, error } = await supabase
      .from('bizus')
      .select('likes')
      .limit(1);

    if (error) {
      console.log('❌ Coluna likes não encontrada:', error.message);
    } else {
      console.log('✅ Coluna likes existe na tabela bizus');
    }
  } catch (err) {
    console.log('❌ Erro ao verificar coluna likes:', err.message);
  }

  console.log('\n🔍 Verificando RLS (Row Level Security)...');
  try {
    const { data: rlsData, error: rlsError } = await supabase
      .from('bizus')
      .select('*')
      .limit(1);

    if (rlsError && rlsError.message.includes('new row violates row-level security policy')) {
      console.log('⚠️ RLS está ativo (isso é normal para usuários anônimos)');
    } else if (rlsError) {
      console.log('❌ Erro de RLS:', rlsError.message);
    } else {
      console.log('✅ RLS configurado corretamente');
    }
  } catch (err) {
    console.log('❌ Erro ao verificar RLS:', err.message);
  }

  console.log('\n🔍 Verificando funções...');
  try {
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_top_bizus_by_likes', { limit_count: 1 })
      .catch(() => ({ data: null, error: 'Função não disponível' }));

    if (functionsError) {
      console.log('❌ Função get_top_bizus_by_likes não encontrada:', functionsError.message);
    } else {
      console.log('✅ Função get_top_bizus_by_likes existe');
    }
  } catch (err) {
    console.log('❌ Erro ao verificar funções:', err.message);
  }

  console.log('\n🎯 Resumo das verificações concluído!');
}

checkTables().catch(console.error); 