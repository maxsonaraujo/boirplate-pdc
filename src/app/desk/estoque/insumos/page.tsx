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
  Stat,
  StatGroup,
  StatLabel,
  StatNumber,
  Table,
  Tag,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
} from '@chakra-ui/react';
import {
  FaBoxOpen,
  FaChevronDown,
  FaEye,
  FaFileExport,
  FaFilter,
  FaPlus,
  FaSearch,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTrash,
  FaPencilAlt,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaWarehouse,
  FaClipboardList,
} from 'react-icons/fa';
import { formatCurrency } from '@/utils/format';
import { useTenant } from '@/hooks/useTenant';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { InsumoFormModal } from '@/components/molecules/InsumoFormModal';
import { MovimentacaoInsumoModal } from '@/components/molecules/MovimentacaoInsumoModal';
import Link from 'next/link';

// Tipo para insumos
interface Insumo {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  precoCusto: number;
  estoqueMinimo: number;
  estoqueAtual: number;
  status: boolean;
  unidadeMedida?: {
    id: number;
    nome: string;
    simbolo: string;
  };
  categoriaInsumo?: {
    id: number;
    nome: string;
  };
  fornecedorPrincipal?: {
    id: number;
    nomeFantasia: string;
    razaoSocial: string;
  };
  _count?: {
    lotes: number;
    movimentacoes: number;
  };
}

