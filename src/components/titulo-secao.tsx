import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TituloSecaoProps = {
  titulo: string;
  eyebrow?: string;
  descricao?: string;
  acao?: ReactNode;
  compacto?: boolean;
};

/** Cabeçalho de seção com o mesmo ritmo editorial da landing page. */
export function TituloSecao({
  titulo,
  eyebrow,
  descricao,
  acao,
  compacto = false,
}: TituloSecaoProps) {
  const theme = useTheme();

  return (
    <View style={[styles.linha, compacto && styles.linhaCompacta]}>
      <View style={styles.texto}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow}</Text>
        ) : null}
        <Text
          style={[
            styles.titulo,
            compacto && styles.tituloCompacto,
            { color: theme.text, fontFamily: WebFont },
          ]}>
          {titulo}
        </Text>
        {descricao ? (
          <Text style={[styles.descricao, { color: theme.textSecondary }]}>{descricao}</Text>
        ) : null}
      </View>
      {acao ? <View style={styles.acao}>{acao}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  linhaCompacta: {
    alignItems: 'center',
  },
  texto: {
    flex: 1,
    minWidth: 200,
    gap: Spacing.one,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  titulo: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tituloCompacto: {
    fontSize: 20,
    lineHeight: 26,
  },
  descricao: {
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 620,
  },
  acao: {
    alignSelf: 'flex-end',
  },
});
