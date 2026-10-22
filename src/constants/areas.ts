// Áreas operacionais da coluna usuarios_perfis.area.
// O login usa isso para escolher a tela inicial do usuário.

export type RotaArea = '/handling' | '/sac' | '/cco';

export const ROTAS_POR_AREA: Record<string, RotaArea> = {
  handling: '/handling',
  sac: '/sac',
  cco: '/cco',
};

/** Normaliza 'HANDLING', ' Sac ' etc. e devolve a rota da área (ou null). */
export function rotaDaArea(area: string | null | undefined): RotaArea | null {
  const chave = (area ?? '').trim().toLowerCase();
  return ROTAS_POR_AREA[chave] ?? null;
}
