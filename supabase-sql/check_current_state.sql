-- =====================================================
-- VERIFICAÇÃO DO ESTADO ATUAL DO SUPABASE
-- =====================================================

-- 1. VERIFICAR TABELAS EXISTENTES
SELECT 
    'TABELAS EXISTENTES' as status,
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('users', 'bizus', 'bizu_likes', 'bizu_edits', 'audit_logs', 'error_logs')
ORDER BY table_name;

-- 2. VERIFICAR ESTRUTURA DA TABELA USERS
SELECT 
    'ESTRUTURA USERS' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA BIZUS
SELECT 
    'ESTRUTURA BIZUS' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bizus' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR TRIGGERS EXISTENTES
SELECT 
    'TRIGGERS EXISTENTES' as status,
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_schema IN ('auth', 'public')
AND trigger_name IN (
    'on_auth_user_created',
    'sync_users_to_auth_metadata_trigger',
    'trigger_update_bizu_likes_count',
    'trigger_update_bizu_views_count'
)
ORDER BY trigger_name;

-- 5. VERIFICAR FUNÇÕES EXISTENTES
SELECT 
    'FUNÇÕES EXISTENTES' as status,
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'handle_new_user',
    'sync_users_to_auth_metadata',
    'update_bizu_likes_count',
    'update_bizu_views_count',
    'promote_demote_user',
    'log_bizu_edit',
    'has_user_liked_bizu',
    'get_top_bizus_by_likes'
)
ORDER BY routine_name;

-- 6. VERIFICAR RLS (Row Level Security)
SELECT 
    'RLS STATUS' as status,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'bizus', 'bizu_likes', 'bizu_edits', 'audit_logs', 'error_logs')
ORDER BY tablename;

-- 7. VERIFICAR POLÍTICAS RLS
SELECT 
    'POLÍTICAS RLS' as status,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'bizus', 'bizu_likes', 'bizu_edits', 'audit_logs', 'error_logs')
ORDER BY tablename, policyname;

-- 8. VERIFICAR DADOS DE USUÁRIOS
SELECT 
    'DADOS USUÁRIOS' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'suporte' THEN 1 END) as suporte,
    COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as sem_nome
FROM public.users;

-- 9. VERIFICAR DADOS DE BIZUS
SELECT 
    'DADOS BIZUS' as status,
    COUNT(*) as total_bizus,
    COUNT(CASE WHEN likes > 0 THEN 1 END) as com_likes,
    COUNT(CASE WHEN views > 0 THEN 1 END) as com_views,
    COUNT(DISTINCT category) as categorias_unicas
FROM public.bizus;

-- 10. VERIFICAR SINCRONIZAÇÃO AUTH ↔ USERS
SELECT 
    'SINCRONIZAÇÃO AUTH ↔ USERS' as status,
    au.email,
    au.raw_user_meta_data->>'name' as auth_name,
    pu.name as public_name,
    CASE 
        WHEN au.raw_user_meta_data->>'name' = pu.name THEN '✅ Sincronizado'
        WHEN au.raw_user_meta_data->>'name' IS NULL AND pu.name IS NULL THEN '✅ Ambos vazios'
        WHEN au.raw_user_meta_data->>'name' IS NULL AND pu.name IS NOT NULL THEN '❌ Auth vazio'
        WHEN au.raw_user_meta_data->>'name' IS NOT NULL AND pu.name IS NULL THEN '❌ Public vazio'
        ELSE '❌ Diferentes'
    END as status_sync
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id
ORDER BY au.email;

-- 11. VERIFICAR PROBLEMAS CONHECIDOS
SELECT 
    'PROBLEMAS IDENTIFICADOS' as status,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
        THEN '❌ Trigger on_auth_user_created não existe'
        ELSE '✅ Trigger on_auth_user_created existe'
    END as trigger_auth,
    
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') 
        THEN '❌ Função handle_new_user não existe'
        ELSE '✅ Função handle_new_user existe'
    END as function_handle_new_user,
    
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bizu_likes' AND rowsecurity = true) 
        THEN '❌ RLS não habilitado em bizu_likes'
        ELSE '✅ RLS habilitado em bizu_likes'
    END as rls_bizu_likes,
    
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bizu_likes') 
        THEN '❌ Políticas RLS não configuradas em bizu_likes'
        ELSE '✅ Políticas RLS configuradas em bizu_likes'
    END as policies_bizu_likes;

-- 12. VERIFICAR ÍNDICES
SELECT 
    'ÍNDICES EXISTENTES' as status,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'bizus', 'bizu_likes', 'bizu_edits', 'audit_logs', 'error_logs')
ORDER BY tablename, indexname;

-- 13. VERIFICAR CONSTRAINTS
SELECT 
    'CONSTRAINTS EXISTENTES' as status,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('users', 'bizus', 'bizu_likes', 'bizu_edits', 'audit_logs', 'error_logs')
ORDER BY tc.table_name, tc.constraint_type;

-- 14. VERIFICAR TYPES/ENUMS
SELECT 
    'TYPES/ENUMS' as status,
    t.typname as type_name,
    e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'role_type'
ORDER BY e.enumsortorder; 