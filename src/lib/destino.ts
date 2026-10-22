import type { User } from '@supabase/supabase-js';

import { rotaDaArea, type RotaArea } from '@/constants/areas';
import { supabase } from '@/supabase';

export type PerfilApp = {
  cargo: string | null;
  area: string | null;
};

export type DestinoApp =
  | RotaArea
  | '/cliente'
  | '/selecao-voo'
  | '/admin-dashboard';

/**
 * A área operacional manda primeiro. Sem área, usamos o cargo antigo.
 * Retorna null quando o perfil existe mas não tem destino conhecido.
 */
export function destinoDoPerfil(perfil: PerfilApp | null | undefined): DestinoApp | null {
  if (!perfil) return null;

  const rotaArea = rotaDaArea(perfil.area);
  if (rotaArea) return rotaArea;

  switch ((perfil.cargo ?? '').trim().toLowerCase()) {
    case 'cliente':
      return '/cliente';
    case 'funcionario':
      return '/selecao-voo';
    case 'admin':
      return '/admin-dashboard';
    default:
      return null;
  }
}

function nomeDoUsuario(
  user: Pick<User, 'email' | 'user_metadata'>,
  nomeFallback?: string,
): string {
  const nomeMetadata = user.user_metadata?.nome;
  if (typeof nomeMetadata === 'string' && nomeMetadata.trim()) {
    return nomeMetadata.trim();
  }
  if (nomeFallback?.trim()) return nomeFallback.trim();
  return user.email?.split('@')[0] || 'Passageiro';
}

/**
 * Busca o perfil e, se ele ainda não existir, cria o perfil de passageiro.
 * Isso cobre projetos em que o trigger 012 ainda não foi aplicado.
 */
export async function garantirPerfilECalcularDestino(
  user: Pick<User, 'id' | 'email' | 'user_metadata'>,
  nomeFallback?: string,
): Promise<DestinoApp | null> {
  const { data: perfil, error } = await supabase
    .from('usuarios_perfis')
    .select('cargo, area')
    .eq('id_usuario', user.id)
    .maybeSingle();

  if (error) throw error;
  if (perfil) return destinoDoPerfil(perfil as PerfilApp);

  const { error: erroCriacao } = await supabase.from('usuarios_perfis').insert({
    id_usuario: user.id,
    cargo: 'cliente',
    nome: nomeDoUsuario(user, nomeFallback),
  });

  // 23505 = outra chamada criou o perfil em paralelo. Reconsultamos para
  // respeitar um eventual cargo/área configurado nesse meio-tempo.
  if (erroCriacao?.code === '23505') {
    const { data: perfilCriado } = await supabase
      .from('usuarios_perfis')
      .select('cargo, area')
      .eq('id_usuario', user.id)
      .maybeSingle();
    return destinoDoPerfil(perfilCriado as PerfilApp | null);
  }

  if (erroCriacao) throw erroCriacao;
  return '/cliente';
}
