import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/supabase';
import type { CheckpointIataPayload } from '@/lib/checkpoint-types';
import { mensagemErro } from '@/lib/erros';

const CHAVE_FILA = '@seletiva-azul/checkpoints-pendentes';

let sincronizando = false;

function chaveDoCheckpoint(item: CheckpointIataPayload): string {
  return `${item.id_mala}|${item.id_voo}|${item.evento_iata}`;
}

function pareceErroDeRede(mensagem: string): boolean {
  const texto = mensagem.toLowerCase();
  return (
    texto.includes('network') ||
    texto.includes('fetch') ||
    texto.includes('timeout') ||
    texto.includes('internet') ||
    texto.includes('conexão') ||
    texto.includes('conexao')
  );
}

function itemValido(valor: unknown): valor is CheckpointIataPayload {
  if (!valor || typeof valor !== 'object') return false;
  const item = valor as Partial<CheckpointIataPayload>;
  return (
    typeof item.id_mala === 'string' &&
    typeof item.id_voo === 'string' &&
    typeof item.evento_iata === 'string'
  );
}

export async function lerFilaCheckpoints(): Promise<CheckpointIataPayload[]> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_FILA);
    if (!bruto) return [];
    const dados: unknown = JSON.parse(bruto);
    return Array.isArray(dados) ? dados.filter(itemValido) : [];
  } catch {
    return [];
  }
}

async function gravarFila(fila: CheckpointIataPayload[]): Promise<void> {
  await AsyncStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
}

export async function enfileirarCheckpoint(item: CheckpointIataPayload): Promise<void> {
  const fila = await lerFilaCheckpoints();
  const chave = chaveDoCheckpoint(item);
  if (fila.some((existente) => chaveDoCheckpoint(existente) === chave)) return;
  fila.push(item);
  await gravarFila(fila);
}

export async function tamanhoFilaCheckpoints(): Promise<number> {
  return (await lerFilaCheckpoints()).length;
}

export async function limparFilaCheckpoints(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_FILA);
}

export type ResultadoSincronizacao = {
  enviados: number;
  restantes: number;
  erro: string | null;
};

/**
 * Envia a fila em ordem. Se a internet cair no meio, preserva o item atual
 * e todos os seguintes para a próxima tentativa.
 */
export async function sincronizarFilaCheckpoints(): Promise<ResultadoSincronizacao> {
  if (sincronizando) {
    return { enviados: 0, restantes: await tamanhoFilaCheckpoints(), erro: null };
  }

  sincronizando = true;
  try {
    const fila = await lerFilaCheckpoints();
    if (fila.length === 0) return { enviados: 0, restantes: 0, erro: null };

    const pendentes: CheckpointIataPayload[] = [];
    let enviados = 0;
    let erro: string | null = null;

    for (let i = 0; i < fila.length; i += 1) {
      const item = fila[i];
      try {
        const { error } = await supabase.from('historico_checkpoints').insert(item);
        if (!error) {
          enviados += 1;
          continue;
        }

        // Erro de validação/RLS não melhora tentando de novo, mas mantemos
        // o item para o operador ver a pendência na tela.
        pendentes.push(item);
        erro = mensagemErro(error, 'Não foi possível sincronizar o checkpoint.');

        if (pareceErroDeRede(error.message)) {
          pendentes.push(...fila.slice(i + 1));
          break;
        }
      } catch (e) {
        pendentes.push(item, ...fila.slice(i + 1));
        erro = mensagemErro(e, 'Falha de rede ao sincronizar.');
        break;
      }
    }

    await gravarFila(pendentes);
    return { enviados, restantes: pendentes.length, erro };
  } finally {
    sincronizando = false;
  }
}
