import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, View } from 'react-native';
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

// Uma mala + todos os checkpoints dela (do mais recente ao mais antigo)
type Checkpoint = {
  local: string | null;
  hora: string | null;
};

type MalaComCheckpoints = {
  id_mala: string;
  local: string | null;
  data: string | null;
  hora: string | null;
  checkpoints: Checkpoint[];
};

// Linha do tempo de uma mala (estilo app de encomenda)
function LinhaDoTempo({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const theme = useTheme();

  if (checkpoints.length === 0) {
    return <ThemedText type="small">Aguardando primeira leitura.</ThemedText>;
  }

  return (
    <View style={styles.linha}>
      {checkpoints.map((c, i) => {
        const primeiro = i === 0;
        const ultimo = i === checkpoints.length - 1;
        return (
          <View key={`${c.hora}-${i}`} style={styles.ponto}>
            <View style={styles.trilho}>
              <View
                style={[
                  styles.bolinha,
                  {
                    backgroundColor: primeiro ? theme.accent : theme.textSecondary,
                    width: primeiro ? 16 : 12,
                    height: primeiro ? 16 : 12,
                  },
                ]}
              />
              {!ultimo && <View style={[styles.fio, { backgroundColor: theme.textSecondary }]} />}
            </View>
            <View style={styles.textoPonto}>
              <ThemedText type={primeiro ? 'smallBold' : 'small'}>{c.local ?? '-'}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {c.hora ?? '-'}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function TelaCliente() {
  const theme = useTheme();

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

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  useEffect(() => {
    async function carregar() {
      // 1. Quem sou eu
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Minhas malas
      const { data: minhas } = await supabase
        .from('malas')
        .select('id_mala, local, data, hora')
        .eq('id_usuario', user.id);

      if (!minhas) {
        setCarregando(false);
        return;
      }

      // 3. Todos os checkpoints de cada mala (mais recente primeiro)
      const lista: MalaComCheckpoints[] = [];
      for (const mala of minhas) {
        const { data: pontos } = await supabase
          .from('historico_checkpoints')
          .select('local, hora')
          .eq('id_mala', mala.id_mala)
          .order('hora', { ascending: false });

        lista.push({
          id_mala: String(mala.id_mala),
          local: mala.local,
          data: mala.data,
          hora: mala.hora,
          checkpoints: (pontos ?? []) as Checkpoint[],
        });
      }

      setMalas(lista);
      setCarregando(false);
    }

    carregar();
  }, []);

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho titulo="Rastreio de Bagagem" subtitulo="Onde sua mala já passou" />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        {carregando ? (
          <ActivityIndicator size="large" style={styles.carga} />
        ) : (
          <FlatList
            data={malas}
            keyExtractor={(item) => item.id_mala}
            contentContainerStyle={[styles.list, contentPlatformStyle]}
            ListEmptyComponent={<ThemedText>Nenhuma mala vinculada a você.</ThemedText>}
            ListFooterComponent={
              <ThemedView style={styles.rodape}>
                <Botao titulo="Sair" contorno onPress={sair} />
              </ThemedView>
            }
            renderItem={({ item }) => (
              <Cartao>
                <View style={styles.topoMala}>
                  <Ionicons name="cube" size={28} color={theme.accent} />
                  <View style={styles.tituloMala}>
                    <ThemedText type="smallBold">Mala {item.id_mala}</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {item.local ?? 'posição desconhecida'} • {item.data ?? '-'}
                    </ThemedText>
                  </View>
                </View>
                <LinhaDoTempo checkpoints={item.checkpoints} />
              </Cartao>
            )}
          />
        )}
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
  topoMala: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tituloMala: {
    flex: 1,
    gap: 2,
  },
  linha: {
    gap: 0,
    marginTop: Spacing.two,
  },
  ponto: {
    flexDirection: 'row',
    gap: Spacing.two,
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
    opacity: 0.4,
    marginVertical: 2,
  },
  textoPonto: {
    flex: 1,
    gap: 2,
    paddingBottom: Spacing.three,
  },
});
