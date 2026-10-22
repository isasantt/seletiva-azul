import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Icone = ComponentProps<typeof Ionicons>['name'];

type PillProps = {
  texto: string;
  cor?: string;
  icone?: Icone;
  solido?: boolean;
};

/** Etiqueta arredondada para status, eventos e metadados. */
export function Pill({ texto, cor, icone, solido = false }: PillProps) {
  const theme = useTheme();
  const destaque = cor ?? theme.accent;
  const corTexto = solido ? '#FFFFFF' : destaque;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: solido ? destaque : `${destaque}14`,
          borderColor: solido ? destaque : `${destaque}38`,
        },
      ]}>
      {icone ? <Ionicons name={icone} size={11} color={corTexto} /> : null}
      <Text style={[styles.texto, { color: corTexto }]} numberOfLines={1}>
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.two + 1,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  texto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
});
