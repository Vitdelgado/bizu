import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configurações do Supabase não encontradas!');
  console.error('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltando');
  console.error('Anon Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltando');
  console.error('');
  console.error('📝 Para configurar:');
  console.error('1. Crie um arquivo .env.local na raiz do projeto');
  console.error('2. Adicione as seguintes variáveis:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima');
  console.error('');
  console.error('🔗 Obtenha essas informações em: https://supabase.com > Seu Projeto > Settings > API');
  
  // Em desenvolvimento, não vamos quebrar a aplicação, apenas mostrar o erro
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Aplicação continuará funcionando, mas sem conexão com o Supabase');
  } else {
    throw new Error('Configurações do Supabase não encontradas. Verifique as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verificar se a conexão está funcionando
if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase configurado com sucesso');
  console.log('🔗 URL:', supabaseUrl);
} 