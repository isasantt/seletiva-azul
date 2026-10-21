-- RPC: traduz a chave técnica do evento para a mensagem amigável do cliente.
--
-- Observação de schema: status_mensagens guarda a descrição técnica
-- (mensagem_tecnica); o texto voltado ao cliente fica em
-- mensagens_cliente.mensagem. A função cruza as duas pela chave.
create or replace function public.obter_mensagem_cliente(p_chave text)
returns text
language sql
stable
security definer  
set search_path = public
as $$
  select mc.mensagem
  from public.status_mensagens sm
  join public.mensagens_cliente mc on mc.chave = sm.chave
  where sm.chave = upper(trim(coalesce(p_chave, '')))
  limit 1;
$$;

comment on function public.obter_mensagem_cliente(text)
  is 'Recebe a chave do evento (ex.: CHEGADA) e devolve a mensagem amigável do cliente.';

-- Rodando como owner (security definer), o cliente não precisa de SELECT
-- direto nas tabelas; só permissão de executar a função.
revoke all on function public.obter_mensagem_cliente(text) from public;
grant execute on function public.obter_mensagem_cliente(text) to authenticated;
