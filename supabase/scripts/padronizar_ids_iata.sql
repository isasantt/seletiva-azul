-- Padroniza os IDs das malas de demonstração para 10 dígitos IATA.
-- Execute no SQL Editor do Supabase.
--
-- Antes:
--   id_mala = DEMO-MALA-01..06
--   tag_iata = 9900000001..9900000006
--
-- Depois:
--   id_mala = tag_iata = 9900000001..9900000006
--
-- A troca é feita em transação. Se alguma tabela ainda referenciar uma mala
-- antiga, o script aborta e nada é alterado.

begin;

create temp table mapa_malas (
  id_antigo text primary key,
  id_novo text not null unique
) on commit drop;

insert into mapa_malas (id_antigo, id_novo) values
  ('DEMO-MALA-01', '9900000001'),
  ('DEMO-MALA-02', '9900000002'),
  ('DEMO-MALA-03', '9900000003'),
  ('DEMO-MALA-04', '9900000004'),
  ('DEMO-MALA-05', '9900000005'),
  ('DEMO-MALA-06', '9900000006');

-- 1. Libera as tags antigas, porque tag_iata é única.
update public.malas m
set tag_iata = null
where m.id_mala in (select id_antigo from mapa_malas);

-- 2. Cria as novas malas já com id_mala de 10 dígitos.
insert into public.malas (
  id_mala,
  local,
  data,
  hora,
  id_usuario,
  tag_iata,
  id_voo,
  data_abertura_rib
)
select
  mapa.id_novo,
  m.local,
  m.data,
  m.hora,
  m.id_usuario,
  mapa.id_novo,
  m.id_voo,
  m.data_abertura_rib
from public.malas m
join mapa_malas mapa on mapa.id_antigo = m.id_mala;

-- 3. Move o histórico. UPDATE direto preserva id_funcionario e hora.
update public.historico_checkpoints h
set id_mala = mapa.id_novo
from mapa_malas mapa
where h.id_mala = mapa.id_antigo;

-- 4. Move os trechos previstos.
update public.trechos_mala t
set id_mala = mapa.id_novo
from mapa_malas mapa
where t.id_mala = mapa.id_antigo;

-- 5. Move os alertas.
update public.alertas a
set id_mala = mapa.id_novo
from mapa_malas mapa
where a.id_mala = mapa.id_antigo;

-- 6. Remove as malas antigas.
delete from public.malas m
using mapa_malas mapa
where m.id_mala = mapa.id_antigo;

commit;

-- Conferência:
-- select id_mala, tag_iata, id_voo, local
-- from public.malas
-- order by id_mala;
--
-- select id_mala, tipo from public.alertas order by id_mala;
-- select id_mala, ordem from public.trechos_mala order by id_mala, ordem;
-- select id_mala, evento_iata, id_funcionario from public.historico_checkpoints order by id_mala, hora;
