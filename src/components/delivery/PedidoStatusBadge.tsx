import { Badge, BadgeProps } from '@chakra-ui/react';
import { PedidoStatus, getStatusLabel, getStatusColor } from '@/constants/pedidoStatus';

interface PedidoStatusBadgeProps extends Omit<BadgeProps, 'colorScheme'> {
  status: string;
}

/**
 * Componente para exibir o status do pedido como um badge
 * Usa as constantes definidas para garantir consistência em toda a aplicação
 */
export function PedidoStatusBadge({ status, ...props }: PedidoStatusBadgeProps) {
  return (
    <Badge
      colorScheme={getStatusColor(status)}
      p={2}
      borderRadius="md"
      textTransform="none"
      {...props}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
