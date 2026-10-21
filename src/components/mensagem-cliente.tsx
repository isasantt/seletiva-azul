import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/supabase';

type Resultado = {
  status: string;
  mensagem: string | null;
  erro: string | null;
};

type MensagemClienteProps = {
  /** Status técnico da mala / chave do evento. Ex.: 'CHEGADA', 'VOO_ERRADO'. */
  status: string;
  style?: StyleProp<ViewStyle>;
};

// Busca a tradução da chave técnica em obter_mensagem_cliente (RPC) e exibe
// a mensagem amigável. Não usa a view v_mensagens_cliente.
export function MensagemCliente({ status, style }: MensagemClienteProps) {
  const theme = useTheme();
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    let ativo = true;

    async function buscar() {
      const { data, error } = await supabase.rpc('obter_mensagem_cliente', {
        p_chave: status,
      });

      if (!ativo) return;

      setResultado({
        status,
        mensagem: error ? null : ((data as string | null) ?? null),
        erro: error?.message ?? null,
      });
    }

    buscar();

    return () => {
      ativo = false;
    };
  }, [status]);

  // Evita mostrar a mensagem do status anterior enquanto o novo carrega.
  const atual = resultado?.status === status ? resultado : null;
  const carregando = !atual;

  const cor = theme.accent;
  const caixa = [
    styles.caixa,
    { backgroundColor: `${cor}14`, borderColor: `${cor}40` },
    style,
  ];

  if (carregando) {
    return (
      <View style={caixa}>
        <ActivityIndicator size="small" color={cor} />
        <ThemedText type="small" themeColor="textSecondary">
          Carregando mensagem...
        </ThemedText>
      </View>
    );
  }

  if (!atual.mensagem) {
    return (
      <View style={caixa}>
        <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">
          {atual.erro
            ? 'Não foi possível carregar a mensagem agora.'
            : 'Sem mensagem para este status.'}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={caixa} accessibilityRole="text" accessibilityLiveRegion="polite">
      <Ionicons name="information-circle" size={20} color={cor} />
      <ThemedText type="small" style={styles.texto}>
        {atual.mensagem}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  texto: {
    flex: 1,
  },
});
