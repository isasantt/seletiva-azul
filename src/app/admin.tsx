import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { CampoTexto } from '@/components/campo-texto';
import { Cartao } from '@/components/cartao';
import { EstadoVazio } from '@/components/estado-vazio';
import { Pill } from '@/components/pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TituloSecao } from '@/components/titulo-secao';
import { BottomTabInset, MaxContentWidth, Spacing, WebFont } from '@/constants/theme';
import { LOCAIS_POR_FASE } from '@/constants/locais';
import { useTheme } from '@/hooks/use-theme';
import { nomeExibicao, useUsuarioAtual } from '@/hooks/use-usuario-atual';
import { mensagemErro } from '@/lib/erros';
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
  const usuario = useUsuarioAtual();

  const contentPlatformStyle = Platform.select({
    ios: {
      paddingBottom: BottomTabInset + Spacing.three,
    },
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
      setMensagem(
        `Malas: ${mensagemErro(erroMalas, 'não foi possível carregar a lista.')}`,
      );
    }
    setMalas((data ?? []) as Mala[]);

    // Lista de clientes para vincular dono (só admin lê todos os perfis)
    const { data: perfis, error: erroPerfis } = await supabase
      .from('usuarios_perfis')
      .select('id_usuario, nome')
      .eq('cargo', 'cliente');
    if (erroPerfis) {
      const texto = mensagemErro(erroPerfis, 'não foi possível carregar os clientes.');
      setMensagem((m) => (m ? `${m} | Clientes: ${texto}` : `Clientes: ${texto}`));
    }
    setClientes((perfis ?? []) as Cliente[]);

    setCarregando(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      carregar();
    }, 0);
    return () => clearTimeout(timer);
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
      setMensagem(mensagemErro(error, 'Não foi possível atualizar o local. Tente novamente.'));
      return;
    }
    setMensagem('Local atualizado com sucesso!');
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
      setMensagem(mensagemErro(error, 'Não foi possível vincular o dono. Tente novamente.'));
      return;
    }
    setMensagem('Dono vinculado com sucesso!');
    setDonoAberto(false);
    carregar();
  }

  // Busca pelo id (ex: "MALA-001") — filtra na hora, sem nova query
  const malasFiltradas = malas.filter((m) =>
    String(m.id_mala).toLowerCase().includes(busca.trim().toLowerCase()),
  );

  const malaSelecionada = malas.find((m) => String(m.id_mala) === selecionada) ?? null;

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        variante="app"
        eyebrow="ADMINISTRAÇÃO"
        icone="settings-outline"
        titulo="Gerenciar malas"
        subtitulo="Busque, confira e atualize qualquer bagagem da operação."
        usuario={nomeExibicao(usuario)}
      />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        {carregando ? (
          <ActivityIndicator size="large" color={theme.accent} style={styles.carga} />
        ) : (
          <FlatList
            data={malasFiltradas}
            keyExtractor={(item) => String(item.id_mala)}
            style={styles.lista}
            contentContainerStyle={[styles.list, contentPlatformStyle]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.cabecalhoLista}>
                <TituloSecao
                  eyebrow="INVENTÁRIO"
                  titulo="Todas as malas"
                  descricao="Toque em uma mala para editar o local ou vincular um dono."
                  acao={
                    <Pill
                      texto={`${malasFiltradas.length} de ${malas.length}`}
                      cor={theme.accent}
                      icone="bag-handle-outline"
                    />
                  }
                />

                <CampoTexto
                  rotulo="Buscar mala"
                  icone="search-outline"
                  placeholder="Digite o id, ex.: MALA-001"
                  autoCapitalize="none"
                  value={busca}
                  onChangeText={setBusca}
                />

                {mensagem ? (
                  <View
                    style={[
                      styles.alerta,
                      { backgroundColor: theme.accentSoft, borderColor: theme.border },
                    ]}>
                    <Ionicons name="information-circle-outline" size={17} color={theme.accent} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
                      {mensagem}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            }
            ListEmptyComponent={
              busca.trim() ? (
                <EstadoVazio
                  icone="search-outline"
                  titulo="Nenhuma mala encontrada"
                  descricao={`Não encontramos resultados para “${busca.trim()}”. Tente outro id.`}
                />
              ) : (
                <EstadoVazio
                  icone="bag-handle-outline"
                  titulo="Nenhuma mala cadastrada"
                  descricao="As malas aparecerão aqui assim que forem registradas."
                />
              )
            }
            ListFooterComponent={
              <View style={styles.edit}>
                <TituloSecao
                  eyebrow="EDIÇÃO"
                  titulo="Mala selecionada"
                  descricao="O local e o dono podem ser atualizados sem sair desta tela."
                />

                {!malaSelecionada ? (
                  <Cartao style={styles.semSelecao}>
                    <View
                      style={[
                        styles.semSelecaoIcone,
                        { backgroundColor: theme.accentSoft, borderColor: theme.border },
                      ]}>
                      <Ionicons name="hand-left-outline" size={22} color={theme.accent} />
                    </View>
                    <View style={styles.semSelecaoTexto}>
                      <ThemedText type="smallBold">Nenhuma mala selecionada</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Toque em um cartão acima para editar.
                      </ThemedText>
                    </View>
                  </Cartao>
                ) : (
                  <Cartao style={styles.formCartao}>
                    <View style={styles.formTopo}>
                      <View
                        style={[
                          styles.formIcone,
                          { backgroundColor: theme.accentSoft, borderColor: theme.border },
                        ]}>
                        <Ionicons name="bag-handle-outline" size={20} color={theme.accent} />
                      </View>
                      <View style={styles.formTextos}>
                        <ThemedText style={[styles.formTitulo, { fontFamily: WebFont }]}>
                          Mala {String(malaSelecionada.id_mala)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {malaSelecionada.local ?? 'Local não informado'} •{' '}
                          {nomeDono(malaSelecionada.id_usuario)}
                        </ThemedText>
                      </View>
                      <Pill texto="Selecionada" cor={theme.accent} icone="checkmark-outline" />
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Escolher novo local"
                      onPress={() => setLocalAberto(true)}
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
                          Novo local
                        </ThemedText>
                        <ThemedText type="smallBold">
                          {novoLocal || 'Toque para escolher...'}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                    </Pressable>

                    {mensagem ? (
                      <View
                        style={[
                          styles.alerta,
                          { backgroundColor: theme.accentSoft, borderColor: theme.border },
                        ]}>
                        <Ionicons name="information-circle-outline" size={17} color={theme.accent} />
                        <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
                          {mensagem}
                        </ThemedText>
                      </View>
                    ) : null}

                    <Botao
                      titulo="Salvar local"
                      icone="save-outline"
                      onPress={salvarLocal}
                    />
                    <Botao
                      titulo="Vincular dono"
                      icone="person-add-outline"
                      contorno
                      onPress={() => setDonoAberto(true)}
                    />
                    <Botao
                      titulo="Voltar ao dashboard"
                      icone="grid-outline"
                      contorno
                      onPress={() => router.replace('/admin-dashboard')}
                    />
                    <Botao
                      titulo="Sair da conta"
                      icone="log-out-outline"
                      contorno
                      onPress={sair}
                    />
                  </Cartao>
                )}

                <ThemedText type="small" themeColor="textSecondary" style={styles.resumoTexto}>
                  {resumoSelecionada()}
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => {
              const ativa = selecionada === String(item.id_mala);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar mala ${item.id_mala}`}
                  onPress={() => {
                    setSelecionada(String(item.id_mala));
                    setNovoLocal('');
                  }}>
                  <Cartao
                    style={[
                      styles.cardMala,
                      ativa && { borderWidth: 2, borderColor: theme.accent },
                    ]}>
                    <View style={styles.cardTopo}>
                      <View
                        style={[
                          styles.cardIcone,
                          { backgroundColor: theme.accentSoft, borderColor: theme.border },
                        ]}>
                        <Ionicons name="bag-handle-outline" size={19} color={theme.accent} />
                      </View>
                      <View style={styles.cardTitulos}>
                        <ThemedText style={[styles.cardTitulo, { fontFamily: WebFont }]}>
                          {String(item.id_mala)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.data ?? 'sem data'} {item.hora ? `• ${item.hora}` : ''}
                        </ThemedText>
                      </View>
                      {ativa ? (
                        <Pill texto="Selecionada" cor={theme.accent} icone="checkmark-outline" />
                      ) : (
                        <Ionicons name="chevron-forward" size={17} color={theme.textSecondary} />
                      )}
                    </View>

                    <View style={styles.cardDetalhes}>
                      <View style={styles.cardDetalhe}>
                        <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.local ?? 'Local não informado'}
                        </ThemedText>
                      </View>
                      <View style={styles.cardDetalhe}>
                        <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
                        <ThemedText type="small" themeColor="textSecondary">
                          {nomeDono(item.id_usuario)}
                        </ThemedText>
                      </View>
                    </View>
                  </Cartao>
                </Pressable>
              );
            }}
          />
        )}

        <Modal
          visible={localAberto}
          transparent
          animationType="slide"
          onRequestClose={() => setLocalAberto(false)}>
          <Pressable style={styles.modalFundo} onPress={() => setLocalAberto(false)}>
            <ThemedView type="backgroundElement" style={styles.modalCaixa}>
              <View style={styles.modalTopo}>
                <View style={[styles.modalIcone, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="location-outline" size={20} color={theme.accent} />
                </View>
                <View style={styles.modalTextos}>
                  <ThemedText type="smallBold">Escolher novo local</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Selecione a fase e o local da mala.
                  </ThemedText>
                </View>
                <Pressable onPress={() => setLocalAberto(false)} hitSlop={8}>
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
                      setNovoLocal(item);
                      setLocalAberto(false);
                    }}
                    style={[
                      styles.option,
                      {
                        backgroundColor: theme.background,
                        borderColor: novoLocal === item ? theme.accent : theme.border,
                        borderWidth: novoLocal === item ? 2 : 1,
                      },
                    ]}>
                    <ThemedText>{item}</ThemedText>
                    {novoLocal === item ? (
                      <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                    ) : null}
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
              <View style={styles.modalTopo}>
                <View style={[styles.modalIcone, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="person-add-outline" size={20} color={theme.accent} />
                </View>
                <View style={styles.modalTextos}>
                  <ThemedText type="smallBold">Vincular dono</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Escolha o passageiro responsável pela mala.
                  </ThemedText>
                </View>
                <Pressable onPress={() => setDonoAberto(false)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={theme.textSecondary} />
                </Pressable>
              </View>

              <FlatList
                data={clientes}
                keyExtractor={(item) => item.id_usuario}
                style={styles.listaModal}
                contentContainerStyle={styles.listaModalConteudo}
                ListEmptyComponent={
                  <ThemedText type="small" themeColor="textSecondary">
                    Nenhum cliente cadastrado.
                  </ThemedText>
                }
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => vincularDono(item.id_usuario)}
                    style={[
                      styles.option,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}>
                    <Ionicons name="person-circle-outline" size={20} color={theme.accent} />
                    <View style={styles.optionTextos}>
                      <ThemedText>{item.nome ?? 'Sem nome'}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        id {item.id_usuario.slice(0, 8)}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
  // Largura total para a barra de rolagem ficar no canto direito da tela.
  lista: {
    flex: 1,
    alignSelf: 'stretch',
  },
  list: {
    gap: Spacing.three,
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
  cardMala: {
    gap: Spacing.two,
  },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardIcone: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitulos: {
    flex: 1,
    gap: 1,
  },
  cardTitulo: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardDetalhes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  cardDetalhe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 1,
  },
  edit: {
    width: '100%',
    gap: Spacing.three,
    paddingTop: Spacing.two,
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
  formTopo: {
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
  formTextos: {
    flex: 1,
    gap: 2,
  },
  formTitulo: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    letterSpacing: -0.2,
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
  resumoTexto: {
    textAlign: 'center',
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
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two + 2,
    marginTop: Spacing.one,
  },
  optionTextos: {
    flex: 1,
    gap: 1,
  },
  carga: {
    marginTop: Spacing.six,
  },
});
