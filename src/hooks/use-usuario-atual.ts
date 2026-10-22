import { useEffect, useState } from 'react';

import { supabase } from '@/supabase';

export type UsuarioAtual = {
  id: string;
  email: string | null;
  nome: string | null;
  cargo: string | null;
  area: string | null;
};

/**
 * Sessão + perfil (nome/cargo/área) do usuário logado.
 * No banco, o ator dos checkpoints é preenchido por auth.uid(); aqui usamos
 * o mesmo id apenas para exibição no header e para regras de UI.
 */
export function useUsuarioAtual(): UsuarioAtual | null {
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!ativo) return;
      if (!user) {
        setUsuario(null);
        return;
      }

      const { data: perfil } = await supabase
        .from('usuarios_perfis')
        .select('nome, cargo, area')
        .eq('id_usuario', user.id)
        .maybeSingle();

      if (!ativo) return;

      setUsuario({
        id: user.id,
        email: user.email ?? null,
        nome: (perfil as { nome?: string | null } | null)?.nome ?? null,
        cargo: (perfil as { cargo?: string | null } | null)?.cargo ?? null,
        area: (perfil as { area?: string | null } | null)?.area ?? null,
      });
    }

    void carregar();

    const { data: assinatura } = supabase.auth.onAuthStateChange(() => {
      // Evita deadlock: o callback do Auth não deve aguardar outra chamada
      // ao Supabase na mesma pilha.
      setTimeout(() => {
        void carregar();
      }, 0);
    });

    return () => {
      ativo = false;
      assinatura.subscription.unsubscribe();
    };
  }, []);

  return usuario;
}

export function nomeExibicao(usuario: UsuarioAtual | null): string | null {
  if (!usuario) return null;
  return usuario.nome?.trim() || usuario.email?.split('@')[0] || null;
}
