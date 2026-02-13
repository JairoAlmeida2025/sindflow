-- 1. Permite que o usuário ATUALIZE seu próprio perfil (nome, foto)
-- O erro 42501 (new row violates RLS) ocorre porque só havia policy de SELECT.
create policy "Users can update own profile"
on public.profiles
for update
using ( id = auth.uid() );

-- 2. Permite INSERT caso o trigger falhe ou seja necessário criar manualmente (upsert)
create policy "Users can insert own profile"
on public.profiles
for insert
with check ( id = auth.uid() );
