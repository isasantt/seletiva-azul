import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ComponentProps } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Marca } from '@/components/marca';
import { MaxLandingWidth, Spacing, WebFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarTagIata } from '@/lib/iata';

type Icone = ComponentProps<typeof Ionicons>['name'];

type Passo = {
  numero: string;
  icone: Icone;
  titulo: string;
  texto: string;
};

type Recurso = {
  icone: Icone;
  titulo: string;
  texto: string;
};

const PASSOS: Passo[] = [
  {
    numero: '01',
    icone: 'person-add-outline',
    titulo: 'Crie sua conta',
    texto: 'Cadastre-se com e-mail e senha em menos de um minuto.',
  },
  {
    numero: '02',
    icone: 'barcode-outline',
    titulo: 'Vincule a etiqueta',
    texto: 'Digite os 10 dígitos IATA que estão impressos na sua bagagem.',
  },
  {
    numero: '03',
    icone: 'navigate-outline',
    titulo: 'Acompanhe cada leitura',
    texto: 'Veja aceitação, carregamento, transferência e chegada em tempo real.',
  },
];

const RECURSOS: Recurso[] = [
  {
    icone: 'radio-outline',
    titulo: 'Rastreio em tempo real',
    texto: 'Cada checkpoint registrado pela operação aparece na sua linha do tempo.',
  },
  {
    icone: 'notifications-outline',
    titulo: 'Alertas de conexão',
    texto: 'Avisos quando a bagagem está em risco de perder a conexão.',
  },
  {
    icone: 'document-text-outline',
    titulo: 'RIB e prazos ANAC',
    texto: 'Abra o Registro de Irregularidade e acompanhe os prazos de devolução.',
  },
  {
    icone: 'cloud-offline-outline',
    titulo: 'Funciona offline',
    texto: 'A fila local sincroniza as leituras quando a internet volta.',
  },
];

const ETAPAS = ['Aceitação', 'Carregamento', 'Transferência', 'Chegada'];

const BULLETS_PASSAGEIRO = [
  'Vínculo da mala por etiqueta IATA',
  'Linha do tempo com todos os checkpoints',
  'Abertura de RIB e acompanhamento ANAC',
];

const BULLETS_OPERACAO = [
  'Scanner com fila offline e sincronização',
  'Painéis para CCO, SAC e Handling',
  'Alertas de conexão e conformidade IATA',
];

