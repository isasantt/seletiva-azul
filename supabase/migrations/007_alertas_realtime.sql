-- Realtime: permite que o hook useSupabaseRealtime receba INSERTs de alertas.
-- Sem isso, o Toast global não dispara em Admin/SAC/Handling.
-- Rode no SQL Editor do Supabase.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'alertas'
  ) then
    alter publication supabase_realtime add table public.alertas;
  end if;
end $$;

-- Para INSERT não é obrigatório, mas ajuda em updates/resoluções no painel.
alter table public.alertas replica identity full;

-- Realtime respeita RLS. No schema v2 já existe `alertas_select` com
-- is_staff() + dono da mala, então esta política é apenas um fallback para
-- bancos sem o v2. Políticas são OR; ela não restringe as existentes. O filtro
-- de quem vê o Toast (admin/SAC/Handling) fica no hook useSupabaseRealtime.
drop policy if exists "alertas_select_operacional" on public.alertas;
create policy "alertas_select_operacional" on public.alertas
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1
      from public.usuarios_perfis p
      where p.id_usuario = auth.uid()
        and lower(coalesce(p.area, '')) in ('sac', 'handling')
    )
  );

-- Conferir:
-- select * from pg_publication_tables
-- where pubname = 'supabase_realtime' and tablename = 'alertas';
