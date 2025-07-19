import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBizus() {
  console.log('🔍 Verificando todos os bizus no sistema...\n');

  try {
    // Buscar todos os bizus
    const { data: bizus, error } = await supabase
      .from('bizus')
      .select(`
        *,
        users (
          id,
          email,
          name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar bizus:', error);
      return;
    }

    if (!bizus || bizus.length === 0) {
      console.log('⚠️  Nenhum bizu encontrado no sistema!\n');
      console.log('Para criar bizus:');
      console.log('1. Acesse a aplicação e faça login');
      console.log('2. Clique em "+ Novo Bizu"');
      console.log('3. Preencha os dados e salve');
      return;
    }

    console.log(`✅ Encontrados ${bizus.length} bizu(s) no sistema:\n`);

    bizus.forEach((bizu, index) => {
      console.log(`📋 Bizu #${index + 1}:`);
      console.log(`   ID: ${bizu.id}`);
      console.log(`   Título: ${bizu.title}`);
      console.log(`   Categoria: ${bizu.category}`);
      console.log(`   Status: ${bizu.status}`);
      console.log(`   Criado por: ${bizu.users?.name || bizu.users?.email || 'N/A'}`);
      console.log(`   Data de criação: ${new Date(bizu.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Última atualização: ${bizu.updated_at ? new Date(bizu.updated_at).toLocaleString('pt-BR') : 'N/A'}`);
      
      if (bizu.description) {
        const shortDesc = bizu.description.length > 100 
          ? bizu.description.substring(0, 100) + '...' 
          : bizu.description;
        console.log(`   Descrição: ${shortDesc}`);
      }
      
      console.log(''); // Linha em branco
    });

    // Estatísticas
    const stats = {
      total: bizus.length,
      ativos: bizus.filter(b => b.status === 'ativo').length,
      inativos: bizus.filter(b => b.status === 'inativo').length,
      categorias: [...new Set(bizus.map(b => b.category))],
    };

    console.log('📊 Estatísticas:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Ativos: ${stats.ativos}`);
    console.log(`   Inativos: ${stats.inativos}`);
    console.log(`   Categorias: ${stats.categorias.join(', ')}`);

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar verificação
checkBizus(); 