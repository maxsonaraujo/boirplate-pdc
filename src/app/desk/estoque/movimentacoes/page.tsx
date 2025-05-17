'use client'

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  Badge,
  Alert,
  AlertIcon,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  VStack,
} from '@chakra-ui/react';
import {
  FaHistory,
  FaSearch,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaArrowUp,
  FaArrowDown,
  FaFilter,
  FaCalendar,
  FaBoxOpen,
  FaUserAlt,
  FaInfoCircle,
} from 'react-icons/fa';
import { formatDate } from '@/utils/format';
import { useTenant } from '@/hooks/useTenant';
import Link from 'next/link';

// Tipo para movimentações
interface Movimentacao {
  id: number;
  insumoId: number;
  tipoMovimentacao: string;
  quantidade: number;
  observacao?: string;
  criadoEm: string | Date;
  insumo: {
    id: number;
    nome: string;
    codigo: string;
    unidadeMedida?: {
      simbolo: string;
    };
  };
  responsavel?: {
    id: number;
    name: string;
  };
  documentoId?: number;
  documentoTipo?: string;
}

export default function EstoqueMovimentacoes() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  const statBg = useColorModeValue('gray.50', 'gray.700');
  
  // Estados
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('criadoEm');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tipoFilter, setTipoFilter] = useState('');
  const [insumoFilter, setInsumoFilter] = useState('');
  const [insumos, setInsumos] = useState<any[]>([]);
  const [periodoFilter, setPeriodoFilter] = useState('30');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovimentacoes, setTotalMovimentacoes] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  // Buscar movimentações
  const fetchMovimentacoes = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Construir filtro de data baseado no período
      let dataInicio = '';
      if (periodoFilter) {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(periodoFilter));
        dataInicio = date.toISOString().split('T')[0];
      }
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itensPorPagina.toString(),
        search: searchTerm,
        sort: sortField,
        order: sortOrder,
        tipo: tipoFilter,
        insumoId: insumoFilter,
        dataInicio,
      });
      
      const response = await fetch(`/api/estoque/movimentacoes?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar movimentações');
      }
      
      const data = await response.json();
      
      setMovimentacoes(data.movimentacoes);
      setTotalMovimentacoes(data.total);
      setTotalPages(data.totalPages);
      setTotalEntradas(data.resumo?.totalEntradas || 0);
      setTotalSaidas(data.resumo?.totalSaidas || 0);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as movimentações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage, 
    itensPorPagina, 
    searchTerm, 
    sortField, 
    sortOrder, 
    tipoFilter, 
    insumoFilter,
    periodoFilter,
    toast
  ]);

  // Buscar insumos para o filtro
  const fetchInsumos = useCallback(async () => {
    try {
      const response = await fetch('/api/estoque/insumos?limit=100&status=true');
      
      if (response.ok) {
        const data = await response.json();
        setInsumos(data.insumos);
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
    }
  }, []);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    fetchMovimentacoes();
    fetchInsumos();
  }, [fetchMovimentacoes, fetchInsumos]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Componente de cabeçalho de coluna ordenável
  const SortableHeader = ({ label, field }: { label: string; field: string }) => (
    <Th 
      cursor="pointer" 
      onClick={() => handleSort(field)}
      userSelect="none"
    >
      <HStack spacing={1}>
        <Text>{label}</Text>
        {sortField === field ? (
          <Icon as={sortOrder === 'asc' ? FaSortAmountUp : FaSortAmountDown} boxSize={3} />
        ) : (
          <Icon as={FaSort} boxSize={3} opacity={0.5} />
        )}
      </HStack>
    </Th>
  );

  // Helper para obter a cor baseada no tipo de movimentação
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA': return 'green';
      case 'SAIDA': return 'red';
      case 'PRODUCAO': return 'blue';
      case 'DESCARTE': return 'orange';
      case 'AJUSTE': return 'purple';
      default: return 'gray';
    }
  };

  // Helper para obter ícone baseado no tipo de movimentação
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA': return FaArrowUp;
      case 'SAIDA': 
      case 'PRODUCAO':
      case 'DESCARTE': 
        return FaArrowDown;
      default: return FaInfoCircle;
    }
  };

  // Descritivo do tipo de documento
  const getDocumentoDescricao = (movimentacao: Movimentacao) => {
    const { documentoTipo, documentoId } = movimentacao;
    
    if (!documentoTipo || !documentoId) return null;
    
    switch (documentoTipo) {
      case 'COMPRA':
        return (
          <Link href={`/estoque/compras/${documentoId}`}>
            <Text color="blue.500" textDecoration="underline">
              Compra #{documentoId}
            </Text>
          </Link>
        );
      case 'PRODUCAO':
        return (
          <Link href={`/producao/ordens/${documentoId}`}>
            <Text color="blue.500" textDecoration="underline">
              Produção #{documentoId}
            </Text>
          </Link>
        );
      case 'INVENTARIO':
        return <Text>Inventário #{documentoId}</Text>;
      default:
        return <Text>{documentoTipo} #{documentoId}</Text>;
    }
  };

  return (
    <Box p={5}>
      <Heading size="lg" mb={6} display="flex" alignItems="center">
        <Icon as={FaHistory} mr={2} />
        {tenant ? `Movimentações de Estoque - ${tenant.nome}` : 'Histórico de Movimentações'}
      </Heading>

      {/* Cards de estatísticas */}
      <StatGroup mb={6} gap={4} flexWrap="wrap">
        <Stat 
          bg={statBg} 
          p={4} 
          borderRadius="md" 
          flex="1" 
          minW="180px"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Icon as={FaHistory} boxSize={6} color="blue.500" />
            <Box>
              <StatLabel>Total de Movimentações</StatLabel>
              <StatNumber>{totalMovimentacoes}</StatNumber>
              <StatHelpText>No período selecionado</StatHelpText>
            </Box>
          </HStack>
        </Stat>
        
        <Stat 
          bg={statBg} 
          p={4} 
          borderRadius="md" 
          flex="1" 
          minW="180px"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Icon as={FaArrowUp} boxSize={6} color="green.500" />
            <Box>
              <StatLabel>Entradas</StatLabel>
              <StatNumber>{totalEntradas}</StatNumber>
              <StatHelpText>({Math.round((totalEntradas/totalMovimentacoes)*100) || 0}% do total)</StatHelpText>
            </Box>
          </HStack>
        </Stat>
        
        <Stat 
          bg={statBg} 
          p={4} 
          borderRadius="md" 
          flex="1" 
          minW="180px"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Icon as={FaArrowDown} boxSize={6} color="red.500" />
            <Box>
              <StatLabel>Saídas</StatLabel>
              <StatNumber>{totalSaidas}</StatNumber>
              <StatHelpText>({Math.round((totalSaidas/totalMovimentacoes)*100) || 0}% do total)</StatHelpText>
            </Box>
          </HStack>
        </Stat>
      </StatGroup>

      <Card bg={bgCard} mb={6} boxShadow="md">
        <CardHeader>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            {/* Barra de busca */}
            <GridItem colSpan={{ base: 12, md: 4 }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder="Buscar movimentação..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </GridItem>
            
            {/* Filtros */}
            <GridItem colSpan={{ base: 12, md: 8 }}>
              <HStack spacing={3} justifyContent={{ base: 'flex-start', md: 'flex-end' }} flexWrap="wrap" gap={2}>
                {/* Filtro de período */}
                <Select 
                  width="auto" 
                  minW="140px"
                  value={periodoFilter}
                  onChange={(e) => setPeriodoFilter(e.target.value)}
                >
                  <option value="">Todas as datas</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="365">Último ano</option>
                </Select>
                
                {/* Filtro de tipo */}
                <Select 
                  width="auto" 
                  minW="150px"
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  <option value="ENTRADA">Entradas</option>
                  <option value="SAIDA">Saídas</option>
                  <option value="PRODUCAO">Produção</option>
                  <option value="DESCARTE">Descartes</option>
                  <option value="AJUSTE">Ajustes</option>
                </Select>
                
                {/* Filtro de insumo */}
                <Select 
                  width="auto" 
                  minW="180px"
                  value={insumoFilter}
                  onChange={(e) => setInsumoFilter(e.target.value)}
                >
                  <option value="">Todos os insumos</option>
                  {insumos.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.nome}
                    </option>
                  ))}
                </Select>
                
                <Button 
                  colorScheme="blue" 
                  leftIcon={<FaFilter />}
                  onClick={() => fetchMovimentacoes()}
                >
                  Filtrar
                </Button>
              </HStack>
            </GridItem>
          </Grid>
        </CardHeader>

        <CardBody>
          {isLoading ? (
            <Flex justify="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : movimentacoes.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <Stack>
                <Text>
                  Nenhuma movimentação encontrada com os filtros selecionados.
                </Text>
              </Stack>
            </Alert>
          ) : (
            <>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <SortableHeader label="Data" field="criadoEm" />
                      <Th>Insumo</Th>
                      <Th>Tipo</Th>
                      <Th isNumeric>Quantidade</Th>
                      <Th>Responsável</Th>
                      <Th>Documento</Th>
                      <Th>Observação</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {movimentacoes.map((movimentacao) => (
                      <Tr key={movimentacao.id}>
                        <Td whiteSpace="nowrap">{formatDate(movimentacao.criadoEm, true)}</Td>
                        <Td>
                          <Link href={`/estoque/insumos/${movimentacao.insumoId}`}>
                            <Text color="teal.500" textDecoration="underline">
                              {movimentacao.insumo.nome}
                            </Text>
                          </Link>
                        </Td>
                        <Td>
                          <Badge colorScheme={getTipoColor(movimentacao.tipoMovimentacao)}>
                            {movimentacao.tipoMovimentacao}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          <HStack justify="flex-end">
                            <Icon 
                              as={getTipoIcon(movimentacao.tipoMovimentacao)} 
                              color={
                                movimentacao.tipoMovimentacao === 'ENTRADA' ? 'green.500' : 
                                movimentacao.tipoMovimentacao === 'AJUSTE' ? 'purple.500' : 'red.500'
                              } 
                            />
                            <Text>
                              {movimentacao.quantidade.toFixed(2)} {movimentacao.insumo.unidadeMedida?.simbolo || ''}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>{movimentacao.responsavel?.name || 'Sistema'}</Td>
                        <Td>{getDocumentoDescricao(movimentacao)}</Td>
                        <Td 
                          maxW="200px" 
                          whiteSpace="nowrap" 
                          overflow="hidden" 
                          textOverflow="ellipsis"
                        >
                          {movimentacao.observacao || '-'}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {/* Paginação */}
              <Flex justify="space-between" align="center" mt={4}>
                <Select
                  w="100px"
                  value={itensPorPagina}
                  onChange={(e) => setItensPorPagina(Number(e.target.value))}
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Select>

                <HStack>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    isDisabled={currentPage === 1}
                  >
                    Anterior
                  </Button>

                  <Text>
                    Página {currentPage} de {totalPages || 1}
                  </Text>

                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(prev =>
                      Math.min(prev + 1, totalPages)
                    )}
                    isDisabled={currentPage >= totalPages}
                  >
                    Próxima
                  </Button>
                </HStack>

                <Text fontSize="sm">
                  Total: {totalMovimentacoes} movimentações
                </Text>
              </Flex>
            </>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}
