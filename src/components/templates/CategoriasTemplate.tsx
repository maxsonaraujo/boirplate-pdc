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
  Switch,
  FormControl,
  FormLabel,
  useToast,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Stack,
  Icon
} from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import {
  FaPlus,
  FaSearch,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaTags,
  FaPrint,
  FaCheck,
  FaTimes,
  FaSyncAlt
} from 'react-icons/fa'
import { CategoriaFormModal } from '../organismes/CategoriaFormModal'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DraggableCategoria } from '../molecules/DraggableCategoria'
import { Categoria } from '@prisma/client'

export function CategoriasTemplate() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [locaisProducao, setLocaisProducao] = useState([])
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ativas')
  const [viewMode, setViewMode] = useState('lista')
  const [estrutura, setEstrutura] = useState({})
  const [categoriasOrdem, setCategoriasOrdem] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [categoriaPaiSelecionada, setCategoriaPaiSelecionada] = useState<Categoria | null>(null)

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const toast = useToast()

  // Buscar categorias
  const fetchCategorias = useCallback(async () => {
    setIsLoading(true)
    try {
      const includeInactive = filterStatus === 'todas' || filterStatus === 'inativas'
      const response = await fetch(`/api/categorias?includeInactive=${includeInactive}`)

      if (!response.ok) {
        throw new Error('Erro ao buscar categorias')
      }

      const data = await response.json()
      setCategorias(data.categorias)

      // Organizar categoria para visualização em árvore
      const estruturaCategorias = organizarCategorias(data.categorias)
      setEstrutura(estruturaCategorias)

      // Preparar categorias para ordenação
      prepararCategoriasOrdenacao(data.categorias)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }, [filterStatus, toast])

  // Buscar locais de produção
  const fetchLocaisProducao = useCallback(async () => {
    try {
      const response = await fetch('/api/locais-producao')

      if (!response.ok) {
        throw new Error('Erro ao buscar locais de produção')
      }

      const data = await response.json()
      setLocaisProducao(data.locaisProducao || [])
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar os locais de produção',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      setLocaisProducao([])
    }
  }, [toast])

  useEffect(() => {
    fetchCategorias()
    fetchLocaisProducao()
  }, [fetchCategorias, fetchLocaisProducao])

  // Organizar categorias em estrutura hierárquica
  const organizarCategorias = (cats) => {
    const raizes = {}
    const mapa = {}

    // Primeiro mapear todas as categorias por ID
    cats.forEach(cat => {
      mapa[cat.id] = { ...cat, filhos: [] }
    })

    // Depois organizar a hierarquia
    cats.forEach(cat => {
      if (cat.categoriaPaiId) {
        // É uma subcategoria
        if (mapa[cat.categoriaPaiId]) {
          mapa[cat.categoriaPaiId].filhos.push(mapa[cat.id])
        }
      } else {
        // É categoria raiz
        raizes[cat.id] = mapa[cat.id]
      }
    })

    return raizes
  }

  // Preparar categorias para ordenação
  const prepararCategoriasOrdenacao = (cats) => {
    // Agrupar por categoriaPaiId
    const categoriasAgrupadas: any = {}

    cats.forEach(cat => {
      const grupoPaiId = cat.categoriaPaiId || 'raiz'
      if (!categoriasAgrupadas[grupoPaiId]) {
        categoriasAgrupadas[grupoPaiId] = []
      }
      categoriasAgrupadas[grupoPaiId].push(cat)
    })

    // Ordenar cada grupo
    Object.keys(categoriasAgrupadas).forEach(grupoPaiId => {
      categoriasAgrupadas[grupoPaiId].sort((a, b) => {
        // Primeiro por ordem de exibição, se definida
        if (a.ordemExibicao !== null && b.ordemExibicao !== null) {
          return a.ordemExibicao - b.ordemExibicao
        }
        // Depois por nome
        if (a.ordemExibicao === null && b.ordemExibicao === null) {
          return a.nome.localeCompare(b.nome)
        }
        // Itens com ordem definida vêm primeiro
        return a.ordemExibicao === null ? 1 : -1
      })
    })

    setCategoriasOrdem(categoriasAgrupadas)
  }

  // Filtrar categorias
  const categoriasFiltradas = categorias.filter(cat => {
    // Filtrar por termo de busca
    const matchesSearch =
      cat.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.descricao && cat.descricao.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filtrar por status
    const matchesStatus =
      filterStatus === 'todas' ||
      (filterStatus === 'ativas' && cat.status) ||
      (filterStatus === 'inativas' && !cat.status)

    return matchesSearch && matchesStatus
  })

  // Abrir modal para adicionar nova categoria
  const handleAddCategoria = () => {
    setSelectedCategoria(null)
    onFormOpen()
  }

  // Abrir modal para editar categoria
  const handleEditCategoria = (categoria) => {
    setSelectedCategoria(categoria)
    onFormOpen()
  }

  // Abrir diálogo de confirmação para excluir categoria
  const handleDeleteClick = (categoria) => {
    setSelectedCategoria(categoria)
    onDeleteOpen()
  }

  // Excluir categoria
  const handleDeleteCategoria = async () => {
    try {
      const response = await fetch(`/api/categorias/${selectedCategoria?.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao excluir categoria')
      }

      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      fetchCategorias()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir categoria',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      onDeleteClose()
    }
  }

  // Movimentar categoria na ordem
  const handleMoveCategoria = (categoria, direcao) => {
    const grupoPaiId = categoria.categoriaPaiId || 'raiz'
    const grupo = [...categoriasOrdem[grupoPaiId]]
    const index = grupo.findIndex((cat: Categoria) => cat.id === categoria.id)

    if (
      (direcao === 'up' && index === 0) ||
      (direcao === 'down' && index === grupo.length - 1)
    ) {
      return // Já está no limite
    }

    // Calcular nova posição
    const novoIndex = direcao === 'up' ? index - 1 : index + 1

    // Trocar posições
    const temp = grupo[index]
    grupo[index] = grupo[novoIndex]
    grupo[novoIndex] = temp

    // Atualizar ordem de exibição
    grupo.forEach((cat: Categoria, i) => {
      cat.ordemExibicao = i + 1
    })

    // Atualizar estado
    const novoGrupos: any = { ...categoriasOrdem }
    novoGrupos[grupoPaiId] = grupo
    setCategoriasOrdem(novoGrupos)

    // Chamar API para atualizar
    salvarOrdemCategorias(grupo)
  }

  // Salvar nova ordem das categorias
  const salvarOrdemCategorias = async (categorias) => {
    try {

      // Criar uma cópia do array para não modificar o original
      const categoriasOrdenadas = [...categorias];

      // Preparar os dados para envio - certifique-se de que sejam sequenciais
      const categoriasParaAtualizar = categoriasOrdenadas.map((cat, index) => ({
        id: cat.id,
        ordemExibicao: index + 1 // Garantir que os índices sejam sequenciais
      }));

      const response = await fetch('/api/categorias', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ categorias: categoriasParaAtualizar })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar ordem das categorias');
      }

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a ordem das categorias',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  }

  // Manipular drop de categoria (arrastar e soltar)
  const handleCategoriaMove = (dragIndex, hoverIndex, paiId) => { // Importante: criar um novo array
    const grupoPaiId = paiId || 'raiz'
    if (!categoriasOrdem[grupoPaiId]) return

    const grupo = [...categoriasOrdem[grupoPaiId]]
    const dragItem = grupo[dragIndex]

    // Remover item arrastado
    grupo.splice(dragIndex, 1)
    // Inserir na nova posição
    grupo.splice(hoverIndex, 0, dragItem)

    // Atualizar índices
    grupo.forEach((cat: any, i) => {
      cat.ordemExibicao = i + 1
    })

    // Atualizar estado
    const novoGrupos: any = { ...categoriasOrdem }
    novoGrupos[grupoPaiId] = grupo
    setCategoriasOrdem(novoGrupos)
  }

  // Finalizar drag-and-drop
  const handleDragEnd = (paiId) => {
    const grupoPaiId = paiId || 'raiz'
    if (!categoriasOrdem[grupoPaiId]) return

    // setIsDragging(false)

    // Salvar nova ordem
    if (categoriasOrdem[grupoPaiId] && categoriasOrdem[grupoPaiId].length > 0) {
      salvarOrdemCategorias(categoriasOrdem[grupoPaiId]);
    }
  }

  // Selecionar categoria pai para visualizar subcategorias no modo ordenação
  const handleSelecionarCategoriaPai = (categoria) => {
    setCategoriaPaiSelecionada(categoria)
  }

  return (
    <Box>
      <Heading size="lg" mb={6} color={useColorModeValue('gray.700', 'white')}>
        Gerenciamento de Categorias
      </Heading>

      <Tabs colorScheme="teal" mb={6}>
        <TabList>
          <Tab onClick={() => setViewMode('lista')}>Lista</Tab>
          <Tab onClick={() => setViewMode('hierarquia')}>Hierarquia</Tab>
          <Tab onClick={() => setViewMode('ordenacao')}>Ordenação</Tab>
        </TabList>

        <Card bg={useColorModeValue('white', 'gray.800')} shadow="md" mt={4}>
          <CardHeader pb={0}>
            <Flex justify="space-between" align="center" mb={4}>
              <HStack>
                <InputGroup maxW={{ md: '320px' }}>
                  <InputLeftElement pointerEvents="none">
                    <FaSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <Select
                  maxW={{ md: '180px' }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ativas">Categorias Ativas</option>
                  <option value="inativas">Categorias Inativas</option>
                  <option value="todas">Todas as Categorias</option>
                </Select>
              </HStack>

              <Button
                leftIcon={<FaPlus />}
                colorScheme="teal"
                onClick={handleAddCategoria}
              >
                Nova Categoria
              </Button>
            </Flex>
          </CardHeader>

          <CardBody>
            <TabPanels>
              {/* Visualização em Lista */}
              <TabPanel p={0}>
                {isLoading ? (
                  <Flex justify="center" align="center" p={8}>
                    <Spinner size="lg" color="teal.500" />
                  </Flex>
                ) : categoriasFiltradas.length === 0 ? (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    Nenhuma categoria encontrada.
                  </Alert>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                        <Tr>
                          <Th>Nome</Th>
                          <Th>Categoria Pai</Th>
                          <Th>Local de Produção</Th>
                          <Th>Gera Comanda</Th>
                          <Th>Status</Th>
                          <Th width="100px" textAlign="center">Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {categoriasFiltradas.map((categoria: any) => (
                          <Tr key={categoria.id}>
                            <Td fontWeight="medium">
                              <HStack>
                                <Box
                                  w={4}
                                  h={4}
                                  borderRadius="full"
                                  bg={categoria.cor || 'gray.400'}
                                />
                                <Text>{categoria.nome}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              {categoria.categoriaPai ? categoria.categoriaPai.nome : '-'}
                            </Td>
                            <Td>
                              {categoria.localProducao ? categoria.localProducao.nome : '-'}
                            </Td>
                            <Td>
                              {categoria.geraComanda ?
                                <Badge colorScheme="green">Sim</Badge> :
                                <Badge colorScheme="red">Não</Badge>
                              }
                            </Td>
                            <Td>
                              <Badge colorScheme={categoria.status ? 'green' : 'red'}>
                                {categoria.status ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </Td>
                            <Td>
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
                                    onClick={() => handleEditCategoria(categoria)}
                                  >
                                    Editar
                                  </MenuItem>
                                  <MenuItem
                                    icon={<FaTrash />}
                                    color="red.500"
                                    onClick={() => handleDeleteClick(categoria)}
                                  >
                                    Excluir
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>

              {/* Visualização em Hierarquia */}
              <TabPanel p={0}>
                {isLoading ? (
                  <Flex justify="center" align="center" p={8}>
                    <Spinner size="lg" color="teal.500" />
                  </Flex>
                ) : Object.keys(estrutura).length === 0 ? (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    Nenhuma categoria encontrada.
                  </Alert>
                ) : (
                  <Box>
                    <Text mb={4} fontSize="sm" color="gray.500">
                      Visualização da estrutura hierárquica das categorias.
                    </Text>

                    {Object.values(estrutura).map((categoria: any) => (
                      <CategoriaNode
                        key={categoria.id}
                        categoria={categoria}
                        nivel={0}
                        onEdit={handleEditCategoria}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </Box>
                )}
              </TabPanel>

              {/* Visualização para Ordenação */}
              <TabPanel p={0}>
                {isLoading ? (
                  <Flex justify="center" align="center" p={8}>
                    <Spinner size="lg" color="teal.500" />
                  </Flex>
                ) : (
                  <DndProvider backend={HTML5Backend}>
                    <Box>
                      <Flex mb={4} align="center" gap={4}>
                        <Text fontWeight="medium">Ordenar:</Text>
                        <Select
                          maxW={{ md: '320px' }}
                          value={categoriaPaiSelecionada ? categoriaPaiSelecionada.id : 'raiz'}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId === 'raiz') {
                              setCategoriaPaiSelecionada(null);
                            } else {
                              const selectedCategoria = categorias.find(
                                cat => cat.id === parseInt(selectedId)
                              );
                              setCategoriaPaiSelecionada(selectedCategoria as Categoria);
                            }
                          }}
                        >
                          <option value="raiz">Categorias Principais</option>
                          {categorias
                            .filter(cat => !cat.categoriaPaiId)
                            .map(cat => (
                              <option key={cat.id} value={cat.id}>
                                Subcategorias de: {cat.nome}
                              </option>
                            ))
                          }
                        </Select>

                        <Button
                          leftIcon={<FaSyncAlt />}
                          size="sm"
                          onClick={() => fetchCategorias()}
                          colorScheme="teal"
                          variant="outline"
                        >
                          Atualizar
                        </Button>
                      </Flex>

                      <Text mb={4} fontSize="sm" color="gray.500">
                        Arraste as categorias para reordenar. As alterações são salvas automaticamente.
                      </Text>

                      <Box mb={4} p={4} borderWidth={1} borderRadius="md" borderStyle="dashed">
                        {isDragging && (
                          <Alert status="info" mb={4}>
                            <AlertIcon />
                            Solte para reposicionar a categoria
                          </Alert>
                        )}

                        {!categoriasOrdem[categoriaPaiSelecionada ? categoriaPaiSelecionada.id : 'raiz'] ||
                          categoriasOrdem[categoriaPaiSelecionada ? categoriaPaiSelecionada.id : 'raiz'].length === 0 ? (
                          <Text>Nenhuma categoria encontrada neste nível.</Text>
                        ) : (
                          <Stack spacing={2}>
                            {categoriasOrdem[categoriaPaiSelecionada ? categoriaPaiSelecionada.id : 'raiz'].map((cat, index) => (
                              <DraggableCategoria
                                key={cat.id}
                                categoria={cat}
                                index={index}
                                moveCategoria={(dragIndex, hoverIndex) =>
                                  handleCategoriaMove(dragIndex, hoverIndex, categoriaPaiSelecionada?.id)
                                }
                                onDragStart={() => { }}
                                onDragEnd={() => { handleDragEnd(categoriaPaiSelecionada?.id); }}
                                onEdit={() => handleEditCategoria(cat)}
                                onDelete={() => handleDeleteClick(cat)}
                              />
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  </DndProvider>
                )}
              </TabPanel>
            </TabPanels>
          </CardBody>
        </Card>
      </Tabs>

      {/* Modal para adicionar/editar categoria */}
      <CategoriaFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        categoria={selectedCategoria as Categoria}
        categorias={categorias}
        locaisProducao={locaisProducao}
        onSuccess={fetchCategorias}
      />

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteCategoria}
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir a categoria "${selectedCategoria?.nome}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  )
}

// Componente para exibir a hierarquia de categorias em árvore
function CategoriaNode({ categoria, nivel, onEdit, onDelete }: { categoria: any, nivel: number, onEdit: any, onDelete: any }) {
  const bgColor = useColorModeValue(
    nivel % 2 === 0 ? 'gray.50' : 'white',
    nivel % 2 === 0 ? 'gray.700' : 'gray.800'
  )

  return (
    <Box>
      <Flex
        p={3}
        bg={bgColor}
        borderRadius="md"
        mb={2}
        borderLeft={`4px solid ${categoria.cor || '#CBD5E0'}`}
        justify="space-between"
        align="center"
      >
        <HStack spacing={2}>
          <Box w={nivel * 4} h={4} /> {/* Espaçamento para indentação */}
          <Text fontWeight="medium">{categoria.nome}</Text>
          {!categoria.status && (
            <Badge colorScheme="red">Inativa</Badge>
          )}
          {categoria.geraComanda ? (
            <Tooltip label="Gera comanda de produção">
              <Badge colorScheme="green"><Icon as={FaPrint} mr={1} />Comanda</Badge>
            </Tooltip>
          ) : (
            <Tooltip label="Não gera comanda de produção">
              <Badge colorScheme="red"><Icon as={FaTimes} mr={1} />Sem Comanda</Badge>
            </Tooltip>
          )}
        </HStack>

        <HStack>
          <IconButton
            icon={<FaEdit />}
            aria-label="Editar categoria"
            size="sm"
            variant="ghost"
            onClick={() => onEdit(categoria)}
          />
          <IconButton
            icon={<FaTrash />}
            aria-label="Excluir categoria"
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => onDelete(categoria)}
          />
        </HStack>
      </Flex>

      {/* Renderizar subcategorias recursivamente */}
      {categoria.filhos && categoria.filhos.length > 0 && (
        <Box ml={4} mt={2} mb={4} pl={2} borderLeftWidth={1} borderLeftStyle="dashed" borderLeftColor="gray.300">
          {categoria.filhos.map(filho => (
            <CategoriaNode
              key={filho.id}
              categoria={filho}
              nivel={nivel + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
