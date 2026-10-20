import { Platform, Pressable, ScrollView, StyleSheet, Image, Dimensions, SectionList, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

const {height, width} = Dimensions.get("screen");

export default function telaFuncionario() {
    const safeAreaInsets = useSafeAreaInsets();
    const insets = {
        ...safeAreaInsets,
        bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    };
    const theme = useTheme();

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

    async function carregarLeituras(mala: string) {
        const { data } = await supabase
            .from('historico_checkpoints')
            .select('local, hora')
            .eq('id_mala', mala)
            .order('hora', { ascending: false })
            .limit(5);
        setLeituras((data ?? []) as { local: string; hora: string }[]);
    }

    // Pede a câmera toda vez que a tela abre
    useEffect(() => {
        requestPermission();
    }, []);

    async function lidarComPermissao() {
        await requestPermission();
    }

    function escanearOutra() {
        setScanned(false);
        setIdMala(null);
        setLocal('');
        setMensagem(null);
    }

    async function sair() {
        await supabase.auth.signOut();
        router.replace('/login/login');
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

        // 0. Se a mala ainda não existe, cadastra agora (dono fica vazio pro admin vincular)
        const { data: existe } = await supabase
            .from('malas')
            .select('id_mala')
            .eq('id_mala', idMala)
            .maybeSingle();
        if (!existe) {
            const { error: erroNova } = await supabase.from('malas').insert({
                id_mala: idMala,
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

        // 1. Nova linha no histórico
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

        // 2. Atualiza a posição atual
        const { error: erroMala } = await supabase.from('malas').update({
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

    if (permissions?.granted) {
      // Mala já escaneada: mostra o formulário de baixa
      if (idMala) {
        return (
          <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
            <Cabecalho titulo="Dar baixa" subtitulo={`Mala: ${idMala}`} />

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
          </ThemedView>
        );
      }

      return (
        <>
        <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr']
        }} onBarcodeScanned={scanned ? undefined: ({ data }) => {
          setScanned(true);
          setIdMala(data);
          carregarLeituras(data);
        }} />
        <Image style={styles.qrcodeImage} source={require("@/assets/images/scanner.png")} />
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
  }
  });
