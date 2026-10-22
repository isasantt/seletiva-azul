-- Dados opcionais para a demonstração do dashboard.
-- Completa a linha do tempo de duas malas do voo AD4001:
--   DEMO-MALA-01: TRANSFERENCIA + CHEGADA + ENTREGA  -> Entregues = 1
--   DEMO-MALA-02: TRANSFERENCIA + CHEGADA             -> 100% de conformidade no voo
--
-- Rode no SQL Editor do Supabase apenas em ambiente de demonstração.
-- O script é idempotente: não duplica eventos já existentes.

insert into public.historico_checkpoints (id_mala, id_voo, evento_iata, local, hora)
select m.id_mala, m.id_voo, 'TRANSFERENCIA', 'Terminal de conexão', now() - interval '3 hours'
from public.malas m
where m.id_mala in ('DEMO-MALA-01', 'DEMO-MALA-02')
  and m.id_voo is not null
  and not exists (
    select 1 from public.historico_checkpoints h
    where h.id_mala = m.id_mala and h.evento_iata = 'TRANSFERENCIA'
  );

insert into public.historico_checkpoints (id_mala, id_voo, evento_iata, local, hora)
select m.id_mala, m.id_voo, 'CHEGADA', 'Esteira de bagagens', now() - interval '2 hours'
from public.malas m
where m.id_mala in ('DEMO-MALA-01', 'DEMO-MALA-02')
  and m.id_voo is not null
  and not exists (
    select 1 from public.historico_checkpoints h
    where h.id_mala = m.id_mala and h.evento_iata = 'CHEGADA'
  );

insert into public.historico_checkpoints (id_mala, id_voo, evento_iata, local, hora)
select m.id_mala, m.id_voo, 'ENTREGA', 'Balcão de restituição', now() - interval '1 hour'
from public.malas m
where m.id_mala = 'DEMO-MALA-01'
  and m.id_voo is not null
  and not exists (
    select 1 from public.historico_checkpoints h
    where h.id_mala = m.id_mala and h.evento_iata = 'ENTREGA'
  );

-- Conferência:
-- select id_mala, evento_iata, local, hora
-- from public.historico_checkpoints
-- where id_mala in ('DEMO-MALA-01', 'DEMO-MALA-02')
-- order by id_mala, hora;
