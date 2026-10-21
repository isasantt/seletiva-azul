import { Platform, Pressable, ScrollView, StyleSheet, Image, Dimensions, SectionList, Modal, FlatList, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/supabase';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { LOCAIS_POR_FASE } from '@/constants/locais';
import { useTheme } from '@/hooks/use-theme';

import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

const {height, width} = Dimensions.get("screen");

type Alerta = {
  titulo: string;
  detalhe: string;
};

// Alerta vermelho bloqueante: sem toque no fundo e sem fechar pelo botão voltar.
function AlertaBloqueante({ alerta, onFechar }: { alerta: Alerta | null; onFechar: () => void }) {
  const theme = useTheme();

  return (
    <Modal visible={alerta !== null} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.alertaFundo}>
        <View
          style={[
            styles.alertaCaixa,
            { backgroundColor: theme.backgroundElement, borderColor: theme.danger },
          ]}>
          <View style={[styles.alertaTopo, { backgroundColor: theme.danger }]}>
            <Ionicons name="alert-circle" size={26} color="#FFFFFF" />
            <ThemedText type="smallBold" style={styles.alertaTitulo}>
              {alerta?.titulo ?? ''}
            </ThemedText>
          </View>

          <ThemedText type="small" style={styles.alertaDetalhe}>
            {alerta?.detalhe ?? ''}
          </ThemedText>

          <Botao titulo="Escanear outra" onPress={onFechar} />
        </View>
      </View>
    </Modal>
  );
}

