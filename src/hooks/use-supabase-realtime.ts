import { useEffect, useMemo } from 'react';

import { useToast } from '@/components/toast';
import { useUsuarioAtual } from '@/hooks/use-usuario-atual';
import { supabase } from '@/supabase';

type AlertaRealtime = {
  id?: string;
  id_mala?: string | null;
  id_voo?: string | null;
  tipo?: string | null;
};

function areaPermitida(area: string | null): boolean {
  const chave = (area ?? '').trim().toLowerCase();
  return chave === 'sac' || chave === 'handling';
}

/**
 * Assina INSERTs em public.alertas e mostra um Toast global para
 * Admin, SAC e Handling (as triggers do banco criam os alertas).
 */
export function useSupabaseRealtime(): void {
  const { showToast } = useToast();
  const usuario = useUsuarioAtual();

  const podeReceber = useMemo(() => {
    if (!usuario) return false;
    return usuario.cargo === 'admin' || areaPermitida(usuario.area);
  }, [usuario]);

  useEffect(() => {
    if (!podeReceber || !usuario) return;

    const canal = supabase
      .channel(`alertas-global-${usuario.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alertas' },
        (payload) => {
          const alerta = payload.new as AlertaRealtime;
          const tipo = alerta.tipo?.trim() || 'Novo alerta';
          const mala = alerta.id_mala ? `Mala ${alerta.id_mala}` : 'Alerta operacional';
          showToast(`🚨 ${tipo}`, mala, 'danger');
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [podeReceber, showToast, usuario]);
}
