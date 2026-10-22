import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Icone = ComponentProps<typeof Ionicons>['name'];

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  desabilitado?: boolean;
  contorno?: boolean;
  /** Versão translúcida para botões sobre faixas/cartões marinho. */
  claro?: boolean;
  icone?: Icone;
  iconeDireita?: Icone;
  pequeno?: boolean;
  carregando?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Botão pílula cheio (accent) ou só contorno.
export function Botao({
  titulo,
  onPress,
  desabilitado,
  contorno,
  claro,
  icone,
  iconeDireita,
  pequeno,
  carregando,
  style,
}: BotaoProps) {
  const theme = useTheme();
  const cor = claro ? '#FFFFFF' : contorno ? theme.accent : theme.onAccent;
  const corFundo = claro
    ? contorno
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.16)'
    : contorno
      ? 'transparent'
      : theme.accent;
  const corBorda = claro ? 'rgba(255, 255, 255, 0.3)' : theme.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      onPress={onPress}
      disabled={desabilitado || carregando}
      style={({ pressed }) => [
        styles.base,
        pequeno && styles.pequeno,
        {
          backgroundColor: corFundo,
          borderColor: corBorda,
          opacity: desabilitado ? 0.5 : pressed ? 0.82 : 1,
          shadowColor: contorno || claro ? 'transparent' : theme.accent,
        },
        style,
      ]}>
      {carregando ? (
        <ActivityIndicator size="small" color={cor} />
      ) : icone ? (
        <Ionicons name={icone} size={pequeno ? 15 : 18} color={cor} />
      ) : null}
      <Text style={[styles.texto, pequeno && styles.textoPequeno, { color: cor }]}>
        {titulo}
      </Text>
      {iconeDireita && !carregando ? (
        <Ionicons name={iconeDireita} size={pequeno ? 15 : 18} color={cor} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  pequeno: {
    paddingVertical: Spacing.one + 3,
    paddingHorizontal: Spacing.three - 2,
  },
  texto: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  textoPequeno: {
    fontSize: 12,
    lineHeight: 16,
  },
});
