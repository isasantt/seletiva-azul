-- Fallback seguro para o item 8: o app envia apenas
-- id_mala, id_voo e evento_iata.
-- Se o banco já tiver outro trigger de preenchimento, este só completa
-- os campos que chegarem nulos (não sobrescreve valores existentes).
--
-- Observação: no projeto atual a coluna local é NOT NULL. Por isso, além do
-- trigger, criamos um default para que o INSERT mínimo do app nunca falhe.
alter table public.historico_checkpoints
  alter column local set default 'Registro via aplicativo';
create or replace function public.preencher_historico_checkpoint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.hora is null then
    new.hora := now();
  end if;

  if new.id_funcionario is null then
    -- O cast dinâmico aceita tanto uuid quanto text, dependendo do schema.
    execute format('select $1::%s', pg_typeof(new.id_funcionario))
      into new.id_funcionario
      using auth.uid()::text;
  end if;

  -- O app envia apenas evento/local do fluxo IATA. Este fallback evita
  -- falha caso a coluna local seja NOT NULL em algum ambiente.
  if new.local is null then
    new.local := 'Registro via aplicativo';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_preencher_historico_checkpoint on public.historico_checkpoints;
create trigger trg_preencher_historico_checkpoint
  before insert on public.historico_checkpoints
  for each row
  execute function public.preencher_historico_checkpoint();
