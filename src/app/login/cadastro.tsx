import { useEffect, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';

const PERFIS_TABLE = 'usuarios_perfis';
const ID_USUARIO_COLUMN = 'id_usuario'; // FK para auth.users.id
const CARGO_COLUMN = 'cargo';

const NOME_COLUMN = 'nome';

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
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sessaoEmail, setSessaoEmail] = useState<string | null>(null);

  // Mostra de quem é a sessão atual (evita gravar na conta errada)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSessaoEmail(data.user?.email ?? null));
  }, []);

  // Checklist ao vivo da senha (verde = ok, vermelho = falta)
  const regras = [
    { texto: '6+ caracteres', ok: senha.length >= 6 },
    { texto: 'letra', ok: /[A-Za-z]/.test(senha) },
    { texto: 'número', ok: /\d/.test(senha) },
    { texto: 'caracter especial', ok: /[^A-Za-z\d]/.test(senha) },
  ];

  // Força 0-4 = quantas regras cumpridas
  const forca = regras.filter((r) => r.ok).length;
  const coresForca = ['#E5484D', '#F5A524', '#D4C226', '#30A46C'];
  const nomesForca = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  async function lidarComCadastro() {
    setCarregando(true);
    setErro(null);

    if (!nome.trim()) {
      setErro('Informe seu nome para concluir o cadastro.');
      setCarregando(false);
      return;
    }

    try {
      // Sem sessão = conta nova: cria no Auth primeiro
      let { data: { user } } = await comTimeout(supabase.auth.getUser(), 'Sessão');

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
          }),
          'Criação da conta',
        );
        if (erroSignUp) {
          setErro(erroSignUp.message);
          return;
        }
        // Com "Confirm email" ligado, ainda não há sessão: pede confirmação
        if (!data.session) {
          setErro('Conta criada! Confirme o e-mail e faça login.');
          router.replace('/login/login');
          return;
        }
        user = data.session.user;
      }

      // Perfil já existe? Respeita o cargo dele (nunca rebaixa ninguém aqui)
      const { data: existente } = await comTimeout(
        supabase
          .from(PERFIS_TABLE)
          .select(`${CARGO_COLUMN}`)
          .eq(ID_USUARIO_COLUMN, user.id)
          .maybeSingle(),
        'Busca do perfil',
      );

      if (existente) {
        const atual = (existente as Record<string, string>)[CARGO_COLUMN];
        if (atual === 'funcionario') {
          router.replace('/funcionario');
          return;
        }
        if (atual === 'admin') {
          router.replace('/admin');
          return;
        }
        // Cliente existente: só atualiza o nome
        await supabase
          .from(PERFIS_TABLE)
          .update({ [NOME_COLUMN]: nome.trim() })
          .eq(ID_USUARIO_COLUMN, user.id);
        router.replace('/cliente');
        return;
      }

      // Perfil novo = cliente (upsert protege contra toque duplo)
      const { error } = await supabase.from(PERFIS_TABLE).upsert(
        {
          [ID_USUARIO_COLUMN]: user.id,
          [CARGO_COLUMN]: 'cliente',
          [NOME_COLUMN]: nome.trim(),
        },
        { onConflict: ID_USUARIO_COLUMN },
      );

      if (error) {
        setErro(error.message);
        return;
      }

      router.replace('/cliente');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        titulo="Criar conta"
        subtitulo={sessaoEmail ? `Sessão atual: ${sessaoEmail}` : 'Sem sessão (conta nova)'}
      />

      <ScrollView style={[styles.folha, { backgroundColor: theme.background }]} contentContainerStyle={[styles.folhaDentro, contentPlatformStyle]}>
        <ThemedView style={styles.limite}>
          <Cartao>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.textSecondary }]}
              placeholder="Nome completo"
              placeholderTextColor={theme.textSecondary}
              value={nome}
              onChangeText={setNome}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.textSecondary }]}
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

            {regras.map((r) => (
              <ThemedText key={r.texto} type="small" style={{ color: r.ok ? 'green' : 'red' }}>
                {r.ok ? '✓' : '✗'} {r.texto}
              </ThemedText>
            ))}

            {senha.length > 0 ? (
              <View style={styles.barraLinha}>
                <View style={styles.barraTrilho}>
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
                <ThemedText type="small" style={{ color: forca > 0 ? coresForca[forca - 1] : theme.textSecondary }}>
                  {nomesForca[forca]}
                </ThemedText>
              </View>
            ) : null}

            {erro ? <ThemedText type="small">{erro}</ThemedText> : null}

            <Botao
              titulo={carregando ? 'Salvando...' : 'Concluir cadastro'}
              onPress={lidarComCadastro}
              desabilitado={carregando || !nome.trim()}
            />
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
  barraLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barraTrilho: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  barraSegmento: {
    flex: 1,
    height: 8,
    borderRadius: 999,
  },
});
