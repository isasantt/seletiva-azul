import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet } from 'react-native';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
        setErro(error.message);
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

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho titulo="Selecionar voo" subtitulo="Handling — escolha o voo antes de escanear" />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        {carregando ? (
          <ActivityIndicator size="large" style={styles.carga} />
        ) : (
          <FlatList
            data={voos}
            keyExtractor={(item) => item.id}
            style={styles.lista}
            contentContainerStyle={[styles.list, contentPlatformStyle]}
            ListEmptyComponent={
              <ThemedText>Nenhum voo disponível. Confira a tabela voos no Supabase.</ThemedText>
            }
            ListFooterComponent={
              <ThemedView style={styles.rodape}>
                <Botao titulo="Sair" contorno onPress={sair} />
              </ThemedView>
            }
            renderItem={({ item }) => (
              <Cartao>
                <ThemedText type="smallBold">
                  {item.codigo_voo ?? 'Voo sem código'} • {item.tipo_voo ?? 'tipo não informado'}
                </ThemedText>
                <ThemedText type="small">
                  {item.origem ?? '?'} → {item.destino ?? '?'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Partida: {formatarPartida(item.partida_prevista)}
                  {item.atraso_min ? ` • atraso ${item.atraso_min} min` : ''}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.accent }}>
                  {item.status_voo ?? 'status não informado'}
                </ThemedText>
                <Botao titulo="Selecionar este voo" onPress={() => selecionar(item)} />
              </Cartao>
            )}
          />
        )}

        {erro ? (
          <ThemedText type="small" style={[styles.erro, { color: theme.danger }]}>
            {erro}
          </ThemedText>
        ) : null}
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
  rodape: {
    paddingVertical: Spacing.four,
    backgroundColor: 'transparent',
  },
  carga: {
    marginTop: Spacing.six,
  },
  erro: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
});
