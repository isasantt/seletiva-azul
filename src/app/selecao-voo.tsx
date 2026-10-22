import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { EstadoVazio } from '@/components/estado-vazio';
import { Pill } from '@/components/pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TituloSecao } from '@/components/titulo-secao';
import { BottomTabInset, MaxContentWidth, Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nomeExibicao, useUsuarioAtual } from '@/hooks/use-usuario-atual';
import { mensagemErro } from '@/lib/erros';
import { supabase } from '@/supabase';
import { router } from 'expo-router';

// Colunas reais da tabela voos (id é uuid e é o que malas.id_voo referencia).
type Voo = {
  id: string;
  codigo_voo: string | null;
  origem: string | null;
  destino: string | null;
  tipo_voo: string | null;
  status_voo: string | null;
  partida_prevista: string | null;
  atraso_min: number | null;
};

// Formata sem depender de Intl (Hermes antigo não tem todos os locales).
function formatarPartida(iso: string | null): string {
  if (!iso) return 'horário não informado';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} às ${hh}:${min}`;
}

export default function SelecaoVooScreen() {
  const theme = useTheme();
  const usuario = useUsuarioAtual();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingBottom: BottomTabInset + Spacing.three,
    },
    web: {
      paddingBottom: Spacing.four,
    },
  });

  const [voos, setVoos] = useState<Voo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from('voos')
        .select('id, codigo_voo, origem, destino, tipo_voo, status_voo, partida_prevista, atraso_min')
        .order('partida_prevista', { ascending: true });

      if (error) {
        setErro(mensagemErro(error, 'Não foi possível carregar os voos. Tente novamente.'));
      }
      setVoos((data ?? []) as Voo[]);
      setCarregando(false);
    }

    carregar();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  function selecionar(voo: Voo) {
    // O ScannerScreen cruza este id com malas.id_voo.
    router.push({
      pathname: '/scanner',
      params: {
        id_voo: voo.id,
        codigo_voo: voo.codigo_voo ?? '',
      },
    });
  }

  function corDoStatus(voo: Voo): string {
    const status = (voo.status_voo ?? '').toLowerCase();
    if (status.includes('cancel')) return theme.danger;
    if (status.includes('atras') || (voo.atraso_min ?? 0) > 0) return theme.warning;
    if (status.includes('embar') || status.includes('pontual') || status.includes('conclu')) {
      return theme.success;
    }
    return theme.accent;
  }

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        variante="app"
        eyebrow="OPERAÇÃO EM SOLO"
        icone="airplane-outline"
        titulo="Selecionar voo"
        subtitulo="Escolha o voo atual antes de escanear e registrar os checkpoints."
        usuario={nomeExibicao(usuario)}
      />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        {carregando ? (
          <ActivityIndicator size="large" color={theme.accent} style={styles.carga} />
        ) : (
          <FlatList
            data={voos}
            keyExtractor={(item) => item.id}
            style={styles.lista}
            contentContainerStyle={[styles.list, contentPlatformStyle]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.cabecalhoLista}>
                <TituloSecao
                  eyebrow="VOOS DISPONÍVEIS"
                  titulo="Qual voo vamos acompanhar?"
                  descricao="A seleção abre o scanner já vinculado ao voo escolhido."
                  acao={
                    <Pill
                      texto={`${voos.length} voo${voos.length === 1 ? '' : 's'}`}
                      cor={theme.accent}
                      icone="list-outline"
                    />
                  }
                />

                {erro ? (
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
            ListEmptyComponent={
              <EstadoVazio
                icone="airplane-outline"
                titulo="Nenhum voo disponível"
                descricao="Confira a tabela de voos no Supabase ou tente novamente em instantes."
              />
            }
            ListFooterComponent={
              <View style={styles.rodape}>
                <Botao
                  titulo="Sair da conta"
                  icone="log-out-outline"
                  contorno
                  onPress={sair}
                />
              </View>
            }
            renderItem={({ item }) => {
              const corStatus = corDoStatus(item);
              return (
                <Cartao style={styles.cartaoVoo}>
                  <View style={styles.topoVoo}>
                    <View style={styles.codigoWrap}>
                      <View
                        style={[
                          styles.vooIcone,
                          { backgroundColor: theme.accentSoft, borderColor: theme.border },
                        ]}>
                        <Ionicons name="airplane-outline" size={20} color={theme.accent} />
                      </View>
                      <View style={styles.codigoTextos}>
                        <ThemedText style={[styles.codigo, { fontFamily: WebFont }]}>
                          {item.codigo_voo ?? 'Voo sem código'}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.tipo_voo ?? 'tipo não informado'}
                        </ThemedText>
                      </View>
                    </View>
                    <Pill
                      texto={item.status_voo ?? 'Sem status'}
                      cor={corStatus}
                      icone="ellipse"
                    />
                  </View>

                  <View style={styles.rota}>
                    <View style={styles.aeroporto}>
                      <ThemedText style={[styles.sigla, { fontFamily: WebFont }]} numberOfLines={1}>
                        {item.origem ?? '?'}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Origem
                      </ThemedText>
                    </View>

                    <View style={styles.rotaMeio}>
                      <View style={[styles.rotaLinha, { backgroundColor: theme.border }]} />
                      <View style={[styles.rotaAviao, { backgroundColor: theme.accentSoft }]}>
                        <Ionicons name="airplane" size={15} color={theme.accent} />
                      </View>
                      <View style={[styles.rotaLinha, { backgroundColor: theme.border }]} />
                    </View>

                    <View style={[styles.aeroporto, styles.aeroportoDireita]}>
                      <ThemedText style={[styles.sigla, { fontFamily: WebFont }]} numberOfLines={1}>
                        {item.destino ?? '?'}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Destino
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.metaVoo, { backgroundColor: theme.background }]}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={15} color={theme.textSecondary} />
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatarPartida(item.partida_prevista)}
                      </ThemedText>
                    </View>
                    {item.atraso_min ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={15} color={theme.warning} />
                        <ThemedText type="small" style={{ color: theme.warning }}>
                          Atraso de {item.atraso_min} min
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={styles.metaItem}>
                        <Ionicons name="checkmark-circle-outline" size={15} color={theme.success} />
                        <ThemedText type="small" style={{ color: theme.success }}>
                          Sem atraso registrado
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <Botao
                    titulo="Escanear este voo"
                    icone="scan-outline"
                    iconeDireita="arrow-forward-outline"
                    onPress={() => selecionar(item)}
                  />
                </Cartao>
              );
            }}
          />
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  folha: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
  // Ocupa a largura toda para a barra de rolagem ficar no canto da tela,
  // enquanto o conteúdo continua centralizado com maxWidth.
  lista: {
    flex: 1,
    alignSelf: 'stretch',
  },
  list: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  cabecalhoLista: {
    gap: Spacing.three,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  cartaoVoo: {
    gap: Spacing.three,
  },
  topoVoo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  codigoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  vooIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codigoTextos: {
    flex: 1,
    gap: 1,
  },
  codigo: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  rota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  aeroporto: {
    flex: 1,
    gap: 1,
  },
  aeroportoDireita: {
    alignItems: 'flex-end',
  },
  sigla: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rotaMeio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    width: 84,
  },
  rotaLinha: {
    flex: 1,
    height: 1.5,
  },
  rotaAviao: {
    width: 27,
    height: 27,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaVoo: {
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
    gap: Spacing.one + 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  rodape: {
    paddingVertical: Spacing.four,
  },
  carga: {
    marginTop: Spacing.six,
  },
});
