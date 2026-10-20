import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

// Faixa marinho do topo (estilo das referências).
// A tela coloca uma folha clara arredondada por cima (ver styles.folha nas telas).
export function Cabecalho({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.faixa, { backgroundColor: theme.primary, paddingTop: insets.top + Spacing.four }]}>
      <Ionicons name="airplane" size={44} color="#FFFFFF" />
      <ThemedText style={styles.titulo}>{titulo}</ThemedText>
      {subtitulo ? <ThemedText style={styles.sub}>{subtitulo}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    color: '#C9D9E8',
    fontSize: 15,
    textAlign: 'center',
  },
});
