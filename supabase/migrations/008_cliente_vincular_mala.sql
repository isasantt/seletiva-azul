-- Permite que o passageiro autenticado vincule a si uma mala ainda sem dono,
-- usando a etiqueta IATA de 10 dígitos.
--
-- A política é intencionalmente restrita:
--   * só enxerga/atualiza linhas com id_usuario IS NULL;
--   * o novo valor de id_usuario precisa ser o próprio auth.uid().
-- O app faz:
--   update malas set id_usuario = auth.uid()
--   where tag_iata = '<10 dígitos>' and id_usuario is null;

alter table public.malas enable row level security;

drop policy if exists "malas_update_cliente_vincula" on public.malas;
create policy "malas_update_cliente_vincula" on public.malas
  for update to authenticated
  using (id_usuario is null)
  with check (id_usuario = auth.uid());

-- Conferir logado como cliente:
-- update public.malas
-- set id_usuario = auth.uid()
-- where tag_iata = '9900000001' and id_usuario is null
-- returning id_mala, id_usuario;
