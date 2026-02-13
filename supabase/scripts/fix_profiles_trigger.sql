-- 1. Cria a função que será executada pelo trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name, photo_url)
  values (new.id, 'user', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

-- 2. Cria o trigger que dispara após cada insert em auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. CORREÇÃO MANUAL: Insere o profile para o usuário admin que já existe mas não tem profile
insert into public.profiles (id, role, display_name)
select id, 'master', 'Admin Master'
from auth.users
where email = 'contato.automacoesai@gmail.com'
on conflict (id) do update set role = 'master';
