import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MarcaProps = {
  compacto?: boolean;
  claro?: boolean;
};

/** Wordmark do AtmosBag com o avião da identidade Azul. */
export function Marca({ compacto = false, claro = false }: MarcaProps) {
  const theme = useTheme();

  return (
    <View style={[styles.linha, compacto && styles.linhaCompacta]}>
      <View
        style={[
          styles.icone,
          compacto && styles.iconeCompacto,
          {
            backgroundColor: claro ? 'rgba(125, 211, 252, 0.16)' : theme.accentSoft,
            borderColor: claro ? 'rgba(125, 211, 252, 0.32)' : theme.border,
          },
        ]}>
        <Ionicons
          name="airplane"
          size={compacto ? 16 : 20}
          color={claro ? theme.sky : theme.accent}
        />
      </View>
      <Text
        style={[
          styles.texto,
          {
            color: claro ? '#FFFFFF' : theme.text,
            fontFamily: WebFont,
            fontSize: compacto ? 17 : 21,
          },
        ]}>
        AtmosBag
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  linhaCompacta: {
    gap: Spacing.one + 2,
  },
  icone: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeCompacto: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  texto: {
    fontWeight: '800',
    letterSpacing: -0.7,
  },
});
