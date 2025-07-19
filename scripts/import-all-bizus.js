const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importAllBizus() {
  console.log('🚀 Iniciando importação de todos os bizus...');

  // Primeiro, vamos verificar se o usuário vitoria.mdelgado96@gmail.com existe
  console.log('🔍 Verificando usuário vitoria.mdelgado96@gmail.com...');
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'vitoria.mdelgado96@gmail.com')
    .single();

  if (userError || !userData) {
    console.error('❌ Usuário vitoria.mdelgado96@gmail.com não encontrado');
    console.error('Erro:', userError);
    return;
  }

  console.log('✅ Usuário encontrado:', userData.email, 'ID:', userData.id);

  // Lista de todos os bizus restantes
  const bizus = [
    {
      title: 'Limite de Importação de Membros',
      category: 'Gerenciamento de Membros',
      keywords: ['importação', 'limite', 'membros', 'cadastro em massa'],
      content: 'O limite máximo por importação de membros é 9.998. Recomendamos dividir em partes quando ultrapassar 5.000 registros.',
      image_url: null
    },
    {
      title: 'Navegação na Área de Membros',
      category: 'Experiência do Usuário',
      keywords: ['navegação', 'área de membros', 'tutorial'],
      content: 'Veja como transitar pela área de membros neste vídeo:',
      image_url: 'https://www.loom.com/share/e69cbab9d60c4f01849c192ff7775d92?sid=8bd2192b-33f5-4870-b339-a31163d6e5cb'
    },
    {
      title: 'Pop-up na Home da Área de Membros',
      category: 'Integrações / Personalização',
      keywords: ['pop-up', 'home', 'área de membros', 'getsitecontrol'],
      content: 'Apenas clientes Black conseguem configurar pop-up na home. Não é funcionalidade oficial. Se for abrir chamado, avise que é demanda especial e sem prazo.\nReferência técnica:',
      image_url: 'https://help.curseduca.com/integracoes/get-site-control'
    },
    {
      title: 'Agente de IA',
      category: 'Inteligência Artificial',
      keywords: ['agente IA', 'material', 'documentação'],
      content: 'Acesse o material do Agente de IA aqui:',
      image_url: 'https://drive.google.com/file/d/1tZoNbBv8vJ2pjR_7jn7R5DpsotLJMGEJ/view'
    },
    {
      title: 'Remover Informações do Produto',
      category: 'Produto / Página',
      keywords: ['ocultar dados', 'página do produto', 'visualização'],
      content: 'Sim, é possível ocultar informações específicas em páginas de produto.',
      image_url: null
    },
    {
      title: 'Certificado MEC – Abrir Chamado',
      category: 'Certificados',
      keywords: ['certificado MEC', 'suporte', 'dados obrigatórios'],
      content: 'Ao abrir chamado sobre emissão de certificado MEC, envie:\n\n* Nome completo do aluno\n* CPF (não CNPJ)\n* E-mail\n* Data de conclusão\n* Nome e ID do produto\n* Comprovante de pagamento\n* URL da plataforma',
      image_url: null
    },
    {
      title: 'Contatos do CS',
      category: 'Equipe / Suporte Interno',
      keywords: ['CS', 'contato direto', 'suporte'],
      content: 'Contatos úteis do time de CS:\n\n* Camila Figueiredo: +55 11 9350-29538\n* Daniel Bernardo: +55 11 9350-29361\n* Marcella Adriane: +55 11 9350-29360\n* Steffany Balhass: +55 11 9350-29359',
      image_url: null
    },
    {
      title: 'Duplicar Desafios',
      category: 'Gamificação / Suporte',
      keywords: ['duplicar desafios', 'gamificação', 'suporte'],
      content: 'A duplicação de desafios deve ser solicitada via chamado para o time.',
      image_url: null
    },
    {
      title: 'Certificados via App',
      category: 'Certificados / App',
      keywords: ['certificado', 'aplicativo', 'emissão'],
      content: 'Atualmente, não é possível emitir certificados via app.',
      image_url: null
    },
    {
      title: 'Cancelamento com Gerente de Contas',
      category: 'Cancelamento / Suporte Comercial',
      keywords: ['cancelamento', 'gerente', 'contas', 'processo'],
      content: 'Todo processo de cancelamento deve ser tratado com o gerente de contas responsável pelo cliente.',
      image_url: null
    },
    {
      title: 'API e Access Token',
      category: 'Integrações / Técnicas',
      keywords: ['API', 'access token', 'chave', 'integrações'],
      content: '* A chave API fica disponível na primeira numeração da seção de integrações.\n\n* Para o Access Token, é necessário abrir um chamado com: nome da plataforma, e-mail e senha do cliente.',
      image_url: null
    },
    {
      title: 'Configuração de Produto',
      category: 'Conteúdo / Produto',
      keywords: ['configuração', 'produto', 'turmas', 'grupos', 'acesso'],
      content: '* Preferencial: configurar acesso no nível de produto (turmas ou grupos);\n\n* Evitar configurar acesso no nível da aula.\n\n⚠️ Atenção:\n\n* Se uma aula for marcada como "demonstração", isso anula a configuração "não listado" do produto.\n\n* Configurações conflitantes entre aula e produto podem gerar erro de acesso.',
      image_url: null
    },
    {
      title: 'Embeds Disponíveis',
      category: 'Integrações / Front-end',
      keywords: ['embeds', 'integrações', 'links', 'plataforma'],
      content: 'A plataforma oferece os seguintes embeds:\n/m/embed, /m/home, /m/courses, /m/lessons,\n/m/c/:slugDoProduto, /m/certificate, /m/community, /m/d/:slugDoProduto,\n/m/gamification/ranking, /m/members, /m/notifications,\n/m/profile/, /m/restrict, /m/restrict/favorites, /m/restrict/groups,\n/m/restrict/notes, /m/restrict/subscriptions, /m/restrict/tracks',
      image_url: null
    },
    {
      title: 'Webhooks – Validações e Reprocessamento',
      category: 'Integrações / Técnicas',
      keywords: ['webhook', 'reprocessamento', 'integração', 'pagamento'],
      content: 'Quando o cliente não recebe o webhook da compra:\n\n1. Verifique com o cliente o tipo de webhook e transação (assinatura, avulsa, recorrente, inteligente);\n\n2. Solicite reprocessamento da compra na plataforma de pagamento;\n\n3. Revise a documentação de integração com o cliente;\n\n4. Solicite envio do webhook para análise.\n\n⚠️ Webhooks não são descartados, mas podem demorar se houver fila.',
      image_url: null
    },
    {
      title: 'Snippets de Atendimento',
      category: 'Atendimento / Comunicação',
      keywords: ['macros', 'mensagens prontas', 'atendimento'],
      content: 'Exemplos de mensagens úteis no atendimento:\n\n* "Bom dia, tudo bem? Meu nome é [nome] e vou te auxiliar…"\n\n* "Estamos encerrando seu atendimento, caso haja mais dúvidas…"\n\n* "Ficamos sem seu retorno. Por isso estamos encerrando seu atendimento…"',
      image_url: null
    },
    {
      title: 'Funções que precisam de N2',
      category: 'Suporte Avançado / Técnico',
      keywords: ['N2', 'suporte técnico', 'funções restritas'],
      content: 'Exemplos de funções que só o N2 pode executar:\n\n* Gerar API / Access Token\n* Migração de aulas\n* Domínio com erro\n* Disparos em lote\n* Resetar pontuações\n* Duplicar desafios\n* Esconder elementos\n* Reset de conta Curseduca Pay\n* Integração com Mautic\n(e mais de 30 outras funções)',
      image_url: null
    },
    {
      title: 'Widgets que o N2 pode remover',
      category: 'Personalização / Interface',
      keywords: ['widgets', 'remoção', 'interface', 'personalização'],
      content: 'Widgets removíveis via N2:\n\n* Widget de progresso\n* Minhas tarefas\n* Gráficos de faturamento\n* Calendário\n* Modal de avisos\n* Mural de engajados\n* Botão "Assistir aula"',
      image_url: null
    },
    {
      title: 'Customizações via CSS',
      category: 'Personalização / Técnico',
      keywords: ['CSS', 'remover botões', 'interface', 'personalização'],
      content: 'Exemplos de trechos CSS para esconder botões da plataforma:\n\nRemover botão de conteúdos:\n```css\n.nav-pills a[href="/restrita"] {\n    display: none !important;\n}\n```\n\nRemover botão de anotações:\n```css\n.nav-pills a[href="/restrita/notes"] {\n    display: none !important;\n}\n```\n\nRemover botão de turmas:\n```css\n.nav-pills a[href="/restrita/groups"] {\n    display: none !important;\n}\n```',
      image_url: null
    }
  ];

  console.log(`📝 Importando ${bizus.length} bizus...`);

  let successCount = 0;
  let errorCount = 0;

  for (const bizu of bizus) {
    try {
      const { data, error } = await supabase
        .from('bizus')
        .insert({
          title: bizu.title,
          category: bizu.category,
          keywords: bizu.keywords,
          content: bizu.content,
          image_url: bizu.image_url,
          author_id: userData.id
        });

      if (error) {
        console.error(`❌ Erro ao importar "${bizu.title}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Importado: ${bizu.title}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Erro ao importar "${bizu.title}":`, err.message);
      errorCount++;
    }
  }

  console.log('\n📊 Resumo da importação:');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📝 Total processado: ${bizus.length}`);

  if (errorCount === 0) {
    console.log('🎉 Todos os bizus foram importados com sucesso!');
  } else {
    console.log('⚠️ Alguns bizus não puderam ser importados. Verifique os erros acima.');
  }
}

importAllBizus().catch(console.error); 