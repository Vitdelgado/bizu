-- =====================================================
-- VERIFICAR E CORRIGIR SINCRONIZAÇÃO ENTRE TABELAS DE USUÁRIOS
-- =====================================================

-- 1. Verificar usuários no Auth
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
        ELSE '❌ Não confirmado'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- 2. Verificar usuários na tabela public.users
SELECT 
    id,
    email,
    name,
    role,
    created_at,
    CASE 
        WHEN role = 'admin' THEN '👑 Admin'
        WHEN role = 'suporte' THEN '🛠️ Suporte'
        ELSE '❓ Desconhecido'
    END as tipo
FROM public.users
ORDER BY created_at DESC;

-- 3. Verificar sincronização
SELECT 
    'auth.users' as tabela,
    COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
    'public.users' as tabela,
    COUNT(*) as total
FROM public.users;

-- 4. Verificar usuários que estão apenas no Auth
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 5. Verificar usuários que estão apenas na tabela users
SELECT 
    pu.id,
    pu.email,
    pu.name,
    pu.role,
    pu.created_at
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- 6. Verificar trigger de sincronização
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'
ORDER BY trigger_name;

-- 7. Verificar função handle_new_user
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- 8. Criar trigger se não existir (opcional)
-- Descomente se o trigger não existir:

/*
-- Função para criar perfil na tabela users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role, created_at)
  VALUES (NEW.id, NEW.email, NULL, NULL, 'suporte', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para rodar a função após inserir em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

-- 9. Verificar RLS da tabela users
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ Ativo'
        ELSE '❌ Inativo'
    END as status_rls
FROM pg_tables 
WHERE tablename = 'users'
AND schemaname = 'public';

-- 10. Verificar políticas RLS da tabela users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
AND schemaname = 'public'
ORDER BY policyname;

-- 11. Resumo final
SELECT 
    'RESUMO' as tipo,
    'Usuários no Auth: ' || (SELECT COUNT(*) FROM auth.users) as info
UNION ALL
SELECT 
    'RESUMO' as tipo,
    'Usuários na tabela users: ' || (SELECT COUNT(*) FROM public.users) as info
UNION ALL
SELECT 
    'RESUMO' as tipo,
    'Sincronizados: ' || (
        SELECT COUNT(*) 
        FROM auth.users au 
        INNER JOIN public.users pu ON au.id = pu.id
    ) as info; 