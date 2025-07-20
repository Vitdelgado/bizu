-- =====================================================
-- 00 - LIMPEZA DE CONFLITOS (EXECUTAR PRIMEIRO)
-- =====================================================

-- REMOVER TRIGGERS CONFLITANTES
DROP TRIGGER IF EXISTS sync_auth_to_users ON auth.users;
DROP TRIGGER IF EXISTS sync_users_to_auth ON public.users;
DROP TRIGGER IF EXISTS sync_users_to_auth_metadata_trigger ON public.users;

-- REMOVER FUNÇÕES CONFLITANTES
DROP FUNCTION IF EXISTS sync_user_names();
DROP FUNCTION IF EXISTS sync_users_to_auth();
DROP FUNCTION IF EXISTS sync_users_to_auth_metadata();

-- REMOVER POLÍTICAS RLS DUPLICADAS
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON bizu_likes;

-- VERIFICAR LIMPEZA
SELECT 
    'TRIGGERS RESTANTES' as status,
    trigger_name,
    event_manipulation,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_schema IN ('auth', 'public')
AND trigger_name IN (
    'on_auth_user_created',
    'trigger_update_bizu_likes_count'
)
ORDER BY trigger_name;

SELECT 
    'FUNÇÕES RESTANTES' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'handle_new_user',
    'update_bizu_likes_count',
    'has_user_liked_bizu',
    'get_top_bizus_by_likes',
    'promote_demote_user',
    'log_bizu_edit'
)
ORDER BY routine_name; 