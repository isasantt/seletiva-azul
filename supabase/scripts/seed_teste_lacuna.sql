-- Teste do job pg_cron de detecção de lacunas.
-- Rode no SQL Editor do Supabase. Cria um voo que parte em 10 minutos e uma
-- mala com ACEITACAO, mas SEM CARREGAMENTO. O job deve inserir um alerta
-- LACUNA na tabela public.alertas na próxima execução.
--
-- Para limpar depois, use o bloco de limpeza no fim do arquivo.

-- 0. Remove uma execução anterior do teste, se existir.
delete from public.alertas where id_mala = 'TESTE-LACUNA-01';
delete from public.historico_checkpoints where id_mala = 'TESTE-LACUNA-01';
delete from public.malas where id_mala = 'TESTE-LACUNA-01';
delete from public.voos where codigo_voo = 'TESTE-LACUNA';

-- 1. Voo prestes a partir.
with voo as (
  insert into public.voos (
    codigo_voo,
    origem,
    destino,
    tipo_voo,
    status_voo,
    partida_prevista,
    chegada_prevista,
    atraso_min
  )
  values (
    'TESTE-LACUNA',
    'VCP',
    'CNF',
    'Nacional',
    'No horário',
    now() + interval '10 minutes',
    now() + interval '2 hours',
    0
  )
  returning id
),

-- 2. Mala vinculada ao voo, ainda sem leitura de CARREGAMENTO.
mala as (
  insert into public.malas (
    id_mala,
    id_voo,
    tag_iata,
    local,
    data,
    hora,
    id_usuario
  )
  select
    'TESTE-LACUNA-01',
    voo.id,
    '9999999999',
    'Balcão de Check-in 14',
    current_date,
    current_time,
    u.id
  from voo
  left join auth.users u on u.email = 'cliente@gmail.com'
  returning id_mala, id_voo
)

-- 3. Só ACEITACAO. Falta CARREGAMENTO de propósito.
insert into public.historico_checkpoints (id_mala, id_voo, evento_iata, local, hora)
select id_mala, id_voo, 'ACEITACAO', 'Balcão de Check-in 14', now()
from mala;

-- 4. Conferência imediata (o alerta ainda pode não existir; o job roda a cada minuto).
select id_mala, id_voo, tag_iata, local
from public.malas
where id_mala = 'TESTE-LACUNA-01';

select id_mala, evento_iata, hora
from public.historico_checkpoints
where id_mala = 'TESTE-LACUNA-01'
order by hora;

-- 5. Veja o job e, se quiser, force a execução agora.
-- select jobid, jobname, schedule, command from cron.job;
-- select cron.run_job((select jobid from cron.job order by jobid limit 1));

-- 6. Confirme o alerta gerado (pode levar até 1 minuto).
-- select id, id_mala, id_voo, tipo, criado_em, resolvido_em
-- from public.alertas
-- where id_mala = 'TESTE-LACUNA-01'
-- order by criado_em desc;

-- 7. Limpeza do teste:
-- delete from public.alertas where id_mala = 'TESTE-LACUNA-01';
-- delete from public.historico_checkpoints where id_mala = 'TESTE-LACUNA-01';
-- delete from public.malas where id_mala = 'TESTE-LACUNA-01';
-- delete from public.voos where codigo_voo = 'TESTE-LACUNA';
