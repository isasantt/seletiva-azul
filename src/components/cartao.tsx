import { StyleSheet, View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CartaoProps = ViewProps & {
  /** Remove a sombra para cartões encaixados em painéis. */
  plano?: boolean;
};

// Cartão arredondado com borda sutil — linguagem visual das referências.
export function Cartao({ style, children, plano = false, ...rest }: CartaoProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.cartao,
        plano && styles.plano,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          shadowColor: theme.primary,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: 26,
    borderWidth: 1,
    padding: Spacing.four - 4,
    gap: Spacing.two,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  plano: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});
