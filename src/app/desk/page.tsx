// 'use client'

// import { DashboardHome } from '@/components/templates/DashboardHome'
// import { EstoqueCard } from '@/components/molecules/EstoqueCard';
// import { Box, SimpleGrid } from '@chakra-ui/react';

// export default function DeskPage() {
//   return (
//     <Box p={5}>
//       <DashboardHome />
//       <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} mb={6}>
//       </SimpleGrid>
//     </Box>
//   )
// }
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  useColorModeValue,
  Icon,
  Divider,
  VStack
} from '@chakra-ui/react';
import {
  FaShoppingBag,
  FaMoneyBillWave,
  FaChartLine,
  FaList,
  FaCheckCircle,
  FaTimesCircle,
  FaMotorcycle,
  FaUtensils,
  FaRegClock
} from 'react-icons/fa';
import { formatCurrency } from '@/utils/format';
import { useTenant } from '@/hooks/useTenant';

// Importação dinâmica para evitar problemas de SSR
import dynamic from 'next/dynamic';

// Importação do componente de gráfico com configuração adequada para Next.js
const ChartComponent = dynamic(
  () => import('@/components/charts/ChartComponent').then(mod => mod.ChartComponent),
  { 
    ssr: false, 
    loading: () => (
      <Box height="300px" display="flex" justifyContent="center" alignItems="center">
        <Spinner size="xl" color="teal.500" />
      </Box>
    )
  }
);

