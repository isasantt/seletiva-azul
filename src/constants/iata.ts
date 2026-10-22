import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

// Eventos usados no histórico IATA. O banco guarda sempre em maiúsculo.
export type EventoIata =
  | 'ACEITACAO'
  | 'CARREGAMENTO'
  | 'TRANSFERENCIA'
  | 'CHEGADA'
  | 'ENTREGA';

export type EventoIataInfo = {
  rotulo: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  cor: string;
};

export const EVENTOS_IATA: Record<EventoIata, EventoIataInfo> = {
  ACEITACAO: { rotulo: 'Aceitação', icone: 'checkmark-circle-outline', cor: '#2F9BC4' },
  CARREGAMENTO: { rotulo: 'Carregamento', icone: 'airplane-outline', cor: '#D97706' },
  TRANSFERENCIA: { rotulo: 'Transferência', icone: 'swap-horizontal-outline', cor: '#7C3AED' },
  CHEGADA: { rotulo: 'Chegada', icone: 'flag-outline', cor: '#1B9E77' },
  ENTREGA: { rotulo: 'Entrega', icone: 'checkmark-done-outline', cor: '#0B2A4A' },
};

// Os quatro pontos exigidos pela IATA para conformidade do voo.
export const EVENTOS_OBRIGATORIOS: EventoIata[] = [
  'ACEITACAO',
  'CARREGAMENTO',
  'TRANSFERENCIA',
  'CHEGADA',
];

export const EVENTOS_TIMELINE: EventoIata[] = [
  'ACEITACAO',
  'CARREGAMENTO',
  'TRANSFERENCIA',
  'CHEGADA',
  'ENTREGA',
];

export function normalizarEventoIata(valor: string | null | undefined): EventoIata | null {
  const chave = (valor ?? '').trim().toUpperCase();
  return chave in EVENTOS_IATA ? (chave as EventoIata) : null;
}

export function eventoIataValido(valor: string | null | undefined): valor is EventoIata {
  return normalizarEventoIata(valor) !== null;
}
