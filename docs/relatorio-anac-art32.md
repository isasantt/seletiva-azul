# Art. 32 da Resolução 400/ANAC e o prazo de devolução

## Parágrafo técnico-jurídico para o relatório

O Art. 32 da Resolução nº 400/2016 da ANAC estabelece prazos máximos para a devolução da bagagem despachada ao passageiro: 7 (sete) dias em voos domésticos e 21 (vinte e um) dias em voos internacionais. Há, na prática, divergência sobre o termo inicial dessa contagem: parte da interpretação considera o desembarque do passageiro no destino, enquanto outra adota a abertura do Registro de Irregularidade de Bagagem (RIB) como marco operacional. O desembarque é um evento físico de difícil comprovação individual e pode ocorrer antes de o passageiro perceber o extravio, o que torna seu uso vulnerável a discussões retrospectivas e a registros inconsistentes. Por essa razão, o sistema adota a coluna `data_abertura_rib` como gatilho seguro da contagem: ela é gravada no momento em que a ocorrência é formalizada, gera um timestamp auditável no banco e coincide com o instante em que o passageiro declara a irregularidade. A view `v_prazo_anac` deriva desse campo os prazos de 7 ou 21 dias, conforme o tipo de voo, permitindo que o SAC identifique devoluções próximas do vencimento e que o dashboard exiba alertas antes do descumprimento. A escolha não afasta a discussão jurídica sobre o termo inicial, mas cria uma base documental objetiva, reproduzível e defensável para o cumprimento do Art. 32, além de alinhar a operação ao princípio da rastreabilidade e à boa-fé na tratativa do extravio.

## Implementação

- View: `v_prazo_anac` (`id_mala`, `data_abertura_rib`, `dias_devolucao`, `prazo_devolucao`, `prazo_indenizacao_max`).
- Cálculo: 7 dias para `tipo_voo = 'Nacional'` e 21 dias para voos internacionais.
- Tela do SAC: `src/app/sac.tsx`, com resumo e `PrazosAnacVencendo`.
- Componente de alerta: `src/components/prazos-anac-vencendo.tsx`, que pinta de vermelho as malas com prazo inferior a 48 horas.
- Abertura do RIB: RPC segura `abrir_rib(p_id_mala)`, chamada pelo painel do cliente em `src/app/cliente.tsx`.
