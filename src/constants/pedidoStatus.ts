import { FaCheckCircle, FaStore, FaBox, FaBiking, FaTruck, FaTimesCircle } from 'react-icons/fa';

// Corresponde ao enum PedidoStatus no Prisma
export enum PedidoStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Configuração de visualização dos status para a interface
export const statusConfig = {
  [PedidoStatus.PENDING]: {
    label: 'Aguardando confirmação',
    description: 'Pedido recebido e aguardando confirmação do estabelecimento',
    icon: FaCheckCircle,
    color: 'blue'
  },
  [PedidoStatus.CONFIRMED]: {
    label: 'Confirmado',
    description: 'Pedido confirmado pelo estabelecimento',
    icon: FaStore,
    color: 'teal'
  },
  [PedidoStatus.PREPARING]: {
    label: 'Em preparo',
    description: 'Seu pedido está sendo preparado',
    icon: FaBox,
    color: 'orange'
  },
  [PedidoStatus.READY]: {
    label: 'Pronto',
    description: 'Seu pedido está pronto para entrega/retirada',
    icon: FaCheckCircle,
    color: 'yellow'
  },
  [PedidoStatus.DELIVERING]: {
    label: 'Em entrega',
    description: 'Seu pedido está a caminho',
    icon: FaBiking,
    color: 'purple'
  },
  [PedidoStatus.COMPLETED]: {
    label: 'Entregue',
    description: 'Pedido finalizado com sucesso',
    icon: FaCheckCircle,
    color: 'green'
  },
  [PedidoStatus.CANCELLED]: {
    label: 'Cancelado',
    description: 'Pedido foi cancelado',
    icon: FaTimesCircle,
    color: 'red'
  }
};

// Função helper para obter a label do status
export const getStatusLabel = (status: string): string => {
  return statusConfig[status as PedidoStatus]?.label || 'Status desconhecido';
};

// Função helper para obter a cor do status
export const getStatusColor = (status: string): string => {
  return statusConfig[status as PedidoStatus]?.color || 'gray';
};

// Lista dos steps para o Stepper
export const orderSteps = [
  statusConfig[PedidoStatus.PENDING],
  statusConfig[PedidoStatus.CONFIRMED],
  statusConfig[PedidoStatus.PREPARING],
  statusConfig[PedidoStatus.READY],
  statusConfig[PedidoStatus.DELIVERING],
];

// Mapeamento de status para índice do stepper
export const statusToStepperIndex = {
  [PedidoStatus.PENDING]: 0,
  [PedidoStatus.CONFIRMED]: 1,
  [PedidoStatus.PREPARING]: 2,
  [PedidoStatus.READY]: 3,
  [PedidoStatus.DELIVERING]: 4,
  [PedidoStatus.COMPLETED]: 5,
  [PedidoStatus.CANCELLED]: -1
};
