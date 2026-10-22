import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Cartao } from '@/components/cartao';
import { ThemedText } from '@/components/themed-text';
import { EVENTOS_OBRIGATORIOS, normalizarEventoIata } from '@/constants/iata';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mensagemErro } from '@/lib/erros';
import { supabase } from '@/supabase';

type VooResumo = {
  id: string;
  codigo_voo: string | null;
  origem: string | null;
  destino: string | null;
  partida_prevista: string | null;
};

type MalaResumo = { id_mala: string };
type CheckpointResumo = { id_mala: string; evento_iata: string | null };

function rotuloVoo(voo: VooResumo): string {
  return voo.codigo_voo?.trim() || `Voo ${voo.id.slice(0, 8)}`;
}

/**
 * Percentual de malas do voo selecionado que já possuem os 4 checkpoints
 * obrigatórios da IATA (ACEITACAO, CARREGAMENTO, TRANSFERENCIA, CHEGADA).
 */
export function PainelConformidadeIATA() {
  const theme = useTheme();
  const [voos, setVoos] = useState<VooResumo[]>([]);
  const [vooId, setVooId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [completos, setCompletos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;

    async function carregarVoos() {
      const { data, error } = await supabase
        .from('voos')
        .select('id, codigo_voo, origem, destino, partida_prevista')
        .order('partida_prevista', { ascending: true });

      if (!ativo) return;
      if (error) {
        setErro(mensagemErro(error, 'Não foi possível carregar os voos. Tente novamente.'));
        setCarregando(false);
        return;
      }

      const lista = (data ?? []) as VooResumo[];
      setVoos(lista);
      setVooId((atual) => atual ?? lista[0]?.id ?? null);
      if (lista.length === 0) setCarregando(false);
    }

    void carregarVoos();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!vooId) return;
    let ativo = true;

    async function calcular() {
      setCarregando(true);
      setErro(null);

      const { data: malas, error: erroMalas } = await supabase
        .from('malas')
        .select('id_mala')
        .eq('id_voo', vooId);

      if (!ativo) return;
      if (erroMalas) {
        setErro(mensagemErro(erroMalas, 'Não foi possível carregar as malas do voo.'));
        setCarregando(false);
        return;
      }

      const ids = ((malas ?? []) as MalaResumo[]).map((mala) => String(mala.id_mala));
      if (ids.length === 0) {
        setTotal(0);
        setCompletos(0);
        setCarregando(false);
        return;
      }

      const { data: historico, error: erroHistorico } = await supabase
        .from('historico_checkpoints')
        .select('id_mala, evento_iata')
        .in('id_mala', ids)
        .in('evento_iata', EVENTOS_OBRIGATORIOS);

      if (!ativo) return;
      if (erroHistorico) {
        setErro(mensagemErro(erroHistorico, 'Não foi possível carregar o histórico do voo.'));
        setCarregando(false);
        return;
      }

      const porMala = new Map<string, Set<string>>();
      for (const row of (historico ?? []) as CheckpointResumo[]) {
        const evento = normalizarEventoIata(row.evento_iata);
        if (!evento || !EVENTOS_OBRIGATORIOS.includes(evento)) continue;
        const conjunto = porMala.get(row.id_mala) ?? new Set<string>();
        conjunto.add(evento);
        porMala.set(row.id_mala, conjunto);
      }

      const malasCompletas = ids.filter(
        (id) => (porMala.get(id)?.size ?? 0) >= EVENTOS_OBRIGATORIOS.length,
      ).length;

      setTotal(ids.length);
      setCompletos(malasCompletas);
      setCarregando(false);
    }

    void calcular();
    return () => {
      ativo = false;
    };
  }, [vooId, versao]);

  const percentual = total > 0 ? Math.round((completos / total) * 100) : 0;
  const cor = percentual >= 80 ? theme.success : percentual >= 50 ? theme.warning : theme.danger;
  const largura = `${percentual}%` as `${number}%`;
  const vooAtual = voos.find((voo) => voo.id === vooId);

  return (
    <Cartao>
      <View style={styles.topo}>
        <View style={styles.titulo}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.accent} />
          <ThemedText type="smallBold">Conformidade IATA</ThemedText>
        </View>
        <Pressable onPress={() => setVersao((v) => v + 1)} hitSlop={8}>
          <Ionicons name="refresh" size={20} color={theme.accent} />
        </Pressable>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        4 pontos obrigatórios por mala: aceitação, carregamento, transferência e chegada.
      </ThemedText>

      {voos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {voos.map((voo) => {
            const selecionado = voo.id === vooId;
            return (
              <Pressable
                key={voo.id}
                onPress={() => setVooId(voo.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: selecionado ? theme.accent : theme.textSecondary,
                    backgroundColor: selecionado ? theme.backgroundSelected : 'transparent',
                  },
                ]}>
                <ThemedText type="small" style={selecionado ? { color: theme.accent } : undefined}>
                  {rotuloVoo(voo)}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {vooAtual ? (
        <ThemedText type="small" themeColor="textSecondary">
          {vooAtual.origem ?? '?'} → {vooAtual.destino ?? '?'}
        </ThemedText>
      ) : null}

      {carregando ? (
        <ActivityIndicator color={theme.accent} />
      ) : (
        <>
          <View style={[styles.barra, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.preenchimento, { width: largura, backgroundColor: cor }]} />
          </View>
          <ThemedText type="small">
            {completos} de {total} mala(s) com os 4 checkpoints ({percentual}%).
          </ThemedText>
          {erro ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {erro}
            </ThemedText>
          ) : null}
        </>
      )}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  chips: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  barra: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    borderRadius: 999,
  },
});
