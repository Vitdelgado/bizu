const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Substitua pelos seus dados do Supabase
const SUPABASE_URL = 'https://fvaanxmajvmrirmukpqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YWFueG1hanZtcmlybXVrcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MTM0NTAsImV4cCI6MjA2ODM4OTQ1MH0.NQ30I25KA8PQ5bqVPrH3cbXHQJkFPncfboBmobhjQ3o';
const AUTHOR_ID = '66221929-1452-42c4-b74a-9028ed4fb7a8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseBizus(text) {
  const blocks = text.split('________________').map(b => b.trim()).filter(Boolean);
  return blocks.map(block => {
    const titleMatch = block.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].replace(/^`|`$/g, '').trim() : '';
    const categoryMatch = block.match(/\* Categoria:([^\n]+)/i);
    const category = categoryMatch ? categoryMatch[1].trim() : '';
    const keywordsMatch = block.match(/\* Palavras-chave:([^\n]+)/i);
    const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()).filter(Boolean) : [];
    const contentMatch = block.match(/\* Conteúdo:\s*([\s\S]*?)(\* URL da imagem\/vídeo:|$)/i);
    const content = contentMatch ? contentMatch[1].replace(/\n+/g, ' ').trim() : '';
    const imageUrlMatch = block.match(/\* URL da imagem\/vídeo:\s*([^\n]*)/i);
    const image_url = imageUrlMatch && imageUrlMatch[1] && imageUrlMatch[1].trim() !== '(Não aplicável)' ? imageUrlMatch[1].trim() : null;
    return {
      title,
      category,
      keywords,
      content,
      image_url,
      author_id: AUTHOR_ID,
      views: 0
    };
  });
}

async function main() {
  const txt = fs.readFileSync('lista-de-bizus.txt', 'utf8');
  const bizus = parseBizus(txt);

  for (const bizu of bizus) {
    const { error } = await supabase.from('bizus').insert([bizu]);
    if (error) {
      console.error('Erro ao inserir:', bizu.title, error.message);
    } else {
      console.log('Bizu inserido:', bizu.title);
    }
  }
}

main();