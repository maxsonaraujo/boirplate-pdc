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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Alert,
  AlertIcon,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FaFileInvoiceDollar,
  FaChevronDown,
  FaEye,
  FaPlus,
  FaSearch,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTrash,
  FaPencilAlt,
  FaBoxOpen,
  FaCheck,
  FaFilter,
  FaCalendar,
  FaMoneyBillWave,
  FaHistory,
} from 'react-icons/fa';
import { formatCurrency, formatDate } from '@/utils/format';
import { useTenant } from '@/hooks/useTenant';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import Link from 'next/link';

// Tipo para compras
interface Compra {
  id: number;
  codigo: string;
  numeroNota?: string;
  dataCompra: Date | string;
  dataEntrega?: Date | string;
  valorTotal: number;
  status: string;
  fornecedor?: {
    id: number;
    razaoSocial: string;
    nomeFantasia?: string;
  };
  _count?: {
    itens: number;
  };
}

export default function EstoqueCompras() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  const statBg = useColorModeValue('gray.50', 'gray.700');
  
  // Estados
  const [compras, setCompras] = useState<Compra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dataCompra');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [fornecedorFilter, setFornecedorFilter] = useState('');
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [periodoFilter, setPeriodoFilter] = useState('30');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompras, setTotalCompras] = useState(0);
  const [valorTotalPeriodo, setValorTotalPeriodo] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  
  // Disclosures para modais
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();

  // Buscar compras
  const fetchCompras = useCallback(async () => {
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
        status: statusFilter,
        fornecedorId: fornecedorFilter,
        dataInicio,
      });
      
      const response = await fetch(`/api/estoque/compras?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar compras');
      }
      
      const data = await response.json();
      
      setCompras(data.compras);
      setTotalCompras(data.total);
      setTotalPages(data.totalPages);
      setValorTotalPeriodo(data.valorTotal || 0);
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as compras',
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
    statusFilter, 
    fornecedorFilter,
    periodoFilter,
    toast
  ]);

  // Buscar fornecedores para o filtro
  const fetchFornecedores = useCallback(async () => {
    try {
      const response = await fetch('/api/fornecedores?limit=100&status=true');
      
      if (response.ok) {
        const data = await response.json();
        setFornecedores(data.fornecedores);
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    }
  }, []);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    fetchCompras();
    fetchFornecedores();
  }, [fetchCompras, fetchFornecedores]);

  // Handlers
  const handleDeleteCompra = (compra: Compra) => {
    setSelectedCompra(compra);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedCompra) return;
    
    try {
      const response = await fetch(`/api/estoque/compras/${selectedCompra.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir compra');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Compra excluída com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchCompras();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a compra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };

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

  // Helper para obter a cor baseada no status da compra
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZADA': return 'green';
      case 'PENDENTE': return 'orange';
      case 'CANCELADA': return 'red';
      case 'PARCIAL': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <Box p={5}>
      <Heading size="lg" mb={6}>
        {tenant ? `Compras - ${tenant.nome}` : 'Gestão de Compras'}
      </Heading>

      {/* Cards de estatísticas */}
      <StatGroup mb={6} gap={4} flexWrap="wrap">
        <Stat 
          bg={statBg} 
          p={4} 
          borderRadius="md" 
          flex="1" 
          minW="200px"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Icon as={FaFileInvoiceDollar} boxSize={6} color="blue.500" />
            <Box>
              <StatLabel>Total de Compras</StatLabel>
              <StatNumber>{totalCompras}</StatNumber>
              <StatHelpText>No período selecionado</StatHelpText>
            </Box>
          </HStack>
        </Stat>
        
        <Stat 
          bg={statBg} 
          p={4} 
          borderRadius="md" 
          flex="1" 
          minW="200px"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Icon as={FaMoneyBillWave} boxSize={6} color="green.500" />
            <Box>
              <StatLabel>Valor Total</StatLabel>
              <StatNumber>{formatCurrency(valorTotalPeriodo)}</StatNumber>
              <StatHelpText>No período selecionado</StatHelpText>
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
                  placeholder="Buscar compra..." 
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
                
                {/* Filtro de status */}
                <Select 
                  width="auto" 
                  minW="150px"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="FINALIZADA">Finalizadas</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="PARCIAL">Parciais</option>
                  <option value="CANCELADA">Canceladas</option>
                </Select>
                
                {/* Filtro de fornecedor */}
                <Select 
                  width="auto" 
                  minW="180px"
                  value={fornecedorFilter}
                  onChange={(e) => setFornecedorFilter(e.target.value)}
                >
                  <option value="">Todos os fornecedores</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nomeFantasia || f.razaoSocial}
                    </option>
                  ))}
                </Select>
                
                <Button 
                  colorScheme="teal" 
                  leftIcon={<FaPlus />}
                  as={Link}
                  href="compras/new"
                >
                  Nova Compra
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
          ) : compras.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <Stack>
                <Text>
                  Nenhuma compra encontrada com os filtros selecionados.
                </Text>
                <Button 
                  as={Link}
                  href="compras/new"
                  variant="link" 
                  colorScheme="blue"
                  leftIcon={<FaPlus />}
                  alignSelf="flex-start"
                >
                  Registrar uma nova compra
                </Button>
              </Stack>
            </Alert>
          ) : (
            <>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <SortableHeader label="Código" field="codigo" />
                      <Th>Fornecedor</Th>
                      <SortableHeader label="Data" field="dataCompra" />
                      <Th>Nota Fiscal</Th>
                      <SortableHeader label="Valor Total" field="valorTotal" />
                      <Th>Status</Th>
                      <Th>Itens</Th>
                      <Th textAlign="center">Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {compras.map((compra) => (
                      <Tr key={compra.id}>
                        <Td fontFamily="mono">{compra.codigo}</Td>
                        <Td>{compra.fornecedor?.nomeFantasia || compra.fornecedor?.razaoSocial || '-'}</Td>
                        <Td>{formatDate(compra.dataCompra)}</Td>
                        <Td>{compra.numeroNota || '-'}</Td>
                        <Td fontWeight="medium">
                          {formatCurrency(compra.valorTotal)}
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(compra.status)}>
                            {compra.status}
                          </Badge>
                        </Td>
                        <Td isNumeric>{compra._count?.itens || 0}</Td>
                        <Td>
                          <HStack spacing={1} justify="center">
                            <Menu>
                              <MenuButton
                                as={Button}
                                size="sm"
                                rightIcon={<FaChevronDown />}
                                variant="outline"
                                colorScheme="teal"
                              >
                                Ações
                              </MenuButton>
                              <MenuList>
                                <MenuItem
                                  icon={<FaEye />}
                                  as={Link}
                                  href={`/estoque/compras/${compra.id}`}
                                >
                                  Visualizar
                                </MenuItem>
                                
                                {compra.status !== 'FINALIZADA' && compra.status !== 'CANCELADA' && (
                                  <MenuItem
                                    icon={<FaPencilAlt />}
                                    as={Link}
                                    href={`/estoque/compras/${compra.id}/edit`}
                                  >
                                    Editar
                                  </MenuItem>
                                )}
                                
                                {compra.status === 'PENDENTE' && (
                                  <MenuItem
                                    icon={<FaCheck />}
                                    as={Link}
                                    href={`/estoque/compras/${compra.id}/receber`}
                                  >
                                    Receber
                                  </MenuItem>
                                )}
                                
                                <Divider my={2} />
                                
                                {compra.status !== 'FINALIZADA' && (
                                  <MenuItem 
                                    icon={<FaTrash />}
                                    onClick={() => handleDeleteCompra(compra)}
                                    color="red.500"
                                  >
                                    Excluir
                                  </MenuItem>
                                )}
                              </MenuList>
                            </Menu>
                          </HStack>
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
                  <option value={10}>10</option>
                  <option value={25}>25</option>
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
                  Total: {totalCompras} compras
                </Text>
              </Flex>
            </>
          )}
        </CardBody>
      </Card>

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleConfirmDelete}
        title="Excluir Compra"
        message={`Tem certeza que deseja excluir a compra "${selectedCompra?.codigo}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  );
}
