import NetInfo from '@react-native-community/netinfo';

import { supabase } from '@/supabase';
import type { CheckpointIataPayload } from '@/lib/checkpoint-types';
import { mensagemErro } from '@/lib/erros';
import { enfileirarCheckpoint } from '@/lib/offline-queue';

export type ResultadoCheckpoint = {
  ok: boolean;
  pendente: boolean;
  erro: string | null;
};

function pareceErroDeRede(mensagem: string): boolean {
  const texto = mensagem.toLowerCase();
  return (
    texto.includes('network') ||
    texto.includes('fetch') ||
    texto.includes('timeout') ||
    texto.includes('internet')
  );
}

/**
 * Insere apenas id_mala, id_voo e evento_iata.
 * O banco preenche hora e id_funcionario automaticamente; a migração 011
 * também cobre o local (NOT NULL no projeto atual).
 * Se estiver offline, guarda na fila local para enviar depois.
 */
export async function inserirCheckpointIata(
  payload: CheckpointIataPayload,
): Promise<ResultadoCheckpoint> {
  let offline = false;
  try {
    const rede = await NetInfo.fetch();
    offline = rede.isConnected === false;
  } catch {
    // Se o NetInfo falhar, tenta a inserção normal; o erro de rede abaixo
    // ainda cobre o cenário offline.
  }

  if (offline) {
    await enfileirarCheckpoint(payload);
    return { ok: false, pendente: true, erro: null };
  }

  try {
    const { error } = await supabase.from('historico_checkpoints').insert(payload);
    if (!error) return { ok: true, pendente: false, erro: null };
    if (pareceErroDeRede(error.message)) {
      await enfileirarCheckpoint(payload);
      return { ok: false, pendente: true, erro: null };
    }
    return {
      ok: false,
      pendente: false,
      erro: mensagemErro(error, 'Não foi possível registrar o checkpoint. Tente novamente.'),
    };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : 'Falha de rede.';
    if (pareceErroDeRede(mensagem)) {
      await enfileirarCheckpoint(payload);
      return { ok: false, pendente: true, erro: null };
    }
    return {
      ok: false,
      pendente: false,
      erro: mensagemErro(e, 'Não foi possível registrar o checkpoint. Tente novamente.'),
    };
  }
}
