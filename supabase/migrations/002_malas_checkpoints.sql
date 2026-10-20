-- Migração: liga malas/checkpoints aos donos + RLS por cargo
-- Rode no SQL Editor do Supabase.

-- 1. Coluna de nome no perfil (o cadastro do app envia 'nome')
alter table usuarios_perfis add column if not exists nome text;

-- 2. Dono da mala (sem isso o cliente não tem como ver "minhas malas")
alter table malas add column if not exists id_usuario uuid references auth.users(id);

-- 3. Ajudante: true se é funcionario ou admin
create or replace function is_staff() returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from usuarios_perfis
    where id_usuario = auth.uid() and cargo in ('admin', 'funcionario')
  );
$$;

-- 4. RLS da tabela malas
alter table malas enable row level security;

drop policy if exists "malas_select" on malas;
create policy "malas_select" on malas
  for select to authenticated
  using (id_usuario = auth.uid() or is_staff());

drop policy if exists "malas_insert_admin" on malas;
create policy "malas_insert_admin" on malas
  for insert to authenticated
  with check (is_admin());

drop policy if exists "malas_update_staff" on malas;
create policy "malas_update_staff" on malas
  for update to authenticated
  using (is_staff())
  with check (is_staff());

-- 5. RLS do histórico de checkpoints
alter table historico_checkpoints enable row level security;

drop policy if exists "leituras_select" on historico_checkpoints;
create policy "leituras_select" on historico_checkpoints
  for select to authenticated
  using (
    is_staff()
    or exists (
      select 1 from malas m
      where m.id_mala = historico_checkpoints.id_mala
        and m.id_usuario = auth.uid()
    )
  );

drop policy if exists "leituras_insert_staff" on historico_checkpoints;
create policy "leituras_insert_staff" on historico_checkpoints
  for insert to authenticated
  with check (is_staff());
