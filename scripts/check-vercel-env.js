// Script para verificar variáveis de ambiente do Vercel
console.log('🔍 Verificando variáveis de ambiente...\n');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('📋 Variáveis necessárias:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NÃO CONFIGURADA`);
  }
});

console.log('\n🔧 Para configurar no Vercel:');
console.log('1. Acesse o dashboard do Vercel');
console.log('2. Vá para seu projeto > Settings > Environment Variables');
console.log('3. Adicione as variáveis:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('4. Faça um novo deploy');

console.log('\n📝 Para verificar localmente:');
console.log('1. Crie um arquivo .env.local na raiz do projeto');
console.log('2. Adicione as variáveis do Supabase');
console.log('3. Execute: npm run dev');

// Verificar se está no Vercel
if (process.env.VERCEL) {
  console.log('\n🚀 Detectado ambiente Vercel');
  console.log('Environment:', process.env.VERCEL_ENV || 'production');
} else {
  console.log('\n💻 Ambiente local detectado');
} 