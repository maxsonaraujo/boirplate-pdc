import { 
  Box, 
  Card, 
  CardBody, 
  Heading, 
  Stack, 
  StackDivider, 
  Text, 
  Flex, 
  Icon,
  Badge,
  Button,
  HStack
} from '@chakra-ui/react';
import { 
  FaWarehouse, 
  FaBoxOpen, 
  FaExclamationTriangle, 
  FaFileInvoiceDollar 
} from 'react-icons/fa';
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';
import { useState, useEffect } from 'react';

export function EstoqueCard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/estoque/dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do estoque:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading || !dashboardData) {
    return (
      <Card>
        <CardBody>
          <Heading size='md' mb={4}>
            <Flex align="center">
              <Icon as={FaWarehouse} mr={2} />
              Estoque
            </Flex>
          </Heading>
          <Text>Carregando informações...</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Heading size='md' mb={4}>
          <Flex align="center">
            <Icon as={FaWarehouse} mr={2} />
            Estoque
          </Flex>
        </Heading>
        <Stack divider={<StackDivider />} spacing='4'>
          <Box>
            <HStack justify="space-between">
              <Flex align="center">
                <Icon as={FaBoxOpen} mr={2} color="teal.500" />
                <Text fontWeight="bold">Insumos em Estoque:</Text>
              </Flex>
              <Text fontWeight="bold">
                {dashboardData.resumo.insumosComEstoque} / {dashboardData.resumo.totalInsumos}
              </Text>
            </HStack>
            <Text pt='2' fontSize='sm'>
              Valor total: {formatCurrency(dashboardData.resumo.valorTotalEstoque)}
            </Text>
          </Box>
          <Box>
            <HStack justify="space-between">
              <Flex align="center">
                <Icon as={FaExclamationTriangle} mr={2} color="red.500" />
                <Text fontWeight="bold">Alertas:</Text>
              </Flex>
              <Badge colorScheme="red" fontSize="md">{dashboardData.insumosAbaixoMinimo.length}</Badge>
            </HStack>
            <Text pt='2' fontSize='sm'>
              {dashboardData.insumosAbaixoMinimo.length === 0 
                ? "Sem alertas de estoque mínimo" 
                : `${dashboardData.insumosAbaixoMinimo.length} itens abaixo do estoque mínimo`}
            </Text>
          </Box>
          <Box>
            <HStack justify="space-between">
              <Flex align="center">
                <Icon as={FaFileInvoiceDollar} mr={2} color="blue.500" />
                <Text fontWeight="bold">Compras (30 dias):</Text>
              </Flex>
              <Text fontWeight="bold">{dashboardData.resumo.totalComprasUltimos30Dias}</Text>
            </HStack>
            <Text pt='2' fontSize='sm'>
              Valor: {formatCurrency(dashboardData.resumo.valorComprasUltimos30Dias)}
            </Text>
          </Box>
          <Button 
            as={Link} 
            href="/estoque" 
            colorScheme="teal" 
            size="sm" 
            w="full"
          >
            Gerenciar Estoque
          </Button>
        </Stack>
      </CardBody>
    </Card>
  );
}
