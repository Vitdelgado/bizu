-- =====================================================
-- 05 - CONFIGURAÇÃO DE ADMIN (QUINTO A EXECUTAR)
-- =====================================================

-- Promover usuário Tektus a admin
UPDATE users 
SET role = 'admin', name = 'Tektus', phone = '+5521977357727' 
WHERE email = 'agenciatektus@gmail.com';

-- Verificar configuração de admin
SELECT 
    'ADMIN CONFIGURADO' as status,
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE role = 'admin'
ORDER BY created_at; 