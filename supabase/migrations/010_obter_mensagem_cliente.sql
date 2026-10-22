-- Reaplica a RPC usada pelo BannerAlertaCliente (item 7) e pelo componente
-- MensagemCliente. O arquivo 005 já contém a mesma função; este é idempotente.
--
-- Compatível com:
--   * `mensagens_cliente(chave, mensagem)` — schema atual;
--   * `status_mensagens.mensagem_cliente` — schema v2.
create or replace function public.obter_mensagem_cliente(p_chave text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_chave text := upper(trim(coalesce(p_chave, '')));
  v_mensagem text;
begin
  if to_regclass('public.mensagens_cliente') is not null then
    select mc.mensagem
      into v_mensagem
      from public.mensagens_cliente mc
     where mc.chave = v_chave
     limit 1;
  end if;

  if v_mensagem is null
     and exists (
       select 1
       from pg_attribute a
       where a.attrelid = to_regclass('public.status_mensagens')
         and a.attname = 'mensagem_cliente'
         and not a.attisdropped
     ) then
    execute
      'select sm.mensagem_cliente
         from public.status_mensagens sm
        where sm.chave = $1
        limit 1'
      into v_mensagem
      using v_chave;
  end if;

  return v_mensagem;
end;
$$;

comment on function public.obter_mensagem_cliente(text)
  is 'Recebe a chave do evento (ex.: CONEXAO_RISCO) e devolve a mensagem amigável do cliente.';

revoke all on function public.obter_mensagem_cliente(text) from public, anon;
grant execute on function public.obter_mensagem_cliente(text) to authenticated;
