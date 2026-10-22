import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { EstadoVazio } from '@/components/estado-vazio';
import { Indicador } from '@/components/indicador';
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

const STATUS = ['No horário', 'Atrasado', 'Cancelado'] as const;
type StatusVoo = (typeof STATUS)[number];

// Atalhos para os atrasos mais comuns e ajuste fino de 5 em 5 minutos.
const MINUTOS_RAPIDOS = [15, 30, 45, 60, 90, 120] as const;
const PASSO_ATRASO = 5;

function formatarPartida(iso: string | null): string {
  if (!iso) return 'horário não informado';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  const dd = String(data.getDate()).padStart(2, '0');
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const hh = String(data.getHours()).padStart(2, '0');
  const min = String(data.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} às ${hh}:${min}`;
}

export default function CCOScreen() {
  const theme = useTheme();
  const usuario = useUsuarioAtual();

  const [voos, setVoos] = useState<Voo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusVoo>('Atrasado');
  const [atraso, setAtraso] = useState('0');
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ texto: string; erro: boolean } | null>(null);

  const contentPlatformStyle = Platform.select({
    android: { paddingBottom: BottomTabInset + Spacing.three },
    web: { paddingBottom: Spacing.four },
  });

  async function carregar(manterSelecao = true) {
    const { data, error } = await supabase
      .from('voos')
      .select('id, codigo_voo, origem, destino, tipo_voo, status_voo, partida_prevista, atraso_min')
      .order('partida_prevista', { ascending: true });

    if (error) {
      setErro(mensagemErro(error, 'Não foi possível carregar os voos. Tente novamente.'));
      setCarregando(false);
      setAtualizando(false);
      return;
    }

    const lista = (data ?? []) as Voo[];
    setErro(null);
    setVoos(lista);
    if (!manterSelecao || !selecionadoId) {
      setSelecionadoId(null);
    } else if (!lista.some((voo) => voo.id === selecionadoId)) {
      setSelecionadoId(null);
    }
    setCarregando(false);
    setAtualizando(false);
  }

  useEffect(() => {
    // Adia a primeira chamada para não disparar setState durante o efeito.
    const timer = setTimeout(() => {
      void carregar();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selecionar(voo: Voo) {
    const statusDoVoo = (STATUS.find((s) => s === voo.status_voo) ?? 'Atrasado') as StatusVoo;
    setSelecionadoId(voo.id);
    setStatus(statusDoVoo);
    setAtraso(statusDoVoo === 'Atrasado' ? String(voo.atraso_min ?? 0) : '0');
    setFeedback(null);
  }

  function selecionarStatus(opcao: StatusVoo) {
    setStatus(opcao);
    // "No horário" e "Cancelado" não têm minutos de atraso.
    if (opcao !== 'Atrasado') setAtraso('0');
  }

  function ajustarAtraso(delta: number) {
    setAtraso((atual) => {
      const minutos = Number.parseInt(atual, 10) || 0;
      return String(Math.min(9999, Math.max(0, minutos + delta)));
    });
  }

  async function salvar() {
    if (!selecionadoId) {
      setFeedback({ texto: 'Selecione um voo na lista acima.', erro: true });
      return;
    }

    const minutos = Number.parseInt(atraso, 10);
    if (!Number.isFinite(minutos) || minutos < 0) {
      setFeedback({ texto: 'Informe o atraso em minutos (0 ou mais).', erro: true });
      return;
    }

    setSalvando(true);
    setFeedback(null);

    const { error } = await supabase
      .from('voos')
      .update({ status_voo: status, atraso_min: minutos })
      .eq('id', selecionadoId);

    setSalvando(false);
    if (error) {
      setFeedback({
        texto: mensagemErro(error, 'Não foi possível atualizar o voo. Tente novamente.'),
        erro: true,
      });
      return;
    }

    setFeedback({
      texto: 'Voo atualizado. A trigger do banco recalcula as conexões em risco.',
      erro: false,
    });
    await carregar(true);
  }

  function atualizar() {
    setAtualizando(true);
    void carregar(true);
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  const selecionado = voos.find((voo) => voo.id === selecionadoId) ?? null;
  const minutosAtuais = Number.parseInt(atraso, 10) || 0;

  function corDoStatus(statusVoo: string | null): string {
    const normalizado = (statusVoo ?? '').toLowerCase();
    if (normalizado.includes('cancel')) return theme.danger;
    if (normalizado.includes('atras') || normalizado.includes('atrasado')) return theme.warning;
    return theme.success;
  }

  const atrasados = voos.filter((voo) => {
    const normalizado = (voo.status_voo ?? '').toLowerCase();
    return normalizado.includes('atras') || (voo.atraso_min ?? 0) > 0;
  }).length;
  const cancelados = voos.filter((voo) =>
    (voo.status_voo ?? '').toLowerCase().includes('cancel'),
  ).length;
  const noHorario = Math.max(0, voos.length - atrasados - cancelados);

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        variante="app"
        eyebrow="CENTRO DE CONTROLE"
        icone="radio-outline"
        titulo="CCO"
        subtitulo="Monitore voos e registre atrasos, cancelamentos e conexões em risco."
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
            contentContainerStyle={[styles.conteudo, contentPlatformStyle]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={atualizar}
                tintColor={theme.accent}
                colors={[theme.accent]}
              />
            }
            ListHeaderComponent={
              <View style={styles.intro}>
                <TituloSecao
                  eyebrow="VOOS MONITORADOS"
                  titulo="A operação em tempo real"
                  descricao="Toque em um voo para registrar atraso ou cancelamento. A trigger do banco recalcula as conexões em risco."
                  acao={
                    <Pill
                      texto={`${voos.length} voo${voos.length === 1 ? '' : 's'}`}
                      cor={theme.accent}
                      icone="list-outline"
                    />
                  }
                />

                <View style={styles.grade}>
                  <Indicador
                    valor={voos.length}
                    rotulo="Monitorados"
                    icone="airplane-outline"
                    cor={theme.accent}
                  />
                  <Indicador
                    valor={noHorario}
                    rotulo="No horário"
                    icone="checkmark-circle-outline"
                    cor={theme.success}
                  />
                  <Indicador
                    valor={atrasados}
                    rotulo="Atrasados"
                    icone="time-outline"
                    cor={theme.warning}
                  />
                  <Indicador
                    valor={cancelados}
                    rotulo="Cancelados"
                    icone="close-circle-outline"
                    cor={theme.danger}
                  />
                </View>

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
                titulo="Nenhum voo monitorado"
                descricao="Cadastre voos na tabela voos para acompanhar a operação."
              />
            }
            ListFooterComponent={
              <View style={styles.rodape}>
                <TituloSecao
                  eyebrow="ATUALIZAR VOO"
                  titulo="Registrar mudança de status"
                  descricao="A alteração é refletida imediatamente na lista e nas conexões em risco."
                />

                {!selecionado ? (
                  <Cartao style={styles.semSelecao}>
                    <View
                      style={[
                        styles.semSelecaoIcone,
                        { backgroundColor: theme.accentSoft, borderColor: theme.border },
                      ]}>
                      <Ionicons name="hand-left-outline" size={22} color={theme.accent} />
                    </View>
                    <View style={styles.semSelecaoTexto}>
                      <ThemedText type="smallBold">Selecione um voo acima</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        O formulário de atualização aparece aqui.
                      </ThemedText>
                    </View>
                  </Cartao>
                ) : (
                  <Cartao style={styles.formCartao}>
                    <View style={styles.tituloForm}>
                      <View
                        style={[
                          styles.formIcone,
                          { backgroundColor: theme.accentSoft, borderColor: theme.border },
                        ]}>
                        <Ionicons name="create-outline" size={20} color={theme.accent} />
                      </View>
                      <View style={styles.tituloFormTexto}>
                        <ThemedText style={[styles.formTitulo, { fontFamily: WebFont }]}>
                          {selecionado.codigo_voo ?? 'Voo sem código'}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {selecionado.origem ?? '?'} → {selecionado.destino ?? '?'} •{' '}
                          {formatarPartida(selecionado.partida_prevista)}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.campoForm}>
                      <ThemedText type="smallBold">Novo status</ThemedText>
                      <View style={styles.statusLinha}>
                        {STATUS.map((opcao) => {
                          const ativo = status === opcao;
                          const cor = corDoStatus(opcao);
                          return (
                            <Pressable
                              key={opcao}
                              accessibilityRole="button"
                              accessibilityLabel={`Status ${opcao}`}
                              onPress={() => selecionarStatus(opcao)}
                              style={[
                                styles.statusChip,
                                {
                                  borderColor: ativo ? cor : theme.border,
                                  backgroundColor: ativo ? `${cor}14` : theme.background,
                                },
                              ]}>
                              <Ionicons
                                name={
                                  opcao === 'No horário'
                                    ? 'checkmark-circle-outline'
                                    : opcao === 'Atrasado'
                                      ? 'time-outline'
                                      : 'close-circle-outline'
                                }
                                size={14}
                                color={ativo ? cor : theme.textSecondary}
                              />
                              <ThemedText
                                type="small"
                                style={[
                                  styles.statusChipTexto,
                                  { color: ativo ? cor : theme.textSecondary },
                                ]}>
                                {opcao}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {status === 'Atrasado' ? (
                      <View style={styles.campoForm}>
                        <ThemedText type="smallBold">Atraso (minutos)</ThemedText>

                        <View style={styles.minutosRapidos}>
                          {MINUTOS_RAPIDOS.map((minutos) => {
                            const ativo = minutosAtuais === minutos;
                            return (
                              <Pressable
                                key={minutos}
                                onPress={() => setAtraso(String(minutos))}
                                style={[
                                  styles.minutoChip,
                                  {
                                    borderColor: ativo ? theme.accent : theme.border,
                                    backgroundColor: ativo ? theme.accentSoft : theme.background,
                                  },
                                ]}>
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.minutoChipTexto,
                                    { color: ativo ? theme.accent : theme.textSecondary },
                                  ]}>
                                  {minutos} min
                                </ThemedText>
                              </Pressable>
                            );
                          })}
                        </View>

                        <View style={styles.stepper}>
                          <Pressable
                            onPress={() => ajustarAtraso(-PASSO_ATRASO)}
                            disabled={minutosAtuais <= 0}
                            style={[
                              styles.stepperBotao,
                              {
                                borderColor: theme.border,
                                backgroundColor: theme.background,
                                opacity: minutosAtuais <= 0 ? 0.4 : 1,
                              },
                            ]}>
                            <Ionicons name="remove" size={18} color={theme.text} />
                          </Pressable>

                          <TextInput
                            style={[
                              styles.stepperInput,
                              {
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderColor: theme.border,
                              },
                            ]}
                            keyboardType="number-pad"
                            value={atraso}
                            maxLength={4}
                            onChangeText={(texto) => setAtraso(texto.replace(/\D/g, ''))}
                            placeholder="0"
                            placeholderTextColor={theme.textSecondary}
                          />

                          <Pressable
                            onPress={() => ajustarAtraso(PASSO_ATRASO)}
                            style={[
                              styles.stepperBotao,
                              { borderColor: theme.border, backgroundColor: theme.background },
                            ]}>
                            <Ionicons name="add" size={18} color={theme.text} />
                          </Pressable>
                        </View>

                        <ThemedText type="small" themeColor="textSecondary">
                          Ajuste de {PASSO_ATRASO} em {PASSO_ATRASO} minutos ou digite o valor.
                        </ThemedText>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.avisoStatus,
                          { backgroundColor: theme.background, borderColor: theme.border },
                        ]}>
                        <Ionicons name="information-circle-outline" size={17} color={theme.accent} />
                        <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                          Este status salva o atraso como 0 min.
                        </ThemedText>
                      </View>
                    )}

                    {feedback ? (
                      <View
                        style={[
                          styles.alerta,
                          {
                            backgroundColor: feedback.erro
                              ? `${theme.danger}10`
                              : `${theme.success}10`,
                            borderColor: feedback.erro
                              ? `${theme.danger}35`
                              : `${theme.success}35`,
                          },
                        ]}>
                        <Ionicons
                          name={feedback.erro ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                          size={17}
                          color={feedback.erro ? theme.danger : theme.success}
                        />
                        <ThemedText
                          type="small"
                          style={{
                            color: feedback.erro ? theme.danger : theme.success,
                            flex: 1,
                          }}>
                          {feedback.texto}
                        </ThemedText>
                      </View>
                    ) : null}

                    <Botao
                      titulo="Salvar atualização"
                      icone="save-outline"
                      onPress={() => void salvar()}
                      carregando={salvando}
                    />
                  </Cartao>
                )}

                <View style={styles.acoesRodape}>
                  <Botao
                    titulo="Atualizar lista"
                    icone="refresh-outline"
                    contorno
                    onPress={atualizar}
                  />
                  <Botao titulo="Sair" icone="log-out-outline" contorno onPress={sair} />
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const corStatus = corDoStatus(item.status_voo);
              const ativo = item.id === selecionadoId;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar voo ${item.codigo_voo ?? item.id}`}
                  onPress={() => selecionar(item)}>
                  <Cartao
                    style={[
                      styles.cardVoo,
                      ativo && { borderWidth: 2, borderColor: theme.accent },
                    ]}>
                    <View style={styles.cardTopo}>
                      <View style={styles.cardTitulo}>
                        <ThemedText style={[styles.codigoVoo, { fontFamily: WebFont }]}>
                          {item.codigo_voo ?? 'Voo sem código'}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.tipo_voo ?? 'tipo não informado'}
                        </ThemedText>
                      </View>
                      <View style={styles.cardStatus}>
                        <Pill
                          texto={item.status_voo ?? 'Sem status'}
                          cor={corStatus}
                          icone="ellipse"
                        />
                        {ativo ? (
                          <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.rotaVoo}>
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
                        <Ionicons name="airplane" size={14} color={theme.accent} />
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
                      <View style={styles.metaItem}>
                        <Ionicons
                          name={item.atraso_min ? 'time-outline' : 'checkmark-circle-outline'}
                          size={15}
                          color={item.atraso_min ? theme.warning : theme.success}
                        />
                        <ThemedText
                          type="small"
                          style={{ color: item.atraso_min ? theme.warning : theme.success }}>
                          {item.atraso_min ? `${item.atraso_min} min de atraso` : 'Sem atraso'}
                        </ThemedText>
                      </View>
                    </View>
                  </Cartao>
                </Pressable>
              );
            }}
          />
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  folha: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
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
  intro: {
    gap: Spacing.three,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  carga: {
    marginTop: Spacing.six,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  cardVoo: {
    gap: Spacing.three,
  },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  cardTitulo: {
    flex: 1,
    gap: 1,
  },
  codigoVoo: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardStatus: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  rotaVoo: {
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
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rotaMeio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    width: 70,
  },
  rotaLinha: {
    flex: 1,
    height: 1.5,
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
    gap: Spacing.three,
  },
  semSelecao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  semSelecaoIcone: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semSelecaoTexto: {
    flex: 1,
    gap: 2,
  },
  formCartao: {
    gap: Spacing.three,
  },
  tituloForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  formIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloFormTexto: {
    flex: 1,
    gap: 2,
  },
  formTitulo: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  campoForm: {
    gap: Spacing.two,
  },
  statusLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
  },
  statusChipTexto: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  minutosRapidos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  minutoChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 1,
  },
  minutoChipTexto: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperBotao: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    flex: 1,
    height: 46,
    borderRadius: Spacing.three,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  avisoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  acoesRodape: {
    gap: Spacing.two,
  },
});
