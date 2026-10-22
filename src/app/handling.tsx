import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { Pill } from '@/components/pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TituloSecao } from '@/components/titulo-secao';
import { BottomTabInset, MaxContentWidth, Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nomeExibicao, useUsuarioAtual } from '@/hooks/use-usuario-atual';
import { supabase } from '@/supabase';
import { router } from 'expo-router';

const PASSOS = [
  {
    titulo: 'Escolha o voo atual',
    descricao: 'Selecione o voo que está sendo operado agora.',
    icone: 'airplane-outline' as const,
  },
  {
    titulo: 'Escaneie o QR Code da mala',
    descricao: 'A leitura identifica a etiqueta IATA e o histórico da bagagem.',
    icone: 'scan-outline' as const,
  },
  {
    titulo: 'Valide o voo e registre a baixa',
    descricao: 'Confirme o checkpoint e mantenha a jornada atualizada.',
    icone: 'checkmark-done-outline' as const,
  },
];

export default function HandlingScreen() {
  const theme = useTheme();
  const usuario = useUsuarioAtual();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingBottom: BottomTabInset + Spacing.three,
    },
    web: {
      paddingBottom: Spacing.four,
    },
  });

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        variante="app"
        eyebrow="HANDLING"
        icone="briefcase-outline"
        titulo="Operação de bagagens"
        subtitulo="Registre checkpoints com velocidade e mantenha a jornada da mala em dia."
        usuario={nomeExibicao(usuario)}
      />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.conteudo, contentPlatformStyle]}
          showsVerticalScrollIndicator={false}>
          <Cartao
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.primary,
                borderColor: 'rgba(125, 211, 252, 0.24)',
              },
            ]}>
            <View
              pointerEvents="none"
              style={[styles.heroOrb, { backgroundColor: 'rgba(56, 189, 248, 0.14)' }]}
            />
            <Ionicons
              name="map-outline"
              size={190}
              color={theme.sky}
              style={styles.heroMapa}
            />

            <Pill texto="PRONTO PARA OPERAR" cor={theme.sky} icone="radio-outline" />
            <ThemedText style={[styles.heroTitulo, { fontFamily: WebFont }]}>
              Cada leitura importa.
            </ThemedText>
            <ThemedText style={styles.heroTexto}>
              Escolha o voo, escaneie a etiqueta e registre o checkpoint. O offline sync cuida do
              resto quando a conexão apertar.
            </ThemedText>

            <View style={styles.heroStatus}>
              <View style={styles.heroStatusItem}>
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                <ThemedText style={styles.heroStatusTexto}>Sistema online</ThemedText>
              </View>
              <View style={styles.heroStatusItem}>
                <Ionicons name="cloud-offline-outline" size={14} color={theme.sky} />
                <ThemedText style={styles.heroStatusTexto}>Fila offline ativa</ThemedText>
              </View>
            </View>

            <Botao
              titulo="Selecionar voo e escanear"
              icone="scan-outline"
              iconeDireita="arrow-forward-outline"
              claro
              onPress={() => router.push('/selecao-voo')}
            />
          </Cartao>

          <TituloSecao
            eyebrow="FLUXO DE TRABALHO"
            titulo="Três passos, sem atrito"
            descricao="O scanner cruza a etiqueta com o voo selecionado e registra o evento IATA."
          />

          <Cartao style={styles.passosCartao}>
            {PASSOS.map((passo, indice) => (
              <View
                key={passo.titulo}
                style={[
                  styles.passo,
                  indice < PASSOS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}>
                <View
                  style={[
                    styles.passoNumero,
                    { backgroundColor: theme.accentSoft, borderColor: theme.border },
                  ]}>
                  <ThemedText style={[styles.passoNumeroTexto, { color: theme.accent }]}>
                    {String(indice + 1).padStart(2, '0')}
                  </ThemedText>
                </View>
                <View style={styles.passoTextos}>
                  <View style={styles.passoLinha}>
                    <Ionicons name={passo.icone} size={17} color={theme.accent} />
                    <ThemedText type="smallBold">{passo.titulo}</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {passo.descricao}
                  </ThemedText>
                </View>
              </View>
            ))}
          </Cartao>

          <View
            style={[
              styles.aviso,
              { backgroundColor: theme.accentSoft, borderColor: theme.border },
            ]}>
            <Ionicons name="information-circle-outline" size={19} color={theme.accent} />
            <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
              O registro exige um voo selecionado. Se a conexão cair, a leitura entra na fila local e
              sincroniza automaticamente.
            </ThemedText>
          </View>

          <Botao titulo="Sair da conta" icone="log-out-outline" contorno onPress={sair} />
        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  folha: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
  scroll: {
    width: '100%',
  },
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  heroCard: {
    overflow: 'hidden',
    gap: Spacing.two + 2,
    padding: Spacing.four,
    shadowOpacity: 0.2,
  },
  heroOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -120,
    right: -70,
  },
  heroMapa: {
    position: 'absolute',
    right: -40,
    bottom: -30,
    opacity: 0.08,
  },
  heroTitulo: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    maxWidth: 420,
  },
  heroTexto: {
    color: 'rgba(255, 255, 255, 0.74)',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 500,
  },
  heroStatus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  heroStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  heroStatusTexto: {
    color: '#C7E8FF',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  passosCartao: {
    paddingVertical: Spacing.one,
    gap: 0,
  },
  passo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two + 2,
    paddingVertical: Spacing.three,
  },
  passoNumero: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passoNumeroTexto: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  passoTextos: {
    flex: 1,
    gap: 3,
    paddingTop: 1,
  },
  passoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
});
