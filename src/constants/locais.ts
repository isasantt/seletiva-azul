// Lista fixa de checkpoints por fase (usada pelo funcionário e pelo admin).
// Para adicionar/remover um local, edite só aqui.
export const LOCAIS_POR_FASE = [
  {
    fase: 'Fase de Entrega (Check-in)',
    locais: [
      'Balcão de Check-in 14',
      'Tapete de Drop-off Automático 02',
      'Esteira Principal de Recolha',
    ],
  },
  {
    fase: 'Fase de Bastidores (Triagem e Segurança)',
    locais: [
      'Controlo de Raio-X B',
      'Triagem Central - Linha 2',
      'Tapete de Separação Sul',
    ],
  },
  {
    fase: 'Fase de Embarque (Avião)',
    locais: [
      'Cais de Carga 03',
      'Porão Dianteiro - Voo 456',
    ],
  },
  {
    fase: 'Fase de Chegada (Destino)',
    locais: [
      'Área de Transferência (Voos de Ligação)',
      'Tapete de Bagagens 5 (Chegadas)',
    ],
  },
];
