import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { mensagemErro } from '@/lib/erros';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/supabase';

type Modo = 'entrar' | 'criar';

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Login/Cadastro dedicado ao passageiro.
 * Após autenticar, sempre cai no painel /cliente.
 */
export default function LoginPassageiroScreen() {
  const theme = useTheme();
  const [modo, setModo] = useState<Modo>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const contentPlatformStyle = Platform.select({
    android: { paddingBottom: BottomTabInset + Spacing.three },
    web: { paddingBottom: Spacing.four },
  });

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErro(null);
    setAviso(null);
    setSenha('');
  }

  async function entrar() {
    setErro(null);
    setAviso(null);

    if (!emailValido(email)) {
      setErro('Informe um e-mail válido.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha precisa ter ao menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setCarregando(false);

    if (error) {
      setErro(mensagemErro(error, 'Não foi possível entrar. Tente novamente.'));
      return;
    }
    if (!data.session) {
      setErro('E-mail ainda não confirmado. Confirme o e-mail antes de entrar.');
      return;
    }

    router.replace('/cliente');
  }

  async function criarConta() {
    setErro(null);
    setAviso(null);

    if (!nome.trim()) {
      setErro('Informe seu nome completo.');
      return;
    }
    if (!emailValido(email)) {
      setErro('Informe um e-mail válido.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha precisa ter ao menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { nome: nome.trim(), cargo: 'cliente' } },
    });

    if (error) {
      setCarregando(false);
      setErro(mensagemErro(error, 'Não foi possível criar a conta. Tente novamente.'));
      return;
    }

    // Projeto com confirmação de e-mail ligada: ainda não há sessão.
    if (!data.session) {
      setCarregando(false);
      setAviso('Conta criada! Confirme o e-mail e depois volte para entrar.');
      setModo('entrar');
      return;
    }

    const user = data.user ?? data.session.user;
    const { error: erroPerfil } = await supabase.from('usuarios_perfis').upsert(
      { id_usuario: user.id, cargo: 'cliente', nome: nome.trim() },
      { onConflict: 'id_usuario' },
    );

    setCarregando(false);
    if (erroPerfil) {
      setErro(mensagemErro(erroPerfil, 'Não foi possível salvar seu perfil. Tente novamente.'));
      return;
    }

    router.replace('/cliente');
  }

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        titulo="Área do passageiro"
        subtitulo="Acompanhe e vincule sua bagagem"
      />

      <ScrollView
        style={[styles.folha, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.folhaDentro, contentPlatformStyle]}>
        <ThemedView style={styles.limite}>
          <View style={styles.abas}>
            <Pressable
              onPress={() => trocarModo('entrar')}
              style={[
                styles.aba,
                modo === 'entrar' && { backgroundColor: theme.accent },
              ]}>
              <ThemedText
                type="smallBold"
                style={modo === 'entrar' ? { color: '#FFFFFF' } : undefined}>
                Entrar
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => trocarModo('criar')}
              style={[
                styles.aba,
                modo === 'criar' && { backgroundColor: theme.accent },
              ]}>
              <ThemedText
                type="smallBold"
                style={modo === 'criar' ? { color: '#FFFFFF' } : undefined}>
                Criar conta
              </ThemedText>
            </Pressable>
          </View>

          <Cartao>
            {modo === 'criar' ? (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.textSecondary },
                ]}
                placeholder="Nome completo"
                placeholderTextColor={theme.textSecondary}
                value={nome}
                onChangeText={setNome}
              />
            ) : null}

            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.background, color: theme.text, borderColor: theme.textSecondary },
              ]}
              placeholder="E-mail"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

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

            {erro ? (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {erro}
              </ThemedText>
            ) : null}
            {aviso ? (
              <ThemedText type="small" style={{ color: theme.success }}>
                {aviso}
              </ThemedText>
            ) : null}

            <Botao
              titulo={
                carregando
                  ? modo === 'entrar'
                    ? 'Entrando...'
                    : 'Criando conta...'
                  : modo === 'entrar'
                    ? 'Entrar'
                    : 'Criar conta de passageiro'
              }
              onPress={() => void (modo === 'entrar' ? entrar() : criarConta())}
              desabilitado={carregando}
            />
          </Cartao>

          <Cartao style={styles.dica}>
            <ThemedText type="smallBold">Conta de demonstração</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              cliente@gmail.com / 123456
            </ThemedText>
          </Cartao>

          <Botao
            titulo="Voltar ao login operacional"
            contorno
            onPress={() => router.replace('/login/login')}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
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
  abas: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  aba: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: Spacing.two,
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
  dica: {
    borderLeftWidth: 4,
    borderLeftColor: '#2F9BC4',
  },
});
