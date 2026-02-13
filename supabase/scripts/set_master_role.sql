-- 1. Substitua 'seu_email@exemplo.com' pelo e-mail do usuário que você criou no painel Authentication
-- 2. Rode este script no SQL Editor do Supabase para transformar esse usuário em MASTER

UPDATE public.profiles
SET role = 'master'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'seu_email@exemplo.com'
);

-- Confirmação: deve retornar a linha do seu usuário com role = 'master'
SELECT * FROM public.usuario WHERE email = 'seu_email@exemplo.com';
