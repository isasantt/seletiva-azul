import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '@supabase/supabase-js';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { CampoTexto } from '@/components/campo-texto';
import { Cartao } from '@/components/cartao';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TituloSecao } from '@/components/titulo-secao';
import { BottomTabInset, MaxContentWidth, Spacing, WebFont } from '@/constants/theme';
import { garantirPerfilECalcularDestino } from '@/lib/destino';
import { mensagemErro } from '@/lib/erros';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/supabase';
import { router, useLocalSearchParams } from 'expo-router';

const TIMEOUT_MS = 15000;

function comTimeout<T>(promessa: PromiseLike<T>, etapa: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promessa),
    new Promise<never>((_, rejeitar) =>
      setTimeout(
        () => rejeitar(new Error(`${etapa} demorou demais. Verifique a internet do celular.`)),
        TIMEOUT_MS,
      ),
    ),
  ]);
}

// Validação simples de e-mail: precisa ter algo@dominio
function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Senha forte: ao menos 6 caracteres, com letra, número e especial
function senhaForte(senha: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/.test(senha);
}

/** Para onde o Supabase manda o usuário depois de clicar no e-mail. */
function urlRedirecionamento(): string | undefined {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/?confirmado=1`;
  }
  return 'atmosbag://?confirmado=1';
}

type Aviso = { texto: string; tipo: 'info' | 'ok' | 'erro' };

export default function TelaCadastro() {
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingBottom: BottomTabInset + Spacing.three,
    },
    web: {
      paddingBottom: Spacing.four,
    },
  });

  // Vem do login (usuário não encontrado): já chega preenchido
  const params = useLocalSearchParams<{ email?: string; senha?: string }>();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [senha, setSenha] = useState(typeof params.senha === 'string' ? params.senha : '');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sessaoEmail, setSessaoEmail] = useState<string | null>(null);
  const [confirmacaoEmail, setConfirmacaoEmail] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const concluindoRef = useRef(false);

  // Mostra de quem é a sessão atual (evita gravar na conta errada)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessaoEmail(data.user?.email ?? null);
      if (!email.trim() && data.user?.email) setEmail(data.user.email);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const concluirAcesso = useCallback(
    async (user: User, origem: 'cadastro' | 'confirmacao' = 'cadastro') => {
      if (concluindoRef.current) return;
      concluindoRef.current = true;

      if (origem === 'confirmacao') setConfirmando(true);
      else setCarregando(true);

      try {
        const destino = await comTimeout(
          garantirPerfilECalcularDestino(user, nome.trim()),
          'Busca do perfil',
        );

        if (!destino) {
          const mensagem =
            'Seu perfil ainda não tem uma área ou cargo configurado. Fale com o administrador.';
          if (origem === 'confirmacao') {
            setAviso({ texto: mensagem, tipo: 'erro' });
          } else {
            setErro(mensagem);
          }
          return;
        }

        router.replace(destino);
      } catch (e) {
        const mensagem = mensagemErro(
          e,
          'Não foi possível carregar seu perfil. Tente novamente.',
        );
        if (origem === 'confirmacao') {
          setAviso({ texto: mensagem, tipo: 'erro' });
        } else {
          setErro(mensagem);
        }
      } finally {
        concluindoRef.current = false;
        setConfirmando(false);
        setCarregando(false);
      }
    },
    [nome],
  );

  // Enquanto o e-mail não é confirmado, ficamos de olho na sessão. Assim que
  // o Supabase confirmar, o usuário cai direto na tela do perfil — sem login.
  useEffect(() => {
    if (!confirmacaoEmail) return;

    let ativo = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (ativo && session?.user) void concluirAcesso(session.user, 'confirmacao');
    });

    const intervalo = setInterval(async () => {
      if (!ativo) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (ativo && session?.user) void concluirAcesso(session.user, 'confirmacao');
    }, 4000);

    return () => {
      ativo = false;
      clearInterval(intervalo);
      subscription.unsubscribe();
    };
  }, [confirmacaoEmail, concluirAcesso]);

  // Checklist ao vivo da senha (verde = ok, vermelho = falta)
  const regras = [
    { texto: '6+ caracteres', ok: senha.length >= 6 },
    { texto: 'letra', ok: /[A-Za-z]/.test(senha) },
    { texto: 'número', ok: /\d/.test(senha) },
    { texto: 'especial', ok: /[^A-Za-z\d]/.test(senha) },
  ];

  // Força 0-4 = quantas regras cumpridas
  const forca = regras.filter((r) => r.ok).length;
  const coresForca = ['#E5484D', '#F5A524', '#D4C226', '#30A46C'];
  const nomesForca = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  const erroEmail = email.length > 0 && !emailValido(email) ? 'Digite um e-mail válido (ex: nome@email.com).' : null;
  const erroSenha =
    senha.length > 0 && !senhaForte(senha)
      ? 'Use 6+ caracteres, com letra, número e caractere especial.'
      : null;

  async function lidarComCadastro() {
    setCarregando(true);
    setErro(null);
    setAviso(null);

    if (!nome.trim()) {
      setErro('Informe seu nome para concluir o cadastro.');
      setCarregando(false);
      return;
    }

    try {
      // Sem sessão = conta nova: cria no Auth primeiro
      let {
        data: { user },
      } = await comTimeout(supabase.auth.getUser(), 'Sessão');

      // Aparelho compartilhado: se digitou outro e-mail, derruba a sessão antiga
      if (user && email.trim() && user.email?.toLowerCase() !== email.trim().toLowerCase()) {
        await supabase.auth.signOut();
        user = null;
      }

      if (!user) {
        if (!emailValido(email)) {
          setErro('Digite um e-mail válido (ex: nome@email.com).');
          return;
        }
        if (!senhaForte(senha)) {
          setErro('A senha precisa de 6+ caracteres, com letra, número e especial.');
          return;
        }

        const { data, error: erroSignUp } = await comTimeout(
          supabase.auth.signUp({
            email: email.trim(),
            password: senha,
            options: {
              data: { nome: nome.trim(), cargo: 'cliente' },
              emailRedirectTo: urlRedirecionamento(),
            },
          }),
          'Criação da conta',
        );

        if (erroSignUp) {
          setErro(
            mensagemErro(erroSignUp, 'Não foi possível criar a conta. Tente novamente.'),
          );
          return;
        }

        // Projeto sem confirmação de e-mail: o Supabase já devolve a sessão.
        if (data.session?.user) {
          await concluirAcesso(data.session.user);
          return;
        }

        // Se a confirmação estiver desligada, esta tentativa conclui o acesso.
        const tentativa = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (tentativa.data.session?.user) {
          await concluirAcesso(tentativa.data.session.user);
          return;
        }

        // Com "Confirm email" ligado, ainda não há sessão. Em vez de voltar
        // para o login, mostramos a confirmação e esperamos a sessão chegar.
        setConfirmacaoEmail(email.trim().toLowerCase());
        setAviso({
          texto: 'Conta criada! Enviamos um link de confirmação para o seu e-mail.',
          tipo: 'ok',
        });
        return;
      }

      // Já existe sessão (por exemplo, atualização de nome no mesmo aparelho).
      await concluirAcesso(user);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível concluir o cadastro. Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  async function tentarConfirmado() {
    if (!confirmacaoEmail) return;

    setConfirmando(true);
    setAviso(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: confirmacaoEmail,
        password: senha,
      });

      if (error) {
        setAviso({
          texto: 'Ainda não identificamos a confirmação. Abra o link do e-mail e tente de novo.',
          tipo: 'info',
        });
        return;
      }

      if (data.user) await concluirAcesso(data.user, 'confirmacao');
    } catch (e) {
      setAviso({
        texto: mensagemErro(e, 'Não foi possível verificar a confirmação. Tente novamente.'),
        tipo: 'erro',
      });
    } finally {
      setConfirmando(false);
    }
  }

  async function reenviarEmail() {
    if (!confirmacaoEmail) return;

    setReenviando(true);
    setAviso(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: confirmacaoEmail,
        options: { emailRedirectTo: urlRedirecionamento() },
      });

      if (error) {
        setAviso({
          texto: mensagemErro(error, 'Não foi possível reenviar o e-mail agora.'),
          tipo: 'erro',
        });
        return;
      }

      setAviso({
        texto: 'E-mail reenviado. Confira também a caixa de spam.',
        tipo: 'ok',
      });
    } catch (e) {
      setAviso({
        texto: mensagemErro(e, 'Não foi possível reenviar o e-mail agora.'),
        tipo: 'erro',
      });
    } finally {
      setReenviando(false);
    }
  }

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        titulo={confirmacaoEmail ? 'Confirme seu e-mail' : 'Criar conta'}
        subtitulo={
          confirmacaoEmail
            ? 'AtmosBag · Um passo para acompanhar sua bagagem'
            : sessaoEmail
              ? `AtmosBag · Sessão atual: ${sessaoEmail}`
              : 'AtmosBag · Comece a acompanhar sua bagagem'
        }
      />

      <ScrollView
        style={[styles.folha, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.folhaDentro, contentPlatformStyle]}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.limite}>
          {confirmacaoEmail ? (
            <Cartao style={styles.confirmacaoCartao}>
              <View style={styles.confirmacaoIconeWrap}>
                <View style={[styles.confirmacaoIcone, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="mail-unread-outline" size={30} color={theme.accent} />
                </View>
              </View>

              <ThemedText style={[styles.confirmacaoTitulo, { color: theme.text, fontFamily: WebFont }]}>
                Falta só confirmar seu e-mail
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.confirmacaoTexto}>
                Enviamos um link para{' '}
                <ThemedText type="smallBold">{confirmacaoEmail}</ThemedText>. Assim que confirmar,
                você entra direto na sua área de passageiro.
              </ThemedText>

              <View style={styles.passosConfirmacao}>
                {[
                  { icone: 'mail-open-outline' as const, texto: 'Abra o e-mail e toque em confirmar' },
                  { icone: 'phone-portrait-outline' as const, texto: 'Volte para o AtmosBag' },
                  { icone: 'sparkles-outline' as const, texto: 'Entraremos automaticamente na sua conta' },
                ].map((passo, indice) => (
                  <View key={passo.texto} style={styles.passoConfirmacao}>
                    <View
                      style={[
                        styles.passoNumero,
                        { backgroundColor: theme.accentSoft, borderColor: theme.border },
                      ]}>
                      <ThemedText style={[styles.passoNumeroTexto, { color: theme.accent }]}>
                        {indice + 1}
                      </ThemedText>
                    </View>
                    <Ionicons name={passo.icone} size={17} color={theme.accent} />
                    <ThemedText type="small" style={styles.passoTexto}>
                      {passo.texto}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {aviso ? (
                <View
                  style={[
                    styles.alerta,
                    {
                      backgroundColor:
                        aviso.tipo === 'erro'
                          ? `${theme.danger}10`
                          : aviso.tipo === 'ok'
                            ? `${theme.success}10`
                            : theme.accentSoft,
                      borderColor:
                        aviso.tipo === 'erro'
                          ? `${theme.danger}35`
                          : aviso.tipo === 'ok'
                            ? `${theme.success}35`
                            : theme.border,
                    },
                  ]}>
                  <Ionicons
                    name={
                      aviso.tipo === 'erro'
                        ? 'alert-circle-outline'
                        : aviso.tipo === 'ok'
                          ? 'checkmark-circle-outline'
                          : 'information-circle-outline'
                    }
                    size={17}
                    color={
                      aviso.tipo === 'erro'
                        ? theme.danger
                        : aviso.tipo === 'ok'
                          ? theme.success
                          : theme.accent
                    }
                  />
                  <ThemedText
                    type="small"
                    style={{
                      color:
                        aviso.tipo === 'erro'
                          ? theme.danger
                          : aviso.tipo === 'ok'
                            ? theme.success
                            : theme.textSecondary,
                      flex: 1,
                    }}>
                    {aviso.texto}
                  </ThemedText>
                </View>
              ) : null}

              <Botao
                titulo="Já confirmei"
                icone="checkmark-circle-outline"
                onPress={tentarConfirmado}
                carregando={confirmando}
              />
              <Botao
                titulo="Reenviar e-mail"
                icone="paper-plane-outline"
                contorno
                onPress={reenviarEmail}
                carregando={reenviando}
              />

              <Pressable
                onPress={() => {
                  setConfirmacaoEmail(null);
                  setAviso(null);
                  setErro(null);
                }}
                style={styles.trocarEmail}>
                <Ionicons name="create-outline" size={15} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Usar outro e-mail
                </ThemedText>
              </Pressable>
            </Cartao>
          ) : (
            <>
              <TituloSecao
                eyebrow="PRIMEIRO ACESSO"
                titulo="Sua bagagem começa aqui"
                descricao="Crie sua conta de passageiro e acompanhe cada checkpoint da sua mala."
              />

              <Cartao>
                <View style={styles.tituloCartao}>
                  <View
                    style={[
                      styles.tituloIcone,
                      { backgroundColor: theme.accentSoft, borderColor: theme.border },
                    ]}>
                    <Ionicons name="person-add-outline" size={20} color={theme.accent} />
                  </View>
                  <View style={styles.tituloCartaoTexto}>
                    <ThemedText type="smallBold">Crie sua conta</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Leva menos de um minuto.
                    </ThemedText>
                  </View>
                </View>

                <CampoTexto
                  rotulo="Nome completo"
                  icone="person-outline"
                  placeholder="Como podemos te chamar?"
                  autoCapitalize="words"
                  autoComplete="name"
                  value={nome}
                  onChangeText={setNome}
                />

                <CampoTexto
                  rotulo="E-mail"
                  icone="mail-outline"
                  placeholder="nome@email.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  erro={erroEmail}
                />

                <CampoTexto
                  rotulo="Senha"
                  icone="lock-closed-outline"
                  placeholder="Crie uma senha segura"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  secureTextEntry
                  value={senha}
                  onChangeText={setSenha}
                  erro={erroSenha}
                />

                <View style={styles.regras}>
                  {regras.map((regra) => (
                    <View
                      key={regra.texto}
                      style={[
                        styles.regra,
                        {
                          backgroundColor: regra.ok ? `${theme.success}12` : theme.background,
                          borderColor: regra.ok ? `${theme.success}35` : theme.border,
                        },
                      ]}>
                      <Ionicons
                        name={regra.ok ? 'checkmark-circle' : 'ellipse-outline'}
                        size={12}
                        color={regra.ok ? theme.success : theme.textSecondary}
                      />
                      <ThemedText
                        type="small"
                        style={{
                          color: regra.ok ? theme.success : theme.textSecondary,
                          fontSize: 11,
                          lineHeight: 14,
                        }}>
                        {regra.texto}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {senha.length > 0 ? (
                  <View style={styles.barraLinha}>
                    <View style={[styles.barraTrilho, { backgroundColor: theme.backgroundSelected }]}>
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.barraSegmento,
                            {
                              backgroundColor:
                                i < forca ? coresForca[forca - 1] : theme.backgroundSelected,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <ThemedText
                      type="small"
                      style={{
                        color: forca > 0 ? coresForca[forca - 1] : theme.textSecondary,
                        fontSize: 11,
                        fontWeight: '700',
                      }}>
                      {nomesForca[forca]}
                    </ThemedText>
                  </View>
                ) : null}

                {erro ? (
                  <View
                    style={[
                      styles.alerta,
                      { backgroundColor: `${theme.danger}10`, borderColor: `${theme.danger}35` },
                    ]}>
                    <Ionicons name="alert-circle-outline" size={17} color={theme.danger} />
                    <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                      {erro}
                    </ThemedText>
                  </View>
                ) : null}

                <Botao
                  titulo={carregando ? 'Criando sua conta...' : 'Criar minha conta'}
                  icone={carregando ? undefined : 'person-add-outline'}
                  onPress={lidarComCadastro}
                  carregando={carregando}
                  desabilitado={!nome.trim() || !emailValido(email) || !senhaForte(senha)}
                />
                <Botao
                  titulo="Já tenho conta"
                  icone="log-in-outline"
                  contorno
                  onPress={() => router.replace('/login/login')}
                />
              </Cartao>

              <View style={styles.confianca}>
                <View style={styles.confiancaItem}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={theme.success} />
                  <ThemedText type="small" themeColor="textSecondary">
                    Dados protegidos
                  </ThemedText>
                </View>
                <View style={styles.confiancaItem}>
                  <Ionicons name="mail-unread-outline" size={14} color={theme.accent} />
                  <ThemedText type="small" themeColor="textSecondary">
                    Confirmação por e-mail
                  </ThemedText>
                </View>
              </View>

              <Pressable onPress={() => router.push('/')} style={styles.voltar}>
                <Ionicons name="arrow-back" size={16} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Voltar para a página inicial
                </ThemedText>
              </Pressable>
            </>
          )}
        </ThemedView>
      </ScrollView>
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
  },
  folhaDentro: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  limite: {
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: 'transparent',
    gap: Spacing.three,
  },
  tituloCartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  tituloIcone: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloCartaoTexto: {
    flex: 1,
    gap: 2,
  },
  erroLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  regras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  regra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  barraLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barraTrilho: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    borderRadius: 999,
    padding: 2,
  },
  barraSegmento: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  confianca: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  confiancaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 1,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.one + 2,
    paddingVertical: Spacing.two,
  },
  confirmacaoCartao: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  confirmacaoIconeWrap: {
    alignItems: 'center',
  },
  confirmacaoIcone: {
    width: 74,
    height: 74,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmacaoTitulo: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  confirmacaoTexto: {
    textAlign: 'center',
    maxWidth: 420,
    alignSelf: 'center',
  },
  passosConfirmacao: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  passoConfirmacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  passoNumero: {
    width: 24,
    height: 24,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passoNumeroTexto: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  passoTexto: {
    flex: 1,
  },
  trocarEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.one + 2,
    paddingVertical: Spacing.one,
  },
});
