-- =====================================================
-- CORRIGIR SINCRONIZAÇÃO ENTRE display_name E name - VERSÃO CORRIGIDA
-- =====================================================

-- 1. VERIFICAÇÃO PRÉVIA (Execute primeiro)
-- Verificar estrutura da tabela auth.users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela public.users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. BACKUP DOS DADOS ATUAIS
-- Criar tabela de backup (opcional)
CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM public.users;

-- 3. REMOÇÃO SEGURA DE TRIGGERS E FUNÇÕES
-- Remover triggers se existirem (seguro)
DROP TRIGGER IF EXISTS sync_auth_to_users ON auth.users;
DROP TRIGGER IF EXISTS sync_users_to_auth ON public.users;

-- Remover funções se existirem (seguro)
DROP FUNCTION IF EXISTS sync_user_names();
DROP FUNCTION IF EXISTS sync_users_to_auth();

-- 4. SINCRONIZAÇÃO INICIAL DOS DADOS
-- Atualizar raw_user_meta_data no Auth com dados da tabela users
UPDATE auth.users 
SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                        jsonb_build_object('name', pu.name, 'phone', pu.phone)
FROM public.users pu
WHERE auth.users.id = pu.id 
AND (auth.users.raw_user_meta_data->>'name' IS DISTINCT FROM pu.name 
     OR auth.users.raw_user_meta_data->>'phone' IS DISTINCT FROM pu.phone);

-- 5. CRIAR FUNÇÃO PARA SINCRONIZAR Auth → Users (COM PROTEÇÃO CONTRA LOOP)
CREATE OR REPLACE FUNCTION sync_user_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Proteção contra loop infinito
    IF TG_OP = 'UPDATE' AND OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data THEN
        -- Verificar se a mudança não foi causada pelo nosso próprio trigger
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'sync_users_to_auth' 
            AND tgrelid = 'public.users'::regclass
        ) THEN
            UPDATE public.users 
            SET 
                name = COALESCE(NEW.raw_user_meta_data->>'name', name),
                phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
                updated_at = NOW()
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CRIAR FUNÇÃO PARA SINCRONIZAR Users → Auth (COM PROTEÇÃO CONTRA LOOP)
CREATE OR REPLACE FUNCTION sync_users_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Proteção contra loop infinito
    IF TG_OP = 'UPDATE' AND (OLD.name IS DISTINCT FROM NEW.name OR OLD.phone IS DISTINCT FROM NEW.phone) THEN
        -- Verificar se a mudança não foi causada pelo nosso próprio trigger
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'sync_auth_to_users' 
            AND tgrelid = 'auth.users'::regclass
        ) THEN
            UPDATE auth.users 
            SET 
                raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                    jsonb_build_object(
                                        'name', NEW.name,
                                        'phone', NEW.phone
                                    )
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CRIAR TRIGGERS COM ORDEM DE EXECUÇÃO
-- Trigger para sincronizar Auth → Users (executa primeiro)
CREATE TRIGGER sync_auth_to_users
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_names();

-- Trigger para sincronizar Users → Auth (executa depois)
CREATE TRIGGER sync_users_to_auth
    AFTER UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_users_to_auth();

-- 8. VERIFICAÇÃO PÓS-EXECUÇÃO
-- Verificar se os triggers foram criados
SELECT 
    'TRIGGERS CRIADOS' as status,
    trigger_name,
    event_manipulation,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_name IN ('sync_auth_to_users', 'sync_users_to_auth')
ORDER BY trigger_name;

-- Verificar se as funções foram criadas
SELECT 
    'FUNÇÕES CRIADAS' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('sync_user_names', 'sync_users_to_auth')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 9. TESTE DE SINCRONIZAÇÃO (OPCIONAL)
-- Descomente para testar:
/*
-- Teste 1: Atualizar name na tabela users
UPDATE public.users SET name = 'Tektus Teste' WHERE email = 'agenciatektus@gmail.com';

-- Teste 2: Verificar se raw_user_meta_data foi atualizado no Auth
SELECT 
    au.email,
    au.raw_user_meta_data->>'name' as auth_name,
    pu.name as public_name
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'agenciatektus@gmail.com';

-- Teste 3: Reverter o teste
UPDATE public.users SET name = 'Tektus' WHERE email = 'agenciatektus@gmail.com';
*/

-- 10. VERIFICAÇÃO FINAL
SELECT 
    'RESULTADO FINAL' as status,
    au.id,
    au.email,
    au.raw_user_meta_data->>'name' as auth_name,
    pu.name as public_name,
    CASE 
        WHEN au.raw_user_meta_data->>'name' = pu.name THEN '✅ Sincronizado'
        ELSE '❌ Dessincronizado'
    END as status_sync
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id
ORDER BY au.email;

-- 11. LIMPEZA (OPCIONAL)
-- Remover tabela de backup se não precisar mais
-- DROP TABLE IF EXISTS users_backup; 