-- RPC: traduz a chave técnica do evento para a mensagem amigável do cliente.
--
-- Compatível com os dois formatos que existem no projeto:
--   1) tabela separada `mensagens_cliente(chave, mensagem)` (schema atual);
--   2) coluna `status_mensagens.mensagem_cliente` (schema v2).
-- Assim a mesma função funciona antes e depois de uma eventual consolidação.
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
  -- Formato atual: tabela separada com o texto do cliente.
  if to_regclass('public.mensagens_cliente') is not null then
    select mc.mensagem
      into v_mensagem
      from public.mensagens_cliente mc
     where mc.chave = v_chave
     limit 1;
  end if;

  -- Formato v2: a mensagem fica na própria status_mensagens.
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
  is 'Recebe a chave do evento (ex.: CHEGADA) e devolve a mensagem amigável do cliente.';

-- Rodando como owner (security definer), o cliente não precisa de SELECT
-- direto nas tabelas; só permissão de executar a função.
revoke all on function public.obter_mensagem_cliente(text) from public, anon;
grant execute on function public.obter_mensagem_cliente(text) to authenticated;
