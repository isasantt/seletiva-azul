import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/supabase';
import { router } from 'expo-router';

const PERFIS_TABLE = 'usuarios_perfis';
const ID_USUARIO_COLUMN = 'id_usuario'; // FK para auth.users.id
const CARGO_COLUMN = 'cargo'; // valores: 'admin' | 'funcionario' | 'cliente'

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
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioNaoEncontrado, setUsuarioNaoEncontrado] = useState(false);

  async function lidarComLogin() {
    setCarregando(true);
    setErro(null);
    setUsuarioNaoEncontrado(false);

    // Validação local antes de chamar o Supabase
    if (!emailValido(email)) {
      setErro('Digite um e-mail válido (ex: nome@email.com).');
      setCarregando(false);
      return;
    }
    if (senha.length < 6) {
      setErro('A senha precisa de ao menos 6 caracteres.');
      setCarregando(false);
      return;
    }

    try {
      const { data, error } = await comTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        }),
        'Login',
      );

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErro('Usuário não encontrado. Verifique o e-mail ou crie uma conta.');
          setUsuarioNaoEncontrado(true);
        } else {
          setErro(error.message);
        }
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setErro('Login ok, mas sem usuário retornado.');
        return;
      }

      const { data: perfil, error: erroPerfil } = await comTimeout(
        supabase
          .from(PERFIS_TABLE)
          .select(`${CARGO_COLUMN}`)
          .eq(ID_USUARIO_COLUMN, userId)
          .maybeSingle(),
        'Busca do perfil',
      );

      if (erroPerfil) {
        setErro(erroPerfil.message);
        return;
      }

      if (!perfil) {
        router.replace('/login/cadastro');
        return;
      }

      const cargo = (perfil as Record<string, string>)[CARGO_COLUMN];
      if (cargo === 'cliente') {
        router.replace('/cliente');
      } else if (cargo === 'funcionario') {
        router.replace('/funcionario');
      } else if (cargo === 'admin') {
        router.replace('/admin');
      } else {
        setErro(`Cargo desconhecido: ${cargo}`);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha de rede. Verifique a internet.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho titulo="Minhas Malas" subtitulo="Acompanhe sua bagagem em cada etapa" />

      <ScrollView style={[styles.folha, { backgroundColor: theme.background }]} contentContainerStyle={[styles.folhaDentro, contentPlatformStyle]}>
        <ThemedView style={styles.limite}>
          <Cartao style={styles.aviso}>
            <ThemedText type="smallBold">Contas para teste (toque para preencher)</ThemedText>
            {[
              { email: 'cliente@gmail.com', senha: '123456' },
              { email: 'funcionario@gmail.com', senha: '123456' },
              { email: 'admin@gmail.com', senha: '123456' },
            ].map((c) => (
              <Pressable
                key={c.email}
                onPress={() => {
                  setEmail(c.email);
                  setSenha(c.senha);
                }}>
                <ThemedText type="small">
                  {c.email} / {c.senha}
                </ThemedText>
              </Pressable>
            ))}
          </Cartao>

          <Cartao>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.textSecondary }]}
              placeholder="E-mail"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            {email.length > 0 && !emailValido(email) ? (
              <ThemedText type="small" style={{ color: 'red' }}>
                ✗ Falta um e-mail válido (ex: nome@email.com).
              </ThemedText>
            ) : null}

            <View style={styles.senhaRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.senhaInput,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.textSecondary },
                ]}
                placeholder="Senha"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!senhaVisivel}
                value={senha}
                onChangeText={setSenha}
              />
              <Pressable
                onPress={() => setSenhaVisivel((v) => !v)}
                style={[styles.eyeButton, { backgroundColor: theme.background, borderColor: theme.textSecondary }]}>
                <Ionicons
                  name={senhaVisivel ? 'eye-off' : 'eye'}
                  size={22}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>

            {senha.length > 0 && senha.length < 6 ? (
              <ThemedText type="small" style={{ color: 'red' }}>
                ✗ A senha precisa de ao menos 6 caracteres.
              </ThemedText>
            ) : null}

            {erro ? <ThemedText type="small">{erro}</ThemedText> : null}

            <Botao
              titulo={carregando ? 'Entrando...' : 'Entrar'}
              onPress={lidarComLogin}
              desabilitado={carregando || !emailValido(email) || senha.length < 6}
            />

            {usuarioNaoEncontrado ? (
              <Botao
                titulo="Ir para cadastro"
                contorno
                onPress={() =>
                  router.replace({
                    pathname: '/login/cadastro',
                    params: { email: email.trim(), senha },
                  })
                }
              />
            ) : null}

            <Botao titulo="Criar conta" contorno onPress={() => router.replace('/login/cadastro')} />
          </Cartao>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
  },
  folhaDentro: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  limite: {
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: 'transparent',
    gap: Spacing.three,
  },
  aviso: {
    borderLeftWidth: 4,
    borderLeftColor: '#2F9BC4',
  },
  input: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  senhaRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  senhaInput: {
    flex: 1,
  },
  eyeButton: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
});
