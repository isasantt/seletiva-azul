import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

// Cartão branco arredondado (estilo das referências).
export function Cartao({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.cartao, { backgroundColor: theme.backgroundElement }, style]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
    shadowColor: '#0B2A4A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
