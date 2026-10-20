import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  desabilitado?: boolean;
  contorno?: boolean;
};

// Botão pílula cheio (accent) ou só contorno.
export function Botao({ titulo, onPress, desabilitado, contorno }: BotaoProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      style={[
        styles.base,
        {
          backgroundColor: contorno ? 'transparent' : theme.accent,
          borderColor: theme.accent,
          opacity: desabilitado ? 0.5 : 1,
        },
      ]}>
      <Text style={[styles.texto, { color: contorno ? theme.accent : '#FFFFFF' }]}>
        {titulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 2,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  texto: {
    fontSize: 16,
    fontWeight: '700',
  },
});
