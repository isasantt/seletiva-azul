# Teste do job pg_cron (detecção de lacunas)

O objetivo é gravar o vídeo mostrando um alerta `LACUNA` sendo criado pelo job que roda a cada minuto.

## 1. Pré-requisitos

- Job pg_cron ativo no Supabase.
- Pelo menos uma mala com `id_voo` preenchido e sem checkpoint `CARREGAMENTO`.
- A tabela `public.alertas` precisa existir (ela já é usada pelo app).

## 2. Inserir o cenário de teste

Abra o **SQL Editor** do Supabase e execute:

```sql
-- arquivo completo: supabase/scripts/seed_teste_lacuna.sql
```

O script cria:

- voo `TESTE-LACUNA`, partindo em 10 minutos;
- mala `TESTE-LACUNA-01`, etiqueta `9999999999`;
- checkpoint apenas de `ACEITACAO`;
- nenhum checkpoint de `CARREGAMENTO`.

Se o job considerar uma janela diferente (por exemplo, 30 minutos antes da partida), o horário de 10 minutos já cobre a maioria dos casos. Ajuste `now() + interval '10 minutes'` se necessário.

## 3. Forçar a execução (opcional)

Liste o job:

```sql
select jobid, jobname, schedule, command from cron.job;
```

Se quiser rodar sem esperar o minuto:

```sql
select cron.run_job(SEU_JOBID);
```

> Em algumas versões do pg_cron a função é `cron.run_job(jobid)`; em outras, o job só pode ser disparado pelo agendamento. Nesse caso, aguarde até 1 minuto.

## 4. Confirmar o alerta

```sql
select id, id_mala, id_voo, tipo, criado_em, resolvido_em
from public.alertas
where id_mala = 'TESTE-LACUNA-01'
order by criado_em desc;
```

O resultado esperado é uma linha com `tipo = 'LACUNA'` e `resolvido_em` nulo. Com o app aberto como Admin, SAC ou Handling, o Toast global deve aparecer assim que o INSERT chegar pelo Realtime.

## 5. Limpar

```sql
delete from public.alertas where id_mala = 'TESTE-LACUNA-01';
delete from public.historico_checkpoints where id_mala = 'TESTE-LACUNA-01';
delete from public.malas where id_mala = 'TESTE-LACUNA-01';
delete from public.voos where codigo_voo = 'TESTE-LACUNA';
```

## 6. Se o alerta não aparecer

1. Confirme que o job existe e está ativo (`select * from cron.job;`).
2. Confirme que o voo ainda não partiu.
3. Confirme que não existe nenhum checkpoint `CARREGAMENTO` para a mala.
4. Verifique se o job grava em `public.alertas` e se a tabela está na publicação `supabase_realtime` (migração `007_alertas_realtime.sql`).
