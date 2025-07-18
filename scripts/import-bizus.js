const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase - ATUALIZE COM SUAS CREDENCIAIS
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ID do usuário admin que será o autor dos bizus
// Substitua pelo ID do usuário Tektus ou outro admin
const ADMIN_USER_ID = 'SEU_USER_ID_AQUI'; // ATUALIZE ESTE VALOR

function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }

  return data;
}

function transformBizuData(csvRow) {
  // Ajuste os nomes das colunas conforme seu CSV
  return {
    title: csvRow.title || csvRow.Title || csvRow.titulo || '',
    category: csvRow.category || csvRow.Category || csvRow.categoria || '',
    keywords: csvRow.keywords ? csvRow.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
    content: csvRow.content || csvRow.Content || csvRow.conteudo || '',
    image_url: csvRow.image_url || csvRow.imageUrl || csvRow.url_imagem || null,
    author_id: ADMIN_USER_ID,
    views: 0
  };
}

async function importBizus() {
  try {
    console.log('🚀 Iniciando importação de bizus...\n');

    // Verificar se o arquivo CSV existe
    const csvPath = './bizus.csv';
    if (!fs.existsSync(csvPath)) {
      console.error('❌ Arquivo bizus.csv não encontrado!');
      console.log('Certifique-se de que o arquivo bizus.csv está na raiz do projeto.');
      return;
    }

    // Ler o arquivo CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const csvData = parseCSV(csvContent);

    console.log(`📊 Encontrados ${csvData.length} bizus no CSV\n`);

    if (csvData.length === 0) {
      console.log('❌ Nenhum bizu encontrado no CSV');
      return;
    }

    // Verificar se o usuário admin existe
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', ADMIN_USER_ID)
      .single();

    if (adminError || !adminUser) {
      console.error('❌ Usuário admin não encontrado!');
      console.log(`ID do usuário: ${ADMIN_USER_ID}`);
      console.log('Certifique-se de que o usuário existe e é admin.');
      return;
    }

    console.log(`✅ Usuário admin encontrado: ${adminUser.email} (${adminUser.role})\n`);

    let successCount = 0;
    let errorCount = 0;

    // Importar bizus
    for (let i = 0; i < csvData.length; i++) {
      const csvRow = csvData[i];
      const bizuData = transformBizuData(csvRow);

      // Validar dados obrigatórios
      if (!bizuData.title || !bizuData.category || !bizuData.content) {
        console.log(`⚠️  Bizu ${i + 1} ignorado - dados incompletos`);
        errorCount++;
        continue;
      }

      try {
        const { data, error } = await supabase
          .from('bizus')
          .insert([bizuData])
          .select('id, title')
          .single();

        if (error) {
          console.error(`❌ Erro ao importar bizu ${i + 1}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Bizu importado: ${data.title}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Erro ao importar bizu ${i + 1}: ${err.message}`);
        errorCount++;
      }

      // Pequena pausa para não sobrecarregar o banco
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Resumo da importação:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📝 Total processado: ${csvData.length}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar importação
importBizus(); 