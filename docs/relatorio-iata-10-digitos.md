# Restrição IATA de 10 dígitos no banco

## Parágrafo para o relatório

A padronização da etiqueta de bagagem em exatamente dez dígitos numéricos é uma exigência operacional da IATA (RP 1740) que garante interoperabilidade entre companhias aéreas, sistemas de leitura óptica e processos de interline. Para que essa regra não dependesse exclusivamente da validação do front-end — que pode ser contornada por chamadas diretas à API, por versões antigas do aplicativo ou por falhas de digitação —, a restrição foi implementada também no PostgreSQL, por meio da cláusula `CHECK (tag_iata ~ '^[0-9]{10}$')` na tabela `malas`. Essa abordagem de defesa em profundidade faz com que o banco rejeite qualquer inserção ou atualização que não contenha exatamente dez algarismos, independentemente da origem da requisição. Assim, o front-end oferece feedback imediato ao operador, enquanto a constraint atua como última barreira de integridade, protegendo o histórico de checkpoints, as consultas de interline e os relatórios de conformidade contra identificadores malformados. O uso de uma expressão regular no próprio SGBD também documenta a regra de negócio no esquema, facilita auditorias e evita que diferentes clientes (aplicativo móvel, PWA ou integrações futuras) implementem validações divergentes.

## Implementação

Migração: `supabase/migrations/009_tag_iata_check.sql`.

```sql
alter table public.malas
  add constraint malas_tag_iata_iata_check
  check (tag_iata is null or tag_iata ~ '^[0-9]{10}$') not valid;
```

A cláusula `NOT VALID` permite aplicar a constraint em uma base que ainda tenha registros antigos fora do padrão; novas linhas e atualizações passam a ser validadas imediatamente. Depois da limpeza dos dados históricos, a constraint pode ser validada com:

```sql
alter table public.malas validate constraint malas_tag_iata_iata_check;
```

No aplicativo, a função `validarTagIata` (`src/lib/iata.ts`) repete a regra antes de consultar o Supabase, permitindo mensagens de erro claras sem substituir a proteção do banco.
