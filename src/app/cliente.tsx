import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BannerAlertaCliente } from '@/components/banner-alerta-cliente';
import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { CampoTexto } from '@/components/campo-texto';
import { Cartao } from '@/components/cartao';
import { EstadoVazio } from '@/components/estado-vazio';
import { Indicador } from '@/components/indicador';
import { Pill } from '@/components/pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TituloSecao } from '@/components/titulo-secao';
import { useToast } from '@/components/toast';
import {
  EVENTOS_IATA,
  EVENTOS_TIMELINE,
  normalizarEventoIata,
  type EventoIata,
} from '@/constants/iata';
import { BottomTabInset, MaxContentWidth, Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nomeExibicao, useUsuarioAtual } from '@/hooks/use-usuario-atual';
import { formatarDataHora } from '@/lib/anac';
import { mensagemErro } from '@/lib/erros';
import { formatarTagIata, somenteDigitosIata, validarTagIata } from '@/lib/iata';
import { supabase } from '@/supabase';
import { router } from 'expo-router';

type Checkpoint = {
  local: string | null;
  hora: string | null;
  evento_iata: string | null;
};

type Mala = {
  id_mala: string;
  local: string | null;
  data: string | null;
  hora: string | null;
  tag_iata: string | null;
  id_voo: string | null;
  data_abertura_rib: string | null;
};

type MalaComCheckpoints = Mala & {
  checkpoints: Checkpoint[];
};

type Resumo = {
  emTransito: number;
  entregues: number;
};

