# Edge Function `interline`

Simula a troca de dados IATA entre companhias. Recebe a etiqueta de 10 dígitos e devolve JSON com mala, voo e histórico completo de checkpoints.

## Deploy

```bash
npx supabase functions deploy interline --no-verify-jwt
```

> `--no-verify-jwt` é necessário porque outra companhia não terá um JWT do Supabase. A função continua protegida no servidor porque usa a `SUPABASE_SERVICE_ROLE_KEY`, que nunca vai para o app.

As variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetadas automaticamente pelo Supabase no ambiente da Edge Function.

## Teste

```bash
curl "https://SEU-PROJETO.supabase.co/functions/v1/interline?id=9900000001"
```

Resposta esperada (resumida):

```json
{
  "source": "seletiva-azul",
  "bag": {
    "id": "DEMO-MALA-01",
    "iata_tag": "9900000001",
    "flight_id": "d0000000-0000-4000-8000-000000000001"
  },
  "flight": {
    "codigo_voo": "AD4001",
    "origem": "VCP",
    "destino": "CNF"
  },
  "checkpoints": [
    { "event": "ACEITACAO", "location": "Balcão de Check-in 14", "occurred_at": "..." }
  ]
}
```

Erros: `400` para etiqueta inválida, `404` para mala inexistente e `500` para falha interna.