export default function ScannerScreen() {
    const safeAreaInsets = useSafeAreaInsets();
    const insets = {
        ...safeAreaInsets,
        bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    };
    const theme = useTheme();

    // Voo escolhido na SelecaoVooScreen.
    const params = useLocalSearchParams<{ id_voo?: string | string[]; codigo_voo?: string | string[] }>();
    const idVoo = Array.isArray(params.id_voo) ? params.id_voo[0] : params.id_voo;
    const codigoVoo = Array.isArray(params.codigo_voo) ? params.codigo_voo[0] : params.codigo_voo;
    const rotuloVoo = codigoVoo || (idVoo ? idVoo.slice(0, 8) : '...');

    const contentPlatformStyle = Platform.select({
        android: {
        paddingBottom: insets.bottom,
        },
        web: {
        paddingBottom: Spacing.four,
        },
    });

    const [permissions, requestPermission] = useCameraPermissions();

    const [scanned, setScanned] = useState(false);
    const [idMala, setIdMala] = useState<string | null>(null);

    // Local escolhido + mensagens da baixa
    const [local, setLocal] = useState('');
    const [listaAberta, setListaAberta] = useState(false);
    const [mensagem, setMensagem] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);

    // Últimas baixas da mala escaneada
    const [leituras, setLeituras] = useState<{ local: string; hora: string }[]>([]);

    // Alerta vermelho (voo errado ou falha ao validar)
    const [alerta, setAlerta] = useState<Alerta | null>(null);

    // Evita duas validações ao mesmo tempo (a câmera dispara vários frames).
    const verificandoRef = useRef(false);

    async function carregarLeituras(mala: string) {
        const { data } = await supabase
            .from('historico_checkpoints')
            .select('local, hora')
            .eq('id_mala', mala)
            .order('hora', { ascending: false })
            .limit(5);
        setLeituras((data ?? []) as { local: string; hora: string }[]);
    }

    // Sem o parâmetro da seleção, não há como validar: volta para escolher o voo.
    useEffect(() => {
        if (!idVoo) {
            router.replace('/selecao-voo');
        }
    }, [idVoo]);

    // Pede a câmera toda vez que a tela abre
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
        setLocal('');
        setMensagem(null);
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

    // Lê o QR e confere se a mala pertence ao voo selecionado.
    async function lerQr(codigo: string) {
        if (verificandoRef.current || !idVoo) return;
        verificandoRef.current = true;
        setScanned(true); // trava a câmera antes do SELECT

        const { data: mala, error } = await supabase
            .from('malas')
            .select('id_voo')
            .eq('id_mala', codigo)
            .maybeSingle();

        if (error) {
            // Erro de rede/RLS: não libera o registro.
            setAlerta({
                titulo: 'Não foi possível validar a mala',
                detalhe: `${error.message} (mala ${codigo})`,
            });
            return;
        }

        // Mala de outro voo: bloqueia. 'scanned' continua true.
        if (mala?.id_voo && String(mala.id_voo) !== idVoo) {
            setAlerta({
                titulo: 'Esta mala não pertence a este voo',
                detalhe: `Mala ${codigo} • voo selecionado ${rotuloVoo}`,
            });
            return;
        }

        setIdMala(codigo);
        carregarLeituras(codigo);
        verificandoRef.current = false;
    }

    // Grava no histórico e atualiza a posição da mala
    async function registrarBaixa() {
        if (!idMala || !local.trim()) {
            setMensagem('Escaneie a mala e escolha o local na lista.');
            return;
        }
        setSalvando(true);
        setMensagem(null);

        const agora = new Date();

        // 0. Reconfere o voo antes de inserir (o estado pode ter mudado desde o scan).
        const { data: atual, error: erroAtual } = await supabase
            .from('malas')
            .select('id_voo')
            .eq('id_mala', idMala)
            .maybeSingle();

        if (erroAtual) {
            setMensagem(erroAtual.message);
            setSalvando(false);
            return;
        }

        if (atual?.id_voo && String(atual.id_voo) !== idVoo) {
            setAlerta({
                titulo: 'Esta mala não pertence a este voo',
                detalhe: `Mala ${idMala} • voo selecionado ${rotuloVoo}`,
            });
            setSalvando(false);
            return;
        }

        // 1. Se a mala ainda não existe, cadastra agora (dono fica vazio pro admin vincular)
        if (!atual) {
            const { error: erroNova } = await supabase.from('malas').insert({
                id_mala: idMala,
                id_voo: idVoo,
                local: local.trim(),
                data: agora.toISOString().slice(0, 10),
                hora: agora.toTimeString().slice(0, 8),
            });
            if (erroNova) {
                setMensagem(erroNova.message);
                setSalvando(false);
                return;
            }
        }

        // 2. Nova linha no histórico
        const { error: erroHist } = await supabase.from('historico_checkpoints').insert({
            id_mala: idMala,
            local: local.trim(),
            hora: agora.toISOString(),
        });
        if (erroHist) {
            setMensagem(erroHist.message);
            setSalvando(false);
            return;
        }

        // 3. Atualiza a posição atual (e vincula o voo se a mala ainda não tinha)
        const { error: erroMala } = await supabase.from('malas').update({
            id_voo: idVoo,
            local: local.trim(),
            data: agora.toISOString().slice(0, 10),
            hora: agora.toTimeString().slice(0, 8),
        }).eq('id_mala', idMala);
        if (erroMala) {
            setMensagem(erroMala.message);
            setSalvando(false);
            return;
        }

        setMensagem('Baixa registrada! Pode escolher outro local e registrar de novo.');
        setLocal('');
        carregarLeituras(idMala);
        setSalvando(false);
    }

    // Enquanto redireciona, evita montar a câmera sem voo selecionado.
    if (!idVoo) {
      return (
        <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
          <ActivityIndicator size="large" color="#FFFFFF" style={styles.cargaVoo} />
        </ThemedView>
      );
    }

    if (permissions?.granted) {
      // Mala já escaneada: mostra o formulário de baixa
      if (idMala) {
        return (
          <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
            <Cabecalho titulo="Dar baixa" subtitulo={`Voo ${rotuloVoo} • Mala: ${idMala}`} />

            <ScrollView
              style={[styles.folha, { backgroundColor: theme.background }]}
              contentContainerStyle={[styles.folhaDentro, contentPlatformStyle]}>
              <ThemedView style={styles.limite}>
                <Cartao>
                  <ThemedText type="smallBold">Local: {local || 'não escolhido'}</ThemedText>

                  {/* Botão que abre a lista de locais */}
                  <Pressable
                    onPress={() => setListaAberta(true)}
                    style={[styles.select, { borderColor: theme.textSecondary, backgroundColor: theme.background }]}>
                    <ThemedText>{local || 'Toque para escolher o local...'}</ThemedText>
                  </Pressable>

                  {mensagem ? <ThemedText>{mensagem}</ThemedText> : null}

                  <Botao titulo={salvando ? 'Salvando...' : 'Registrar'} onPress={registrarBaixa} desabilitado={salvando} />
                  <Botao titulo="Escanear outra" contorno onPress={escanearOutra} />
                  <Botao titulo="Trocar voo" contorno onPress={trocarVoo} />
                </Cartao>

                <Cartao>
                  <ThemedText type="smallBold">Últimas baixas desta mala:</ThemedText>
                  <FlatList
                    data={leituras}
                    keyExtractor={(item, i) => `${item.hora}-${i}`}
                    scrollEnabled={false}
                    ListEmptyComponent={<ThemedText type="small">Nenhuma ainda.</ThemedText>}
                    renderItem={({ item }) => (
                      <ThemedText type="small">{item.local} ({item.hora})</ThemedText>
                    )}
                  />
                  <Botao titulo="Sair" contorno onPress={sair} />
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
                  <SectionList
                    sections={LOCAIS_POR_FASE.map((g) => ({ title: g.fase, data: g.locais }))}
                    keyExtractor={(item) => item}
                    renderSectionHeader={({ section }) => (
                      <ThemedText type="smallBold">{section.title}</ThemedText>
                    )}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          setLocal(item);
                          setListaAberta(false);
                        }}
                        style={[
                          styles.option,
                          { backgroundColor: theme.background },
                          local === item && styles.optionSelected,
                        ]}>
                        <ThemedText>{item}</ThemedText>
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
        barcodeScannerSettings={{
          barcodeTypes: ['qr']
        }} onBarcodeScanned={scanned ? undefined: ({ data }) => { void lerQr(data); }} />

        <Image style={styles.qrcodeImage} source={require("@/assets/images/scanner.png")} />

        <View style={[styles.cameraTopo, { paddingTop: safeAreaInsets.top + Spacing.two }]}>
          <View style={styles.vooPill}>
            <Ionicons name="airplane" size={16} color="#FFFFFF" />
            <ThemedText type="smallBold" style={styles.vooPillTexto}>Voo {rotuloVoo}</ThemedText>
          </View>
          <Pressable onPress={trocarVoo} style={styles.trocarPill}>
            <ThemedText type="small" style={styles.vooPillTexto}>Trocar voo</ThemedText>
          </Pressable>
        </View>

        <AlertaBloqueante alerta={alerta} onFechar={fecharAlerta} />
        </>
      )
    }

    return (
        <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
            <Cabecalho titulo="Escaneamento" subtitulo="Permita a câmera para ler o QR" />

            <ScrollView
              style={[styles.folha, { backgroundColor: theme.background }]}
              contentContainerStyle={[styles.folhaDentro, contentPlatformStyle]}>
                <ThemedView style={styles.limite}>
                    <Cartao>
                        <ThemedText style={{ textAlign: 'center' }}>
                            As permissões de câmera são necessárias.
                        </ThemedText>
                        <Botao titulo="Permitir" onPress={lidarComPermissao} />
                        <Botao titulo="Trocar voo" contorno onPress={trocarVoo} />
                    </Cartao>
                </ThemedView>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  folha: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
  },
  folhaDentro: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  limite: {
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: 'transparent',
    gap: Spacing.three,
  },
  camera: {
    flex: 1,
  },
  option: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.one,
    borderWidth: 1,
    borderColor: '#888',
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: '#208AEF',
  },
  select: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCaixa: {
    maxHeight: '70%',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.three,
  },
  qrcodeImage: {
    height: 256,
    width: 256,
    position: 'absolute',
    left: (width / 2) - 128,
    top: (height / 2) - 128
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
    backgroundColor: 'rgba(11,42,74,0.85)',
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  trocarPill: {
    backgroundColor: 'rgba(11,42,74,0.85)',
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  vooPillTexto: {
    color: '#FFFFFF',
  },
  cargaVoo: {
    marginTop: Spacing.six,
  },
  alertaFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  alertaCaixa: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Spacing.four,
    borderWidth: 2,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  alertaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  alertaTitulo: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  alertaDetalhe: {
    textAlign: 'center',
  },
  });
