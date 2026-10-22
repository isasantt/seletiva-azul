import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { CampoTexto } from '@/components/campo-texto';
import { Cartao } from '@/components/cartao';
import { Pill } from '@/components/pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TituloSecao } from '@/components/titulo-secao';
import { EVENTOS_IATA, EVENTOS_TIMELINE, normalizarEventoIata, type EventoIata } from '@/constants/iata';
import { MaxContentWidth, Spacing, WebFont } from '@/constants/theme';
import { LOCAIS_POR_FASE } from '@/constants/locais';
import { useTheme } from '@/hooks/use-theme';
import { nomeExibicao, useUsuarioAtual } from '@/hooks/use-usuario-atual';
import { formatarDataHora } from '@/lib/anac';
import { inserirCheckpointIata } from '@/lib/checkpoints';
import { mensagemErro } from '@/lib/erros';
import { formatarTagIata, normalizarTagIata, somenteDigitosIata, validarTagIata } from '@/lib/iata';
import { supabase } from '@/supabase';

type TipoAlerta = 'voo_errado' | 'tag_invalida' | 'erro';

type Alerta = {
  titulo: string;
  detalhe: string;
  tipo?: TipoAlerta;
};

type Leitura = {
  local: string | null;
  hora: string | null;
  evento_iata: string | null;
};

function AlertaBloqueante({ alerta, onFechar }: { alerta: Alerta | null; onFechar: () => void }) {
  const theme = useTheme();

  if (alerta?.tipo === 'voo_errado') {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
        <View style={[styles.vooErradoFundo, { backgroundColor: theme.danger }]}>
          <View style={styles.vooErradoIcone}>
            <Ionicons name="close-circle" size={72} color="#FFFFFF" />
          </View>
          <ThemedText style={[styles.vooErradoTitulo, { fontFamily: WebFont }]}>
            Esta mala não pertence a este voo
          </ThemedText>
          <ThemedText style={styles.vooErradoDetalhe}>{alerta.detalhe}</ThemedText>
          <Botao
            titulo="Escanear outra mala"
            icone="scan-outline"
            claro
            onPress={onFechar}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={alerta !== null} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.alertaFundo}>
        <Cartao style={[styles.alertaCaixa, { borderColor: theme.danger }]}>
          <View style={[styles.alertaIcone, { backgroundColor: `${theme.danger}16` }]}>
            <Ionicons name="alert-circle" size={32} color={theme.danger} />
          </View>
          <ThemedText style={[styles.alertaTitulo, { color: theme.text, fontFamily: WebFont }]}>
            {alerta?.titulo ?? ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.alertaDetalhe}>
            {alerta?.detalhe ?? ''}
          </ThemedText>
          <Botao titulo="Escanear outra" icone="scan-outline" onPress={onFechar} />
        </Cartao>
      </View>
    </Modal>
  );
}

