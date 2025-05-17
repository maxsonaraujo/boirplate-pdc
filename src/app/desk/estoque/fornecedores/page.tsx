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
  useDisclosure,
  useToast,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FaBuilding,
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
  FaFileInvoiceDollar,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { FornecedorFormModal } from '@/components/molecules/FornecedorFormModal'; 
import Link from 'next/link';

// Tipo para fornecedores
interface Fornecedor {
  id: number;
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  telefone: string;
  email: string;
  endereco: string;
  contato: string;
  observacoes: string;
  status: boolean;
  _count?: {
    insumos: number;
    compras: number;
  };
}

export default function EstoqueFornecedores() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  
  // Estados
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('razaoSocial');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState('ativos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFornecedores, setTotalFornecedores] = useState(0);
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

  // Buscar fornecedores
  const fetchFornecedores = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itensPorPagina.toString(),
        search: searchTerm,
        sort: sortField,
        order: sortOrder,
        status: statusFilter === 'todos' ? '' : statusFilter === 'ativos' ? 'true' : 'false',
      });
      
      const response = await fetch(`/api/fornecedores?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar fornecedores');
      }
      
      const data = await response.json();
      
      setFornecedores(data.fornecedores);
      setTotalFornecedores(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os fornecedores',
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
    toast
  ]);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  // Manipuladores de eventos
  const handleAddFornecedor = () => {
    setSelectedFornecedor(null);
    onFormOpen();
  };

  const handleEditFornecedor = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    onFormOpen();
  };

  const handleDeleteFornecedor = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedFornecedor) return;
    
    try {
      const response = await fetch(`/api/fornecedores/${selectedFornecedor.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir fornecedor');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Fornecedor excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchFornecedores();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o fornecedor',
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
        {tenant ? `Fornecedores - ${tenant.nome}` : 'Gerenciamento de Fornecedores'}
      </Heading>

      <Card bg={bgCard} mb={6} boxShadow="md">
        <CardHeader>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            {/* Barra de busca */}
            <GridItem colSpan={{ base: 12, md: 6, lg: 4 }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder="Buscar fornecedor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </GridItem>
            
            {/* Filtros */}
            <GridItem colSpan={{ base: 12, md: 6, lg: 8 }}>
              <HStack spacing={3} justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
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
                
                <Button 
                  colorScheme="teal" 
                  leftIcon={<FaPlus />}
                  onClick={handleAddFornecedor}
                >
                  Novo Fornecedor
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
          ) : fornecedores.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <Text>
                Nenhum fornecedor encontrado. {' '}
                <Button 
                  variant="link" 
                  colorScheme="blue" 
                  onClick={handleAddFornecedor}
                >
                  Cadastre seu primeiro fornecedor
                </Button>
              </Text>
            </Alert>
          ) : (
            <>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <SortableHeader label="Código" field="codigo" />
                      <SortableHeader label="Nome Fantasia" field="nomeFantasia" />
                      <SortableHeader label="Razão Social" field="razaoSocial" />
                      <Th>CNPJ</Th>
                      <Th>Contato</Th>
                      <Th>Status</Th>
                      <Th isNumeric>Insumos</Th>
                      <Th textAlign="center">Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {fornecedores.map((fornecedor) => (
                      <Tr key={fornecedor.id}>
                        <Td fontFamily="mono">{fornecedor.codigo}</Td>
                        <Td fontWeight="medium">{fornecedor.nomeFantasia || '-'}</Td>
                        <Td>{fornecedor.razaoSocial}</Td>
                        <Td>{fornecedor.cnpj || '-'}</Td>
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            {fornecedor.telefone && (
                              <HStack fontSize="sm">
                                <Icon as={FaPhone} boxSize={3} />
                                <Text>{fornecedor.telefone}</Text>
                              </HStack>
                            )}
                            {fornecedor.email && (
                              <HStack fontSize="sm">
                                <Icon as={FaEnvelope} boxSize={3} />
                                <Text>{fornecedor.email}</Text>
                              </HStack>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={fornecedor.status ? 'green' : 'red'}
                          >
                            {fornecedor.status ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          {fornecedor._count?.insumos || 0}
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
                                  icon={<FaFileInvoiceDollar />}
                                  as={Link}
                                  href={`/desk/estoque/compras/new?fornecedorId=${fornecedor.id}`}
                                >
                                  Nova Compra
                                </MenuItem>
                                <MenuItem
                                  icon={<FaBoxOpen />}
                                  as={Link}
                                  href={`/desk/estoque/insumos?fornecedorId=${fornecedor.id}`}
                                >
                                  Ver Insumos
                                </MenuItem>
                                <Divider my={2} />
                                <MenuItem 
                                  icon={<FaEye />}
                                  as={Link}
                                  href={`/desk/estoque/fornecedores/${fornecedor.id}`}
                                >
                                  Visualizar
                                </MenuItem>
                                <MenuItem 
                                  icon={<FaPencilAlt />}
                                  onClick={() => handleEditFornecedor(fornecedor)}
                                >
                                  Editar
                                </MenuItem>
                                <MenuItem 
                                  icon={<FaTrash />}
                                  onClick={() => handleDeleteFornecedor(fornecedor)}
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
                  Total: {totalFornecedores} fornecedores
                </Text>
              </Flex>
            </>
          )}
        </CardBody>
      </Card>

      {/* Modal de formulário de fornecedor */}
      <FornecedorFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        fornecedor={selectedFornecedor}
        onSuccess={fetchFornecedores}
      />

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleConfirmDelete}
        title="Excluir Fornecedor"
        message={`Tem certeza que deseja excluir o fornecedor "${selectedFornecedor?.razaoSocial}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  );
}
