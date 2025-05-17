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
  Icon
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
  FaRuler,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa'
import { UnidadeMedidaFormModal } from '../organismes/UnidadeMedidaFormModal'
import { ConfirmDialog } from '../molecules/ConfirmDialog'

// Tipo da unidade de medida
interface UnidadeMedida {
  id: number
  nome: string
  simbolo: string
  descricao?: string
  status: boolean
  criadoEm?: string
  atualizadoEm?: string
}

export function UnidadesMedidaTemplate() {
  // Estados
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadeMedida[]>([])
  const [selectedUnidade, setSelectedUnidade] = useState<UnidadeMedida | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  
  // Disclosures para modais
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  
  const toast = useToast()
  const initialRender = useRef(true)

  // Buscar unidades de medida
  const fetchUnidadesMedida = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/unidades-medida?search=${searchTerm}`)

      if (!response.ok) {
        throw new Error('Erro ao buscar unidades de medida')
      }

      const data = await response.json()
      setUnidadesMedida(data.unidadesMedida)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as unidades de medida',
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
    fetchUnidadesMedida()
  }, [fetchUnidadesMedida])

  // Filtrar unidades de medida por status e busca
  const unidadesFiltradas = unidadesMedida.filter((unidade) => {
    // Filtro de status
    if (filterStatus === 'ativos' && !unidade.status) return false
    if (filterStatus === 'inativos' && unidade.status) return false
    
    return true
  })

  // Abrir modal para adicionar nova unidade
  const handleAddUnidade = () => {
    setSelectedUnidade(null)
    onFormOpen()
  }

  // Abrir modal para editar unidade
  const handleEditUnidade = (unidade: UnidadeMedida) => {
    setSelectedUnidade(unidade)
    onFormOpen()
  }

  // Abrir diálogo de confirmação para excluir unidade
  const handleDeleteClick = (unidade: UnidadeMedida) => {
    setSelectedUnidade(unidade)
    onDeleteOpen()
  }

  // Excluir unidade
  const handleDeleteUnidade = async () => {
    if (!selectedUnidade) return

    try {
      const response = await fetch(`/api/unidades-medida/${selectedUnidade.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao excluir unidade de medida')
      }

      toast({
        title: 'Sucesso',
        description: 'Unidade de medida excluída com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      fetchUnidadesMedida()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir unidade de medida',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      onDeleteClose()
    }
  }

  // Alternar status da unidade (ativar/desativar)
  const handleToggleStatus = async (unidade: UnidadeMedida) => {
    try {
      const response = await fetch(`/api/unidades-medida/${unidade.id}/toggle-status`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao alterar status da unidade de medida')
      }

      toast({
        title: 'Sucesso',
        description: `Unidade de medida ${unidade.status ? 'desativada' : 'ativada'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      fetchUnidadesMedida()
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

  return (
    <Box>
      <Heading size="lg" mb={6} color={useColorModeValue('gray.700', 'white')}>
        Unidades de Medida
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
                  placeholder="Buscar unidade de medida..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select
                maxW="180px"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todas</option>
                <option value="ativos">Ativas</option>
                <option value="inativos">Inativas</option>
              </Select>
            </HStack>

            <Button
              leftIcon={<FaPlus />}
              colorScheme="teal"
              onClick={handleAddUnidade}
            >
              Nova Unidade
            </Button>
          </Flex>
        </CardHeader>

        <CardBody>
          {isLoading ? (
            <Flex justify="center" align="center" p={8}>
              <Spinner size="lg" color="teal.500" />
            </Flex>
          ) : unidadesFiltradas.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Nenhuma unidade de medida encontrada.
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Símbolo</Th>
                    <Th>Descrição</Th>
                    <Th>Status</Th>
                    <Th width="100px">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {unidadesFiltradas.map((unidade) => (
                    <Tr key={unidade.id}>
                      <Td fontWeight="medium">{unidade.nome}</Td>
                      <Td>
                        <Badge colorScheme="blue" px={2}>
                          {unidade.simbolo}
                        </Badge>
                      </Td>
                      <Td>{unidade.descricao || '-'}</Td>
                      <Td>
                        <Badge colorScheme={unidade.status ? 'green' : 'red'}>
                          {unidade.status ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="Editar">
                            <IconButton
                              icon={<FaEdit />}
                              aria-label="Editar unidade"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditUnidade(unidade)}
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
                                icon={unidade.status ? <FaToggleOff /> : <FaToggleOn />}
                                onClick={() => handleToggleStatus(unidade)}
                              >
                                {unidade.status ? 'Desativar' : 'Ativar'}
                              </MenuItem>
                              <MenuItem
                                icon={<FaTrash />}
                                color="red.500"
                                onClick={() => handleDeleteClick(unidade)}
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

      {/* Modal para adicionar/editar unidade de medida */}
      <UnidadeMedidaFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        unidadeMedida={selectedUnidade}
        onSuccess={fetchUnidadesMedida}
      />

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteUnidade}
        title="Excluir Unidade de Medida"
        message={`Tem certeza que deseja excluir a unidade de medida "${selectedUnidade?.nome}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  )
}
