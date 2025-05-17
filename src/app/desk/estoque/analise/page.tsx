'use client'

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Badge,
  HStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
} from '@chakra-ui/react';
import {
  FaChartLine,
  FaChartPie,
  FaBoxOpen,
  FaMoneyBillWave,
  FaShoppingCart,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaLayerGroup,
  FaWarehouse,
  FaHistory,
  FaClipboardCheck,
} from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { formatCurrency, formatDate } from '@/utils/format';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Importar chart dinamicamente para evitar problemas com SSR
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function EstoqueAnalisePage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cores para o tema
  const cardBg = useColorModeValue('white', 'gray.800');
  const statCardBg = useColorModeValue('gray.50', 'gray.700');
  const isDarkMode = useColorModeValue(false, true);
  
  // Cores para os gráficos
  const chartColors = {
    entradas: '#38A169',
    saidas: '#E53E3E',
    valor: '#3182CE',
    compras: '#805AD5',
  };
  
  // Cores para os gráficos de pizza
  const pieColors = ['#38A169', '#3182CE', '#805AD5', '#DD6B20', '#F6AD55', '#E53E3E', '#9F7AEA', '#4FD1C5', '#718096', '#D53F8C'];

  // Carregar dados do dashboard avançado
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/estoque/dashboard/avancado');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da análise de estoque',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Preparar dados para gráfico de movimentações por mês
  const prepareMovimentacoesChart = () => {
    if (!dashboardData) return null;
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    return {
      options: {
        chart: {
          id: 'movimentacoes',
          toolbar: {
            show: false
          },
          background: 'transparent'
        },
        xaxis: {
          categories: meses
        },
        colors: [chartColors.entradas, chartColors.saidas],
        theme: {
          mode: isDarkMode ? 'dark' : 'light'
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            shadeIntensity: 0.3,
            opacityFrom: 0.7,
            opacityTo: 0.2
          }
        },
        markers: {
          size: 5
        },
        tooltip: {
          y: {
            formatter: (value: number) => value.toFixed(2)
          }
        },
        title: {
          text: 'Movimentações por Mês',
          align: 'left',
          style: {
            fontSize: '16px',
            fontWeight: 'bold'
          }
        }
      },
      series: [
        {
          name: 'Entradas',
          data: dashboardData.movimentacoesPorMes.map((m: any) => m.entradas.toFixed(2))
        },
        {
          name: 'Saídas',
          data: dashboardData.movimentacoesPorMes.map((m: any) => m.saidas.toFixed(2))
        }
      ]
    };
  };
  
  // Preparar dados para gráfico de compras por mês
  const prepareComprasChart = () => {
    if (!dashboardData) return null;
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    return {
      options: {
        chart: {
          id: 'compras',
          toolbar: {
            show: false
          },
          background: 'transparent'
        },
        xaxis: {
          categories: meses
        },
        colors: [chartColors.compras, chartColors.valor],
        theme: {
          mode: isDarkMode ? 'dark' : 'light'
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            shadeIntensity: 0.3,
            opacityFrom: 0.7,
            opacityTo: 0.2
          }
        },
        markers: {
          size: 4
        },
        title: {
          text: 'Compras por Mês',
          align: 'left',
          style: {
            fontSize: '16px',
            fontWeight: 'bold'
          }
        },
        yaxis: [
          {
            title: {
              text: 'Número de Compras'
            }
          },
          {
            opposite: true,
            title: {
              text: 'Valor (R$)'
            },
            labels: {
              formatter: (value: number) => `R$ ${value.toFixed(0)}`
            }
          }
        ],
      },
      series: [
        {
          name: 'Número de Compras',
          type: 'column',
          data: dashboardData.comprasPorMes.map((m: any) => m.numero)
        },
        {
          name: 'Valor Total (R$)',
          type: 'line',
          data: dashboardData.comprasPorMes.map((m: any) => m.total.toFixed(2))
        }
      ]
    };
  };
  
  // Preparar dados para gráfico de valor por categoria
  const prepareCategoriasChart = () => {
    if (!dashboardData) return null;
    
    // Filtrar para mostrar apenas as categorias com valor significativo
    const topCategorias = dashboardData.valorPorCategoria
      .sort((a: any, b: any) => b.valorEstoque - a.valorEstoque)
      .slice(0, 5);
    
    // Calcular o total para a categoria "Outros"
    const totalValor = dashboardData.valorPorCategoria.reduce(
      (total: number, cat: any) => total + cat.valorEstoque, 
      0
    );
    
    const topValor = topCategorias.reduce(
      (total: number, cat: any) => total + cat.valorEstoque, 
      0
    );
    
    const outros = {
      nome: 'Outras Categorias',
      valorEstoque: totalValor - topValor
    };
    
    // Adicionar "Outros" se houver valor significativo
    const dadosGrafico = [...topCategorias];
    if (outros.valorEstoque > 0) {
      dadosGrafico.push(outros);
    }
    
    return {
      options: {
        chart: {
          id: 'categorias',
          background: 'transparent'
        },
        labels: dadosGrafico.map(cat => cat.nome),
        colors: pieColors,
        theme: {
          mode: isDarkMode ? 'dark' : 'light'
        },
        legend: {
          position: 'bottom'
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 300
              },
              legend: {
                position: 'bottom'
              }
            }
          }
        ],
        title: {
          text: 'Valor de Estoque por Categoria',
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 'bold'
          }
        },
        tooltip: {
          y: {
            formatter: (value: number) => formatCurrency(value)
          }
        },
        dataLabels: {
          formatter: (val: number, opts: any) => {
            return `${formatCurrency(opts.w.config.series[opts.seriesIndex])}`;
          }
        }
      },
      series: dadosGrafico.map(cat => parseFloat(cat.valorEstoque.toFixed(2)))
    };
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="500px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={5}>
      <Breadcrumb mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/estoque">Estoque</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Análise Avançada</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Heading mb={6} display="flex" alignItems="center">
        <Icon as={FaChartLine} mr={2} />
        Análise Avançada de Estoque
      </Heading>

      {/* Cards de resumo comparativo */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        <Card bg={statCardBg} boxShadow="sm">
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Icon as={FaArrowUp} mr={2} color="green.500" />
                Entradas no Mês
              </StatLabel>
              <StatNumber>{dashboardData.mesAtual.entradas.toFixed(2)}</StatNumber>
              <StatHelpText>
                {dashboardData.mesAnterior.entradas > 0 ? (
                  <>
                    <StatArrow 
                      type={dashboardData.mesAtual.entradas >= dashboardData.mesAnterior.entradas ? 'increase' : 'decrease'} 
                    />
                    {Math.abs(
                      ((dashboardData.mesAtual.entradas - dashboardData.mesAnterior.entradas) / 
                      dashboardData.mesAnterior.entradas) * 100
                    ).toFixed(1)}% do mês anterior
                  </>
                ) : 'Primeiro mês com registros'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={statCardBg} boxShadow="sm">
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Icon as={FaArrowDown} mr={2} color="red.500" />
                Saídas no Mês
              </StatLabel>
              <StatNumber>{dashboardData.mesAtual.saidas.toFixed(2)}</StatNumber>
              <StatHelpText>
                {dashboardData.mesAnterior.saidas > 0 ? (
                  <>
                    <StatArrow 
                      type={dashboardData.mesAtual.saidas >= dashboardData.mesAnterior.saidas ? 'increase' : 'decrease'} 
                    />
                    {Math.abs(
                      ((dashboardData.mesAtual.saidas - dashboardData.mesAnterior.saidas) / 
                      dashboardData.mesAnterior.saidas) * 100
                    ).toFixed(1)}% do mês anterior
                  </>
                ) : 'Primeiro mês com registros'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={statCardBg} boxShadow="sm">
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Icon as={FaShoppingCart} mr={2} color="purple.500" />
                Compras no Mês
              </StatLabel>
              <StatNumber>{dashboardData.mesAtual.compras}</StatNumber>
              <StatHelpText>
                {dashboardData.mesAnterior.compras > 0 ? (
                  <>
                    <StatArrow 
                      type={dashboardData.mesAtual.compras >= dashboardData.mesAnterior.compras ? 'increase' : 'decrease'} 
                    />
                    {Math.abs(
                      ((dashboardData.mesAtual.compras - dashboardData.mesAnterior.compras) / 
                      dashboardData.mesAnterior.compras) * 100
                    ).toFixed(1)}% do mês anterior
                  </>
                ) : 'Primeiro mês com registros'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={statCardBg} boxShadow="sm">
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Icon as={FaMoneyBillWave} mr={2} color="green.500" />
                Valor em Compras
              </StatLabel>
              <StatNumber>{formatCurrency(dashboardData.mesAtual.valorCompras)}</StatNumber>
              <StatHelpText>
                {dashboardData.mesAnterior.valorCompras > 0 ? (
                  <>
                    <StatArrow 
                      type={dashboardData.mesAtual.valorCompras >= dashboardData.mesAnterior.valorCompras ? 'increase' : 'decrease'} 
                    />
                    {Math.abs(
                      ((dashboardData.mesAtual.valorCompras - dashboardData.mesAnterior.valorCompras) / 
                      dashboardData.mesAnterior.valorCompras) * 100
                    ).toFixed(1)}% do mês anterior
                  </>
                ) : 'Primeiro mês com registros'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Gráficos */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card bg={cardBg} boxShadow="md">
          <CardBody>
            {typeof window !== 'undefined' && dashboardData && (
              <Chart
                options={prepareMovimentacoesChart().options as any}
                series={prepareMovimentacoesChart().series}
                type="area"
                height={350}
              />
            )}
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="md">
          <CardBody>
            {typeof window !== 'undefined' && dashboardData && (
              <Chart
                options={prepareComprasChart().options as any}
                series={prepareComprasChart().series}
                type="line"
                height={350}
              />
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Tabs para análises detalhadas */}
      <Tabs colorScheme="teal" mb={8}>
        <TabList>
          <Tab><Icon as={FaLayerGroup} mr={2} />Categorias</Tab>
          <Tab><Icon as={FaBoxOpen} mr={2} />Giro de Insumos</Tab>
          <Tab><Icon as={FaExclamationTriangle} mr={2} />Sem Movimento</Tab>
          <Tab><Icon as={FaClipboardCheck} mr={2} />Inventários</Tab>
        </TabList>

        <TabPanels>
          {/* Tab de Categorias */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card bg={cardBg} boxShadow="md">
                <CardHeader>
                  <Heading size="md">Valor de Estoque por Categoria</Heading>
                </CardHeader>
                <CardBody>
                  {typeof window !== 'undefined' && dashboardData && (
                    <Chart
                      options={prepareCategoriasChart().options as any}
                      series={prepareCategoriasChart().series}
                      type="pie"
                      height={350}
                    />
                  )}
                </CardBody>
              </Card>

              <Card bg={cardBg} boxShadow="md">
                <CardHeader>
                  <Heading size="md">Detalhamento por Categorias</Heading>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Categoria</Th>
                          <Th isNumeric>Insumos</Th>
                          <Th isNumeric>Valor em Estoque</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {dashboardData.valorPorCategoria.map((categoria: any) => (
                          <Tr key={categoria.id}>
                            <Td fontWeight="medium">{categoria.nome}</Td>
                            <Td isNumeric>{categoria.quantidadeInsumos}</Td>
                            <Td isNumeric fontWeight="bold">{formatCurrency(categoria.valorEstoque)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* Tab de Giro de Insumos */}
          <TabPanel>
            <Card bg={cardBg} boxShadow="md">
              <CardHeader>
                <Heading size="md">Top Insumos por Volume de Saída (Últimos 30 dias)</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Insumo</Th>
                        <Th>Categoria</Th>
                        <Th isNumeric>Saídas</Th>
                        <Th>Unidade</Th>
                        <Th isNumeric>Valor Movimentado</Th>
                        <Th isNumeric>Estoque Atual</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dashboardData.insumosPorGiro.map((insumo: any) => (
                        <Tr key={insumo.id}>
                          <Td fontWeight="medium">{insumo.nome}</Td>
                          <Td>{insumo.categoria || '-'}</Td>
                          <Td isNumeric>
                            <Badge colorScheme="red" fontSize="md">{insumo.totalSaida.toFixed(2)}</Badge>
                          </Td>
                          <Td>{insumo.unidadeMedida}</Td>
                          <Td isNumeric>{formatCurrency(insumo.valorMovimentado)}</Td>
                          <Td isNumeric>{insumo.estoqueAtual.toFixed(2)} {insumo.unidadeMedida}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Tab de Insumos sem Movimento */}
          <TabPanel>
            <Card bg={cardBg} boxShadow="md">
              <CardHeader>
                <HStack>
                  <Heading size="md">Insumos Sem Movimentação (Últimos 30 dias)</Heading>
                  <Badge colorScheme="orange" fontSize="md">
                    {dashboardData.insumosSemMovimentacao.length} itens
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody>
                <Alert status="warning" mb={4}>
                  <AlertIcon />
                  <Text>
                    Estes insumos possuem estoque, mas não tiveram saída nos últimos 30 dias. 
                    Considere revisar para evitar estoque parado.
                  </Text>
                </Alert>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Insumo</Th>
                        <Th>Categoria</Th>
                        <Th isNumeric>Dias sem Movimentação</Th>
                        <Th isNumeric>Estoque Atual</Th>
                        <Th>Unidade</Th>
                        <Th isNumeric>Valor Parado</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dashboardData.insumosSemMovimentacao.map((insumo: any) => (
                        <Tr key={insumo.id}>
                          <Td fontWeight="medium">{insumo.nome}</Td>
                          <Td>{insumo.categoria || '-'}</Td>
                          <Td isNumeric>
                            <Badge colorScheme="red">{insumo.diasSemMovimentacao}+</Badge>
                          </Td>
                          <Td isNumeric>{insumo.estoqueAtual.toFixed(2)}</Td>
                          <Td>{insumo.unidadeMedida}</Td>
                          <Td isNumeric fontWeight="bold">{formatCurrency(insumo.valorEstoque)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Tab de Inventários */}
          <TabPanel>
            <Card bg={cardBg} boxShadow="md">
              <CardHeader>
                <Heading size="md">Inventários Recentes</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Data</Th>
                        <Th>Responsável</Th>
                        <Th isNumeric>Itens Ajustados</Th>
                        <Th>Ações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dashboardData.inventariosRecentes.map((inventario: any) => (
                        <Tr key={inventario.id}>
                          <Td>{formatDate(inventario.data)}</Td>
                          <Td>{inventario.responsavel?.name || 'Sistema'}</Td>
                          <Td isNumeric>
                            <Badge colorScheme="blue">{inventario._count.itens}</Badge>
                          </Td>
                          <Td>
                            <Button
                              as={Link}
                              href="/estoque/inventario"
                              size="sm"
                              colorScheme="teal"
                              variant="outline"
                            >
                              Ver Detalhes
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Sumário */}
      <Card bg={cardBg} boxShadow="md" mb={6}>
        <CardHeader>
          <Heading size="md">Resumo da Análise</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box>
              <Heading size="sm" mb={2}>Destaques Positivos:</Heading>
              <Text>• {dashboardData.insumosPorGiro[0]?.nome || 'N/A'} é o item com maior giro</Text>
              <Text>• Categoria {dashboardData.valorPorCategoria[0]?.nome || 'N/A'} representa o maior valor em estoque</Text>
              {dashboardData.mesAtual.entradas > dashboardData.mesAnterior.entradas && (
                <Text>• Aumento nas entradas de estoque em relação ao mês anterior</Text>
              )}
            </Box>
            
            <Box>
              <Heading size="sm" mb={2}>Pontos de Atenção:</Heading>
              <Text>• {dashboardData.insumosSemMovimentacao.length} insumos sem saída nos últimos 30 dias</Text>
              {dashboardData.mesAtual.saidas < dashboardData.mesAnterior.saidas && (
                <Text>• Redução nas saídas de estoque em relação ao mês anterior</Text>
              )}
              <Text>• Valor parado em estoque sem giro: {formatCurrency(
                dashboardData.insumosSemMovimentacao.reduce(
                  (total: number, insumo: any) => total + insumo.valorEstoque, 0
                )
              )}</Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
}
