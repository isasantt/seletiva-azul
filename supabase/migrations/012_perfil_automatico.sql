-- Cria automaticamente o perfil de passageiro quando uma conta é criada pelo
-- app. O cadastro envia user_metadata.cargo = 'cliente'.
--
-- Contas de staff criadas pelo Dashboard/Auth (sem esse metadata) não são
-- afetadas; o admin continua cadastrando o perfil com cargo/area corretos.
--
-- Rode no SQL Editor do Supabase.

create or replace function public.criar_perfil_passageiro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'cargo', '') = 'cliente' then
    insert into public.usuarios_perfis (id_usuario, nome, cargo)
    values (
      new.id,
      coalesce(
        nullif(trim(new.raw_user_meta_data->>'nome'), ''),
        split_part(coalesce(new.email, 'passageiro'), '@', 1)
      ),
      'cliente'
    )
    on conflict (id_usuario) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_perfil on auth.users;

create trigger on_auth_user_created_perfil
after insert on auth.users
for each row execute function public.criar_perfil_passageiro();

-- Para contas que já existem no Auth e não têm perfil, o app cria o perfil
-- automaticamente no primeiro login. Se preferir corrigir agora pelo SQL:
--
-- insert into public.usuarios_perfis (id_usuario, nome, cargo)
-- select
--   u.id,
--   coalesce(
--     nullif(trim(u.raw_user_meta_data->>'nome'), ''),
--     split_part(coalesce(u.email, 'passageiro'), '@', 1)
--   ),
--   'cliente'
-- from auth.users u
-- where not exists (
--   select 1 from public.usuarios_perfis p where p.id_usuario = u.id
-- )
-- on conflict (id_usuario) do nothing;
