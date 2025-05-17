'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  StatGroup,
  useDisclosure,
  MenuDivider,
} from '@chakra-ui/react';
import {
  FaBoxOpen,
  FaChevronDown,
  FaEye,
  FaPlus,
  FaSearch,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTrash,
  FaPencilAlt,
  FaCheck,
  FaTimes,
  FaClipboardList,
} from 'react-icons/fa';
import { formatDate } from '@/utils/format';
import { useTenant } from '@/hooks/useTenant';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import Link from 'next/link';

// Tipo para inventários
interface Inventario {
  id: number;
  codigo: string;
  dataInicio: Date | string;
  dataFim?: Date | string;
  status: string;
  observacoes?: string;
  responsavel?: {
    id: number;
    name: string;
    email: string;
  };
  _count?: {
    itens: number;
  };
}

export default function InventariosPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const router = useRouter();
  const bgCard = useColorModeValue('white', 'gray.800');
  const statBg = useColorModeValue('gray.50', 'gray.700');
  
  // Estados
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInventario, setSelectedInventario] = useState<Inventario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dataInicio');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInventarios, setTotalInventarios] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  
  // Disclosures para modais
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();

  // Buscar inventários
  const fetchInventarios = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Construir filtro de data baseado no período
      let dataInicio = '';
      let dataFim = '';
      
      if (periodoFilter !== 'all') {
        const today = new Date();
        let date = new Date();
        
        if (periodoFilter === '30') {
          date.setDate(date.getDate() - 30);
        } else if (periodoFilter === '90') {
          date.setDate(date.getDate() - 90);
        } else if (periodoFilter === '365') {
          date.setDate(date.getDate() - 365);
        }
        
        dataInicio = date.toISOString().split('T')[0];
        dataFim = today.toISOString().split('T')[0];
      }
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itensPorPagina.toString(),
        search: searchTerm,
        sort: sortField,
        order: sortOrder,
        status: statusFilter,
        dataInicio,
        dataFim,
      });
      
      const response = await fetch(`/api/estoque/inventarios?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar inventários');
      }
      
      const data = await response.json();
      
      setInventarios(data.inventarios);
      setTotalInventarios(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Erro ao buscar inventários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os inventários',
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
    periodoFilter,
    toast
  ]);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    fetchInventarios();
  }, [fetchInventarios]);

  // Handlers
  const handleDeleteInventario = (inventario: Inventario) => {
    setSelectedInventario(inventario);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedInventario) return;
    
    try {
      const response = await fetch(`/api/estoque/inventarios/${selectedInventario.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir inventário');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Inventário excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchInventarios();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o inventário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };

  const handleNovoInventario = () => {
    router.push('inventarios/new');
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

  // Helper para obter a cor baseada no status do inventário
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDO': return 'green';
      case 'PENDENTE': return 'orange';
      case 'CANCELADO': return 'red';
      case 'EM_ANDAMENTO': return 'blue';
      default: return 'gray';
    }
  };

  // Helper para obter o texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONCLUIDO': return 'Concluído';
      case 'PENDENTE': return 'Pendente';
      case 'CANCELADO': return 'Cancelado';
      case 'EM_ANDAMENTO': return 'Em andamento';
      default: return status;
    }
  };

  return (
    <Box p={5}>
      <Heading size="lg" mb={6}>
        {tenant ? `Inventário de Estoque - ${tenant.nome}` : 'Gestão de Inventário'}
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
            <Icon as={FaBoxOpen} boxSize={6} color="blue.500" />
            <Box>
              <StatLabel>Total de Inventários</StatLabel>
              <StatNumber>{totalInventarios}</StatNumber>
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
            <Icon as={FaClipboardList} boxSize={6} color="green.500" />
            <Box>
              <StatLabel>Inventários Concluídos</StatLabel>
              <StatNumber>
                {inventarios.filter(i => i.status === 'CONCLUIDO').length}
              </StatNumber>
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
                  placeholder="Buscar inventário..." 
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
                  <option value="all">Todas as datas</option>
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
                  <option value="CONCLUIDO">Concluídos</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="EM_ANDAMENTO">Em andamento</option>
                  <option value="CANCELADO">Cancelados</option>
                </Select>
                
                <Button 
                  colorScheme="teal" 
                  leftIcon={<FaPlus />}
                  onClick={handleNovoInventario}
                >
                  Novo Inventário
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
          ) : inventarios.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <Stack>
                <Text>
                  Nenhum inventário encontrado com os filtros selecionados.
                </Text>
                <Button 
                  variant="link" 
                  colorScheme="blue"
                  leftIcon={<FaPlus />}
                  alignSelf="flex-start"
                  onClick={handleNovoInventario}
                >
                  Iniciar um novo inventário
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
                      <SortableHeader label="Data Início" field="dataInicio" />
                      <Th>Data Fim</Th>
                      <Th>Responsável</Th>
                      <Th>Status</Th>
                      <Th>Itens</Th>
                      <Th textAlign="center">Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {inventarios.map((inventario) => (
                      <Tr key={inventario.id}>
                        <Td fontFamily="mono">{inventario.codigo}</Td>
                        <Td>{formatDate(inventario.dataInicio)}</Td>
                        <Td>{inventario.dataFim ? formatDate(inventario.dataFim) : '-'}</Td>
                        <Td>{inventario.responsavel?.name || '-'}</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(inventario.status)}>
                            {getStatusText(inventario.status)}
                          </Badge>
                        </Td>
                        <Td isNumeric>{inventario._count?.itens || 0}</Td>
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
                                  href={`/estoque/inventarios/${inventario.id}`}
                                >
                                  Visualizar
                                </MenuItem>
                                
                                {(inventario.status === 'PENDENTE' || inventario.status === 'EM_ANDAMENTO') && (
                                  <>
                                    <MenuItem
                                      icon={<FaPencilAlt />}
                                      as={Link}
                                      href={`/estoque/inventarios/${inventario.id}/edit`}
                                    >
                                      Editar
                                    </MenuItem>
                                    
                                    <MenuItem
                                      icon={<FaClipboardList />}
                                      as={Link}
                                      href={`/estoque/inventarios/${inventario.id}/contagem`}
                                    >
                                      Realizar Contagem
                                    </MenuItem>
                                    
                                    {inventario.status === 'EM_ANDAMENTO' && (
                                      <MenuItem
                                        icon={<FaCheck />}
                                        as={Link}
                                        href={`/estoque/inventarios/${inventario.id}/finalizar`}
                                      >
                                        Finalizar Inventário
                                      </MenuItem>
                                    )}
                                  </>
                                )}
                                
                                <MenuDivider />
                                
                                {inventario.status !== 'CONCLUIDO' && (
                                  <MenuItem 
                                    icon={<FaTrash />}
                                    onClick={() => handleDeleteInventario(inventario)}
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
                  Total: {totalInventarios} inventários
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
        title="Excluir Inventário"
        message={`Tem certeza que deseja excluir o inventário "${selectedInventario?.codigo}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  );
}
