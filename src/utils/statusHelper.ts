import { BadgeProps } from '@chakra-ui/react';

export type EntidadeStatus = 'ATIVO' | 'INATIVO';
export type CompraStatus = 'PENDENTE' | 'PARCIAL' | 'FINALIZADA' | 'CANCELADA';
export type MovimentacaoTipo = 'ENTRADA' | 'SAIDA' | 'PRODUCAO' | 'DESCARTE' | 'AJUSTE';

/**
 * Obtém a cor para o status de uma compra
 */
export const getCompraStatusColor = (status: string): BadgeProps['colorScheme'] => {
  switch (status) {
    case 'FINALIZADA': return 'green';
    case 'PENDENTE': return 'orange';
    case 'CANCELADA': return 'red';
    case 'PARCIAL': return 'blue';
    default: return 'gray';
  }
};

/**
 * Obtém a cor para o tipo de movimentação
 */
export const getMovimentacaoTipoColor = (tipo: string): BadgeProps['colorScheme'] => {
  switch (tipo) {
    case 'ENTRADA': return 'green';
    case 'SAIDA': return 'red';
    case 'PRODUCAO': return 'blue';
    case 'DESCARTE': return 'orange';
    case 'AJUSTE': return 'purple';
    default: return 'gray';
  }
};

/**
 * Obtém a cor baseada no status (ativo/inativo)
 */
export const getStatusColor = (status: boolean): BadgeProps['colorScheme'] => {
  return status ? 'green' : 'red';
};

/**
 * Traduz o status para português
 */
export const traduzirStatus = (status: string): string => {
  const traducoes: Record<string, string> = {
    'ATIVO': 'Ativo',
    'INATIVO': 'Inativo',
    'PENDENTE': 'Pendente',
    'PARCIAL': 'Parcial',
    'FINALIZADA': 'Finalizada',
    'CANCELADA': 'Cancelada',
    'ENTRADA': 'Entrada',
    'SAIDA': 'Saída',
    'PRODUCAO': 'Produção',
    'DESCARTE': 'Descarte',
    'AJUSTE': 'Ajuste'
  };
  
  return traducoes[status] || status;
};
