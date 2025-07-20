-- =====================================================
-- CORRIGIR SINCRONIZAÇÃO ENTRE display_name E name
-- =====================================================

-- 1. Verificar dados atuais
SELECT 
    'auth.users' as tabela,
    id,
    email,
    display_name,
    raw_user_meta_data->>'name' as auth_name
FROM auth.users
UNION ALL
SELECT 
    'public.users' as tabela,
    id,
    email,
    NULL as display_name,
    name as auth_name
FROM public.users
ORDER BY email, tabela;

-- 2. Atualizar display_name no Auth com dados da tabela users
UPDATE auth.users 
SET 
    display_name = pu.name,
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                        jsonb_build_object('name', pu.name, 'phone', pu.phone)
FROM public.users pu
WHERE auth.users.id = pu.id 
AND auth.users.display_name IS DISTINCT FROM pu.name;

-- 3. Verificar se a atualização funcionou
SELECT 
    'APÓS ATUALIZAÇÃO' as status,
    id,
    email,
    display_name,
    raw_user_meta_data->>'name' as auth_name
FROM auth.users
ORDER BY email;

-- 4. Criar função para sincronizar automaticamente
CREATE OR REPLACE FUNCTION sync_user_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Se display_name mudou no Auth, atualizar name na tabela users
    IF TG_OP = 'UPDATE' AND OLD.display_name IS DISTINCT FROM NEW.display_name THEN
        UPDATE public.users 
        SET name = NEW.display_name, updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    -- Se raw_user_meta_data mudou, extrair name e atualizar
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

-- 5. Criar trigger para sincronizar Auth → Users
DROP TRIGGER IF EXISTS sync_auth_to_users ON auth.users;
CREATE TRIGGER sync_auth_to_users
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_names();

-- 6. Criar função para sincronizar Users → Auth
CREATE OR REPLACE FUNCTION sync_users_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Se name mudou na tabela users, atualizar display_name no Auth
    IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
        UPDATE auth.users 
        SET 
            display_name = NEW.name,
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                jsonb_build_object('name', NEW.name)
        WHERE id = NEW.id;
    END IF;
    
    -- Se phone mudou, atualizar raw_user_meta_data
    IF TG_OP = 'UPDATE' AND OLD.phone IS DISTINCT FROM NEW.phone THEN
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                jsonb_build_object('phone', NEW.phone)
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para sincronizar Users → Auth
DROP TRIGGER IF EXISTS sync_users_to_auth ON public.users;
CREATE TRIGGER sync_users_to_auth
    AFTER UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_users_to_auth();

-- 8. Verificar triggers criados
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('sync_auth_to_users', 'sync_users_to_auth')
ORDER BY trigger_name;

-- 9. Testar sincronização (opcional)
-- UPDATE public.users SET name = 'Tektus Atualizado' WHERE email = 'agenciatektus@gmail.com';

-- 10. Verificar resultado final
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

-- 11. Política de prioridade
COMMENT ON FUNCTION sync_user_names() IS 
'Função para sincronizar display_name do Auth com name da tabela users.
Prioridade: Auth.display_name tem precedência sobre users.name';

COMMENT ON FUNCTION sync_users_to_auth() IS 
'Função para sincronizar name da tabela users com display_name do Auth.
Prioridade: users.name tem precedência sobre Auth.display_name'; 