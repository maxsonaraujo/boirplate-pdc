'use client'

import {
  Box,
  Button,
  Flex,
  Heading,
  useColorModeValue,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  HStack,
  InputGroup,
  Input,
  InputLeftElement,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  Image,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Stack,
  SimpleGrid,
  VStack,
  Divider,
  useToast,
  Icon,
  Tag,
  TagLabel,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Collapse,
  FormControl,
  FormLabel
} from '@chakra-ui/react'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  FaPlus,
  FaSearch,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaCopy,
  FaEye,
  FaFileExport,
  FaFileImport,
  FaFilter,
  FaSyncAlt,
  FaTag,
  FaGripHorizontal,
  FaList,
  FaImage,
  FaTimes,
  FaUtensils,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaPrint,
  FaBoxes,
  FaChevronDown,
  FaArchive,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa'
import { ProdutoFormModal } from '../organismes/ProdutoFormModal'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { PreviewModal } from '../organismes/PreviewModal'
import { ImportProdutosModal } from '../organismes/ImportProdutosModal'
import { paginateArray } from '@/utils/pagination'
import { formatCurrency } from '@/utils/format'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant';

// Tipo do produto
interface Produto {
  id: number
  codigo: string
  nome: string
  descricao?: string
  precoVenda: number
  imagem?: string
  status: boolean
  unidadeMedidaId?: number
  estoqueMinimo?: number
  tempoPreparo?: number
  geraComanda?: boolean
  localProducaoId?: number
  categorias: any[]
  unidadeMedida?: any
  localProducao?: any
}

