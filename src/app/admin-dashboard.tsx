import { useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/supabase';
import { router } from 'expo-router';

type AlertaAberto = {
  id_mala: string | null;
  tipo: string | null;
};

type Contagens = {
  total: number;
  emTransito: number;
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

export default function AdminDashboardScreen() {
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingBottom: BottomTabInset + Spacing.three,
    },
    web: {
      paddingBottom: Spacing.four,
    },
  });

  const [contagens, setContagens] = useState<Contagens>({
    total: 0,
    emTransito: 0,
    comAlerta: 0,
    extraviadas: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /*
   * Critérios dos cards (não existe coluna de status em malas):
   * - Total de Malas: todas as linhas de malas.
   * - Em Trânsito: malas com id_voo preenchido (já vinculadas a um voo).
   * - Com Alerta: malas distintas com alerta em aberto (resolvido_em nulo).
   * - Extraviadas: malas distintas com alerta em aberto do tipo EXTRAVIO.
   */
  async function buscarContagens(): Promise<ResultadoContagens> {
    const [totalRes, transitoRes, alertasRes] = await Promise.all([
      supabase.from('malas').select('id_mala', { count: 'exact', head: true }),
      supabase
        .from('malas')
        .select('id_mala', { count: 'exact', head: true })
        .not('id_voo', 'is', null),
      supabase.from('alertas').select('id_mala, tipo').is('resolvido_em', null),
    ]);

    const falha = totalRes.error ?? transitoRes.error ?? alertasRes.error;
    if (falha) {
      return { contagens: null, erro: falha.message };
    }

    // Distinct por mala: um mesmo id_mala pode ter mais de um alerta aberto.
    const malasComAlerta = new Set<string>();
    const malasExtraviadas = new Set<string>();

    for (const alerta of (alertasRes.data ?? []) as AlertaAberto[]) {
      if (!alerta.id_mala) continue;

      malasComAlerta.add(alerta.id_mala);

      const tipo = (alerta.tipo ?? '').toUpperCase();
      if (tipo.includes('EXTRAVIO')) {
        malasExtraviadas.add(alerta.id_mala);
      }
    }

    return {
      contagens: {
        total: totalRes.count ?? 0,
        emTransito: transitoRes.count ?? 0,
        comAlerta: malasComAlerta.size,
        extraviadas: malasExtraviadas.size,
      },
      erro: null,
    };
  }

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

    inicial();
  }, []);

  // Usado pelo pull-to-refresh e pelo botão: liga o indicador e recarrega.
  function atualizar() {
    setAtualizando(true);
    void buscarContagens().then(aplicar);
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  const cards: CardResumo[] = [
    { chave: 'total', rotulo: 'Total de Malas', icone: 'cube-outline', cor: theme.accent },
    { chave: 'emTransito', rotulo: 'Em Trânsito', icone: 'airplane-outline', cor: theme.success },
    { chave: 'comAlerta', rotulo: 'Com Alerta', icone: 'warning-outline', cor: theme.warning },
    { chave: 'extraviadas', rotulo: 'Extraviadas', icone: 'alert-circle-outline', cor: theme.danger },
  ];

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho titulo="Dashboard" subtitulo="Visão geral das malas e alertas" />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.conteudo, contentPlatformStyle]}
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
              <View style={styles.grade}>
                {cards.map((card) => (
                  <Cartao key={card.chave} style={styles.card}>
                    <View style={[styles.icone, { backgroundColor: `${card.cor}1F` }]}>
                      <Ionicons name={card.icone} size={22} color={card.cor} />
                    </View>
                    <ThemedText style={[styles.numero, { color: theme.text }]}>
                      {contagens[card.chave]}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {card.rotulo}
                    </ThemedText>
                  </Cartao>
                ))}
              </View>

              {erro ? (
                <ThemedText type="small" style={{ color: theme.danger }}>
                  {erro}
                </ThemedText>
              ) : null}

              <Cartao>
                <ThemedText type="smallBold">Atalhos</ThemedText>
                <Botao titulo="Atualizar" contorno onPress={atualizar} />
                <Botao titulo="Gerenciar malas" onPress={() => router.push('/admin')} />
                <Botao titulo="Sair" contorno onPress={sair} />
              </Cartao>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
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
    gap: Spacing.three,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 140,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  icone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  numero: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  carga: {
    marginTop: Spacing.six,
  },
});
