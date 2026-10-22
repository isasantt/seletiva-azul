import { useCallback, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

import { useToast } from '@/components/toast';
import { sincronizarFilaCheckpoints, tamanhoFilaCheckpoints } from '@/lib/offline-queue';

/**
 * Quando a internet volta (ou a cada 30s), tenta enviar a fila local de
 * checkpoints gravados na pista sem conexão.
 */
export function useOfflineSync(): void {
  const { showToast } = useToast();
  const executando = useRef(false);

  const sincronizar = useCallback(async () => {
    if (executando.current) return;
    executando.current = true;
    try {
      const pendentes = await tamanhoFilaCheckpoints();
      if (pendentes === 0) return;

      const resultado = await sincronizarFilaCheckpoints();
      if (resultado.enviados > 0) {
        showToast(
          'Checkpoints sincronizados',
          `${resultado.enviados} leitura(s) enviada(s) ao Supabase.`,
          'success',
        );
      }
    } finally {
      executando.current = false;
    }
  }, [showToast]);

  useEffect(() => {
    void sincronizar();

    const cancelarNetInfo = NetInfo.addEventListener((estado) => {
      if (estado.isConnected) void sincronizar();
    });

    const intervalo = setInterval(() => {
      void sincronizar();
    }, 30000);

    return () => {
      cancelarNetInfo();
      clearInterval(intervalo);
    };
  }, [sincronizar]);
}
