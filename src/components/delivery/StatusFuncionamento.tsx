'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Badge,
  Flex,
  Tooltip,
  Skeleton,
  useColorModeValue
} from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';

interface StatusFuncionamentoProps {
  tenantId: number;
}

export function StatusFuncionamento({ tenantId }: StatusFuncionamentoProps) {
  const [status, setStatus] = useState({
    aberto: false,
    mensagem: '',
    proximaAbertura: null as string | null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      fetchStatus();
    }
  }, [tenantId]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery/status?tenantId=${tenantId}`);
      const data = await response.json();

      if (response.ok) {
        setStatus({
          aberto: data.aberto,
          mensagem: data.mensagem,
          proximaAbertura: data.proximaAbertura
        });
      } else {
        console.error('Erro ao verificar status:', data.error);
      }
    } catch (error) {
      console.error('Erro ao verificar status de funcionamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (loading) {
    return (
      <Skeleton height="40px" width="100%" borderRadius="md" />
    );
  }

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderRadius="md"
      bg={bgColor}
      borderColor={borderColor}
      boxShadow="sm"
    >
      <Flex align="center" justify="space-between">
        <Flex align="center">
          <TimeIcon mr={2} color={status.aberto ? 'green.500' : 'red.500'} />
          <Text fontWeight="medium">
            {status.mensagem}
          </Text>
        </Flex>
        
        <Tooltip 
          label={status.proximaAbertura ? `Próxima abertura: ${status.proximaAbertura}` : ''} 
          hasArrow
          isDisabled={status.aberto || !status.proximaAbertura}
        >
          <Badge 
            colorScheme={status.aberto ? 'green' : 'red'} 
            variant="solid" 
            fontSize="xs" 
            borderRadius="full" 
            px={2}
          >
            {status.aberto ? 'ABERTO' : 'FECHADO'}
          </Badge>
        </Tooltip>
      </Flex>
      
      {!status.aberto && status.proximaAbertura && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          Abriremos {status.proximaAbertura}
        </Text>
      )}
    </Box>
  );
}
