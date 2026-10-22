import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Marca } from './marca';
import { ThemedText } from './themed-text';
import { Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Icone = ComponentProps<typeof Ionicons>['name'];

type CabecalhoProps = {
  titulo: string;
  subtitulo?: string;
  usuario?: string | null;
  /** Pequeno rótulo acima do título. Deixa o topo com cara de painel. */
  eyebrow?: string;
  icone?: Icone;
  /**
   * `hero` é o cabeçalho centralizado das telas de entrada.
   * `app` é o cabeçalho editorial usado nas telas internas.
   */
  variante?: 'hero' | 'app';
  acao?: ReactNode;
};

export function Cabecalho({
  titulo,
  subtitulo,
  usuario,
  eyebrow,
  icone = 'sparkles',
  variante = 'hero',
  acao,
}: CabecalhoProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const interno = variante === 'app';

  return (
    <View
      style={[
        styles.faixa,
        interno && styles.faixaApp,
        {
          backgroundColor: theme.primary,
          paddingTop: insets.top + (interno ? Spacing.three : Spacing.four),
        },
      ]}>
      <View
        pointerEvents="none"
        style={[styles.orbGrande, { backgroundColor: 'rgba(56, 189, 248, 0.13)' }]}
      />
      <View
        pointerEvents="none"
        style={[styles.orbPequeno, { backgroundColor: 'rgba(125, 211, 252, 0.09)' }]}
      />
      <Ionicons
        name="map-outline"
        size={interno ? 260 : 320}
        color={theme.sky}
        style={[styles.mapaFundo, interno ? styles.mapaInterno : styles.mapaHero]}
      />

      {interno ? (
        <>
          <View style={styles.topoApp}>
            <Marca claro compacto />
            {usuario ? (
              <View style={styles.usuarioPill}>
                <Ionicons name="person-circle-outline" size={15} color={theme.sky} />
                <ThemedText style={styles.usuarioTexto} numberOfLines={1}>
                  {usuario}
                </ThemedText>
              </View>
            ) : (
              acao
            )}
          </View>

          <View style={styles.conteudoApp}>
            {eyebrow ? (
              <View style={styles.eyebrow}>
                <Ionicons name={icone} size={12} color={theme.sky} />
                <ThemedText style={styles.eyebrowTexto}>{eyebrow}</ThemedText>
              </View>
            ) : null}

            <ThemedText style={[styles.tituloApp, { fontFamily: WebFont }]}>{titulo}</ThemedText>
            {subtitulo ? <ThemedText style={styles.subApp}>{subtitulo}</ThemedText> : null}
            {usuario ? acao : null}
          </View>
        </>
      ) : (
        <>
          <View
            style={[
              styles.icone,
              {
                backgroundColor: 'rgba(125, 211, 252, 0.14)',
                borderColor: 'rgba(125, 211, 252, 0.32)',
              },
            ]}>
            <Ionicons name="airplane" size={28} color={theme.sky} />
          </View>

          <ThemedText style={[styles.titulo, { fontFamily: WebFont }]}>{titulo}</ThemedText>
          {subtitulo ? <ThemedText style={styles.sub}>{subtitulo}</ThemedText> : null}
          {usuario ? (
            <View style={styles.usuario}>
              <Ionicons name="person-circle-outline" size={16} color={theme.sky} />
              <ThemedText style={styles.usuarioTexto} numberOfLines={1}>
                {usuario}
              </ThemedText>
            </View>
          ) : null}
          {acao}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  faixaApp: {
    alignItems: 'stretch',
    gap: 0,
    paddingBottom: Spacing.six - Spacing.one,
  },
  orbGrande: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
    top: -190,
    right: -100,
  },
  orbPequeno: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    bottom: -80,
    left: -40,
  },
  mapaFundo: {
    position: 'absolute',
    opacity: 0.08,
  },
  mapaHero: {
    right: -70,
    top: 20,
  },
  mapaInterno: {
    right: -50,
    top: -20,
  },
  topoApp: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  conteudoApp: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    gap: Spacing.two,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.24)',
    borderRadius: 999,
    backgroundColor: 'rgba(125, 211, 252, 0.1)',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    marginBottom: Spacing.one,
  },
  eyebrowTexto: {
    color: '#BAE6FD',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  icone: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  tituloApp: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.9,
    maxWidth: 760,
  },
  sub: {
    color: '#C7E8FF',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 520,
  },
  subApp: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 620,
  },
  usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
    maxWidth: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  usuarioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    maxWidth: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 1,
  },
  usuarioTexto: {
    color: '#D8EEFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
});