export default function LandingPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const compacto = width < 760;
  const muitoCompacto = width < 360;
  const heroDuasColunas = width >= 980;
  const passosEmLinha = width >= 800;
  const paineisEmLinha = width >= 820;

  const irParaLogin = () => router.push('/login/login');
  const irParaCadastro = () => router.push('/login/cadastro');

  return (
    <View style={[styles.raiz, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.primary,
              paddingTop: insets.top + Spacing.four,
            },
          ]}>
          <View pointerEvents="none" style={[styles.orbGrande, { backgroundColor: 'rgba(56, 189, 248, 0.14)' }]} />
          <View pointerEvents="none" style={[styles.orbPequeno, { backgroundColor: 'rgba(125, 211, 252, 0.09)' }]} />
          <Ionicons
            name="map-outline"
            size={compacto ? 300 : 430}
            color={theme.sky}
            style={[styles.mapaFundo, { opacity: 0.11 }]}
          />

          <View style={styles.heroInner}>
            <View style={styles.nav}>
              <Marca claro compacto={compacto} />

              <View style={styles.navAcoes}>
                <Pressable
                  accessibilityRole="button"
                  onPress={irParaLogin}
                  style={({ pressed }) => [styles.navLink, { opacity: pressed ? 0.72 : 1 }]}>
                  <Text style={styles.navLinkTexto}>Entrar</Text>
                </Pressable>

                {!compacto ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={irParaCadastro}
                    style={({ pressed }) => [
                      styles.navCta,
                      { backgroundColor: theme.sky, opacity: pressed ? 0.84 : 1 },
                    ]}>
                    <Text style={[styles.navCtaTexto, { color: theme.primary }]}>Criar conta</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={[styles.heroConteudo, heroDuasColunas && styles.heroConteudoLinha]}>
              <View style={styles.heroTexto}>
                <View style={styles.eyebrow}>
                  <Ionicons name="sparkles" size={12} color={theme.sky} />
                  <Text style={[styles.eyebrowTexto, { color: theme.sky }]}>RASTREIO DE BAGAGEM</Text>
                </View>

                <Text
                  style={[
                    styles.titulo,
                    compacto && styles.tituloCompacto,
                    { fontFamily: WebFont },
                  ]}>
                  Sua mala,{' '}
                  <Text style={[styles.tituloDestaque, { color: theme.sky }]}>em cada etapa</Text> do
                  voo.
                </Text>

                <Text style={styles.subtitulo}>
                  Do check-in à esteira, o AtmosBag conecta passageiros e operação em uma única
                  jornada. Acompanhe o status da sua bagagem e aja antes que um problema vire
                  prejuízo.
                </Text>

                <View style={styles.ctas}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={irParaLogin}
                    style={({ pressed }) => [
                      styles.ctaPrimario,
                      {
                        backgroundColor: theme.sky,
                        shadowColor: theme.sky,
                        opacity: pressed ? 0.86 : 1,
                      },
                    ]}>
                    <Text style={[styles.ctaPrimarioTexto, { color: theme.primary }]}>
                      Acompanhar minha mala
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={theme.primary} />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={irParaCadastro}
                    style={({ pressed }) => [styles.ctaSecundario, { opacity: pressed ? 0.72 : 1 }]}>
                    <Text style={styles.ctaSecundarioTexto}>Criar conta</Text>
                  </Pressable>
                </View>

                <View style={styles.trustRow}>
                  <View style={styles.trustItem}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={theme.sky} />
                    <Text style={styles.trustTexto}>Dados protegidos</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Ionicons name="time-outline" size={14} color={theme.sky} />
                    <Text style={styles.trustTexto}>Tempo real</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Ionicons name="cloud-offline-outline" size={14} color={theme.sky} />
                    <Text style={styles.trustTexto}>Modo offline</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.heroVisual, !heroDuasColunas && styles.heroVisualCompacto]}>
                <View
                  style={[
                    styles.heroCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                      shadowColor: theme.primary,
                    },
                  ]}>
                  <View style={[styles.heroCardTopo, muitoCompacto && styles.heroCardTopoCompacto]}>
                    <View style={styles.heroCardIdentificacao}>
                      <Text style={[styles.heroCardLabel, { color: theme.textSecondary }]}>
                        MINHA MALA
                      </Text>
                      <Text style={[styles.heroCardTag, { color: theme.text, fontFamily: WebFont }]}>
                        {formatarTagIata('9900000001')}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        muitoCompacto && styles.statusPillCompacta,
                        { backgroundColor: theme.accentSoft, borderColor: theme.border },
                      ]}>
                      <View style={[styles.statusDot, { backgroundColor: theme.accent }]} />
                      <Text style={[styles.statusTexto, { color: theme.accent }]}>EM TRÂNSITO</Text>
                    </View>
                  </View>

                  <View style={styles.rota}>
                    <View>
                      <Text style={[styles.aeroporto, { color: theme.text, fontFamily: WebFont }]}>GRU</Text>
                      <Text style={[styles.cidade, { color: theme.textSecondary }]}>São Paulo</Text>
                    </View>

                    <View style={styles.rotaLinha}>
                      <View style={[styles.rotaPonto, { backgroundColor: theme.accent }]} />
                      {[0, 1, 2].map((i) => (
                        <View
                          key={`ida-${i}`}
                          style={[styles.rotaPontoPequeno, { backgroundColor: theme.border }]}
                        />
                      ))}
                      <Ionicons name="airplane" size={15} color={theme.accent} />
                      {[0, 1, 2].map((i) => (
                        <View
                          key={`volta-${i}`}
                          style={[styles.rotaPontoPequeno, { backgroundColor: theme.border }]}
                        />
                      ))}
                      <View style={[styles.rotaPonto, { backgroundColor: theme.border }]} />
                    </View>

                    <View style={styles.aeroportoDireita}>
                      <Text style={[styles.aeroporto, { color: theme.text, fontFamily: WebFont }]}>VCP</Text>
                      <Text style={[styles.cidade, { color: theme.textSecondary }]}>Campinas</Text>
                    </View>
                  </View>

                  <View style={[styles.progresso, muitoCompacto && styles.progressoCompacto]}>
                    {muitoCompacto ? null : (
                      <View style={[styles.progressoLinha, { backgroundColor: theme.border }]} />
                    )}
                    {ETAPAS.map((etapa, indice) => {
                      const concluida = indice < 2;
                      const atual = indice === 2;

                      return (
                        <View
                          key={etapa}
                          style={[styles.etapa, muitoCompacto && styles.etapaCompacta]}>
                          <View
                            style={[
                              styles.etapaBolinha,
                              {
                                backgroundColor: concluida || atual ? theme.accent : theme.backgroundSelected,
                                borderColor: atual ? theme.sky : theme.border,
                                borderWidth: atual ? 3 : 1,
                              },
                            ]}>
                            {concluida ? (
                              <Ionicons name="checkmark" size={8} color={theme.onAccent} />
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.etapaLabel,
                              muitoCompacto && styles.etapaLabelCompacta,
                              {
                                color: atual ? theme.text : theme.textSecondary,
                                fontWeight: atual ? '800' : '700',
                              },
                            ]}>
                            {etapa}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={[styles.heroCardRodape, { borderTopColor: theme.border }]}>
                    <Ionicons name="checkmark-circle" size={15} color={theme.accent} />
                    <Text style={[styles.heroCardRodapeTexto, { color: theme.textSecondary }]}>
                      Última leitura: <Text style={{ color: theme.text, fontWeight: '700' }}>Transferência em VCP</Text>
                    </Text>
                    <Text style={[styles.heroCardHora, { color: theme.textSecondary }]}>agora</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.floating,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                      shadowColor: theme.primary,
                      right: compacto ? 10 : -14,
                    },
                  ]}>
                  <View style={[styles.floatingIcone, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name="notifications" size={15} color={theme.accent} />
                  </View>
                  <View style={styles.floatingTexto}>
                    <Text style={[styles.floatingTitulo, { color: theme.text }]}>Sua mala embarcou</Text>
                    <Text style={[styles.floatingSub, { color: theme.textSecondary }]}>
                      notificação em tempo real
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.folha, { backgroundColor: theme.background }]}>
          <View style={styles.folhaInner}>
            <View style={styles.secao}>
              <Text style={[styles.sobretitulo, { color: theme.accent }]}>SIMPLES DO INÍCIO AO FIM</Text>
              <Text
                style={[
                  styles.secaoTitulo,
                  compacto && styles.secaoTituloCompacto,
                  { color: theme.text, fontFamily: WebFont },
                ]}>
                Como funciona?
              </Text>
              <Text style={[styles.secaoTexto, { color: theme.textSecondary }]}>
                Três passos para tirar a bagagem do escuro. Sem burocracia e sem precisar instalar
                nada além do app.
              </Text>

              <View style={[styles.passos, passosEmLinha && styles.passosEmLinha]}>
                {PASSOS.map((passo) => (
                  <View
                    key={passo.numero}
                    style={[
                      styles.passo,
                      passosEmLinha && styles.passoEmLinha,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}>
                    <Text style={[styles.passoNumero, { color: theme.accent, fontFamily: WebFont }]}>
                      {passo.numero}
                    </Text>
                    <View
                      style={[
                        styles.passoIcone,
                        { backgroundColor: theme.accentSoft, borderColor: theme.border },
                      ]}>
                      <Ionicons name={passo.icone} size={22} color={theme.accent} />
                    </View>
                    <Text style={[styles.passoTitulo, { color: theme.text, fontFamily: WebFont }]}>
                      {passo.titulo}
                    </Text>
                    <Text style={[styles.passoTexto, { color: theme.textSecondary }]}>{passo.texto}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.faixa,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              {[
                { valor: '10', rotulo: 'dígitos IATA' },
                { valor: '24h', rotulo: 'rastreio contínuo' },
                { valor: 'RIB', rotulo: 'prazos ANAC' },
                { valor: '0', rotulo: 'papelada' },
              ].map((item) => (
                <View key={item.rotulo} style={styles.faixaItem}>
                  <Text style={[styles.faixaValor, { color: theme.accent, fontFamily: WebFont }]}>
                    {item.valor}
                  </Text>
                  <Text style={[styles.faixaRotulo, { color: theme.textSecondary }]}>{item.rotulo}</Text>
                </View>
              ))}
            </View>

            <View style={styles.secao}>
              <Text style={[styles.sobretitulo, { color: theme.accent }]}>TUDO EM UM SÓ LUGAR</Text>
              <Text
                style={[
                  styles.secaoTitulo,
                  compacto && styles.secaoTituloCompacto,
                  { color: theme.text, fontFamily: WebFont },
                ]}>
                A jornada inteira, conectada.
              </Text>
              <Text style={[styles.secaoTexto, { color: theme.textSecondary }]}>
                Informação certa, na hora certa, para quem voa e para quem faz o voo acontecer.
              </Text>

              <View style={styles.recursos}>
                {RECURSOS.map((recurso) => (
                  <View
                    key={recurso.titulo}
                    style={[
                      styles.recurso,
                      {
                        flexBasis: compacto ? '100%' : '47%',
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}>
                    <View
                      style={[
                        styles.recursoIcone,
                        { backgroundColor: theme.accentSoft, borderColor: theme.border },
                      ]}>
                      <Ionicons name={recurso.icone} size={21} color={theme.accent} />
                    </View>
                    <View style={styles.recursoTexto}>
                      <Text style={[styles.recursoTitulo, { color: theme.text, fontFamily: WebFont }]}>
                        {recurso.titulo}
                      </Text>
                      <Text style={[styles.recursoDescricao, { color: theme.textSecondary }]}>
                        {recurso.texto}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.duasColunas, paineisEmLinha && styles.duasColunasLinha]}>
              <View
                style={[
                  styles.painel,
                  paineisEmLinha && styles.painelEmLinha,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View
                  style={[
                    styles.painelIcone,
                    { backgroundColor: theme.accentSoft, borderColor: theme.border },
                  ]}>
                  <Ionicons name="person-outline" size={22} color={theme.accent} />
                </View>
                <Text style={[styles.painelTitulo, { color: theme.text, fontFamily: WebFont }]}>
                  Para quem voa
                </Text>
                <Text style={[styles.painelTexto, { color: theme.textSecondary }]}>
                  Saiba onde sua mala está, receba avisos e resolva imprevistos sem correr atrás.
                </Text>
                {BULLETS_PASSAGEIRO.map((item) => (
                  <View key={item} style={styles.bullet}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
                    <Text style={[styles.bulletTexto, { color: theme.text }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <View
                style={[
                  styles.painel,
                  paineisEmLinha && styles.painelEmLinha,
                  { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}>
                <View
                  style={[
                    styles.painelIcone,
                    {
                      backgroundColor: 'rgba(125, 211, 252, 0.14)',
                      borderColor: 'rgba(125, 211, 252, 0.3)',
                    },
                  ]}>
                  <Ionicons name="briefcase-outline" size={22} color={theme.sky} />
                </View>
                <Text style={[styles.painelTitulo, { color: '#FFFFFF', fontFamily: WebFont }]}>
                  Para quem opera
                </Text>
                <Text style={[styles.painelTexto, { color: 'rgba(255, 255, 255, 0.74)' }]}>
                  Uma visão compartilhada da operação para agir antes do problema chegar ao
                  passageiro.
                </Text>
                {BULLETS_OPERACAO.map((item) => (
                  <View key={item} style={styles.bullet}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.sky} />
                    <Text style={[styles.bulletTexto, { color: '#FFFFFF' }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.ctaFinal,
                paineisEmLinha && styles.ctaFinalLinha,
                { backgroundColor: theme.primary },
              ]}>
              <Ionicons
                name="airplane"
                size={220}
                color={theme.sky}
                style={styles.ctaAviao}
              />
              <View style={styles.ctaFinalTexto}>
                <Text style={[styles.ctaFinalTitulo, { fontFamily: WebFont }]}>
                  Pronto para acompanhar sua mala?
                </Text>
                <Text style={styles.ctaFinalSub}>
                  Entre na sua conta ou crie uma agora. Leva menos de um minuto.
                </Text>
              </View>

              <View style={styles.ctaFinalBotoes}>
                <Pressable
                  accessibilityRole="button"
                  onPress={irParaLogin}
                  style={({ pressed }) => [
                    styles.ctaPrimario,
                    {
                      backgroundColor: theme.sky,
                      shadowColor: theme.sky,
                      opacity: pressed ? 0.86 : 1,
                    },
                  ]}>
                  <Text style={[styles.ctaPrimarioTexto, { color: theme.primary }]}>Entrar</Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.primary} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={irParaCadastro}
                  style={({ pressed }) => [styles.ctaSecundario, { opacity: pressed ? 0.72 : 1 }]}>
                  <Text style={styles.ctaSecundarioTexto}>Criar conta</Text>
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.footer,
                compacto && styles.footerCompacto,
                { borderTopColor: theme.border },
              ]}>
              <View style={styles.footerMarca}>
                <Marca compacto />
                <Text style={[styles.footerTexto, { color: theme.textSecondary }]}>
                  Bagagem tranquila, do check-in à chegada.
                </Text>
              </View>

              <View style={styles.footerLinks}>
                <Pressable accessibilityRole="button" onPress={irParaLogin}>
                  <Text style={[styles.footerLink, { color: theme.textSecondary }]}>Entrar</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={irParaCadastro}>
                  <Text style={[styles.footerLink, { color: theme.textSecondary }]}>Criar conta</Text>
                </Pressable>
                <Text style={[styles.footerCopy, { color: theme.textSecondary }]}>
                  © 2026 AtmosBag · Azul
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: Spacing.six + Spacing.two,
  },
  orbGrande: {
    position: 'absolute',
    width: 540,
    height: 540,
    borderRadius: 999,
    top: -270,
    right: -170,
  },
  orbPequeno: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    bottom: -110,
    left: -90,
  },
  mapaFundo: {
    position: 'absolute',
    right: -90,
    top: 60,
  },
  heroInner: {
    width: '100%',
    maxWidth: MaxLandingWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.six,
  },
  navAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  navLink: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  navLinkTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  navCta: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  navCtaTexto: {
    fontSize: 13,
    fontWeight: '800',
  },
  heroConteudo: {
    gap: Spacing.five,
    paddingBottom: Spacing.three,
  },
  heroConteudoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.six,
  },
  heroTexto: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.three,
    maxWidth: 640,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.28)',
    backgroundColor: 'rgba(125, 211, 252, 0.1)',
    borderRadius: 999,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
  },
  eyebrowTexto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '800',
    letterSpacing: -1.8,
  },
  tituloCompacto: {
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.1,
  },
  tituloDestaque: {
    fontWeight: '800',
  },
  subtitulo: {
    color: 'rgba(255, 255, 255, 0.76)',
    fontSize: 17,
    lineHeight: 27,
    fontWeight: '500',
    maxWidth: 580,
  },
  ctas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  ctaPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three - 2,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ctaPrimarioTexto: {
    fontSize: 15,
    fontWeight: '800',
  },
  ctaSecundario: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three - 2,
  },
  ctaSecundarioTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  trustTexto: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  heroVisual: {
    width: 390,
    flexShrink: 0,
    position: 'relative',
    paddingBottom: Spacing.six,
  },
  heroVisualCompacto: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
  heroCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: Spacing.four - 2,
    gap: Spacing.three,
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  heroCardTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  heroCardTopoCompacto: {
    flexWrap: 'wrap',
    rowGap: Spacing.one,
  },
  heroCardIdentificacao: {
    gap: 2,
  },
  heroCardLabel: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroCardTag: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 1,
  },
  statusPillCompacta: {
    marginLeft: 'auto',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statusTexto: {
    fontSize: 8,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rota: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  rotaLinha: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  rotaPonto: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  rotaPontoPequeno: {
    width: 3,
    height: 3,
    borderRadius: 999,
  },
  aeroporto: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  aeroportoDireita: {
    alignItems: 'flex-end',
  },
  cidade: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  progresso: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  progressoCompacto: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: Spacing.one,
  },
  progressoLinha: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: 6,
    height: 2,
    borderRadius: 999,
  },
  etapa: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  etapaCompacta: {
    flexBasis: '50%',
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.one + 2,
    paddingRight: Spacing.one,
  },
  etapaBolinha: {
    width: 14,
    height: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etapaLabel: {
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  etapaLabelCompacta: {
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'left',
  },
  heroCardRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderTopWidth: 1,
    paddingTop: Spacing.two + 2,
  },
  heroCardRodapeTexto: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  heroCardHora: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  floating: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    maxWidth: 250,
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.two + 2,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  floatingIcone: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTexto: {
    flex: 1,
    gap: 1,
  },
  floatingTitulo: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  floatingSub: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '600',
  },
  folha: {
    marginTop: -30,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: Spacing.six - Spacing.one,
  },
  folhaInner: {
    width: '100%',
    maxWidth: MaxLandingWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  secao: {
    gap: Spacing.two + 2,
    marginBottom: Spacing.six,
  },
  sobretitulo: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  secaoTitulo: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1.1,
    maxWidth: 720,
  },
  secaoTituloCompacto: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  secaoTexto: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
    maxWidth: 680,
    marginTop: Spacing.one,
  },
  passos: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  passosEmLinha: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  passo: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 220,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four - 2,
    gap: Spacing.two,
  },
  passoEmLinha: {
    flex: 1,
    flexBasis: 0,
  },
  passoNumero: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.four,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '800',
    opacity: 0.14,
  },
  passoIcone: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  passoTitulo: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  passoTexto: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  faixa: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.three,
    marginBottom: Spacing.six,
    columnGap: Spacing.three,
    rowGap: Spacing.two,
  },
  faixaItem: {
    flexGrow: 1,
    flexBasis: 140,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.one,
  },
  faixaValor: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  faixaRotulo: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  recursos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  recurso: {
    flexGrow: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 22,
    padding: Spacing.four - 2,
  },
  recursoIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recursoTexto: {
    flex: 1,
    gap: Spacing.one,
  },
  recursoTitulo: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  recursoDescricao: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  duasColunas: {
    gap: Spacing.three,
    marginBottom: Spacing.six,
  },
  duasColunasLinha: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  painel: {
    borderRadius: 28,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two + 2,
  },
  painelEmLinha: {
    flex: 1,
    flexBasis: 0,
  },
  painelIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  painelTitulo: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  painelTexto: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: Spacing.one,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  bulletTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  ctaFinal: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 32,
    padding: Spacing.five,
    gap: Spacing.four,
    marginBottom: Spacing.six,
  },
  ctaFinalLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.five,
  },
  ctaAviao: {
    position: 'absolute',
    right: -24,
    bottom: -36,
    opacity: 0.1,
  },
  ctaFinalTexto: {
    flex: 1,
    gap: Spacing.two,
  },
  ctaFinalTitulo: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.9,
    maxWidth: 560,
  },
  ctaFinalSub: {
    color: 'rgba(255, 255, 255, 0.74)',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    maxWidth: 520,
  },
  ctaFinalBotoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(125, 211, 252, 0.16)',
    paddingTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  footerCompacto: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  footerMarca: {
    gap: Spacing.two,
  },
  footerTexto: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.three,
  },
  footerLink: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  footerCopy: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
});
