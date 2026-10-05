-- Migração: valida cargos como text + RLS base para usuarios_perfis
-- Rode no SQL Editor do Supabase. Ajuste os nomes se diferirem do código.

-- 1. Garante só os 3 valores (cargo continua text)
alter table usuarios_perfis drop constraint if exists usuarios_perfis_cargo_check;
alter table usuarios_perfis
  add constraint usuarios_perfis_cargo_check
  check (cargo in ('admin', 'funcionario', 'cliente'));

-- 2. Colunas de dados do cadastro (idempotente)
alter table usuarios_perfis add column if not exists nome text;
alter table usuarios_perfis add column if not exists telefone text;

-- 3. RLS: cada um lê o próprio perfil; admin lê todos
alter table usuarios_perfis enable row level security;

create or replace function is_admin() returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from usuarios_perfis
    where id_usuario = auth.uid() and cargo = 'admin'
  );
$$;

drop policy if exists "perfis_select_own" on usuarios_perfis;
create policy "perfis_select_own" on usuarios_perfis
  for select to authenticated
  using (id_usuario = auth.uid() or is_admin());

-- Cadastro: cada usuário cria só a própria linha
drop policy if exists "perfis_insert_own" on usuarios_perfis;
create policy "perfis_insert_own" on usuarios_perfis
  for insert to authenticated
  with check (id_usuario = auth.uid());

-- 4. TODO: políticas nas tabelas de dados (ex: malas/clientes).
-- Modelo sugerido: dono lê/escreve o próprio registro, admin tudo.
-- Exemplo (troque SUA_TABELA e SUA_COLUNA_DE_DONO):
-- alter table SUA_TABELA enable row level security;
-- drop policy if exists "dados_owner" on SUA_TABELA;
-- create policy "dados_owner" on SUA_TABELA
--   for all to authenticated
--   using (SUA_COLUNA_DE_DONO = auth.uid() or is_admin())
--   with check (SUA_COLUNA_DE_DONO = auth.uid() or is_admin());
