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
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Icon,
  Stack,
  Tag,
  TagLabel
} from '@chakra-ui/react'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FaPlus,
  FaSearch,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaTimes,
  FaCheck,
  FaLayerGroup,
  FaToggleOn,
  FaToggleOff,
  FaInfoCircle,
  FaExclamationCircle
} from 'react-icons/fa'
import { GrupoComplementoFormModal } from '../organismes/GrupoComplementoFormModal'
import { ConfirmDialog } from '../molecules/ConfirmDialog'

// Tipo do grupo de complementos
interface GrupoComplemento {
  id: number
  nome: string
  descricao?: string
  minSelecao: number
  maxSelecao: number
  status: boolean
  criadoEm?: string
  atualizadoEm?: string
  complementos?: any[]
}

export function GruposComplementosTemplate() {
  // Estados
  const [grupos, setGrupos] = useState<GrupoComplemento[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoComplemento | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  
  // Disclosures para modais
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  
  const toast = useToast()
  const initialRender = useRef(true)

  // Buscar grupos de complementos
  const fetchGrupos = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/grupos-complementos?search=${searchTerm}&includeComplementos=true`)

      if (!response.ok) {
        throw new Error('Erro ao buscar grupos de complementos')
      }

      const data = await response.json()
      setGrupos(data.gruposComplementos)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os grupos de complementos',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, toast])

  // Buscar dados na montagem do componente
  useEffect(() => {
    fetchGrupos()
  }, [fetchGrupos])

  // Filtrar grupos por status e busca
  const gruposFiltrados = grupos.filter((grupo) => {
    // Filtro de status
    if (filterStatus === 'ativos' && !grupo.status) return false
    if (filterStatus === 'inativos' && grupo.status) return false
    
    return true
  })

  // Abrir modal para adicionar novo grupo
  const handleAddGrupo = () => {
    setSelectedGrupo(null)
    onFormOpen()
  }

  // Abrir modal para editar grupo
  const handleEditGrupo = (grupo: GrupoComplemento) => {
    setSelectedGrupo(grupo)
    onFormOpen()
  }

  // Abrir diálogo de confirmação para excluir grupo
  const handleDeleteClick = (grupo: GrupoComplemento) => {
    setSelectedGrupo(grupo)
    onDeleteOpen()
  }

  // Excluir grupo
  const handleDeleteGrupo = async () => {
    if (!selectedGrupo) return

    try {
      const response = await fetch(`/api/grupos-complementos/${selectedGrupo.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao excluir grupo de complementos')
      }

      toast({
        title: 'Sucesso',
        description: 'Grupo de complementos excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      fetchGrupos()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir grupo de complementos',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      onDeleteClose()
    }
  }

  // Alternar status do grupo (ativar/desativar)
  const handleToggleStatus = async (grupo: GrupoComplemento) => {
    try {
      const response = await fetch(`/api/grupos-complementos/${grupo.id}/toggle-status`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao alterar status do grupo de complementos')
      }

      toast({
        title: 'Sucesso',
        description: `Grupo ${grupo.status ? 'desativado' : 'ativado'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      fetchGrupos()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Renderizar regras de seleção
  const renderRegras = (minSelecao: number, maxSelecao: number) => {
    if (minSelecao === 0 && maxSelecao === 0) {
      return <Badge colorScheme="red">Sem regras definidas</Badge>
    }
    
    if (minSelecao === maxSelecao && minSelecao > 0) {
      return <Badge colorScheme="blue">Selecionar exatamente {minSelecao}</Badge>
    }
    
    if (minSelecao > 0 && maxSelecao > minSelecao) {
      return <Badge colorScheme="purple">Selecionar de {minSelecao} até {maxSelecao}</Badge>
    }
    
    if (minSelecao === 0 && maxSelecao > 0) {
      return <Badge colorScheme="green">Opcional, até {maxSelecao}</Badge>
    }
    
    if (minSelecao > 0 && maxSelecao === 0) {
      return <Badge colorScheme="orange">Mínimo {minSelecao}, sem limite máximo</Badge>
    }
    
    return <Badge>Configuração inválida</Badge>
  }

  // Renderizar contagem de complementos
  const renderComplementos = (grupo: GrupoComplemento) => {
    if (!grupo.complementos || grupo.complementos.length === 0) {
      return <Text color="red.500" fontSize="sm">Sem complementos</Text>
    }
    
    return (
      <Stack direction="row" flexWrap="wrap" spacing={1}>
        <Text fontSize="sm">{grupo.complementos.length} complemento(s):</Text>
        {grupo.complementos.slice(0, 3).map(item => (
          <Tag key={item.complementoId} size="sm" colorScheme="teal" borderRadius="full">
            <TagLabel>{item.complemento.nome}</TagLabel>
          </Tag>
        ))}
        {grupo.complementos.length > 3 && (
          <Tag size="sm" colorScheme="gray" borderRadius="full">
            <TagLabel>+{grupo.complementos.length - 3} mais</TagLabel>
          </Tag>
        )}
      </Stack>
    )
  }

  return (
    <Box>
      <Heading size="lg" mb={6} color={useColorModeValue('gray.700', 'white')}>
        Grupos de Complementos
      </Heading>

      <Card bg={useColorModeValue('white', 'gray.800')} shadow="md" mb={6}>
        <CardHeader pb={0}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <InputGroup maxW={{ md: '320px' }}>
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Buscar grupo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select
                maxW="180px"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </Select>
            </HStack>

            <Button
              leftIcon={<FaPlus />}
              colorScheme="teal"
              onClick={handleAddGrupo}
            >
              Novo Grupo
            </Button>
          </Flex>
        </CardHeader>

        <CardBody>
          {isLoading ? (
            <Flex justify="center" align="center" p={8}>
              <Spinner size="lg" color="teal.500" />
            </Flex>
          ) : gruposFiltrados.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Nenhum grupo de complementos encontrado.
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Complementos</Th>
                    <Th>Regras de Seleção</Th>
                    <Th>Status</Th>
                    <Th width="100px">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {gruposFiltrados.map((grupo) => (
                    <Tr key={grupo.id}>
                      <Td fontWeight="medium">
                        <HStack>
                          <Icon as={FaLayerGroup} color="teal.500" />
                          <Text>{grupo.nome}</Text>
                        </HStack>
                        {grupo.descricao && (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {grupo.descricao}
                          </Text>
                        )}
                      </Td>
                      <Td>{renderComplementos(grupo)}</Td>
                      <Td>{renderRegras(grupo.minSelecao, grupo.maxSelecao)}</Td>
                      <Td>
                        <Badge colorScheme={grupo.status ? 'green' : 'red'}>
                          {grupo.status ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="Editar">
                            <IconButton
                              icon={<FaEdit />}
                              aria-label="Editar grupo"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditGrupo(grupo)}
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
                                icon={grupo.status ? <FaToggleOff /> : <FaToggleOn />}
                                onClick={() => handleToggleStatus(grupo)}
                              >
                                {grupo.status ? 'Desativar' : 'Ativar'}
                              </MenuItem>
                              <MenuItem
                                icon={<FaTrash />}
                                color="red.500"
                                onClick={() => handleDeleteClick(grupo)}
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
          )}
        </CardBody>
      </Card>

      {/* Modal para adicionar/editar grupo de complementos */}
      <GrupoComplementoFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        grupoComplemento={selectedGrupo}
        onSuccess={fetchGrupos}
      />

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteGrupo}
        title="Excluir Grupo de Complementos"
        message={`Tem certeza que deseja excluir o grupo "${selectedGrupo?.nome}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  )
}
