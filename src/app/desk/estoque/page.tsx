'use client'

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  VStack,
  Text,
  useColorModeValue,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Divider,
} from '@chakra-ui/react';
import {
  FaWarehouse,
  FaBoxOpen,
  FaUsers,
  FaFileInvoiceDollar,
  FaHistory,
  FaMoneyBillWave,
  FaFire,
  FaChartPie,
  FaExclamationTriangle,
  FaBalanceScale,
  FaLayerGroup,
  FaRuler,
  FaClipboardCheck,
  FaChartLine,
  FaShoppingBag,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle,
  FaTags,
} from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { formatCurrency, formatDate } from '@/utils/format';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Importar chart dinamicamente para evitar problemas com SSR
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function EstoqueDashboard() {
  const { tenant } = useTenant();
  const toast = useToast();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cores para o tema
  const cardBg = useColorModeValue('white', 'gray.800');
  const statCardBg = useColorModeValue('gray.50', 'gray.700');
  const alertCardBg = useColorModeValue('red.50', 'red.900');
  const isDarkMode = useColorModeValue(false, true);

  // Carregar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/estoque/dashboard');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados do dashboard');
        }
        
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        setError('Não foi possível carregar os dados do dashboard de estoque');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do estoque',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  // Preparar dados para gráfico de pizza de categorias
  const prepareCategoriasChart = () => {
    if (!dashboardData) return null;
    
    const labels = dashboardData.estoquePorCategoria.slice(0, 6).map((cat: any) => cat.nome);
    const series = dashboardData.estoquePorCategoria.slice(0, 6).map((cat: any) => parseFloat(cat.valorEstoque.toFixed(2)));
    
    return {
      options: {
        chart: {
          type: 'donut',
        },
        labels,
        theme: {
          mode: isDarkMode ? 'dark' : 'light'
        },
        legend: {
          position: 'bottom'
        },
        tooltip: {
          y: {
            formatter: (value: number) => formatCurrency(value)
          }
        }
      },
      series
    };
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="500px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" variant="left-accent" my={6}>
        <AlertIcon />
        <Box>
          <Heading size="md" mb={2}>Erro ao carregar dados</Heading>
          <Text>{error}</Text>
          <Button mt={4} onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Box p={5}>
      <Heading mb={6} display="flex" alignItems="center">
        <Icon as={FaWarehouse} mr={2} />
        {tenant ? `Estoque - ${tenant.nome}` : 'Gerenciamento de Estoque'}
      </Heading>

      {/* Menu de Navegação Rápida */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
        <Button 
          as={Link}
          href="/estoque/insumos"
          size="lg"
          height="100px"
          colorScheme="teal"
          leftIcon={<FaBoxOpen />}
          justifyContent="start"
          pl={5}
        >
          <VStack align="start" spacing={0}>
            <Text>Insumos</Text>
            <Text fontSize="sm" opacity={0.8}>Gerenciar ingredientes</Text>
          </VStack>
        </Button>
        
        <Button 
          as={Link}
          href="/estoque/fornecedores"
          size="lg"
          height="100px"
          colorScheme="purple"
          leftIcon={<FaUsers />}
          justifyContent="start"
          pl={5}
        >
          <VStack align="start" spacing={0}>
            <Text>Fornecedores</Text>
            <Text fontSize="sm" opacity={0.8}>Gerenciar fornecedores</Text>
          </VStack>
        </Button>
        
        <Button 
          as={Link}
          href="/estoque/compras"
          size="lg"
          height="100px"
          colorScheme="blue"
          leftIcon={<FaFileInvoiceDollar />}
          justifyContent="start"
          pl={5}
        >
          <VStack align="start" spacing={0}>
            <Text>Compras</Text>
            <Text fontSize="sm" opacity={0.8}>Pedidos e recebimentos</Text>
          </VStack>
        </Button>
        
        <Button 
          as={Link}
          href="/estoque/movimentacoes"
          size="lg"
          height="100px"
          colorScheme="orange"
          leftIcon={<FaHistory />}
          justifyContent="start"
          pl={5}
        >
          <VStack align="start" spacing={0}>
            <Text>Movimentações</Text>
            <Text fontSize="sm" opacity={0.8}>Histórico de estoque</Text>
          </VStack>
        </Button>
      </SimpleGrid>

      {/* Cards de Resumo Geral */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        <Card bg={statCardBg} boxShadow="sm">
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Icon as={FaBoxOpen} mr={2} color="teal.500" />
                Insumos em Estoque
              </StatLabel>
              <StatNumber>{dashboardData.resumo.insumosComEstoque}</StatNumber>
              <StatHelpText>
                Total: {dashboardData.resumo.totalInsumos} insumos
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={statCardBg} boxShadow="sm">
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Icon as={FaMoneyBillWave} mr={2} color="green.500" />
                Valor em Estoque
              </StatLabel>
              <StatNumber>{formatCurrency(dashboardData.resumo.valorTotalEstoque)}</StatNumber>
              <StatHelpText>
                Distribuído em {dashboardData.resumo.insumosComEstoque} itens
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={statCardBg} boxShadow="sm">
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Icon as={FaShoppingBag} mr={2} color="blue.500" />
                Compras (30 dias)
              </StatLabel>
              <StatNumber>{dashboardData.resumo.totalComprasUltimos30Dias}</StatNumber>
              <StatHelpText>
                Valor: {formatCurrency(dashboardData.resumo.valorComprasUltimos30Dias)}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={statCardBg} boxShadow="sm">
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Icon as={FaExclamationTriangle} mr={2} color="red.500" />
                Alertas de Estoque
              </StatLabel>
              <StatNumber>{dashboardData.insumosAbaixoMinimo.length}</StatNumber>
              <StatHelpText>
                Insumos abaixo do mínimo
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Conteúdo principal em tabs */}
      <Tabs colorScheme="teal" isLazy mb={8}>
        <TabList>
          <Tab><Icon as={FaFire} mr={2} />Alertas de Estoque</Tab>
          <Tab><Icon as={FaHistory} mr={2} />Movimentações Recentes</Tab>
          <Tab><Icon as={FaFileInvoiceDollar} mr={2} />Compras Recentes</Tab>
        </TabList>

        <TabPanels>
          {/* Tab de Alertas de Estoque */}
          <TabPanel px={0}>
            <Card bg={cardBg} boxShadow="md">
              <CardHeader pb={2}>
                <Heading size="md" display="flex" alignItems="center">
                  <Icon as={FaExclamationTriangle} mr={2} color="red.500" />
                  Insumos Abaixo do Estoque Mínimo
                </Heading>
              </CardHeader>
              <CardBody pt={2}>
                {dashboardData.insumosAbaixoMinimo.length === 0 ? (
                  <Alert status="success" variant="subtle">
                    <AlertIcon />
                    Todos os insumos estão com estoque acima do mínimo.
                  </Alert>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Insumo</Th>
                          <Th>Categoria</Th>
                          <Th isNumeric>Estoque Atual</Th>
                          <Th isNumeric>Estoque Mínimo</Th>
                          <Th>Status</Th>
                          <Th>Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {dashboardData.insumosAbaixoMinimo.map((insumo: any) => (
                          <Tr key={insumo.id}>
                            <Td fontWeight="medium">{insumo.nome}</Td>
                            <Td>{insumo.categoria ? insumo.categoria.nome : '-'}</Td>
                            <Td isNumeric color="red.500" fontWeight="bold">
                              {insumo.estoqueAtual.toFixed(2)} {insumo.unidadeMedida?.simbolo}
                            </Td>
                            <Td isNumeric>
                              {insumo.estoqueMinimo.toFixed(2)} {insumo.unidadeMedida?.simbolo}
                            </Td>
                            <Td>
                              <Badge colorScheme="red">
                                {((insumo.estoqueAtual / insumo.estoqueMinimo) * 100).toFixed(0)}%
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Button 
                                  as={Link} 
                                  href={`/estoque/insumos/${insumo.id}`}
                                  size="sm" 
                                  colorScheme="teal" 
                                  variant="outline"
                                >
                                  Detalhes
                                </Button>
                                <Button 
                                  as={Link} 
                                  href="/estoque/compras/new"
                                  size="sm" 
                                  colorScheme="blue"
                                >
                                  Comprar
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Tab de Movimentações Recentes */}
          <TabPanel px={0}>
            <Card bg={cardBg} boxShadow="md">
              <CardHeader>
                <Heading size="md">Movimentações Recentes</Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Data</Th>
                      <Th>Insumo</Th>
                      <Th>Tipo</Th>
                      <Th isNumeric>Quantidade</Th>
                      <Th>Responsável</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dashboardData.movimentacoesRecentes.map((movimentacao: any) => (
                      <Tr key={movimentacao.id}>
                        <Td>{formatDate(movimentacao.criadoEm, true)}</Td>
                        <Td>
                          <Link href={`/estoque/insumos/${movimentacao.insumoId}`}>
                            <Text color="teal.500" textDecoration="underline">
                              {movimentacao.insumo.nome}
                            </Text>
                          </Link>
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={
                              movimentacao.tipoMovimentacao === 'ENTRADA' ? 'green' : 
                              movimentacao.tipoMovimentacao === 'SAIDA' ? 'red' : 
                              movimentacao.tipoMovimentacao === 'PRODUCAO' ? 'blue' : 
                              movimentacao.tipoMovimentacao === 'DESCARTE' ? 'orange' : 
                              'purple'
                            }
                          >
                            {movimentacao.tipoMovimentacao}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          {movimentacao.quantidade.toFixed(2)} {movimentacao.insumo.unidadeMedida?.simbolo || ''}
                        </Td>
                        <Td>{movimentacao.responsavel?.name || 'Sistema'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                
                <Button 
                  as={Link} 
                  href="/estoque/movimentacoes" 
                  colorScheme="teal" 
                  variant="outline"
                  mt={4}
                  size="sm"
                >
                  Ver Todas as Movimentações
                </Button>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Tab de Compras Recentes */}
          <TabPanel px={0}>
            <Card bg={cardBg} boxShadow="md">
              <CardHeader>
                <Heading size="md">Compras Recentes</Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Código</Th>
                      <Th>Data</Th>
                      <Th>Fornecedor</Th>
                      <Th>Status</Th>
                      <Th isNumeric>Valor Total</Th>
                      <Th>Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dashboardData.comprasRecentes.map((compra: any) => (
                      <Tr key={compra.id}>
                        <Td>{compra.codigo}</Td>
                        <Td>{formatDate(compra.dataCompra)}</Td>
                        <Td>{compra.fornecedor.nomeFantasia || compra.fornecedor.razaoSocial}</Td>
                        <Td>
                          <Badge 
                            colorScheme={
                              compra.status === 'FINALIZADA' ? 'green' : 
                              compra.status === 'PENDENTE' ? 'orange' : 
                              compra.status === 'PARCIAL' ? 'blue' : 'red'
                            }
                          >
                            {compra.status}
                          </Badge>
                        </Td>
                        <Td isNumeric fontWeight="bold">{formatCurrency(compra.valorTotal)}</Td>
                        <Td>
                          <Button 
                            as={Link} 
                            href={`/estoque/compras/${compra.id}`}
                            size="sm" 
                            colorScheme="teal"
                          >
                            Detalhes
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                
                <HStack mt={4} spacing={2}>
                  <Button 
                    as={Link} 
                    href="/estoque/compras" 
                    colorScheme="teal" 
                    variant="outline"
                    size="sm"
                  >
                    Ver Todas as Compras
                  </Button>
                  <Button 
                    as={Link} 
                    href="/estoque/compras/new" 
                    colorScheme="blue" 
                    size="sm"
                  >
                    Nova Compra
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Distribuição de Estoque por Categoria */}
      <Card bg={cardBg} boxShadow="md" mt={8}>
        <CardHeader>
          <Heading size="md" display="flex" alignItems="center">
            <Icon as={FaChartPie} mr={2} color="purple.500" />
            Distribuição de Estoque por Categoria
          </Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            {typeof window !== 'undefined' && dashboardData && (
              <Box>
                <Chart
                  options={prepareCategoriasChart().options as any}
                  series={prepareCategoriasChart().series}
                  type="donut"
                  height={300}
                />
              </Box>
            )}
            
            <Box>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Categoria</Th>
                    <Th isNumeric>Insumos</Th>
                    <Th isNumeric>Valor</Th>
                    <Th isNumeric>%</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dashboardData.estoquePorCategoria.slice(0, 5).map((categoria: any) => (
                    <Tr key={categoria.id}>
                      <Td fontWeight="medium">{categoria.nome}</Td>
                      <Td isNumeric>{categoria.quantidadeInsumos}</Td>
                      <Td isNumeric>{formatCurrency(categoria.valorEstoque)}</Td>
                      <Td isNumeric>
                        {(
                          (categoria.valorEstoque / dashboardData.resumo.valorTotalEstoque) * 100
                        ).toFixed(1)}%
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Acesso Rápido às Funcionalidades */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} mt={8}>
        <Card bg={cardBg} boxShadow="md">
          <CardHeader pb={2}>
            <Heading size="sm">Ações Rápidas</Heading>
          </CardHeader>
          <CardBody pt={2}>
            <VStack align="stretch" spacing={3}>
              <Button
                as={Link}
                href="/estoque/compras/new"
                leftIcon={<FaFileInvoiceDollar />}
                colorScheme="blue"
                size="sm"
              >
                Registrar Nova Compra
              </Button>
              <Button
                as={Link}
                href="/estoque/insumos/new"
                leftIcon={<FaBoxOpen />}
                colorScheme="teal"
                size="sm"
              >
                Cadastrar Novo Insumo
              </Button>
              <Button
                as={Link}
                href="/estoque/inventario"
                leftIcon={<FaBalanceScale />}
                colorScheme="purple"
                size="sm"
              >
                Fazer Inventário
              </Button>
              <Button
                as={Link}
                href="/estoque/analise"
                leftIcon={<FaChartLine />}
                colorScheme="orange"
                size="sm"
              >
                Análise Avançada
              </Button>
            </VStack>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md">
          <CardHeader pb={2}>
            <Heading size="sm">Configurações de Estoque</Heading>
          </CardHeader>
          <CardBody pt={2}>
            <VStack align="stretch" spacing={3}>
              <Button
                as={Link}
                href="/estoque/categorias"
                leftIcon={<FaLayerGroup />}
                variant="outline"
                colorScheme="teal"
                size="sm"
              >
                Categorias
              </Button>
              <Button
                as={Link}
                href="/estoque/unidades"
                leftIcon={<FaRuler />}
                variant="outline"
                colorScheme="teal"
                size="sm"
              >
                Unidades de Medida
              </Button>
              <Button
                as={Link}
                href="/estoque/fornecedores"
                leftIcon={<FaUsers />}
                variant="outline"
                colorScheme="teal"
                size="sm"
              >
                Fornecedores
              </Button>
              <Button
                as={Link}
                href="/estoque/lotes"
                leftIcon={<FaTags />}
                variant="outline"
                colorScheme="teal"
                size="sm"
              >
                Gestão de Lotes
              </Button>
            </VStack>
          </CardBody>
        </Card>
        
        <Card bg={alertCardBg} boxShadow="md" borderLeft="4px solid" borderColor="red.500">
          <CardHeader pb={2}>
            <HStack>
              <Icon as={FaExclamationTriangle} color="red.500" />
              <Heading size="sm">Alertas de Estoque Crítico</Heading>
            </HStack>
          </CardHeader>
          <CardBody pt={2}>
            <Text mb={4}>
              {dashboardData.insumosAbaixoMinimo.length === 0 
                ? 'Não há alertas de estoque crítico no momento.' 
                : `Há ${dashboardData.insumosAbaixoMinimo.length} insumos abaixo do estoque mínimo.`}
            </Text>
            
            {dashboardData.insumosAbaixoMinimo.length > 0 && (
              <VStack align="stretch" spacing={2}>
                {dashboardData.insumosAbaixoMinimo.slice(0, 3).map((insumo: any) => (
                  <Box key={insumo.id} p={2} bg={useColorModeValue('red.50', 'red.700')} borderRadius="md">
                    <HStack justify="space-between">
                      <Text fontWeight="medium">{insumo.nome}</Text>
                      <Badge colorScheme="red">
                        {insumo.estoqueAtual.toFixed(2)} / {insumo.estoqueMinimo.toFixed(2)} {insumo.unidadeMedida?.simbolo}
                      </Badge>
                    </HStack>
                    <Progress 
                      value={(insumo.estoqueAtual / insumo.estoqueMinimo) * 100} 
                      colorScheme="red" 
                      size="sm" 
                      mt={1} 
                    />
                  </Box>
                ))}
                
                {dashboardData.insumosAbaixoMinimo.length > 3 && (
                  <Button 
                    as={Link}
                    href="/estoque/insumos?filtroEstoque=abaixoMinimo"
                    size="sm" 
                    colorScheme="red" 
                    variant="outline"
                  >
                    Ver todos os {dashboardData.insumosAbaixoMinimo.length} alertas
                  </Button>
                )}
              </VStack>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
