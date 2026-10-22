// @ts-nocheck -- arquivo Deno (Edge Function), não faz parte do bundle Expo.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

/**
 * Simula o compartilhamento IATA/interline.
 *
 * GET /functions/v1/interline?id=9900000001
 * - id: etiqueta IATA de 10 dígitos (tag_iata)
 * - retorna a mala, o voo e o histórico completo de checkpoints
 * - usa a service role no servidor; não expõe essa chave ao app
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Use GET /interline?id=<10 dígitos>.' }, 405);
  }

  const url = new URL(req.url);
  const tag = (url.searchParams.get('id') ?? url.searchParams.get('tag') ?? '').trim();

  if (!/^\d{10}$/.test(tag)) {
    return json({ error: 'O parâmetro id deve ter exatamente 10 dígitos (etiqueta IATA).' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRole) {
    return json({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: mala, error: erroMala } = await supabase
    .from('malas')
    .select('id_mala, tag_iata, id_voo, local, data, hora, data_abertura_rib')
    .eq('tag_iata', tag)
    .maybeSingle();

  if (erroMala) {
    return json({ error: erroMala.message }, 500);
  }

  if (!mala) {
    return json({ error: `Mala com a etiqueta ${tag} não encontrada.` }, 404);
  }

  const { data: checkpoints, error: erroCheckpoints } = await supabase
    .from('historico_checkpoints')
    .select('evento_iata, local, hora, id_voo')
    .eq('id_mala', mala.id_mala)
    .order('hora', { ascending: true });

  if (erroCheckpoints) {
    return json({ error: erroCheckpoints.message }, 500);
  }

  let voo = null;
  if (mala.id_voo) {
    const { data: dadosVoo, error: erroVoo } = await supabase
      .from('voos')
      .select('id, codigo_voo, origem, destino, tipo_voo, status_voo, partida_prevista, chegada_prevista')
      .eq('id', mala.id_voo)
      .maybeSingle();

    if (erroVoo) {
      return json({ error: erroVoo.message }, 500);
    }
    voo = dadosVoo;
  }

  return json({
    source: 'seletiva-azul',
    generated_at: new Date().toISOString(),
    bag: {
      id: mala.id_mala,
      iata_tag: mala.tag_iata,
      flight_id: mala.id_voo,
      last_location: mala.local,
      last_seen_date: mala.data,
      last_seen_time: mala.hora,
      rib_opened_at: mala.data_abertura_rib,
    },
    flight: voo,
    checkpoints: (checkpoints ?? []).map((ponto) => ({
      event: ponto.evento_iata,
      location: ponto.local,
      occurred_at: ponto.hora,
      flight_id: ponto.id_voo,
    })),
  });
});
