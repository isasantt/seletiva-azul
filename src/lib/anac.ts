export type PrazoAnac = {
  id_mala: string;
  data_abertura_rib: string | null;
  dias_devolucao: number | null;
  prazo_devolucao: string | null;
  prazo_indenizacao_max: string | null;
};

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function diasRestantes(iso: string | null): number | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return Math.ceil((data.getTime() - Date.now()) / MS_POR_DIA);
}

export function prazoVencendo(iso: string | null, horas = 48): boolean {
  if (!iso) return false;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return false;
  return data.getTime() - Date.now() <= horas * 60 * 60 * 1000;
}

export function rotuloPrazo(diasDevolucao: number | null): string {
  if (diasDevolucao === 7) return 'Voo doméstico • 7 dias';
  if (diasDevolucao === 21) return 'Voo internacional • 21 dias';
  return diasDevolucao ? `${diasDevolucao} dias` : 'Prazo não informado';
}

export function formatarDataHora(iso: string | null): string {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  const dd = String(data.getDate()).padStart(2, '0');
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const hh = String(data.getHours()).padStart(2, '0');
  const min = String(data.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} às ${hh}:${min}`;
}