function LinhaDoTempo({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const theme = useTheme();

  if (checkpoints.length === 0) {
    return (
      <View style={[styles.vazioLinha, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">
          Aguardando a primeira leitura.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.linha}>
      {checkpoints.map((ponto, i) => {
        const primeiro = i === 0;
        const ultimo = i === checkpoints.length - 1;
        const evento = normalizarEventoIata(ponto.evento_iata);
        const info = evento ? EVENTOS_IATA[evento] : null;
        const cor = info?.cor ?? (primeiro ? theme.accent : theme.textSecondary);

        return (
          <View key={`${ponto.hora}-${i}`} style={styles.ponto}>
            <View style={styles.trilho}>
              <View
                style={[
                  styles.bolinha,
                  {
                    backgroundColor: cor,
                    width: primeiro ? 16 : 12,
                    height: primeiro ? 16 : 12,
                  },
                ]}
              />
              {!ultimo && <View style={[styles.fio, { backgroundColor: theme.border }]} />}
            </View>
            <View style={styles.textoPonto}>
              <View style={styles.eventoLinha}>
                {info ? <Ionicons name={info.icone} size={15} color={info.cor} /> : null}
                <ThemedText type={primeiro ? 'smallBold' : 'small'}>
                  {info?.rotulo ?? ponto.local ?? 'Checkpoint'}
                </ThemedText>
              </View>
              {ponto.local && info ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {ponto.local}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                {formatarDataHora(ponto.hora)}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PontosIata({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const theme = useTheme();
  const feitos = new Set(
    checkpoints
      .map((ponto) => normalizarEventoIata(ponto.evento_iata))
      .filter((evento): evento is EventoIata => evento !== null),
  );

  return (
    <View style={styles.pontosIata}>
      {EVENTOS_TIMELINE.map((evento) => {
        const info = EVENTOS_IATA[evento];
        const feito = feitos.has(evento);
        return (
          <View
            key={evento}
            style={[
              styles.pontoIata,
              {
                borderColor: feito ? `${info.cor}45` : theme.border,
                opacity: feito ? 1 : 0.58,
                backgroundColor: feito ? `${info.cor}10` : theme.background,
              },
            ]}>
            <Ionicons
              name={feito ? info.icone : 'ellipse-outline'}
              size={13}
              color={feito ? info.cor : theme.textSecondary}
            />
            <ThemedText
              type="small"
              style={[styles.pontoIataTexto, feito ? { color: info.cor } : undefined]}>
              {info.rotulo}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function VincularMala({ onVinculada }: { onVinculada: () => Promise<void> }) {
  const theme = useTheme();
  const [tag, setTag] = useState('');
  const [vinculando, setVinculando] = useState(false);
  const [feedback, setFeedback] = useState<{ texto: string; erro: boolean } | null>(null);

  async function vincular() {
    setFeedback(null);

    if (!validarTagIata(tag)) {
      setFeedback({ texto: 'Digite a etiqueta IATA com exatamente 10 números.', erro: true });
      return;
    }

    setVinculando(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setVinculando(false);
      setFeedback({ texto: 'Sua sessão expirou. Entre novamente.', erro: true });
      return;
    }

    const { data, error } = await supabase
      .from('malas')
      .update({ id_usuario: user.id })
      .eq('tag_iata', tag)
      .is('id_usuario', null)
      .select('id_mala');

    setVinculando(false);

    if (error) {
      setFeedback({
        texto: mensagemErro(error, 'Não foi possível vincular a mala. Tente novamente.'),
        erro: true,
      });
      return;
    }

    if (!data || data.length === 0) {
      setFeedback({
        texto: 'Etiqueta não encontrada ou já vinculada a outro passageiro.',
        erro: true,
      });
      return;
    }

    setTag('');
    setFeedback({ texto: 'Mala vinculada à sua conta!', erro: false });
    await onVinculada();
  }

  return (
    <Cartao style={styles.vincularCartao}>
      <View style={styles.vincularTopo}>
        <View
          style={[
            styles.vincularIcone,
            { backgroundColor: theme.accentSoft, borderColor: theme.border },
          ]}>
          <Ionicons name="link-outline" size={22} color={theme.accent} />
        </View>
        <View style={styles.vincularTextos}>
          <ThemedText type="smallBold">Vincular uma mala</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Digite os 10 números da etiqueta IATA da sua bagagem.
          </ThemedText>
        </View>
      </View>

      <CampoTexto
        rotulo="Etiqueta IATA"
        icone="pricetag-outline"
        keyboardType="number-pad"
        maxLength={10}
        value={tag}
        onChangeText={(texto) => setTag(somenteDigitosIata(texto))}
        placeholder="Ex.: 9900000001"
      />

      {tag.length === 10 ? (
        <Pill texto={`Etiqueta ${formatarTagIata(tag)}`} cor={theme.accent} icone="checkmark-outline" />
      ) : null}

      {feedback ? (
        <View
          style={[
            styles.alerta,
            {
              backgroundColor: feedback.erro ? `${theme.danger}10` : `${theme.success}10`,
              borderColor: feedback.erro ? `${theme.danger}35` : `${theme.success}35`,
            },
          ]}>
          <Ionicons
            name={feedback.erro ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={16}
            color={feedback.erro ? theme.danger : theme.success}
          />
          <ThemedText
            type="small"
            style={{ color: feedback.erro ? theme.danger : theme.success, flex: 1 }}>
            {feedback.texto}
          </ThemedText>
        </View>
      ) : null}

      <Botao
        titulo="Vincular mala"
        icone="link-outline"
        onPress={() => void vincular()}
        carregando={vinculando}
      />
    </Cartao>
  );
}

export default function TelaCliente() {
  const theme = useTheme();
  const usuario = useUsuarioAtual();
  const { showToast } = useToast();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingBottom: BottomTabInset + Spacing.three,
    },
    web: {
      paddingBottom: Spacing.four,
    },
  });

  const [malas, setMalas] = useState<MalaComCheckpoints[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // RIB (Registro de Irregularidade de Bagagem)
  const [malaRib, setMalaRib] = useState<MalaComCheckpoints | null>(null);
  const [abrindoRib, setAbrindoRib] = useState(false);
  const [erroRib, setErroRib] = useState<string | null>(null);

  async function carregar() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCarregando(false);
      router.replace('/login/login');
      return;
    }

    const { data: minhas, error } = await supabase
      .from('malas')
      .select('id_mala, local, data, hora, tag_iata, id_voo, data_abertura_rib')
      .eq('id_usuario', user.id);

    if (error) {
      setErro(mensagemErro(error, 'Não foi possível carregar suas malas. Tente novamente.'));
      setCarregando(false);
      return;
    }

    const lista: MalaComCheckpoints[] = [];
    for (const mala of (minhas ?? []) as Mala[]) {
      const { data: pontos } = await supabase
        .from('historico_checkpoints')
        .select('local, hora, evento_iata')
        .eq('id_mala', mala.id_mala)
        .order('hora', { ascending: false });

      lista.push({
        ...mala,
        id_mala: String(mala.id_mala),
        checkpoints: (pontos ?? []) as Checkpoint[],
      });
    }

    setErro(null);
    setMalas(lista);
    setCarregando(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregar();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  async function confirmarRib() {
    if (!malaRib) return;
    setAbrindoRib(true);
    setErroRib(null);

    const { error } = await supabase.rpc('abrir_rib', { p_id_mala: malaRib.id_mala });
    setAbrindoRib(false);

    if (error) {
      setErroRib(mensagemErro(error, 'Não foi possível abrir o RIB agora.'));
      return;
    }

    const idMala = malaRib.id_mala;
    setMalaRib(null);
    showToast('RIB aberto', `A ocorrência da mala ${idMala} foi registrada.`, 'success');
    await carregar();
  }

  const idsMalas = malas.map((mala) => mala.id_mala);
  const resumo: Resumo = malas.reduce(
    (acc, mala) => {
      const entregue = mala.checkpoints.some(
        (ponto) => normalizarEventoIata(ponto.evento_iata) === 'ENTREGA',
      );
      if (entregue) acc.entregues += 1;
      else if (mala.id_voo) acc.emTransito += 1;
      return acc;
    },
    { emTransito: 0, entregues: 0 },
  );

  function statusDaMala(mala: MalaComCheckpoints) {
    if (mala.data_abertura_rib) {
      return { texto: 'RIB aberto', cor: theme.danger, icone: 'document-text-outline' as const };
    }
    const entregue = mala.checkpoints.some(
      (ponto) => normalizarEventoIata(ponto.evento_iata) === 'ENTREGA',
    );
    if (entregue) {
      return { texto: 'Entregue', cor: theme.success, icone: 'checkmark-circle-outline' as const };
    }
    if (mala.checkpoints.length > 0) {
      return { texto: 'Em trânsito', cor: theme.accent, icone: 'airplane-outline' as const };
    }
    return {
      texto: 'Aguardando leitura',
      cor: theme.textSecondary,
      icone: 'time-outline' as const,
    };
  }

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        variante="app"
        eyebrow="MINHA JORNADA"
        icone="bag-handle-outline"
        titulo="Rastreio de Bagagem"
        subtitulo="Acompanhe cada etapa da sua mala, do check-in à entrega."
        usuario={nomeExibicao(usuario)}
      />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        {carregando ? (
          <ActivityIndicator size="large" color={theme.accent} style={styles.carga} />
        ) : (
          <FlatList
            data={malas}
            keyExtractor={(item) => item.id_mala}
            style={styles.lista}
            contentContainerStyle={[styles.list, contentPlatformStyle]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.cabecalhoLista}>
                <TituloSecao
                  eyebrow="VISÃO GERAL"
                  titulo="Sua bagagem"
                  descricao="Status atual, eventos IATA e histórico de cada mala vinculada à sua conta."
                />

                <View style={styles.gradeIndicadores}>
                  <Indicador
                    valor={malas.length}
                    rotulo="Bagagens"
                    icone="bag-handle-outline"
                    cor={theme.accent}
                  />
                  <Indicador
                    valor={resumo.emTransito}
                    rotulo="Em trânsito"
                    icone="airplane-outline"
                    cor={theme.success}
                  />
                  <Indicador
                    valor={resumo.entregues}
                    rotulo="Entregues"
                    icone="checkmark-done-outline"
                    cor={theme.sky}
                  />
                </View>

                <BannerAlertaCliente idMalas={idsMalas} />
                <VincularMala onVinculada={carregar} />

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

                {malas.length > 0 ? (
                  <TituloSecao
                    compacto
                    titulo="Acompanhe de perto"
                    descricao="Toque em “Não recebi minha mala” para abrir um RIB."
                  />
                ) : null}
              </View>
            }
            ListEmptyComponent={
              <EstadoVazio
                icone="bag-handle-outline"
                titulo="Nenhuma mala vinculada ainda"
                descricao="Digite a etiqueta IATA acima para começar a acompanhar sua bagagem em tempo real."
              />
            }
            ListFooterComponent={
              <View style={styles.rodape}>
                <View
                  style={[
                    styles.rodapeCard,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}>
                  <View style={styles.rodapeTexto}>
                    <ThemedText type="smallBold">Sessão do passageiro</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Encerre com segurança quando terminar.
                    </ThemedText>
                  </View>
                  <Botao
                    titulo="Sair"
                    icone="log-out-outline"
                    contorno
                    pequeno
                    onPress={sair}
                  />
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const status = statusDaMala(item);
              return (
                <Cartao style={styles.cartaoMala}>
                  <View style={styles.topoMala}>
                    <View
                      style={[
                        styles.malaIcone,
                        { backgroundColor: theme.accentSoft, borderColor: theme.border },
                      ]}>
                      <Ionicons name="bag-handle-outline" size={22} color={theme.accent} />
                    </View>
                    <View style={styles.tituloMala}>
                      <ThemedText style={[styles.tituloMalaTexto, { fontFamily: WebFont }]}>
                        Mala {item.id_mala}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatarTagIata(item.tag_iata) || 'sem etiqueta'} • {item.data ?? '-'}
                      </ThemedText>
                    </View>
                    <Pill texto={status.texto} cor={status.cor} icone={status.icone} />
                  </View>

                  <PontosIata checkpoints={item.checkpoints} />
                  <LinhaDoTempo checkpoints={item.checkpoints} />

                  {!item.data_abertura_rib ? (
                    <Botao
                      titulo="Não recebi minha mala"
                      icone="document-text-outline"
                      contorno
                      onPress={() => {
                        setErroRib(null);
                        setMalaRib(item);
                      }}
                    />
                  ) : (
                    <View
                      style={[
                        styles.ribAviso,
                        { backgroundColor: `${theme.danger}0D`, borderColor: `${theme.danger}30` },
                      ]}>
                      <Ionicons name="document-text-outline" size={16} color={theme.danger} />
                      <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                        RIB aberto em {formatarDataHora(item.data_abertura_rib)}
                      </ThemedText>
                    </View>
                  )}
                </Cartao>
              );
            }}
          />
        )}
      </ThemedView>

      <Modal
        visible={malaRib !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!abrindoRib) setMalaRib(null);
        }}>
        <View style={styles.modalFundo}>
          <Cartao style={styles.modalCaixa}>
            <View style={[styles.modalIcone, { backgroundColor: `${theme.danger}14` }]}>
              <Ionicons name="document-text-outline" size={30} color={theme.danger} />
            </View>
            <ThemedText style={[styles.modalTitulo, { fontFamily: WebFont }]}>
              Abrir RIB para esta mala?
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.modalTexto}>
              Isso registra a irregularidade da mala {malaRib?.id_mala} e inicia a contagem do prazo
              ANAC para devolução.
            </ThemedText>
            {erroRib ? (
              <View
                style={[
                  styles.alerta,
                  { backgroundColor: `${theme.danger}10`, borderColor: `${theme.danger}35` },
                ]}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
                <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                  {erroRib}
                </ThemedText>
              </View>
            ) : null}
            <Botao
              titulo="Confirmar abertura"
              icone="alert-circle-outline"
              onPress={() => void confirmarRib()}
              carregando={abrindoRib}
            />
            <Botao
              titulo="Cancelar"
              contorno
              onPress={() => {
                if (!abrindoRib) setMalaRib(null);
              }}
            />
          </Cartao>
        </View>
      </Modal>
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
    gap: Spacing.four,
  },
  gradeIndicadores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  carga: {
    marginTop: Spacing.six,
  },
  vincularCartao: {
    gap: Spacing.three,
  },
  vincularTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  vincularIcone: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vincularTextos: {
    flex: 1,
    gap: 2,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  cartaoMala: {
    gap: Spacing.three,
  },
  topoMala: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  malaIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloMala: {
    flex: 1,
    gap: 2,
  },
  tituloMalaTexto: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pontosIata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  pontoIata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  pontoIataTexto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  vazioLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  linha: {
    gap: 0,
    marginTop: Spacing.one,
  },
  ponto: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  trilho: {
    width: 16,
    alignItems: 'center',
  },
  bolinha: {
    borderRadius: 999,
  },
  fio: {
    flex: 1,
    width: 2,
    marginVertical: 2,
  },
  textoPonto: {
    flex: 1,
    gap: 2,
    paddingBottom: Spacing.three,
  },
  eventoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  ribAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  rodape: {
    paddingVertical: Spacing.four,
  },
  rodapeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 22,
    padding: Spacing.three,
    flexWrap: 'wrap',
  },
  rodapeTexto: {
    flex: 1,
    minWidth: 160,
    gap: 2,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCaixa: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  modalIcone: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitulo: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalTexto: {
    textAlign: 'center',
    maxWidth: 420,
  },
});