export function ProdutosTemplate() {
  // ============================================================
  // IMPORTANTE: TODOS OS HOOKS DO REACT DEVEM SER CHAMADOS NO TOPO
  // E NA MESMA ORDEM A CADA RENDERIZAÇÃO
  // ============================================================

  // Context hooks
  const { tenant, isLoading: isTenantLoading } = useTenant();
  
  // Recuperar estado da URL e gerenciar histórico
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Disclosures para modais
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();

  // Estados - todos os useState juntos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [locaisProducao, setLocaisProducao] = useState<any[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortField, setSortField] = useState<string>('nome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filtros adicionais
  const [filters, setFilters] = useState({
    categoriaId: '',
    status: 'ativos',
    precoMin: 0,
    precoMax: 1000,
    localProducaoId: '',
    unidadeMedidaId: '',
    geraComanda: ''
  });

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // *** useCallback, useMemo e useEffect sempre após useState e useRef ***

  // Função para criar URL com parâmetros de busca
  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });

      return current.toString();
    },
    [searchParams]
  );

  // Função para atualizar a URL e manter o estado de busca
  const updateSearchParams = useCallback(
    (params: Record<string, string>) => {
      const queryString = createQueryString(params);
      router.push(`${pathname}?${queryString}`);
    },
    [pathname, router, createQueryString]
  );

  // Buscar produtos
  const fetchProdutos = useCallback(async () => {
    try {
      setIsLoading(true);

      const url = `/api/produtos?page=${currentPage}&limit=${perPage}&search=${searchTerm}&categoria=${filterCategoria}&status=${filterStatus}&sort=${sortField}&order=${sortDirection}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao buscar produtos');
      }

      const data = await response.json();
      setProdutos(data.produtos);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, searchTerm, filterCategoria, filterStatus, sortField, sortDirection, toast]);

  // Buscar categorias
  const fetchCategorias = useCallback(async () => {
    try {
      const response = await fetch('/api/categorias');
      if (response.ok) {
        const data = await response.json();
        setCategorias(data.categorias);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  }, []);

  // Buscar locais de produção
  const fetchLocaisProducao = useCallback(async () => {
    try {
      const response = await fetch('/api/locais-producao');
      if (response.ok) {
        const data = await response.json();
        setLocaisProducao(data.locaisProducao);
      }
    } catch (error) {
      console.error('Erro ao buscar locais de produção:', error);
    }
  }, []);

  // Buscar unidades de medida
  const fetchUnidadesMedida = useCallback(async () => {
    try {
      const response = await fetch('/api/unidades-medida');
      if (response.ok) {
        const data = await response.json();
        setUnidadesMedida(data.unidadesMedida);
      }
    } catch (error) {
      console.error('Erro ao buscar unidades de medida:', error);
    }
  }, []);

  // Sincronizar estados com a URL ao montar o componente
  useEffect(() => {
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const search = searchParams.get('search') || '';
    const categoria = searchParams.get('categoria') || '';
    const status = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'nome';
    const order = searchParams.get('order') || 'asc';

    setCurrentPage(parseInt(page));
    setPerPage(parseInt(limit));
    setSearchTerm(search);
    setFilterCategoria(categoria);
    setFilterStatus(status);
    setSortField(sort);
    setSortDirection(order as 'asc' | 'desc');
  }, [searchParams]);

  // Buscar dados iniciais
  useEffect(() => {
    fetchCategorias();
    fetchLocaisProducao();
    fetchUnidadesMedida();
  }, [fetchCategorias, fetchLocaisProducao, fetchUnidadesMedida]);

  // Buscar produtos quando os filtros mudarem
  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  // Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  // Modificar fetchProdutos para incluir o tenant no título da página
  useEffect(() => {
    if (tenant) {
      document.title = `${tenant.nome} - Produtos`;
    }
  }, [tenant]);

  // Manipuladores de eventos
  const handleAddProduto = () => {
    setSelectedProduto(null)
    onFormOpen()
  }

  const handleEditProduto = (produto: Produto) => {
    setSelectedProduto(produto)
    onFormOpen()
  }

  const handleDeleteClick = (produto: Produto) => {
    setSelectedProduto(produto)
    onDeleteOpen()
  }

  const handlePreviewClick = (produto: Produto) => {
    setSelectedProduto(produto);
    onPreviewOpen();
  }

  const handleDuplicateProduto = async (produto: Produto) => {
    try {
      const response = await fetch(`/api/produtos/${produto.id}/duplicate`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao duplicar produto')
      }

      toast({
        title: 'Sucesso',
        description: 'Produto duplicado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      fetchProdutos()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao duplicar produto',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const handleToggleStatus = async (produto: Produto) => {
    try {
      const response = await fetch(`/api/produtos/${produto.id}/toggle-status`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        throw new Error('Erro ao alterar status do produto')
      }

      toast({
        title: 'Sucesso',
        description: `Produto ${produto.status ? 'desativado' : 'ativado'} com sucesso`,
        status: 'success',
        duration: 2000,
        isClosable: true
      })

      fetchProdutos()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status do produto',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const handleDeleteProduto = async () => {
    if (!selectedProduto) return

    try {
      const response = await fetch(`/api/produtos/${selectedProduto.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao excluir produto')
      }

      toast({
        title: 'Sucesso',
        description: 'Produto excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      fetchProdutos()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir produto',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      onDeleteClose()
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/produtos/export')
      if (!response.ok) throw new Error('Erro ao exportar produtos')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `produtos_export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Exportação concluída',
        description: 'Os produtos foram exportados com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os produtos',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Handler para ordenação
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Manipular mudança de filtros
  const handleFilterChange = (field: string, value: any) => {
    setFilters({
      ...filters,
      [field]: value
    })
  }

  // Resetar filtros
  const resetFilters = () => {
    setFilters({
      categoriaId: '',
      status: 'ativos',
      precoMin: 0,
      precoMax: 1000,
      localProducaoId: '',
      unidadeMedidaId: '',
      geraComanda: ''
    })
    setSearchTerm('')
  }

  // Renderizar colunas ordenáveis
  const renderSortableColumn = (label: string, field: string) => (
    <Th
      cursor="pointer"
      onClick={() => handleSort(field)}
      position="relative"
      pr={6}
    >
      {label}
      {sortField === field && (
        <Box
          as="span"
          ml={1}
          position="absolute"
          right={2}
          top="50%"
          transform="translateY(-50%)"
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </Box>
      )}
    </Th>
  )

  // Componente de paginação
  const Pagination = () => (
    <Flex justify="space-between" align="center" mt={4}>
      <Select
        w="100px"
        value={itemsPerPage}
        onChange={(e) => setItemsPerPage(Number(e.target.value))}
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
          Página {currentPage} de {Math.ceil(totalItems / itemsPerPage) || 1}
        </Text>

        <Button
          size="sm"
          onClick={() => setCurrentPage(prev =>
            Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage))
          )}
          isDisabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
        >
          Próxima
        </Button>
      </HStack>

      <Text fontSize="sm">
        Total: {totalItems} produtos
      </Text>
    </Flex>
  )

  // Renderizar categoria(s) como badges
  const renderCategorias = (categorias: any[]) => (
    <HStack spacing={1} flexWrap="wrap">
      {categorias.map(cat => (
        <Tag
          key={cat.categoriaId}
          size="sm"
          colorScheme="teal"
          borderRadius="full"
          variant="subtle"
        >
          <TagLabel>{cat.categoria.nome}</TagLabel>
        </Tag>
      ))}
    </HStack>
  )

  return (
    <Box>
      <Heading size="lg" mb={6} color={useColorModeValue('gray.700', 'white')}>
        {tenant ? `Produtos - ${tenant.nome}` : 'Gerenciamento de Produtos'}
      </Heading>

      <Card bg={useColorModeValue('white', 'gray.800')} shadow="md" mb={6}>
        <CardHeader pb={0}>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <HStack>
                <InputGroup maxW={{ md: '320px' }}>
                  <InputLeftElement pointerEvents="none">
                    <FaSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <Button
                  leftIcon={<FaFilter />}
                  variant="outline"
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  colorScheme={Object.values(filters).some(v => v !== '' && v !== 'ativos' && v !== 0 && v !== 1000) ? "teal" : "gray"}
                >
                  Filtros
                </Button>

                <Tooltip label="Alternar visualização">
                  <IconButton
                    icon={viewMode === 'list' ? <FaGripHorizontal /> : <FaList />}
                    aria-label="Alternar visualização"
                    variant="outline"
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  />
                </Tooltip>
              </HStack>

              <HStack>
                <Button
                  leftIcon={<FaFileImport />}
                  variant="outline"
                  onClick={onImportOpen}
                >
                  Importar
                </Button>

                <Button
                  leftIcon={<FaFileExport />}
                  variant="outline"
                  onClick={handleExport}
                >
                  Exportar
                </Button>

                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="teal"
                  onClick={handleAddProduto}
                >
                  Novo Produto
                </Button>
              </HStack>
            </Flex>

            <Collapse in={filtersExpanded} animateOpacity>
              <Box
                p={4}
                bg={useColorModeValue('gray.50', 'gray.700')}
                borderRadius="md"
              >
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Categoria</FormLabel>
                    <Select
                      size="sm"
                      value={filters.categoriaId}
                      onChange={(e) => handleFilterChange('categoriaId', e.target.value)}
                      placeholder="Todas as categorias"
                    >
                      {categorias.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Status</FormLabel>
                    <Select
                      size="sm"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="ativos">Produtos Ativos</option>
                      <option value="inativos">Produtos Inativos</option>
                      <option value="todos">Todos os Produtos</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Local de Produção</FormLabel>
                    <Select
                      size="sm"
                      value={filters.localProducaoId}
                      onChange={(e) => handleFilterChange('localProducaoId', e.target.value)}
                      placeholder="Todos os locais"
                    >
                      {locaisProducao.map((local: any) => (
                        <option key={local.id} value={local.id}>
                          {local.nome}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Unidade de Medida</FormLabel>
                    <Select
                      size="sm"
                      value={filters.unidadeMedidaId}
                      onChange={(e) => handleFilterChange('unidadeMedidaId', e.target.value)}
                      placeholder="Todas as unidades"
                    >
                      {unidadesMedida.map((um: any) => (
                        <option key={um.id} value={um.id}>
                          {um.nome} ({um.simbolo})
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Gera Comanda</FormLabel>
                    <Select
                      size="sm"
                      value={filters.geraComanda}
                      onChange={(e) => handleFilterChange('geraComanda', e.target.value)}
                      placeholder="Todos"
                    >
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">
                      Faixa de Preço: {formatCurrency(filters.precoMin)} - {formatCurrency(filters.precoMax)}
                    </FormLabel>
                    <RangeSlider
                      aria-label={['min', 'max']}
                      min={0}
                      max={1000}
                      step={10}
                      value={[filters.precoMin, filters.precoMax]}
                      onChange={(val) => {
                        handleFilterChange('precoMin', val[0])
                        handleFilterChange('precoMax', val[1])
                      }}
                      colorScheme="teal"
                    >
                      <RangeSliderTrack>
                        <RangeSliderFilledTrack />
                      </RangeSliderTrack>
                      <RangeSliderThumb index={0} />
                      <RangeSliderThumb index={1} />
                    </RangeSlider>
                  </FormControl>
                </SimpleGrid>

                <Flex justify="flex-end" mt={4}>
                  <Button
                    size="sm"
                    leftIcon={<FaTimes />}
                    variant="outline"
                    onClick={resetFilters}
                  >
                    Limpar Filtros
                  </Button>
                </Flex>
              </Box>
            </Collapse>
          </VStack>
        </CardHeader>

        <CardBody>
          {isLoading ? (
            <Flex justify="center" align="center" p={8}>
              <Spinner size="lg" color="teal.500" />
            </Flex>
          ) : produtos.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Nenhum produto encontrado.
            </Alert>
          ) : viewMode === 'list' ? (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    {renderSortableColumn('Código', 'codigo')}
                    {renderSortableColumn('Nome', 'nome')}
                    <Th>Categorias</Th>
                    {renderSortableColumn('Preço', 'precoVenda')}
                    <Th>Un. Medida</Th>
                    <Th>Local Produção</Th>
                    <Th>Status</Th>
                    <Th width="120px" textAlign="center">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {produtos.map((produto: Produto) => (
                    <Tr key={produto.id}>
                      <Td fontFamily="mono">{produto.codigo}</Td>
                      <Td fontWeight="medium">
                        <HStack>
                          {produto.imagem && (
                            <Image
                              src={produto.imagem}
                              alt={produto.nome}
                              boxSize="30px"
                              objectFit="cover"
                              borderRadius="md"
                            />
                          )}
                          <Text>{produto.nome}</Text>
                        </HStack>
                      </Td>
                      <Td>{renderCategorias(produto.categorias)}</Td>
                      <Td isNumeric color="green.600" fontWeight="medium">
                        {formatCurrency(produto.precoVenda)}
                      </Td>
                      <Td>{produto.unidadeMedida?.simbolo || '-'}</Td>
                      <Td>{produto.localProducao?.nome || '-'}</Td>
                      <Td>
                        <Badge colorScheme={produto.status ? 'green' : 'red'}>
                          {produto.status ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={1} justify="center">
                          <Tooltip label="Visualizar">
                            <IconButton
                              icon={<FaEye />}
                              aria-label="Visualizar produto"
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePreviewClick(produto)}
                            />
                          </Tooltip>

                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FaEllipsisV />}
                              variant="ghost"
                              size="sm"
                              aria-label="Opções"
                            />
                            <MenuList>
                              <MenuItem
                                icon={<FaEdit />}
                                onClick={() => handleEditProduto(produto)}
                              >
                                Editar
                              </MenuItem>
                              <MenuItem
                                icon={<FaCopy />}
                                onClick={() => handleDuplicateProduto(produto)}
                              >
                                Duplicar
                              </MenuItem>
                              <MenuItem
                                icon={produto.status ? <FaToggleOff /> : <FaToggleOn />}
                                onClick={() => handleToggleStatus(produto)}
                              >
                                {produto.status ? 'Desativar' : 'Ativar'}
                              </MenuItem>
                              <MenuItem
                                icon={<FaTrash />}
                                color="red.500"
                                onClick={() => handleDeleteClick(produto)}
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
          ) : (
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
              spacing={4}
            >
              {produtos.map((produto: Produto) => (
                <Card
                  key={produto.id}
                  overflow="hidden"
                  variant="outline"
                  position="relative"
                  transition="all 0.2s"
                  _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                >
                  {!produto.status && (
                    <Badge
                      position="absolute"
                      top={2}
                      right={2}
                      colorScheme="red"
                      zIndex={1}
                    >
                      Inativo
                    </Badge>
                  )}

                  <Box
                    h="140px"
                    bg={produto.imagem ? 'transparent' : 'gray.100'}
                    borderBottomWidth="1px"
                    position="relative"
                  >
                    {produto.imagem ? (
                      <Image
                        src={produto.imagem}
                        alt={produto.nome}
                        objectFit="cover"
                        w="full"
                        h="full"
                      />
                    ) : (
                      <Flex
                        h="full"
                        align="center"
                        justify="center"
                        color="gray.400"
                      >
                        <Icon as={FaImage} boxSize={8} />
                      </Flex>
                    )}

                    <Flex
                      position="absolute"
                      bottom={0}
                      right={0}
                      bg="blackAlpha.700"
                      color="white"
                      p={1}
                      px={2}
                      borderTopLeftRadius="md"
                    >
                      {formatCurrency(produto.precoVenda)}
                    </Flex>
                  </Box>

                  <Box p={3}>
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      mb={1}
                      fontFamily="mono"
                    >
                      {produto.codigo}
                    </Text>

                    <Heading size="sm" noOfLines={2} mb={2}>
                      {produto.nome}
                    </Heading>

                    <Box mb={3}>
                      {renderCategorias(produto.categorias)}
                    </Box>

                    <HStack justify="space-between" mt={2}>
                      <HStack>
                        <Tooltip label="Visualizar1">
                          <IconButton
                            icon={<FaEye />}
                            aria-label="Visualizar produto"
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreviewClick(produto)}
                          />
                        </Tooltip>

                        <Tooltip label="Editar">
                          <IconButton
                            icon={<FaEdit />}
                            aria-label="Editar produto"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditProduto(produto)}
                          />
                        </Tooltip>
                      </HStack>

                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FaEllipsisV />}
                          variant="ghost"
                          size="sm"
                          aria-label="Opções"
                        />
                        <MenuList>
                          <MenuItem
                            icon={<FaCopy />}
                            onClick={() => handleDuplicateProduto(produto)}
                          >
                            Duplicar
                          </MenuItem>
                          <MenuItem
                            icon={produto.status ? <FaToggleOff /> : <FaToggleOn />}
                            onClick={() => handleToggleStatus(produto)}
                          >
                            {produto.status ? 'Desativar' : 'Ativar'}
                          </MenuItem>
                          <MenuItem
                            icon={<FaTrash />}
                            color="red.500"
                            onClick={() => handleDeleteClick(produto)}
                          >
                            Excluir
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Box>
                </Card>
              ))}
            </SimpleGrid>
          )}

          <Pagination />
        </CardBody>
      </Card>

      {/* Modal para adicionar/editar produto */}
      <ProdutoFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        produto={selectedProduto}
        categorias={categorias}
        unidadesMedida={unidadesMedida}
        locaisProducao={locaisProducao}
        onSuccess={fetchProdutos}
        onFormOpen={() => {
          setSelectedProduto(null);
          onFormOpen();
        }}
      />

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteProduto}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir o produto "${selectedProduto?.nome}"? Esta ação não poderá ser desfeita.`}
      />

      {/* Modal de pré-visualização */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        produto={selectedProduto}
      />

      {/* Modal de importação */}
      <ImportProdutosModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        onSuccess={fetchProdutos}
      />
    </Box>
  )
}
