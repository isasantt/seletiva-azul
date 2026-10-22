import { useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { Indicador } from '@/components/indicador';
import { PainelConformidadeIATA } from '@/components/painel-conformidade-iata';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TituloSecao } from '@/components/titulo-secao';
import { BottomTabInset, MaxContentWidth, Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nomeExibicao, useUsuarioAtual } from '@/hooks/use-usuario-atual';
import { mensagemErro } from '@/lib/erros';
import { supabase } from '@/supabase';
import { router } from 'expo-router';

type MalaResumo = {
  id_mala: string;
  id_voo: string | null;
  data_abertura_rib: string | null;
};

type CheckpointResumo = {
  id_mala: string;
  evento_iata: string | null;
};

type AlertaAberto = {
  id_mala: string | null;
  tipo: string | null;
};

type Contagens = {
  emTransito: number;
  entregues: number;
  comAlerta: number;
  extraviadas: number;
};

type ResultadoContagens =
  | { contagens: Contagens; erro: null }
  | { contagens: null; erro: string };

type CardResumo = {
  chave: keyof Contagens;
  rotulo: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  cor: string;
};

type Atalho = {
  titulo: string;
  descricao: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  cor: string;
  onPress: () => void;
};

/**
 * Critérios dos cards:
 * - Em trânsito: mala vinculada a voo e sem checkpoint ENTREGA.
 * - Entregues: mala com checkpoint ENTREGA.
 * - Com alerta: mala distinta com alerta em aberto.
 * - Extraviadas: mala com data_abertura_rib ou alerta de EXTRAVIO em aberto.
 */
