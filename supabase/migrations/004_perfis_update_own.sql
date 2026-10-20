-- Migração: permite atualizar o próprio perfil (necessário pro upsert do cadastro).
-- Rode no SQL Editor.

drop policy if exists "perfis_update_own" on usuarios_perfis;
create policy "perfis_update_own" on usuarios_perfis
  for update to authenticated
  using (id_usuario = auth.uid())
  with check (id_usuario = auth.uid());
