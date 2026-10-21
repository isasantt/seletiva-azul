-- Garante que o cliente veja apenas as próprias malas e os checkpoints delas.
-- Idempotente: pode rodar de novo mesmo se a 002 já foi aplicada.

alter table public.malas enable row level security;

drop policy if exists "malas_select" on public.malas;
create policy "malas_select" on public.malas
  for select to authenticated
  using (id_usuario = auth.uid() or public.is_staff());

alter table public.historico_checkpoints enable row level security;

drop policy if exists "leituras_select" on public.historico_checkpoints;
create policy "leituras_select" on public.historico_checkpoints
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1
      from public.malas m
      where m.id_mala = historico_checkpoints.id_mala
        and m.id_usuario = auth.uid()
    )
  );

-- Conferir logado como cliente: deve listar só as malas com id_usuario = auth.uid().
-- select id_mala, id_usuario from public.malas;
