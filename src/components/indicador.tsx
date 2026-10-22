import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Icone = ComponentProps<typeof Ionicons>['name'];

type IndicadorProps = {
  valor: string | number;
  rotulo: string;
  icone: Icone;
  cor?: string;
  sufixo?: string;
};

/** Cartão compacto de número/indicador usado nos painéis internos. */
export function Indicador({ valor, rotulo, icone, cor, sufixo }: IndicadorProps) {
  const theme = useTheme();
  const destaque = cor ?? theme.accent;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          shadowColor: theme.primary,
        },
      ]}>
      <View style={[styles.icone, { backgroundColor: `${destaque}1A` }]}>
        <Ionicons name={icone} size={17} color={destaque} />
      </View>
      <View style={styles.valorLinha}>
        <Text style={[styles.valor, { color: theme.text, fontFamily: WebFont }]}>{valor}</Text>
        {sufixo ? (
          <Text style={[styles.sufixo, { color: theme.textSecondary }]}>{sufixo}</Text>
        ) : null}
      </View>
      <Text style={[styles.rotulo, { color: theme.textSecondary }]}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 104,
    minWidth: 96,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three - 2,
    gap: Spacing.one,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  icone: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  valorLinha: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  valor: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  sufixo: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  rotulo: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