export default function EstoqueInsumos() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  const bgStatCard = useColorModeValue('gray.50', 'gray.700');
  
  // Estados
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ativos');
  const [estoqueFilter, setEstoqueFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInsumos, setTotalInsumos] = useState(0);
  const [valorTotalEstoque, setValorTotalEstoque] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  
  // Disclosures para modais
  const { 
    isOpen: isFormOpen, 
    onOpen: onFormOpen, 
    onClose: onFormClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  
  const { 
    isOpen: isMovimentacaoOpen, 
    onOpen: onMovimentacaoOpen, 
    onClose: onMovimentacaoClose 
  } = useDisclosure();

  // Buscar insumos
  const fetchInsumos = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itensPorPagina.toString(),
        search: searchTerm,
        sort: sortField,
        order: sortOrder,
        status: statusFilter === 'todos' ? '' : statusFilter,
        estoqueMinimo: estoqueFilter === 'abaixo_minimo' ? 'true' : '',
        categoriaId: categoryFilter,
      });
      
      const response = await fetch(`/api/estoque/insumos?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar insumos');
      }
      
      const data = await response.json();
      
      setInsumos(data.insumos);
      setTotalInsumos(data.total);
      setTotalPages(data.totalPages);
      setValorTotalEstoque(data.valorTotalEstoque || 0);
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os insumos',
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
    estoqueFilter, 
    categoryFilter, 
    toast
  ]);

  // Buscar categorias
  const fetchCategorias = useCallback(async () => {
    try {
      const response = await fetch('/api/estoque/categorias');
      
      if (response.ok) {
        const data = await response.json();
        setCategorias(data.categorias);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  }, []);

  // Buscar fornecedores
  const fetchFornecedores = useCallback(async () => {
    try {
      const response = await fetch('/api/fornecedores');
      
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
    fetchInsumos();
    fetchCategorias();
    fetchFornecedores();
  }, [fetchInsumos, fetchCategorias, fetchFornecedores]);

  // Manipuladores de eventos
  const handleAddInsumo = () => {
    setSelectedInsumo(null);
    onFormOpen();
  };

  const handleEditInsumo = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    onFormOpen();
  };

  const handleDeleteInsumo = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedInsumo) return;
    
    try {
      const response = await fetch(`/api/estoque/insumos/${selectedInsumo.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir insumo');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Insumo excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchInsumos();
    } catch (error) {
      console.error('Erro ao excluir insumo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o insumo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };

  const handleMovimentacao = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    onMovimentacaoOpen();
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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

  return (
    <Box p={5}>
      <Heading size="lg" mb={6}>
        {tenant ? `Estoque - ${tenant.nome}` : 'Gerenciamento de Estoque'}
      </Heading>

      {/* Resumo estatístico */}
      <StatGroup 
        mb={6} 
        gap={4} 
        flexWrap="wrap"
      >
        <Stat 
          bg={bgStatCard} 
          p={4} 
          borderRadius="md" 
          flex="1" 
          minW="200px"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Icon as={FaBoxOpen} boxSize={6} color="blue.500" />
            <Box>
              <StatLabel>Total de Insumos</StatLabel>
              <StatNumber>{totalInsumos}</StatNumber>
            </Box>
          </HStack>
        </Stat>
        
        <Stat 
          bg={bgStatCard} 
          p={4} 
          borderRadius="md" 
          flex="1" 
          minW="200px"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Icon as={FaWarehouse} boxSize={6} color="green.500" />
            <Box>
              <StatLabel>Valor do Estoque</StatLabel>
              <StatNumber>{formatCurrency(valorTotalEstoque)}</StatNumber>
            </Box>
          </HStack>
        </Stat>
        
        <Stat 
          bg={bgStatCard} 
          p={4} 
          borderRadius="md" 
          flex="1" 
          minW="200px"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Icon as={FaExclamationTriangle} boxSize={6} color="orange.500" />
            <Box>
              <StatLabel>Abaixo do Mínimo</StatLabel>
              <StatNumber>
                {insumos.filter(i => i.estoqueAtual < i.estoqueMinimo).length}
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
                  placeholder="Buscar insumo..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </GridItem>
            
            {/* Filtros */}
            <GridItem colSpan={{ base: 12, md: 8 }}>
              <HStack spacing={3} justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
                {/* Filtro de categoria */}
                <Select 
                  width="auto" 
                  minW="180px"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Todas as categorias"
                >
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </Select>
                
                {/* Filtro de status */}
                <Select 
                  width="auto" 
                  minW="150px"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ativos">Ativos</option>
                  <option value="inativos">Inativos</option>
                  <option value="todos">Todos</option>
                </Select>
                
                {/* Filtro de estoque */}
                <Select 
                  width="auto" 
                  minW="180px"
                  value={estoqueFilter}
                  onChange={(e) => setEstoqueFilter(e.target.value)}
                >
                  <option value="">Todos os níveis</option>
                  <option value="abaixo_minimo">Abaixo do mínimo</option>
                </Select>
                
                <Button 
                  colorScheme="teal" 
                  leftIcon={<FaPlus />}
                  onClick={handleAddInsumo}
                >
                  Novo Insumo
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
          ) : (
            <>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <SortableHeader label="Código" field="codigo" />
                      <SortableHeader label="Nome" field="nome" />
                      <Th>Categoria</Th>
                      <SortableHeader label="Qtd. Atual" field="estoqueAtual" />
                      <Th>Un.</Th>
                      <SortableHeader label="Preço Custo" field="precoCusto" />
                      <Th>Status</Th>
                      <Th textAlign="center">Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {insumos.map((insumo) => (
                      <Tr key={insumo.id}>
                        <Td fontFamily="mono">{insumo.codigo}</Td>
                        <Td fontWeight="medium">{insumo.nome}</Td>
                        <Td>
                          {insumo.categoriaInsumo ? (
                            <Tag colorScheme="blue" size="sm">
                              <TagLabel>{insumo.categoriaInsumo.nome}</TagLabel>
                            </Tag>
                          ) : (
                            '-'
                          )}
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={
                              insumo.estoqueAtual <= 0 ? 'red' :
                              insumo.estoqueAtual < insumo.estoqueMinimo ? 'orange' : 'green'
                            }
                          >
                            {insumo.estoqueAtual.toFixed(2)}
                          </Badge>
                        </Td>
                        <Td>{insumo.unidadeMedida?.simbolo || '-'}</Td>
                        <Td isNumeric>
                          {formatCurrency(insumo.precoCusto)}
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={insumo.status ? 'green' : 'red'}
                          >
                            {insumo.status ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </Td>
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
                                  icon={<FaExchangeAlt />}
                                  onClick={() => handleMovimentacao(insumo)}
                                >
                                  Movimentar
                                </MenuItem>
                                <MenuItem
                                  icon={<FaClipboardList />}
                                  as="a"
                                  href={`/estoque/movimentacoes?insumoId=${insumo.id}`}
                                >
                                  Histórico
                                </MenuItem>
                                <Divider my={2} />
                                <MenuItem 
                                  icon={<FaEye />}
                                  as="a"
                                  href={`/estoque/insumos/${insumo.id}`}
                                >
                                  Visualizar
                                </MenuItem>
                                <MenuItem 
                                  icon={<FaPencilAlt />}
                                  onClick={() => handleEditInsumo(insumo)}
                                >
                                  Editar
                                </MenuItem>
                                <MenuItem 
                                  icon={<FaTrash />}
                                  onClick={() => handleDeleteInsumo(insumo)}
                                  color="red.500"
                                >
                                  Excluir
                                </MenuItem>
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
                  Total: {totalInsumos} insumos
                </Text>
              </Flex>
            </>
          )}
        </CardBody>
      </Card>

      {/* Modais */}
      <InsumoFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        insumo={selectedInsumo}
        categorias={categorias}
        fornecedores={fornecedores}
        onSuccess={fetchInsumos}
      />

      <MovimentacaoInsumoModal
        isOpen={isMovimentacaoOpen}
        onClose={onMovimentacaoClose}
        insumo={selectedInsumo}
        onSuccess={fetchInsumos}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleConfirmDelete}
        title="Excluir Insumo"
        message={`Tem certeza que deseja excluir o insumo "${selectedInsumo?.nome}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  );
}