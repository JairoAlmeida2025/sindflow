-- 1. Remove as policies antigas para evitar erro de duplicidade
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- 2. Recria a policy de UPDATE
create policy "Users can update own profile"
on public.profiles
for update
using ( id = auth.uid() );

-- 3. Recria a policy de INSERT
create policy "Users can insert own profile"
on public.profiles
for insert
with check ( id = auth.uid() );
