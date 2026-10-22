import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Cartao } from '@/components/cartao';
import { EstadoVazio } from '@/components/estado-vazio';
import { Pill } from '@/components/pill';
import { ThemedText } from '@/components/themed-text';
import { TituloSecao } from '@/components/titulo-secao';
import {
  diasRestantes,
  formatarDataHora,
  prazoVencendo,
  rotuloPrazo,
  type PrazoAnac,
} from '@/lib/anac';
import { BottomTabInset, MaxContentWidth, Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  prazos: PrazoAnac[];
  carregando: boolean;
  erro: string | null;
  atualizando: boolean;
  onRefresh: () => void;
  cabecalho?: ReactNode;
  rodape?: ReactNode;
};

function formatarRestante(dias: number | null): string {
  if (dias === null) return 'Sem prazo calculado';
  if (dias < 0) return `Vencido há ${Math.abs(dias)} dia(s)`;
  if (dias === 0) return 'Vence hoje';
  return `${dias} dia(s) restante(s)`;
}

/**
 * FlatList com as malas cujo prazo de devolução ANAC vence em menos de 48h.
 * O card fica vermelho para facilitar a ação do SAC.
 */
export function PrazosAnacVencendo({
  prazos,
  carregando,
  erro,
  atualizando,
  onRefresh,
  cabecalho,
  rodape,
}: Props) {
  const theme = useTheme();
  const vencendo = prazos.filter((prazo) => prazoVencendo(prazo.prazo_devolucao));

  const contentPlatformStyle = Platform.select({
    android: { paddingBottom: BottomTabInset + Spacing.three },
    web: { paddingBottom: Spacing.four },
  });

  return (
    <FlatList
      data={vencendo}
      keyExtractor={(item) => item.id_mala}
      style={styles.lista}
      contentContainerStyle={[styles.conteudo, contentPlatformStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={onRefresh}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
      ListHeaderComponent={
        <View style={styles.cabecalhoLista}>
          {cabecalho}
          <TituloSecao
            eyebrow="PRAZOS ANAC"
            titulo="Malas com prazo vencendo"
            descricao={`${vencendo.length} mala(s) com devolução em menos de 48 horas.`}
          />
        </View>
      }
      ListEmptyComponent={
        carregando ? (
          <ActivityIndicator size="large" color={theme.accent} style={styles.carga} />
        ) : (
          <EstadoVazio
            icone={erro ? 'cloud-offline-outline' : 'shield-checkmark-outline'}
            titulo={erro ? 'Não foi possível carregar' : 'Tudo em dia por aqui'}
            descricao={
              erro ?? 'Nenhuma mala com prazo vencendo nas próximas 48 horas.'
            }
          />
        )
      }
      ListFooterComponent={
        <View style={styles.rodape}>
          {rodape}
          {erro && vencendo.length > 0 ? (
            <View
              style={[
                styles.alerta,
                { backgroundColor: `${theme.danger}10`, borderColor: `${theme.danger}35` },
              ]}>
              <Ionicons name="alert-circle-outline" size={17} color={theme.danger} />
              <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                {erro}
              </ThemedText>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }) => {
        const dias = diasRestantes(item.prazo_devolucao);
        const vencido = dias !== null && dias < 0;
        const cor = vencido ? theme.danger : theme.warning;
        const rotulo = vencido ? 'Vencido' : dias === 0 ? 'Vence hoje' : 'Prioridade';

        return (
          <Cartao
            style={[
              styles.card,
              {
                borderColor: `${cor}55`,
                backgroundColor: `${cor}0A`,
              },
            ]}>
            <View style={styles.linhaTitulo}>
              <View style={[styles.icone, { backgroundColor: `${cor}16` }]}>
                <Ionicons name={vencido ? 'alert-circle' : 'hourglass-outline'} size={22} color={cor} />
              </View>
              <View style={styles.tituloCard}>
                <ThemedText style={[styles.tituloMala, { fontFamily: WebFont }]}>
                  Mala {item.id_mala}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {rotuloPrazo(item.dias_devolucao)}
                </ThemedText>
              </View>
              <Pill
                texto={rotulo}
                cor={cor}
                icone={vencido ? 'alert-circle-outline' : 'time-outline'}
                solido={vencido}
              />
            </View>

            <ThemedText style={[styles.restante, { color: cor }]}>
              {formatarRestante(dias)}
            </ThemedText>

            <View style={[styles.detalhes, { backgroundColor: theme.background }]}>
              <View style={styles.detalheLinha}>
                <Ionicons name="calendar-outline" size={15} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.detalheTexto}>
                  Devolução até {formatarDataHora(item.prazo_devolucao)}
                </ThemedText>
              </View>
              <View style={styles.detalheLinha}>
                <Ionicons name="document-text-outline" size={15} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.detalheTexto}>
                  RIB aberto em {formatarDataHora(item.data_abertura_rib)}
                </ThemedText>
              </View>
            </View>
          </Cartao>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    flex: 1,
    alignSelf: 'stretch',
  },
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  cabecalhoLista: {
    gap: Spacing.three,
  },
  card: {
    borderWidth: 1.5,
    gap: Spacing.two,
  },
  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  icone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloCard: {
    flex: 1,
    gap: 2,
  },
  tituloMala: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  restante: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  detalhes: {
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
    gap: Spacing.one + 2,
  },
  detalheLinha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  detalheTexto: {
    flex: 1,
  },
  carga: {
    marginTop: Spacing.four,
  },
  rodape: {
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
});
