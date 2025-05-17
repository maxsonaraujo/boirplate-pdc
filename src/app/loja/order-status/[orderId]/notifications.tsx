'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Flex,
  Icon,
  Heading,
  Divider,
  Badge,
  Skeleton,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FaBell, FaClock, FaCheck, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

interface NotificationsProps {
  orderId: number;
  tenantId: number;
}

export function Notifications({ orderId, tenantId }: NotificationsProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar notificações da API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/delivery/orders/${orderId}/notifications?tenantId=${tenantId}`);
        
        if (!response.ok) {
          throw new Error('Não foi possível carregar as notificações');
        }
        
        const data = await response.json();
        setNotifications(data.notifications || []);
        setError(null);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        setError('Não foi possível carregar as notificações. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId && tenantId) {
      fetchNotifications();
      
      // Configurar polling para buscar atualizações a cada minuto
      const intervalId = setInterval(fetchNotifications, 60000);
      
      return () => clearInterval(intervalId);
    }
  }, [orderId, tenantId]);

  // Formatação de data/hora
  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obter ícone baseado no status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return FaClock;
      case 'confirmed':
        return FaCheck;
      case 'preparing':
        return FaInfoCircle;
      case 'delivery':
        return FaInfoCircle;
      case 'delivered':
        return FaCheck;
      case 'cancelled':
        return FaExclamationTriangle;
      default:
        return FaBell;
    }
  };

  // Obter cor do badge baseado no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'gray';
      case 'confirmed':
        return 'blue';
      case 'preparing':
        return 'purple';
      case 'delivery':
        return 'orange';
      case 'delivered':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'teal';
    }
  };

  // Converter status para texto legível
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Aguardando',
      'confirmed': 'Confirmado',
      'preparing': 'Em preparo',
      'delivery': 'Em entrega',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado',
    };
    
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <VStack spacing={4} align="stretch">
        <Skeleton height="80px" />
        <Skeleton height="80px" />
        <Skeleton height="80px" />
      </VStack>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Flex align="center" mb={4}>
        <Icon as={FaBell} mr={2} />
        <Heading size="md">Atualizações do Pedido</Heading>
      </Flex>
      
      {notifications.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Nenhuma atualização disponível no momento.
        </Alert>
      ) : (
        <VStack spacing={3} align="stretch" divider={<Divider />}>
          {notifications.map((notification) => (
            <Flex key={notification.id} p={3} borderRadius="md" bg="gray.50" align="flex-start">
              <Box borderRadius="full" p={2} bg="white" mr={3}>
                <Icon as={getStatusIcon(notification.status)} color={`${getStatusColor(notification.status)}.500`} />
              </Box>
              
              <Box flex={1}>
                <Flex justify="space-between" align="center" mb={1}>
                  <Badge colorScheme={getStatusColor(notification.status)}>
                    {getStatusText(notification.status)}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    {formatDateTime(notification.timestamp)}
                  </Text>
                </Flex>
                <Text>{notification.message}</Text>
              </Box>
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
}
