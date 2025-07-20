-- =====================================================
-- CORRIGIR SINCRONIZAÇÃO ENTRE display_name E name - VERSÃO SEGURA
-- =====================================================

-- 1. VERIFICAÇÃO PRÉVIA (Execute primeiro)
-- Verificar triggers existentes na tabela auth.users
SELECT 
    'auth.users' as tabela,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'
ORDER BY trigger_name;

-- Verificar triggers existentes na tabela public.users
SELECT 
    'public.users' as tabela,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'public'
ORDER BY trigger_name;

-- Verificar funções existentes
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'sync_user_names', 'sync_users_to_auth')
AND routine_schema = 'public'
ORDER BY routine_name;

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
-- Atualizar display_name no Auth com dados da tabela users
UPDATE auth.users 
SET 
    display_name = pu.name,
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                        jsonb_build_object('name', pu.name, 'phone', pu.phone)
FROM public.users pu
WHERE auth.users.id = pu.id 
AND auth.users.display_name IS DISTINCT FROM pu.name;

-- 5. CRIAR FUNÇÃO PARA SINCRONIZAR Auth → Users (COM PROTEÇÃO CONTRA LOOP)
CREATE OR REPLACE FUNCTION sync_user_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Proteção contra loop infinito
    IF TG_OP = 'UPDATE' AND OLD.display_name IS DISTINCT FROM NEW.display_name THEN
        -- Verificar se a mudança não foi causada pelo nosso próprio trigger
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'sync_users_to_auth' 
            AND tgrelid = 'public.users'::regclass
        ) OR NOT EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = NEW.id AND name = NEW.display_name
        ) THEN
            UPDATE public.users 
            SET name = NEW.display_name, updated_at = NOW()
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    -- Sincronizar raw_user_meta_data
    IF TG_OP = 'UPDATE' AND OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data THEN
        UPDATE public.users 
        SET 
            name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.display_name),
            phone = NEW.raw_user_meta_data->>'phone',
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CRIAR FUNÇÃO PARA SINCRONIZAR Users → Auth (COM PROTEÇÃO CONTRA LOOP)
CREATE OR REPLACE FUNCTION sync_users_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Proteção contra loop infinito
    IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
        -- Verificar se a mudança não foi causada pelo nosso próprio trigger
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'sync_auth_to_users' 
            AND tgrelid = 'auth.users'::regclass
        ) OR NOT EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = NEW.id AND display_name = NEW.name
        ) THEN
            UPDATE auth.users 
            SET 
                display_name = NEW.name,
                raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                    jsonb_build_object('name', NEW.name)
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    -- Sincronizar telefone
    IF TG_OP = 'UPDATE' AND OLD.phone IS DISTINCT FROM NEW.phone THEN
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                jsonb_build_object('phone', NEW.phone)
        WHERE id = NEW.id;
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

-- Teste 2: Verificar se display_name foi atualizado no Auth
SELECT 
    au.email,
    au.display_name as auth_display_name,
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
    au.display_name as auth_display_name,
    pu.name as public_name,
    CASE 
        WHEN au.display_name = pu.name THEN '✅ Sincronizado'
        ELSE '❌ Dessincronizado'
    END as status_sync
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id
ORDER BY au.email;

-- 11. LIMPEZA (OPCIONAL)
-- Remover tabela de backup se não precisar mais
-- DROP TABLE IF EXISTS users_backup; 