function EntradaManual({
  aoValidar,
  estilo,
}: {
  aoValidar: (codigo: string) => void;
  estilo?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  function validar() {
    if (!validarTagIata(codigo)) {
      setErro('Digite exatamente 10 números da etiqueta IATA.');
      return;
    }
    setErro(null);
    aoValidar(codigo);
  }

  return (
    <View
      style={[
        styles.manualCaixa,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        estilo,
      ]}>
      <View style={styles.manualTopo}>
        <View style={[styles.manualIcone, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="keypad-outline" size={18} color={theme.accent} />
        </View>
        <View style={styles.manualTextos}>
          <ThemedText type="smallBold">Digitar etiqueta</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Use se a câmera não estiver disponível.
          </ThemedText>
        </View>
      </View>

      <CampoTexto
        rotulo="Etiqueta IATA"
        icone="pricetag-outline"
        keyboardType="number-pad"
        maxLength={10}
        value={codigo}
        onChangeText={(texto) => setCodigo(somenteDigitosIata(texto))}
        placeholder="10 números da etiqueta"
        erro={erro}
      />

      <Botao
        titulo="Validar etiqueta"
        icone="arrow-forward-outline"
        onPress={validar}
      />
    </View>
  );
}

export default function ScannerScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + Spacing.three,
  };
  const { width, height } = useWindowDimensions();
  const tamanhoQr = Math.min(256, width - Spacing.four * 2);
  const topoQr = Math.max(80, height * 0.4 - tamanhoQr / 2);
  const theme = useTheme();
  const usuario = useUsuarioAtual();

  const params = useLocalSearchParams<{
    id_voo?: string | string[];
    codigo_voo?: string | string[];
  }>();
  const idVoo = Array.isArray(params.id_voo) ? params.id_voo[0] : params.id_voo;
  const codigoVoo = Array.isArray(params.codigo_voo) ? params.codigo_voo[0] : params.codigo_voo;
  const rotuloVoo = codigoVoo || (idVoo ? idVoo.slice(0, 8) : '...');

  const contentPlatformStyle =
    Platform.OS === 'web' ? { paddingBottom: Spacing.four } : { paddingBottom: insets.bottom };

  const [permissions, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [idMala, setIdMala] = useState<string | null>(null);
  const [tagLida, setTagLida] = useState<string | null>(null);

  const [local, setLocal] = useState('');
  const [listaAberta, setListaAberta] = useState(false);
  const [evento, setEvento] = useState<EventoIata>('CARREGAMENTO');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [alerta, setAlerta] = useState<Alerta | null>(null);

  const verificandoRef = useRef(false);

  async function carregarLeituras(mala: string) {
    const { data } = await supabase
      .from('historico_checkpoints')
      .select('local, hora, evento_iata')
      .eq('id_mala', mala)
      .order('hora', { ascending: false })
      .limit(5);
    setLeituras((data ?? []) as Leitura[]);
  }

  useEffect(() => {
    if (!idVoo) router.replace('/selecao-voo');
  }, [idVoo]);

  useEffect(() => {
    requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lidarComPermissao() {
    await requestPermission();
  }

  function escanearOutra() {
    setScanned(false);
    setIdMala(null);
    setTagLida(null);
    setLocal('');
    setEvento('CARREGAMENTO');
    setMensagem(null);
    setLeituras([]);
    verificandoRef.current = false;
  }

  function trocarVoo() {
    router.replace('/selecao-voo');
  }

  function fecharAlerta() {
    setAlerta(null);
    escanearOutra();
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  /**
   * Validação na leitura:
   * 1) a etiqueta precisa ser IATA (10 dígitos);
   * 2) busca a mala pela tag_iata;
   * 3) cruza o id_voo original com o id_voo selecionado.
   */
  async function onBarcodeScanned({ data }: { data: string }) {
    if (verificandoRef.current || !idVoo) return;

    const tag = normalizarTagIata(data);
    if (!validarTagIata(tag)) {
      setScanned(true);
      setAlerta({
        tipo: 'tag_invalida',
        titulo: 'Etiqueta IATA inválida',
        detalhe: 'O QR Code precisa conter exatamente 10 números. Tente novamente.',
      });
      return;
    }

    verificandoRef.current = true;
    setScanned(true);

    const { data: mala, error } = await supabase
      .from('malas')
      .select('id_mala, id_voo, tag_iata')
      .eq('tag_iata', tag)
      .maybeSingle();

    if (error) {
      setAlerta({
        tipo: 'erro',
        titulo: 'Não foi possível validar a mala',
        detalhe: `${mensagemErro(error, 'Erro ao consultar a mala.')} (etiqueta ${tag})`,
      });
      return;
    }

    if (!mala) {
      setAlerta({
        tipo: 'erro',
        titulo: 'Mala não encontrada',
        detalhe: `Nenhuma mala cadastrada com a etiqueta ${tag}.`,
      });
      return;
    }

    if (mala.id_voo && String(mala.id_voo) !== idVoo) {
      setAlerta({
        tipo: 'voo_errado',
        titulo: 'Esta mala não pertence a este voo',
        detalhe: `Etiqueta ${tag} • voo selecionado ${rotuloVoo}`,
      });
      return;
    }

    setIdMala(String(mala.id_mala));
    setTagLida(tag);
    await carregarLeituras(String(mala.id_mala));
    verificandoRef.current = false;
  }

  async function registrarBaixa() {
    const vooId = idVoo;
    if (!idMala || !vooId || !local.trim()) {
      setMensagem('Escaneie a mala e escolha o local na lista.');
      return;
    }

    setSalvando(true);
    setMensagem(null);

    const { data: atual, error: erroAtual } = await supabase
      .from('malas')
      .select('id_voo')
      .eq('id_mala', idMala)
      .maybeSingle();

    if (erroAtual || !atual) {
      setMensagem(
        erroAtual
          ? mensagemErro(erroAtual, 'Não foi possível consultar a mala. Tente novamente.')
          : 'Mala não encontrada no cadastro.',
      );
      setSalvando(false);
      return;
    }

    if (atual.id_voo && String(atual.id_voo) !== vooId) {
      setAlerta({
        tipo: 'voo_errado',
        titulo: 'Esta mala não pertence a este voo',
        detalhe: `Mala ${tagLida ?? idMala} • voo selecionado ${rotuloVoo}`,
      });
      setSalvando(false);
      return;
    }

    // Objeto mínimo: o banco preenche hora e id_funcionario.
    const resultado = await inserirCheckpointIata({
      id_mala: idMala,
      id_voo: vooId,
      evento_iata: evento,
    });

    if (!resultado.ok && !resultado.pendente) {
      setMensagem(resultado.erro ?? 'Não foi possível registrar o checkpoint.');
      setSalvando(false);
      return;
    }

    const agora = new Date();
    const { error: erroMala } = await supabase
      .from('malas')
      .update({
        id_voo: vooId,
        local: local.trim(),
        data: agora.toISOString().slice(0, 10),
        hora: agora.toTimeString().slice(0, 8),
      })
      .eq('id_mala', idMala);

    if (erroMala && !resultado.pendente) {
      setMensagem(mensagemErro(erroMala, 'Não foi possível atualizar a mala. Tente novamente.'));
      setSalvando(false);
      return;
    }

    setMensagem(
      resultado.pendente
        ? 'Sem internet: checkpoint salvo na fila local. Ele será enviado quando a conexão voltar.'
        : 'Checkpoint registrado! Escolha outro evento/local ou escaneie outra mala.',
    );
    setLocal('');
    await carregarLeituras(idMala);
    setSalvando(false);
  }

  if (!idVoo) {
    return (
      <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.cargaVoo} />
      </ThemedView>
    );
  }

  if (permissions?.granted || idMala) {
    if (idMala) {
      const mensagemOffline = mensagem?.includes('Sem internet');
      const mensagemSucesso = mensagem?.startsWith('Checkpoint registrado');
      const corMensagem = mensagemOffline
        ? theme.warning
        : mensagemSucesso
          ? theme.success
          : theme.danger;

      return (
        <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
          <Cabecalho
            variante="app"
            eyebrow="REGISTRAR CHECKPOINT"
            icone="scan-outline"
            titulo={tagLida ? `Mala ${formatarTagIata(tagLida)}` : 'Registrar checkpoint'}
            subtitulo={`Voo ${rotuloVoo} • confirme o local e o evento IATA.`}
            usuario={nomeExibicao(usuario)}
          />

          <ScrollView
            style={[styles.folha, { backgroundColor: theme.background }]}
            contentContainerStyle={[styles.folhaDentro, contentPlatformStyle]}
            showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.limite}>
              <TituloSecao
                eyebrow="CHECKPOINT"
                titulo="Onde está a mala agora?"
                descricao="Cada leitura atualiza a jornada do passageiro em tempo real."
              />

              <Cartao style={styles.formCartao}>
                <View style={styles.malaTopo}>
                  <View
                    style={[
                      styles.malaIcone,
                      { backgroundColor: theme.accentSoft, borderColor: theme.border },
                    ]}>
                    <Ionicons name="bag-handle-outline" size={21} color={theme.accent} />
                  </View>
                  <View style={styles.malaTextos}>
                    <ThemedText style={[styles.malaTitulo, { fontFamily: WebFont }]}>
                      {tagLida ? formatarTagIata(tagLida) : idMala}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Voo {rotuloVoo}
                    </ThemedText>
                  </View>
                  <Pill texto="Validada" cor={theme.success} icone="checkmark-circle-outline" />
                </View>

                <View style={styles.campoForm}>
                  <ThemedText type="smallBold">Local do checkpoint</ThemedText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Escolher local do checkpoint"
                    onPress={() => setListaAberta(true)}
                    style={({ pressed }) => [
                      styles.select,
                      {
                        borderColor: theme.border,
                        backgroundColor: pressed ? theme.backgroundSelected : theme.background,
                      },
                    ]}>
                    <Ionicons name="location-outline" size={18} color={theme.accent} />
                    <View style={styles.selectTextos}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Local selecionado
                      </ThemedText>
                      <ThemedText type="smallBold">
                        {local || 'Toque para escolher...'}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.campoForm}>
                  <ThemedText type="smallBold">Evento IATA</ThemedText>
                  <View style={styles.eventos}>
                    {EVENTOS_TIMELINE.map((opcao) => {
                      const info = EVENTOS_IATA[opcao];
                      const ativo = evento === opcao;
                      return (
                        <Pressable
                          key={opcao}
                          accessibilityRole="button"
                          accessibilityLabel={`Evento ${info.rotulo}`}
                          onPress={() => setEvento(opcao)}
                          style={[
                            styles.eventoChip,
                            {
                              borderColor: ativo ? info.cor : theme.border,
                              backgroundColor: ativo ? `${info.cor}12` : theme.background,
                            },
                          ]}>
                          <Ionicons
                            name={info.icone}
                            size={15}
                            color={ativo ? info.cor : theme.textSecondary}
                          />
                          <ThemedText
                            type="small"
                            style={[
                              styles.eventoChipTexto,
                              { color: ativo ? info.cor : theme.textSecondary },
                            ]}>
                            {info.rotulo}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {mensagem ? (
                  <View
                    style={[
                      styles.alerta,
                      {
                        backgroundColor: `${corMensagem}10`,
                        borderColor: `${corMensagem}35`,
                      },
                    ]}>
                    <Ionicons
                      name={
                        mensagemOffline
                          ? 'cloud-offline-outline'
                          : mensagemSucesso
                            ? 'checkmark-circle-outline'
                            : 'alert-circle-outline'
                      }
                      size={17}
                      color={corMensagem}
                    />
                    <ThemedText type="small" style={{ color: corMensagem, flex: 1 }}>
                      {mensagem}
                    </ThemedText>
                  </View>
                ) : null}

                <Botao
                  titulo="Registrar checkpoint"
                  icone="save-outline"
                  onPress={() => void registrarBaixa()}
                  carregando={salvando}
                />

                <View style={styles.acoesForm}>
                  <Botao
                    titulo="Escanear outra"
                    icone="scan-outline"
                    contorno
                    pequeno
                    onPress={escanearOutra}
                  />
                  <Botao
                    titulo="Trocar voo"
                    icone="swap-horizontal-outline"
                    contorno
                    pequeno
                    onPress={trocarVoo}
                  />
                </View>
              </Cartao>

              <Cartao style={styles.leiturasCartao}>
                <TituloSecao
                  compacto
                  eyebrow="HISTÓRICO"
                  titulo="Últimas leituras"
                  descricao="Os cinco checkpoints mais recentes desta mala."
                />

                <FlatList
                  data={leituras}
                  keyExtractor={(item, i) => `${item.hora}-${i}`}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <View
                      style={[
                        styles.vazioLinha,
                        { backgroundColor: theme.background, borderColor: theme.border },
                      ]}>
                      <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                      <ThemedText type="small" themeColor="textSecondary">
                        Nenhuma leitura registrada ainda.
                      </ThemedText>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const info = normalizarEventoIata(item.evento_iata);
                    const cor = info ? EVENTOS_IATA[info].cor : theme.textSecondary;
                    return (
                      <View style={styles.leituraLinha}>
                        <View style={[styles.leituraIcone, { backgroundColor: `${cor}14` }]}>
                          <Ionicons
                            name={info ? EVENTOS_IATA[info].icone : 'ellipse-outline'}
                            size={14}
                            color={cor}
                          />
                        </View>
                        <View style={styles.leituraTextos}>
                          <ThemedText type="smallBold">
                            {info ? EVENTOS_IATA[info].rotulo : (item.local ?? 'Leitura')}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {item.local && info ? `${item.local} • ` : ''}
                            {formatarDataHora(item.hora)}
                          </ThemedText>
                        </View>
                      </View>
                    );
                  }}
                />

                <Botao titulo="Sair da conta" icone="log-out-outline" contorno onPress={sair} />
              </Cartao>
            </ThemedView>
          </ScrollView>

          <Modal
            visible={listaAberta}
            transparent
            animationType="slide"
            onRequestClose={() => setListaAberta(false)}>
            <Pressable style={styles.modalFundo} onPress={() => setListaAberta(false)}>
              <ThemedView type="backgroundElement" style={styles.modalCaixa}>
                <View style={styles.modalTopo}>
                  <View style={[styles.modalIcone, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name="location-outline" size={20} color={theme.accent} />
                  </View>
                  <View style={styles.modalTextos}>
                    <ThemedText type="smallBold">Escolher local</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Selecione a fase e o local do checkpoint.
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => setListaAberta(false)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={theme.textSecondary} />
                  </Pressable>
                </View>

                <SectionList
                  sections={LOCAIS_POR_FASE.map((g) => ({ title: g.fase, data: g.locais }))}
                  keyExtractor={(item) => item}
                  style={styles.listaModal}
                  contentContainerStyle={styles.listaModalConteudo}
                  stickySectionHeadersEnabled={false}
                  renderSectionHeader={({ section }) => (
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>
                      {section.title}
                    </ThemedText>
                  )}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setLocal(item);
                        setListaAberta(false);
                      }}
                      style={[
                        styles.option,
                        {
                          backgroundColor: theme.background,
                          borderColor: local === item ? theme.accent : theme.border,
                          borderWidth: local === item ? 2 : 1,
                        },
                      ]}>
                      <ThemedText>{item}</ThemedText>
                      {local === item ? (
                        <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                      ) : null}
                    </Pressable>
                  )}
                />
                <Botao titulo="Fechar" contorno onPress={() => setListaAberta(false)} />
              </ThemedView>
            </Pressable>
          </Modal>

          <AlertaBloqueante alerta={alerta} onFechar={fecharAlerta} />
        </ThemedView>
      );
    }

    return (
      <>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
        />

        <Image
          style={[
            styles.qrcodeImage,
            {
              width: tamanhoQr,
              height: tamanhoQr,
              left: (width - tamanhoQr) / 2,
              top: topoQr,
            },
          ]}
          source={require('@/assets/images/scanner.png')}
        />

        <View style={[styles.cameraTopo, { paddingTop: safeAreaInsets.top + Spacing.two }]}>
          <View style={styles.vooPill}>
            <Ionicons name="airplane" size={16} color="#FFFFFF" />
            <ThemedText type="smallBold" style={styles.vooPillTexto}>
              Voo {rotuloVoo}
            </ThemedText>
          </View>
          <Pressable onPress={trocarVoo} style={styles.trocarPill}>
            <Ionicons name="swap-horizontal-outline" size={14} color="#FFFFFF" />
            <ThemedText type="small" style={styles.vooPillTexto}>
              Trocar voo
            </ThemedText>
          </Pressable>
        </View>

        <View
          pointerEvents="none"
          style={[styles.instrucaoCamera, { top: safeAreaInsets.top + 56 }]}>
          <Ionicons name="scan-outline" size={14} color="#FFFFFF" />
          <ThemedText type="small" style={styles.instrucaoTexto}>
            Aponte para o QR Code da etiqueta
          </ThemedText>
        </View>

        <View style={[styles.manualHost, { bottom: insets.bottom }]}>
          <EntradaManual
            aoValidar={(codigo) => void onBarcodeScanned({ data: codigo })}
            estilo={styles.manualCamera}
          />
        </View>

        <AlertaBloqueante alerta={alerta} onFechar={fecharAlerta} />
      </>
    );
  }

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        variante="app"
        eyebrow="SCANNER"
        icone="scan-outline"
        titulo="Escanear bagagem"
        subtitulo={`Voo ${rotuloVoo} • permita a câmera ou digite a etiqueta.`}
        usuario={nomeExibicao(usuario)}
      />

      <ScrollView
        style={[styles.folha, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.folhaDentro, contentPlatformStyle]}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.limite}>
          <Cartao style={styles.permissaoCartao}>
            <View style={[styles.permissaoIcone, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="camera-outline" size={32} color={theme.accent} />
            </View>
            <ThemedText style={[styles.permissaoTitulo, { color: theme.text, fontFamily: WebFont }]}>
              Precisamos da câmera
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.permissaoTexto}>
              A câmera lê o QR Code da etiqueta IATA. Você também pode digitar os 10 números
              manualmente.
            </ThemedText>
            <Botao
              titulo="Permitir câmera"
              icone="camera-outline"
              onPress={lidarComPermissao}
            />
            <Botao
              titulo="Trocar voo"
              icone="swap-horizontal-outline"
              contorno
              onPress={trocarVoo}
            />
          </Cartao>

          <EntradaManual
            aoValidar={(codigo) => void onBarcodeScanned({ data: codigo })}
          />

          <Botao titulo="Sair da conta" icone="log-out-outline" contorno onPress={sair} />
        </ThemedView>
      </ScrollView>

      <AlertaBloqueante alerta={alerta} onFechar={fecharAlerta} />
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
  },
  folhaDentro: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  limite: {
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: 'transparent',
    gap: Spacing.three,
  },
  camera: { flex: 1 },
  formCartao: {
    gap: Spacing.three,
  },
  malaTopo: {
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
  malaTextos: {
    flex: 1,
    gap: 2,
  },
  malaTitulo: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  campoForm: {
    gap: Spacing.two,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two + 2,
  },
  selectTextos: {
    flex: 1,
    gap: 1,
  },
  eventos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  eventoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
  },
  eventoChipTexto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  acoesForm: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  leiturasCartao: {
    gap: Spacing.three,
  },
  leituraLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  leituraIcone: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leituraTextos: {
    flex: 1,
    gap: 1,
  },
  vazioLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCaixa: {
    width: '100%',
    maxWidth: MaxContentWidth,
    maxHeight: '78%',
    alignSelf: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  modalTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  modalIcone: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTextos: {
    flex: 1,
    gap: 2,
  },
  listaModal: {
    flexGrow: 0,
  },
  listaModalConteudo: {
    gap: Spacing.one + 2,
    paddingBottom: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two + 2,
    marginTop: Spacing.one,
  },
  qrcodeImage: {
    position: 'absolute',
  },
  cameraTopo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  vooPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(11, 42, 74, 0.88)',
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  trocarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(11, 42, 74, 0.88)',
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  vooPillTexto: { color: '#FFFFFF' },
  instrucaoCamera: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(11, 42, 74, 0.78)',
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  instrucaoTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  cargaVoo: { marginTop: Spacing.six },
  alertaFundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  alertaCaixa: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  alertaIcone: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertaTitulo: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  alertaDetalhe: { textAlign: 'center', maxWidth: 420 },
  vooErradoFundo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  vooErradoIcone: {
    width: 112,
    height: 112,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vooErradoTitulo: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'center',
    maxWidth: 420,
  },
  vooErradoDetalhe: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    opacity: 0.92,
    maxWidth: 420,
  },
  manualHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  manualCamera: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderRadius: 22,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  manualCaixa: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  manualTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  manualIcone: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualTextos: {
    flex: 1,
    gap: 1,
  },
  permissaoCartao: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  permissaoIcone: {
    width: 74,
    height: 74,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissaoTitulo: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  permissaoTexto: {
    textAlign: 'center',
    maxWidth: 420,
  },
});
