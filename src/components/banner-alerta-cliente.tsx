import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/supabase';

const MENSAGEM_FALLBACK = 'Sua conexão está apertada. Estamos cuidando da sua mala.';

type Alerta = {
  id_mala: string | null;
  tipo: string | null;
};

/**
 * Aviso proativo para o passageiro: procura alerta CONEXAO_RISCO em aberto
 * nas malas dele e traduz a chave via RPC obter_mensagem_cliente.
 */
export function BannerAlertaCliente({ idMalas }: { idMalas: string[] }) {
  const theme = useTheme();
  const [mensagem, setMensagem] = useState<string | null>(null);

  // A chave evita refazer a consulta a cada render (o array muda de referência).
  const chaveMalas = [...idMalas].sort().join('|');

  useEffect(() => {
    let ativo = true;
    const ids = chaveMalas ? chaveMalas.split('|') : [];

    async function buscar() {
      if (ids.length === 0) {
        setMensagem(null);
        return;
      }

      const { data, error } = await supabase
        .from('alertas')
        .select('id_mala, tipo')
        .in('id_mala', ids)
        .is('resolvido_em', null);

      if (!ativo) return;
      if (error) {
        setMensagem(null);
        return;
      }

      const temRisco = ((data ?? []) as Alerta[]).some(
        (alerta) => (alerta.tipo ?? '').trim().toUpperCase() === 'CONEXAO_RISCO',
      );

      if (!temRisco) {
        setMensagem(null);
        return;
      }

      const { data: texto, error: erroRpc } = await supabase.rpc('obter_mensagem_cliente', {
        p_chave: 'CONEXAO_RISCO',
      });

      if (!ativo) return;
      const traduzida = !erroRpc && typeof texto === 'string' && texto.trim() ? texto : null;
      setMensagem(traduzida ?? MENSAGEM_FALLBACK);
    }

    void buscar();

    return () => {
      ativo = false;
    };
  }, [chaveMalas]);

  if (!mensagem) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.caixa, { backgroundColor: `${theme.danger}14`, borderColor: theme.danger }]}>
      <Ionicons name="warning" size={26} color={theme.danger} />
      <View style={styles.textos}>
        <ThemedText type="smallBold" style={{ color: theme.danger }}>
          Atenção na sua conexão
        </ThemedText>
        <ThemedText type="small">{mensagem}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    borderWidth: 2,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
});
