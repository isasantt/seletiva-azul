import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Icone = ComponentProps<typeof Ionicons>['name'];

type CampoTextoProps = TextInputProps & {
  rotulo: string;
  icone: Icone;
  erro?: string | null;
};

/** Campo de formulário com rótulo, ícone, foco e botão de mostrar senha. */
export function CampoTexto({
  rotulo,
  icone,
  erro,
  secureTextEntry = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: CampoTextoProps) {
  const theme = useTheme();
  const [focado, setFocado] = useState(false);
  const [visivel, setVisivel] = useState(false);

  return (
    <View style={styles.campo}>
      <Text style={[styles.rotulo, { color: theme.textSecondary }]}>{rotulo}</Text>
      <View
        style={[
          styles.caixa,
          {
            backgroundColor: theme.background,
            borderColor: erro ? theme.danger : focado ? theme.accent : theme.border,
          },
        ]}>
        <Ionicons name={icone} size={18} color={focado ? theme.accent : theme.textSecondary} />
        <TextInput
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secureTextEntry && !visivel}
          style={[styles.input, { color: theme.text }, style]}
          onFocus={(event) => {
            setFocado(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocado(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setVisivel((atual) => !atual)}
            hitSlop={8}
            style={styles.olho}>
            <Ionicons
              name={visivel ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {erro ? (
        <View style={styles.erroLinha}>
          <Ionicons name="alert-circle-outline" size={13} color={theme.danger} />
          <Text style={[styles.erro, { color: theme.danger }]}>{erro}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: Spacing.one + 2,
  },
  rotulo: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  caixa: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three - 2,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.two + 4,
    fontSize: 15,
    lineHeight: 20,
  },
  olho: {
    padding: Spacing.one,
  },
  erroLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  erro: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
});