async function buscarContagens(): Promise<ResultadoContagens> {
  const [malasRes, checkpointsRes, alertasRes] = await Promise.all([
    supabase.from('malas').select('id_mala, id_voo, data_abertura_rib'),
    supabase.from('historico_checkpoints').select('id_mala, evento_iata'),
    supabase.from('alertas').select('id_mala, tipo').is('resolvido_em', null),
  ]);

  const falha = malasRes.error ?? checkpointsRes.error ?? alertasRes.error;
  if (falha) {
    return {
      contagens: null,
      erro: mensagemErro(falha, 'Não foi possível carregar os indicadores. Tente novamente.'),
    };
  }

  const malas = (malasRes.data ?? []) as MalaResumo[];
  const checkpoints = (checkpointsRes.data ?? []) as CheckpointResumo[];
  const alertas = (alertasRes.data ?? []) as AlertaAberto[];
  const idsMalas = new Set(malas.map((mala) => String(mala.id_mala)));

  const entregues = new Set(
    checkpoints
      .filter((ponto) => (ponto.evento_iata ?? '').trim().toUpperCase() === 'ENTREGA')
      .map((ponto) => String(ponto.id_mala))
      .filter((id) => idsMalas.has(id)),
  );

  const comAlerta = new Set<string>();
  const extraviadas = new Set<string>();

  for (const alerta of alertas) {
    if (!alerta.id_mala) continue;
    const idMala = String(alerta.id_mala);
    if (!idsMalas.has(idMala)) continue;
    comAlerta.add(idMala);
    if ((alerta.tipo ?? '').toUpperCase().includes('EXTRAVIO')) {
      extraviadas.add(idMala);
    }
  }

  for (const mala of malas) {
    if (mala.data_abertura_rib) extraviadas.add(String(mala.id_mala));
  }

  const emTransito = malas.filter(
    (mala) => Boolean(mala.id_voo) && !entregues.has(String(mala.id_mala)),
  ).length;

  return {
    contagens: {
      emTransito,
      entregues: entregues.size,
      comAlerta: comAlerta.size,
      extraviadas: extraviadas.size,
    },
    erro: null,
  };
}

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const usuario = useUsuarioAtual();

  const contentPlatformStyle = Platform.select({
    android: { paddingBottom: BottomTabInset + Spacing.three },
    web: { paddingBottom: Spacing.four },
  });

  const [contagens, setContagens] = useState<Contagens>({
    emTransito: 0,
    entregues: 0,
    comAlerta: 0,
    extraviadas: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function aplicar(resultado: ResultadoContagens) {
    if (resultado.contagens) {
      setErro(null);
      setContagens(resultado.contagens);
    } else {
      setErro(resultado.erro);
    }
    setCarregando(false);
    setAtualizando(false);
  }

  useEffect(() => {
    async function inicial() {
      aplicar(await buscarContagens());
    }

    void inicial();
  }, []);

  function atualizar() {
    setAtualizando(true);
    void buscarContagens().then(aplicar);
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  const cards: CardResumo[] = [
    { chave: 'emTransito', rotulo: 'Em trânsito', icone: 'airplane-outline', cor: theme.success },
    { chave: 'entregues', rotulo: 'Entregues', icone: 'checkmark-done-outline', cor: theme.accent },
    { chave: 'comAlerta', rotulo: 'Com alerta', icone: 'warning-outline', cor: theme.warning },
    { chave: 'extraviadas', rotulo: 'Extraviadas', icone: 'alert-circle-outline', cor: theme.danger },
  ];

  const atalhos: Atalho[] = [
    {
      titulo: 'Gerenciar malas',
      descricao: 'Buscar, editar e conferir checkpoints.',
      icone: 'bag-handle-outline',
      cor: theme.accent,
      onPress: () => router.push('/admin'),
    },
    {
      titulo: 'Atualizar painel',
      descricao: 'Recarregar os indicadores em tempo real.',
      icone: 'refresh-outline',
      cor: theme.success,
      onPress: atualizar,
    },
    {
      titulo: 'Encerrar sessão',
      descricao: 'Sair com segurança desta conta.',
      icone: 'log-out-outline',
      cor: theme.danger,
      onPress: sair,
    },
  ];

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        variante="app"
        eyebrow="CENTRAL DE CONTROLE"
        icone="speedometer-outline"
        titulo="Dashboard"
        subtitulo="Visão geral das malas, alertas e conformidade IATA."
        usuario={nomeExibicao(usuario)}
      />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.conteudo, contentPlatformStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={atualizar}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }>
          {carregando ? (
            <ActivityIndicator size="large" color={theme.accent} style={styles.carga} />
          ) : (
            <>
              <TituloSecao
                eyebrow="VISÃO GERAL"
                titulo="A operação em números"
                descricao="Indicadores calculados a partir das malas, checkpoints e alertas abertos."
                acao={
                  <View
                    style={[
                      styles.onlinePill,
                      { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}35` },
                    ]}>
                    <View style={[styles.onlineDot, { backgroundColor: theme.success }]} />
                    <ThemedText type="small" style={{ color: theme.success, fontWeight: '700' }}>
                      Atualizado
                    </ThemedText>
                  </View>
                }
              />

              <View style={styles.grade}>
                {cards.map((card) => (
                  <Indicador
                    key={card.chave}
                    valor={contagens[card.chave]}
                    rotulo={card.rotulo}
                    icone={card.icone}
                    cor={card.cor}
                  />
                ))}
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

              <PainelConformidadeIATA />

              <TituloSecao
                eyebrow="AÇÕES RÁPIDAS"
                titulo="O que você precisa agora?"
                descricao="Atalhos para as tarefas mais frequentes da operação."
              />

              <View style={styles.atalhos}>
                {atalhos.map((atalho) => (
                  <Pressable
                    key={atalho.titulo}
                    accessibilityRole="button"
                    accessibilityLabel={atalho.titulo}
                    onPress={atalho.onPress}
                    style={({ pressed }) => [
                      styles.atalhoPress,
                      { opacity: pressed ? 0.78 : 1 },
                    ]}>
                    <Cartao style={styles.atalhoCard}>
                      <View style={styles.atalhoTopo}>
                        <View style={[styles.atalhoIcone, { backgroundColor: `${atalho.cor}16` }]}>
                          <Ionicons name={atalho.icone} size={20} color={atalho.cor} />
                        </View>
                        <Ionicons name="arrow-forward-outline" size={16} color={theme.textSecondary} />
                      </View>
                      <ThemedText style={[styles.atalhoTitulo, { fontFamily: WebFont }]}>
                        {atalho.titulo}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {atalho.descricao}
                      </ThemedText>
                    </Cartao>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>
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
  scroll: {
    width: '100%',
  },
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  atalhos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  atalhoPress: {
    flexBasis: '45%',
    flexGrow: 1,
    minWidth: 140,
  },
  atalhoCard: {
    height: '100%',
    gap: Spacing.one + 2,
    padding: Spacing.three,
  },
  atalhoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  atalhoIcone: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoTitulo: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  carga: {
    marginTop: Spacing.six,
  },
});
