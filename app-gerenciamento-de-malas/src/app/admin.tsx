import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, SectionList, StyleSheet, TextInput } from 'react-native';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { LOCAIS_POR_FASE } from '@/constants/locais';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/supabase';
import { router } from 'expo-router';

type Mala = {
  id_mala: string;
  local: string | null;
  data: string | null;
  hora: string | null;
  id_usuario: string | null;
};

type Cliente = {
  id_usuario: string;
  nome: string | null;
};

export default function TelaAdmin() {
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingBottom: BottomTabInset + Spacing.three,
    },
    web: {
      paddingBottom: Spacing.four,
    },
  });

  const [malas, setMalas] = useState<Mala[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [novoLocal, setNovoLocal] = useState('');
  const [localAberto, setLocalAberto] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Vincular dono: lista de clientes + modal
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [donoAberto, setDonoAberto] = useState(false);

  // 1. Lista todas as malas (RLS: só admin enxerga tudo)
  async function carregar() {
    setCarregando(true);
    setMensagem(null);
    const { data, error: erroMalas } = await supabase
      .from('malas')
      .select('id_mala, local, data, hora, id_usuario');
    if (erroMalas) {
      setMensagem(`Malas: ${erroMalas.message}`);
    }
    setMalas((data ?? []) as Mala[]);

    // Lista de clientes para vincular dono (só admin lê todos os perfis)
    const { data: perfis, error: erroPerfis } = await supabase
      .from('usuarios_perfis')
      .select('id_usuario, nome')
      .eq('cargo', 'cliente');
    if (erroPerfis) {
      setMensagem((m) => (m ? `${m} | Clientes: ${erroPerfis.message}` : `Clientes: ${erroPerfis.message}`));
    }
    setClientes((perfis ?? []) as Cliente[]);

    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  // 2. Edita o local da mala selecionada
  async function salvarLocal() {
    if (!selecionada || !novoLocal.trim()) {
      setMensagem('Selecione uma mala e escolha o novo local.');
      return;
    }
    const { error } = await supabase
      .from('malas')
      .update({ local: novoLocal.trim() })
      .eq('id_mala', selecionada);
    if (error) {
      setMensagem(error.message);
      return;
    }
    setMensagem('Atualizado!');
    setNovoLocal('');
    carregar();
  }

  // Nome do dono (sem nome salvo, mostra o começo do id)
  function nomeDono(idDono: string | null): string {
    if (!idDono) return 'sem dono';
    const c = clientes.find((x) => x.id_usuario === idDono);
    if (!c) return 'sem dono';
    return c.nome ?? `id ${idDono.slice(0, 8)}`;
  }

  // Resumo da mala selecionada para a área de edição
  function resumoSelecionada(): string {
    const mala = malas.find((m) => String(m.id_mala) === selecionada);
    if (!mala) return 'Nenhuma mala selecionada. Toque num cartão acima.';
    return `Mala: ${mala.id_mala} | Local: ${mala.local ?? '-'} | Dono: ${nomeDono(mala.id_usuario)}`;
  }

  // 3. Vincula o dono (cliente) à mala selecionada
  async function vincularDono(idDono: string) {
    if (!selecionada) {
      setMensagem('Selecione uma mala primeiro.');
      return;
    }
    const { error } = await supabase
      .from('malas')
      .update({ id_usuario: idDono })
      .eq('id_mala', selecionada);
    if (error) {
      setMensagem(error.message);
      return;
    }
    setMensagem('Dono vinculado!');
    setDonoAberto(false);
    carregar();
  }

  // Busca pelo id (ex: "MALA-001") — filtra na hora, sem nova query
  const malasFiltradas = malas.filter((m) =>
    String(m.id_mala).toLowerCase().includes(busca.trim().toLowerCase()),
  );

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho titulo="Administração" subtitulo="Todas as malas em um só lugar" />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        <ThemedView style={styles.limite}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.textSecondary }]}
            placeholder="Buscar mala pelo id..."
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            value={busca}
            onChangeText={setBusca}
          />
        </ThemedView>

        {carregando ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={malasFiltradas}
            keyExtractor={(item) => String(item.id_mala)}
            contentContainerStyle={[styles.list, contentPlatformStyle]}
            ListEmptyComponent={<ThemedText>Nenhuma mala cadastrada.</ThemedText>}
            renderItem={({ item }) => (
              <Pressable onPress={() => setSelecionada(String(item.id_mala))}>
                <Cartao style={selecionada === String(item.id_mala) && styles.selected}>
                  <ThemedText type="smallBold">
                    Mala: {String(item.id_mala)}
                  </ThemedText>
                  <ThemedText>
                    Local: {item.local ?? '-'} ({item.data ?? '-'})
                  </ThemedText>
                  <ThemedText>Dono: {nomeDono(item.id_usuario)}</ThemedText>
                </Cartao>
              </Pressable>
            )}
          />
        )}

        <ThemedView style={styles.edit}>
          <Cartao>
            <ThemedText type="smallBold">{resumoSelecionada()}</ThemedText>
            <Pressable
              onPress={() => setLocalAberto(true)}
              style={[styles.select, { borderColor: theme.textSecondary, backgroundColor: theme.background }]}>
              <ThemedText>{novoLocal || 'Toque para escolher o novo local...'}</ThemedText>
            </Pressable>

            {mensagem ? <ThemedText type="small">{mensagem}</ThemedText> : null}
            <Botao titulo="Salvar local" onPress={salvarLocal} />
            <Botao titulo="Vincular dono..." contorno onPress={() => setDonoAberto(true)} />
            <Botao titulo="Sair" contorno onPress={sair} />
          </Cartao>
        </ThemedView>

        <Modal
          visible={localAberto}
          transparent
          animationType="slide"
          onRequestClose={() => setLocalAberto(false)}>
          <Pressable style={styles.modalFundo} onPress={() => setLocalAberto(false)}>
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
                      setNovoLocal(item);
                      setLocalAberto(false);
                    }}
                    style={[
                      styles.option,
                      { backgroundColor: theme.background },
                      novoLocal === item && styles.optionSelected,
                    ]}>
                    <ThemedText>{item}</ThemedText>
                  </Pressable>
                )}
              />
              <Botao titulo="Fechar" contorno onPress={() => setLocalAberto(false)} />
            </ThemedView>
          </Pressable>
        </Modal>

        <Modal
          visible={donoAberto}
          transparent
          animationType="slide"
          onRequestClose={() => setDonoAberto(false)}>
          <Pressable style={styles.modalFundo} onPress={() => setDonoAberto(false)}>
            <ThemedView type="backgroundElement" style={styles.modalCaixa}>
              <FlatList
                data={clientes}
                keyExtractor={(item) => item.id_usuario}
                ListEmptyComponent={<ThemedText>Nenhum cliente cadastrado.</ThemedText>}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => vincularDono(item.id_usuario)}
                    style={[styles.option, { backgroundColor: theme.background }]}>
                    <ThemedText>{item.nome ?? 'Sem nome'} (id {item.id_usuario.slice(0, 8)})</ThemedText>
                  </Pressable>
                )}
              />
              <Botao titulo="Fechar" contorno onPress={() => setDonoAberto(false)} />
            </ThemedView>
          </Pressable>
        </Modal>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
  limite: {
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  selected: {
    borderWidth: 2,
    borderColor: '#208AEF',
  },
  edit: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  input: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
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
});