export default function DeliveryDashboardPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState('7');
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Buscar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/delivery/pedidos/dashboard?periodo=${periodo}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados do dashboard');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do dashboard',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [periodo, toast]);
  
  const handlePeriodoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodo(e.target.value);
  };
  
  // Dados para o gráfico de linha (pedidos por dia)
  const lineChartData = {
    labels: dashboardData?.pedidosPorDia.map((d: any) => {
      const date = new Date(d.data);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }).reverse() || [],
    datasets: [
      {
        label: 'Número de Pedidos',
        data: dashboardData?.pedidosPorDia.map((d: any) => d.total).reverse() || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
      },
    ],
  };
  
  // Dados para o gráfico de barras (valor por dia)
  const barChartData = {
    labels: dashboardData?.pedidosPorDia.map((d: any) => {
      const date = new Date(d.data);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }).reverse() || [],
    datasets: [
      {
        label: 'Valor Total (R$)',
        data: dashboardData?.pedidosPorDia.map((d: any) => d.valor).reverse() || [],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };
  
  // Dados para o gráfico de pizza (status dos pedidos)
  const pieChartData = {
    labels: ['Pendentes', 'Confirmados', 'Preparando', 'Em Entrega', 'Entregues', 'Cancelados'],
    datasets: [
      {
        label: 'Pedidos por Status',
        data: dashboardData ? [
          dashboardData.statusCount.pendentes,
          dashboardData.statusCount.confirmados,
          dashboardData.statusCount.preparando,
          dashboardData.statusCount.emEntrega,
          dashboardData.statusCount.entregues,
          dashboardData.statusCount.cancelados
        ] : [],
        backgroundColor: [
          'rgba(255, 159, 64, 0.7)',  // Pendentes
          'rgba(54, 162, 235, 0.7)',   // Confirmados
          'rgba(153, 102, 255, 0.7)',  // Preparando
          'rgba(75, 192, 192, 0.7)',   // Em Entrega
          'rgba(40, 167, 69, 0.7)',    // Entregues
          'rgba(220, 53, 69, 0.7)'     // Cancelados
        ],
        borderWidth: 1,
      },
    ],
  };
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="500px">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  return (
    <Box p={5}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">
          {tenant ? `Dashboard Delivery - ${tenant.nome}` : 'Dashboard Delivery'}
        </Heading>
        
        <Select
          value={periodo}
          onChange={handlePeriodoChange}
          width="auto"
          size="md"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 3 meses</option>
        </Select>
      </Flex>
      
      {/* Cards de estatísticas principais */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
        <Card bg={bgCard}>
          <CardBody>
            <Flex align="center">
              <Box
                p={3}
                borderRadius="full"
                bg="teal.50"
                color="teal.500"
                mr={3}
              >
                <Icon as={FaShoppingBag} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel>Total de Pedidos</StatLabel>
                <StatNumber>{dashboardData?.totalPedidos || 0}</StatNumber>
                <StatHelpText>
                  No período selecionado
                </StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>
        
        <Card bg={bgCard}>
          <CardBody>
            <Flex align="center">
              <Box
                p={3}
                borderRadius="full"
                bg="green.50"
                color="green.500"
                mr={3}
              >
                <Icon as={FaMoneyBillWave} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel>Valor Total</StatLabel>
                <StatNumber>{formatCurrency(dashboardData?.valorTotal || 0)}</StatNumber>
                <StatHelpText>
                  Ticket Médio: {formatCurrency(dashboardData?.ticketMedio || 0)}
                </StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>
        
        <Card bg={bgCard}>
          <CardBody>
            <Flex align="center">
              <Box
                p={3}
                borderRadius="full"
                bg="blue.50"
                color="blue.500"
                mr={3}
              >
                <Icon as={FaChartLine} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel>Maior Pedido</StatLabel>
                <StatNumber>{formatCurrency(dashboardData?.maiorPedido || 0)}</StatNumber>
                <StatHelpText>
                  Valor máximo registrado
                </StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>
        
        <Card bg={bgCard}>
          <CardBody>
            <Flex align="center">
              <Box
                p={3}
                borderRadius="full"
                bg="orange.50"
                color="orange.500"
                mr={3}
              >
                <Icon as={FaRegClock} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel>Pedidos Ativos</StatLabel>
                <StatNumber>
                  {(dashboardData?.statusCount.pendentes || 0) + 
                  (dashboardData?.statusCount.confirmados || 0) + 
                  (dashboardData?.statusCount.preparando || 0) + 
                  (dashboardData?.statusCount.emEntrega || 0)}
                </StatNumber>
                <StatHelpText>
                  Aguardando finalização
                </StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Status cards */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={6}>
        <Card bg={bgCard} align="center" p={3}>
          <Icon as={FaRegClock} color="orange.500" boxSize={8} mb={2} />
          <Text fontWeight="bold" mb={1}>Pendentes</Text>
          <Text fontSize="2xl" fontWeight="bold" color="orange.500">
            {dashboardData?.statusCount.pendentes || 0}
          </Text>
        </Card>
        
        <Card bg={bgCard} align="center" p={3}>
          <Icon as={FaCheckCircle} color="blue.500" boxSize={8} mb={2} />
          <Text fontWeight="bold" mb={1}>Confirmados</Text>
          <Text fontSize="2xl" fontWeight="bold" color="blue.500">
            {dashboardData?.statusCount.confirmados || 0}
          </Text>
        </Card>
        
        <Card bg={bgCard} align="center" p={3}>
          <Icon as={FaUtensils} color="purple.500" boxSize={8} mb={2} />
          <Text fontWeight="bold" mb={1}>Preparando</Text>
          <Text fontSize="2xl" fontWeight="bold" color="purple.500">
            {dashboardData?.statusCount.preparando || 0}
          </Text>
        </Card>
        
        <Card bg={bgCard} align="center" p={3}>
          <Icon as={FaMotorcycle} color="teal.500" boxSize={8} mb={2} />
          <Text fontWeight="bold" mb={1}>Em Entrega</Text>
          <Text fontSize="2xl" fontWeight="bold" color="teal.500">
            {dashboardData?.statusCount.emEntrega || 0}
          </Text>
        </Card>
        
        <Card bg={bgCard} align="center" p={3}>
          <Icon as={FaCheckCircle} color="green.500" boxSize={8} mb={2} />
          <Text fontWeight="bold" mb={1}>Entregues</Text>
          <Text fontSize="2xl" fontWeight="bold" color="green.500">
            {dashboardData?.statusCount.entregues || 0}
          </Text>
        </Card>
        
        <Card bg={bgCard} align="center" p={3}>
          <Icon as={FaTimesCircle} color="red.500" boxSize={8} mb={2} />
          <Text fontWeight="bold" mb={1}>Cancelados</Text>
          <Text fontSize="2xl" fontWeight="bold" color="red.500">
            {dashboardData?.statusCount.cancelados || 0}
          </Text>
        </Card>
      </SimpleGrid>
      
      {/* Gráficos */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <Card bg={bgCard}>
          <CardHeader>
            <Heading size="md">Pedidos por Dia</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <Box height="300px" position="relative">
              <ChartComponent 
                type="line"
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false,
                      text: 'Pedidos por Dia',
                    },
                  },
                }}
              />
            </Box>
          </CardBody>
        </Card>
        
        <Card bg={bgCard}>
          <CardHeader>
            <Heading size="md">Valor por Dia (R$)</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <Box height="300px" position="relative">
              <ChartComponent 
                type="bar"
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false,
                      text: 'Valor por Dia',
                    },
                  },
                }}
              />
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Gráfico de pizza e produtos mais vendidos */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card bg={bgCard}>
          <CardHeader>
            <Heading size="md">Pedidos por Status</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <Box height="300px" position="relative">
              <ChartComponent 
                type="pie"
                data={pieChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    title: {
                      display: false,
                      text: 'Pedidos por Status',
                    },
                  },
                }}
              />
            </Box>
          </CardBody>
        </Card>
        
        <Card bg={bgCard}>
          <CardHeader>
            <Heading size="md">Produtos Mais Vendidos</Heading>
          </CardHeader>
          <Divider />
          <CardBody overflow="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Produto</Th>
                  <Th isNumeric>Quantidade</Th>
                  <Th isNumeric>Valor Total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {dashboardData?.produtosMaisVendidos.map((produto: any) => (
                  <Tr key={produto.id}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{produto.nome}</Text>
                        <Text fontSize="xs" color={textColor} noOfLines={1}>
                          {produto.descricao || '-'}
                        </Text>
                      </VStack>
                    </Td>
                    <Td isNumeric>{produto.quantidadeVendida}</Td>
                    <Td isNumeric>{formatCurrency(produto.valorTotal)}</Td>
                  </Tr>
                ))}
                
                {(!dashboardData?.produtosMaisVendidos || dashboardData.produtosMaisVendidos.length === 0) && (
                  <Tr>
                    <Td colSpan={3} textAlign="center">
                      <Text py={4} color={textColor}>
                        Nenhum produto vendido no período selecionado.
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
