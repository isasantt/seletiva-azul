-- Migração: funcionário pode cadastrar a mala na hora do scan
-- (o dono fica vazio e o admin vincula depois). Rode no SQL Editor.

drop policy if exists "malas_insert_staff" on malas;
create policy "malas_insert_staff" on malas
  for insert to authenticated
  with check (is_staff());
