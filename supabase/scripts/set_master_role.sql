-- 1. Rode este script no SQL Editor do Supabase para transformar o usuário admin em MASTER

UPDATE public.profiles
SET role = 'master'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'contato.automacoesai@gmail.com'
);

-- Confirmação
SELECT * FROM public.usuario WHERE email = 'contato.automacoesai@gmail.com';
