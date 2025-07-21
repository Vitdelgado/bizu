const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = 'vitoria.mdelgado96@gmail.com';

async function main() {
  // Buscar o usuário pelo email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', TARGET_EMAIL)
    .single();

  if (userError || !user) {
    console.error('❌ Usuário não encontrado:', userError?.message || 'Email não existe');
    process.exit(1);
  }

  console.log(`✅ Usuário encontrado: ${user.email} (id: ${user.id})`);

  // Atualizar todos os bizus para esse author_id
  const { error: updateError, count } = await supabase
    .from('bizus')
    .update({ author_id: user.id })
    .neq('author_id', user.id)
    .select('id');

  if (updateError) {
    console.error('❌ Erro ao atualizar bizus:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Todos os bizus agora pertencem ao usuário:', user.email);
}

main(); 