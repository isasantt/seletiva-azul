import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Botao } from '@/components/botao';
import { Cabecalho } from '@/components/cabecalho';
import { Cartao } from '@/components/cartao';
import { Indicador } from '@/components/indicador';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TituloSecao } from '@/components/titulo-secao';
import { PrazosAnacVencendo } from '@/components/prazos-anac-vencendo';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nomeExibicao, useUsuarioAtual } from '@/hooks/use-usuario-atual';
import { diasRestantes, prazoVencendo, type PrazoAnac } from '@/lib/anac';
import { mensagemErro } from '@/lib/erros';
import { supabase } from '@/supabase';
import { router } from 'expo-router';

export default function SACScreen() {
  const theme = useTheme();
  const usuario = useUsuarioAtual();

  const [prazos, setPrazos] = useState<PrazoAnac[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    const { data, error } = await supabase
      .from('v_prazo_anac')
      .select('*')
      .order('prazo_devolucao', { ascending: true });

    if (error) {
      setErro(mensagemErro(error, 'Não foi possível carregar os prazos ANAC. Tente novamente.'));
    } else {
      setErro(null);
      setPrazos((data ?? []) as PrazoAnac[]);
    }
    setCarregando(false);
    setAtualizando(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregar();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function atualizar() {
    setAtualizando(true);
    void carregar();
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login/login');
  }

  const vencendo = prazos.filter((prazo) => prazoVencendo(prazo.prazo_devolucao)).length;
  const vencidos = prazos.filter((prazo) => {
    const dias = diasRestantes(prazo.prazo_devolucao);
    return dias !== null && dias < 0;
  }).length;

  const resumo = (
    <View style={styles.resumo}>
      <TituloSecao
        eyebrow="ATENDIMENTO COM PRAZO"
        titulo="Cada mala merece uma resposta"
        descricao="Acompanhe os RIBs abertos e priorize as devoluções que vencem nas próximas 48 horas."
      />

      <View style={styles.grade}>
        <Indicador
          valor={prazos.length}
          rotulo="RIBs abertos"
          icone="document-text-outline"
          cor={theme.accent}
        />
        <Indicador
          valor={vencendo}
          rotulo="Vencem em 48h"
          icone="hourglass-outline"
          cor={theme.warning}
        />
        <Indicador
          valor={vencidos}
          rotulo="Já vencidos"
          icone="alert-circle-outline"
          cor={theme.danger}
        />
      </View>

      <Cartao style={styles.nota}>
        <View style={[styles.notaIcone, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="information-circle-outline" size={19} color={theme.accent} />
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.notaTexto}>
          Regra exibida pela view <ThemedText type="smallBold">v_prazo_anac</ThemedText>: 7 dias
          para voo doméstico e 21 dias para internacional, contados da abertura do RIB.
        </ThemedText>
      </Cartao>
    </View>
  );

  return (
    <ThemedView style={[styles.raiz, { backgroundColor: theme.primary }]}>
      <Cabecalho
        variante="app"
        eyebrow="SERVIÇO DE ATENDIMENTO"
        icone="shield-checkmark-outline"
        titulo="SAC"
        subtitulo="Prazos ANAC e cuidado com o passageiro em um só lugar."
        usuario={nomeExibicao(usuario)}
      />

      <ThemedView style={[styles.folha, { backgroundColor: theme.background }]}>
        <PrazosAnacVencendo
          prazos={prazos}
          carregando={carregando}
          erro={erro}
          atualizando={atualizando}
          onRefresh={atualizar}
          cabecalho={resumo}
          rodape={
            <Botao
              titulo="Sair da conta"
              icone="log-out-outline"
              contorno
              onPress={sair}
            />
          }
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  folha: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
  resumo: {
    gap: Spacing.three,
    paddingBottom: Spacing.one,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  nota: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  notaIcone: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notaTexto: {
    flex: 1,
    paddingTop: 2,
  },
});
