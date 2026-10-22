import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { CampoTexto } from '@/components/campo-texto';
import { Cartao } from '@/components/cartao';
import { Pill } from '@/components/pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TituloSecao } from '@/components/titulo-secao';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { garantirPerfilECalcularDestino } from '@/lib/destino';
import { mensagemErro } from '@/lib/erros';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/supabase';
import { router } from 'expo-router';

const TIMEOUT_MS = 15000;

// Validação simples de e-mail: precisa ter algo@dominio
function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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

const CONTAS_DEMO = [
  { email: 'cliente@gmail.com', senha: '123456', perfil: 'Passageiro' },
  { email: 'funcionario@gmail.com', senha: '123456', perfil: 'Equipe' },
  { email: 'admin@gmail.com', senha: '123456', perfil: 'Admin' },
  { email: 'handling@gmail.com', senha: '123456', perfil: 'Handling' },
  { email: 'sac.teste@gmail.com', senha: '123456', perfil: 'SAC' },
  { email: 'cco.teste@gmail.com', senha: '123456', perfil: 'CCO' },
];

export default function TelaLogin() {
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingBottom: BottomTabInset + Spacing.three,
    },
    web: {
      paddingBottom: Spacing.four,
    },
  });

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioNaoEncontrado, setUsuarioNaoEncontrado] = useState(false);
  const [demoAtiva, setDemoAtiva] = useState<string | null>(null);
  const [erroDemo, setErroDemo] = useState<string | null>(null);

  const ocupado = carregando || demoAtiva !== null;
  const erroEmail =
    email.length > 0 && !emailValido(email) ? 'Falta um e-mail válido (ex: nome@email.com).' : null;
  const erroSenha = senha.length > 0 && senha.length < 6 ? 'A senha precisa de ao menos 6 caracteres.' : null;

  async function entrarComCredenciais(
    emailEntrada: string,
    senhaEntrada: string,
    origem: 'formulario' | 'demo',
  ) {
    const emailLimpo = emailEntrada.trim();
    const mostrarErro = (mensagem: string) => {
      if (origem === 'demo') setErroDemo(mensagem);
      else setErro(mensagem);
    };

    setErro(null);
    setErroDemo(null);
    setUsuarioNaoEncontrado(false);

    if (origem === 'demo') setDemoAtiva(emailLimpo);
    else setCarregando(true);

    try {
      const { data, error } = await comTimeout(
        supabase.auth.signInWithPassword({
          email: emailLimpo,
          password: senhaEntrada,
        }),
        'Login',
      );

      if (error) {
        const codigo = (error as { code?: string }).code;
        if (
          error.message.includes('Invalid login credentials') ||
          codigo === 'invalid_credentials'
        ) {
          mostrarErro('E-mail ou senha inválidos. Verifique os dados ou crie uma conta.');
          if (origem === 'formulario') setUsuarioNaoEncontrado(true);
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          mostrarErro(
            'Este e-mail ainda não foi confirmado. Abra o link enviado para sua caixa de entrada.',
          );
        } else {
          mostrarErro(mensagemErro(error, 'Não foi possível entrar. Tente novamente.'));
        }
        return;
      }

      if (!data.user) {
        mostrarErro('Login ok, mas sem usuário retornado.');
        return;
      }

      const destino = await comTimeout(
        garantirPerfilECalcularDestino(data.user, emailLimpo.split('@')[0]),
        'Busca do perfil',
      );

      if (!destino) {
        mostrarErro(
          'Seu perfil ainda não tem uma área ou cargo configurado. Fale com o administrador.',
        );
        return;
      }

      router.replace(destino);
    } catch (e) {
      mostrarErro(mensagemErro(e, 'Falha de rede. Verifique a internet.'));
    } finally {
      setCarregando(false);
      setDemoAtiva(null);
    }
  }

  async function lidarComLogin() {
    setErro(null);
    setUsuarioNaoEncontrado(false);

    if (!emailValido(email)) {
      setErro('Digite um e-mail válido (ex: nome@email.com).');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha precisa de ao menos 6 caracteres.');
      return;
    }

    await entrarComCredenciais(email, senha, 'formulario');
  }

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho titulo="AtmosBag" subtitulo="por Azul · Sua bagagem, em cada etapa do voo" />

      <ScrollView
        style={[styles.folha, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.folhaDentro, contentPlatformStyle]}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.limite}>
          <TituloSecao
            eyebrow="ÁREA SEGURA"
            titulo="Bem-vindo de volta"
            descricao="Passageiros e equipe Azul entram por aqui para acompanhar a jornada da bagagem."
          />

          <Cartao>
            <View style={styles.tituloCartao}>
              <View
                style={[
                  styles.tituloIcone,
                  { backgroundColor: theme.accentSoft, borderColor: theme.border },
                ]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.accent} />
              </View>
              <View style={styles.tituloCartaoTexto}>
                <ThemedText type="smallBold">Acesse sua conta</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Use o e-mail e a senha cadastrados.
                </ThemedText>
              </View>
            </View>

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
              editable={!ocupado}
            />

            <CampoTexto
              rotulo="Senha"
              icone="lock-closed-outline"
              placeholder="Sua senha"
              autoCapitalize="none"
              autoComplete="current-password"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
              erro={erroSenha}
              editable={!ocupado}
            />

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
              titulo={carregando ? 'Entrando...' : 'Entrar na minha conta'}
              icone={carregando ? undefined : 'log-in-outline'}
              onPress={lidarComLogin}
              carregando={carregando}
              desabilitado={ocupado || !emailValido(email) || senha.length < 6}
            />

            {usuarioNaoEncontrado ? (
              <Botao
                titulo="Criar minha conta"
                icone="person-add-outline"
                contorno
                desabilitado={ocupado}
                onPress={() =>
                  router.replace({
                    pathname: '/login/cadastro',
                    params: { email: email.trim(), senha },
                  })
                }
              />
            ) : null}

            <Botao
              titulo="Ainda não tenho conta"
              icone="arrow-forward-outline"
              contorno
              desabilitado={ocupado}
              onPress={() => router.replace('/login/cadastro')}
            />
          </Cartao>

          <Cartao style={styles.demoCartao}>
            <View style={styles.demoCabecalho}>
              <View style={[styles.demoIcone, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="flask-outline" size={18} color={theme.accent} />
              </View>
              <View style={styles.demoTextos}>
                <ThemedText type="smallBold">Contas de demonstração</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Toque em uma conta para entrar direto nela.
                </ThemedText>
              </View>
            </View>

            {erroDemo ? (
              <View
                style={[
                  styles.alerta,
                  { backgroundColor: `${theme.danger}10`, borderColor: `${theme.danger}35` },
                ]}>
                <Ionicons name="alert-circle-outline" size={17} color={theme.danger} />
                <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                  {erroDemo}
                </ThemedText>
              </View>
            ) : null}

            {CONTAS_DEMO.map((conta) => {
              const entrando = demoAtiva === conta.email;
              return (
                <Pressable
                  key={conta.email}
                  disabled={ocupado}
                  accessibilityRole="button"
                  accessibilityLabel={`Entrar como ${conta.perfil}`}
                  onPress={() => {
                    setEmail(conta.email);
                    setSenha(conta.senha);
                    void entrarComCredenciais(conta.email, conta.senha, 'demo');
                  }}
                  style={({ pressed }) => [
                    styles.demoLinha,
                    {
                      borderColor: entrando ? theme.accent : theme.border,
                      backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
                      opacity: ocupado && !entrando ? 0.5 : 1,
                    },
                  ]}>
                  <View style={[styles.demoAvatar, { backgroundColor: theme.background }]}>
                    <Ionicons
                      name={entrando ? 'log-in-outline' : 'person-outline'}
                      size={14}
                      color={entrando ? theme.accent : theme.textSecondary}
                    />
                  </View>
                  <View style={styles.demoDados}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {conta.email}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      senha {conta.senha}
                    </ThemedText>
                  </View>
                  {entrando ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <Pill texto={conta.perfil} cor={theme.accent} />
                  )}
                </Pressable>
              );
            })}
          </Cartao>

          <Pressable onPress={() => router.push('/')} style={styles.voltar}>
            <Ionicons name="arrow-back" size={16} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Voltar para a página inicial
            </ThemedText>
          </Pressable>
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
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two + 2,
  },
  demoCartao: {
    gap: Spacing.two,
  },
  demoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  demoIcone: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTextos: {
    flex: 1,
    gap: 2,
  },
  demoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two,
  },
  demoAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoDados: {
    flex: 1,
    gap: 1,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.one + 2,
    paddingVertical: Spacing.two,
  },
});
