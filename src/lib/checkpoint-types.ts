import type { EventoIata } from '@/constants/iata';

// Objeto mínimo aceito pela tabela historico_checkpoints.
// data/hora e id_funcionario são preenchidos pelo banco.
export type CheckpointIataPayload = {
  id_mala: string;
  id_voo: string;
  evento_iata: EventoIata;
};
