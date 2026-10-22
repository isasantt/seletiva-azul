import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Icone = ComponentProps<typeof Ionicons>['name'];

type EstadoVazioProps = {
  icone: Icone;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
};

/** Estado vazio acolhedor, no lugar de cards cinzentos sem conteúdo. */
export function EstadoVazio({ icone, titulo, descricao, acao }: EstadoVazioProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.caixa,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={[styles.icone, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icone} size={28} color={theme.accent} />
      </View>
      <Text style={[styles.titulo, { color: theme.text, fontFamily: WebFont }]}>{titulo}</Text>
      <Text style={[styles.descricao, { color: theme.textSecondary }]}>{descricao}</Text>
      {acao}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 26,
    borderWidth: 1,
    padding: Spacing.four,
  },
  icone: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  titulo: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  descricao: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 380,
  },
});
