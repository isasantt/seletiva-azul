import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';

import { garantirPerfilECalcularDestino } from '@/lib/destino';
import { supabase } from '@/supabase';

/**
 * O link de confirmação do Supabase volta para a Site URL (ou para a URL
 * informada no cadastro) com os tokens de sessão. Quando isso acontece,
 * levamos o usuário direto para a tela do perfil dele em vez de deixá-lo
 * na landing page ou na tela de login.
 */
export function RedirecionarAuth() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const voltouDaConfirmacao =
      params.get('confirmado') === '1' ||
      params.has('code') ||
      hash.includes('access_token') ||
      hash.includes('refresh_token');

    if (!voltouDaConfirmacao) return;

    let ativo = true;

    async function redirecionar() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!ativo || !session?.user) return;

      try {
        const destino = await garantirPerfilECalcularDestino(session.user);
        if (ativo && destino) router.replace(destino);
      } catch {
        // Se a leitura do perfil falhar, o usuário ainda pode entrar manualmente.
      }
    }

    void redirecionar();
    return () => {
      ativo = false;
    };
  }, []);

  return null;
}
