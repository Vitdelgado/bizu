import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento de categorias antigas para novas
const categoryMappings = {
  'Personalização / Técnico': 'Personalização, Técnico',
  'Personalização / Interface': 'Personalização, Interface',
  'Suporte Avançado / Técnico': 'Suporte Avançado, Técnico',
  'Atendimento / Comunicação': 'Atendimento, Comunicação',
  'Integrações / Técnicas': 'Integrações, Técnicas',
  'Integrações / Front-end': 'Integrações, Front-end',
  'Conteúdo / Produto': 'Conteúdo, Produto',
  'Cancelamento / Suporte Comercial': 'Cancelamento, Suporte Comercial',
  'Certificados / App': 'Certificados, App',
  'Gamificação / Suporte': 'Gamificação, Suporte',
  'Equipe / Suporte Interno': 'Equipe, Suporte Interno',
  'Produto / Página': 'Produto, Página',
  'Integrações / Personalização': 'Integrações, Personalização'
};

async function fixCategories() {
  console.log('🔧 Iniciando correção de categorias...\n');

  try {
    // Buscar todos os bizus
    const { data: bizus, error } = await supabase
      .from('bizus')
      .select('id, title, category');

    if (error) {
      console.error('❌ Erro ao buscar bizus:', error);
      return;
    }

    console.log(`📋 Encontrados ${bizus.length} bizus para verificar\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const bizu of bizus) {
      const oldCategory = bizu.category;
      const newCategory = categoryMappings[oldCategory];

      if (newCategory) {
        console.log(`🔄 Atualizando: "${bizu.title}"`);
        console.log(`   Antes: "${oldCategory}"`);
        console.log(`   Depois: "${newCategory}"`);

        const { error: updateError } = await supabase
          .from('bizus')
          .update({ category: newCategory })
          .eq('id', bizu.id);

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
        } else {
          console.log(`   ✅ Atualizado com sucesso\n`);
          updatedCount++;
        }
      } else {
        console.log(`⏭️  Pulando: "${bizu.title}" - Categoria já correta: "${oldCategory}"\n`);
        skippedCount++;
      }
    }

    console.log('📊 Resumo da correção:');
    console.log(`✅ Atualizados: ${updatedCount}`);
    console.log(`⏭️  Pulados: ${skippedCount}`);
    console.log(`📋 Total processado: ${bizus.length}`);

    if (updatedCount > 0) {
      console.log('\n🎉 Categorias corrigidas com sucesso!');
    } else {
      console.log('\nℹ️  Nenhuma categoria precisou ser corrigida.');
    }

  } catch (error) {
    console.error('💥 Erro durante a correção:', error);
  }
}

// Executar a correção
fixCategories(); 