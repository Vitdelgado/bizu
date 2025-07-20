-- =====================================================
-- SINCRONIZAÇÃO COMPATÍVEL - SEM CONFLITOS
-- =====================================================

-- 1. VERIFICAÇÃO PRÉVIA
-- Verificar triggers existentes
SELECT 
    'TRIGGERS EXISTENTES' as status,
    trigger_name,
    event_manipulation,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_schema IN ('auth', 'public')
AND trigger_name IN ('on_auth_user_created', 'sync_auth_to_users', 'sync_users_to_auth')
ORDER BY trigger_name;

-- 2. BACKUP DOS DADOS ATUAIS
CREATE TABLE IF NOT EXISTS users_backup_sync AS 
SELECT * FROM public.users;

-- 3. SINCRONIZAÇÃO INICIAL DOS DADOS (SEM CONFLITAR)
-- Atualizar raw_user_meta_data no Auth com dados da tabela users
UPDATE auth.users 
SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                        jsonb_build_object('name', pu.name, 'phone', pu.phone)
FROM public.users pu
WHERE auth.users.id = pu.id 
AND (auth.users.raw_user_meta_data->>'name' IS DISTINCT FROM pu.name 
     OR auth.users.raw_user_meta_data->>'phone' IS DISTINCT FROM pu.phone);

-- 4. MODIFICAR FUNÇÃO EXISTENTE handle_new_user (COMPATÍVEL)
-- Adicionar sincronização de nome/telefone na função existente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na tabela users (comportamento original)
  INSERT INTO public.users (id, email, name, phone, role, created_at)
  VALUES (NEW.id, NEW.email, NULL, NULL, 'suporte', NOW());
  
  -- Sincronizar raw_user_meta_data se existir
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    UPDATE public.users 
    SET 
        name = COALESCE(NEW.raw_user_meta_data->>'name', name),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CRIAR FUNÇÃO PARA SINCRONIZAR Users → Auth (NOVA)
CREATE OR REPLACE FUNCTION sync_users_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Só executar se name ou phone mudaram
    IF TG_OP = 'UPDATE' AND (OLD.name IS DISTINCT FROM NEW.name OR OLD.phone IS DISTINCT FROM NEW.phone) THEN
        -- Atualizar raw_user_meta_data no Auth
        UPDATE auth.users 
        SET 
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                jsonb_build_object(
                                    'name', NEW.name,
                                    'phone', NEW.phone
                                )
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CRIAR TRIGGER PARA Users → Auth (NOVO)
-- Este trigger é seguro pois não interfere com o trigger existente
CREATE TRIGGER sync_users_to_auth_metadata_trigger
    AFTER UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_users_to_auth_metadata();

-- 7. VERIFICAÇÃO PÓS-EXECUÇÃO
-- Verificar se os triggers foram criados/modificados
SELECT 
    'TRIGGERS FINAIS' as status,
    trigger_name,
    event_manipulation,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_schema IN ('auth', 'public')
AND trigger_name IN ('on_auth_user_created', 'sync_users_to_auth_metadata_trigger')
ORDER BY trigger_name;

-- Verificar se as funções foram criadas/modificadas
SELECT 
    'FUNÇÕES FINAIS' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'sync_users_to_auth_metadata')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 8. TESTE DE SINCRONIZAÇÃO (OPCIONAL)
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

-- 9. VERIFICAÇÃO FINAL
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

-- 10. LIMPEZA (OPCIONAL)
-- Remover tabela de backup se não precisar mais
-- DROP TABLE IF EXISTS users_backup_sync; 