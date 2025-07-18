-- Após criar o usuário 'Tektus' no Supabase Auth, rode este comando para promovê-lo a admin:

UPDATE users SET role = 'admin', name = 'Tektus', phone = '+5521977357727' WHERE email = 'agenciatektus@gmail.com'; 