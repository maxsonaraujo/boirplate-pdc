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
  FaMoneyBillWave,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa'
import { ComplementoFormModal } from '../organismes/ComplementoFormModal'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { formatCurrency } from '@/utils/format'

// Tipo do complemento
interface Complemento {
  id: number
  nome: string
  descricao?: string
  precoAdicional: number
  status: boolean
  criadoEm?: string
  atualizadoEm?: string
}

export function ComplementosTemplate() {
  // Estados
  const [complementos, setComplementos] = useState<Complemento[]>([])
  const [selectedComplemento, setSelectedComplemento] = useState<Complemento | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  
  // Disclosures para modais
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  
  const toast = useToast()
  const initialRender = useRef(true)

  // Buscar complementos
  const fetchComplementos = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/complementos?search=${searchTerm}`)

      if (!response.ok) {
        throw new Error('Erro ao buscar complementos')
      }

      const data = await response.json()
      setComplementos(data.complementos)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os complementos',
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
    fetchComplementos()
  }, [fetchComplementos])

  // Filtrar complementos por status e busca
  const complementosFiltrados = complementos.filter((complemento) => {
    // Filtro de status
    if (filterStatus === 'ativos' && !complemento.status) return false
    if (filterStatus === 'inativos' && complemento.status) return false
    
    return true
  })

  // Abrir modal para adicionar novo complemento
  const handleAddComplemento = () => {
    setSelectedComplemento(null)
    onFormOpen()
  }

  // Abrir modal para editar complemento
  const handleEditComplemento = (complemento: Complemento) => {
    setSelectedComplemento(complemento)
    onFormOpen()
  }

  // Abrir diálogo de confirmação para excluir complemento
  const handleDeleteClick = (complemento: Complemento) => {
    setSelectedComplemento(complemento)
    onDeleteOpen()
  }

  // Excluir complemento
  const handleDeleteComplemento = async () => {
    if (!selectedComplemento) return

    try {
      const response = await fetch(`/api/complementos/${selectedComplemento.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao excluir complemento')
      }

      toast({
        title: 'Sucesso',
        description: 'Complemento excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      fetchComplementos()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir complemento',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      onDeleteClose()
    }
  }

  // Alternar status do complemento (ativar/desativar)
  const handleToggleStatus = async (complemento: Complemento) => {
    try {
      const response = await fetch(`/api/complementos/${complemento.id}/toggle-status`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao alterar status do complemento')
      }

      toast({
        title: 'Sucesso',
        description: `Complemento ${complemento.status ? 'desativado' : 'ativado'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      fetchComplementos()
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
        Complementos
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
                  placeholder="Buscar complemento..."
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
              onClick={handleAddComplemento}
            >
              Novo Complemento
            </Button>
          </Flex>
        </CardHeader>

        <CardBody>
          {isLoading ? (
            <Flex justify="center" align="center" p={8}>
              <Spinner size="lg" color="teal.500" />
            </Flex>
          ) : complementosFiltrados.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Nenhum complemento encontrado.
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Descrição</Th>
                    <Th isNumeric>Preço Adicional</Th>
                    <Th>Status</Th>
                    <Th width="100px">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {complementosFiltrados.map((complemento) => (
                    <Tr key={complemento.id}>
                      <Td fontWeight="medium">{complemento.nome}</Td>
                      <Td>{complemento.descricao || '-'}</Td>
                      <Td isNumeric>
                        <HStack justifyContent="flex-end">
                          <Icon as={FaMoneyBillWave} color="green.500" />
                          <Text fontWeight="medium" color="green.600">
                            {formatCurrency(complemento.precoAdicional)}
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={complemento.status ? 'green' : 'red'}>
                          {complemento.status ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="Editar">
                            <IconButton
                              icon={<FaEdit />}
                              aria-label="Editar complemento"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditComplemento(complemento)}
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
                                icon={complemento.status ? <FaToggleOff /> : <FaToggleOn />}
                                onClick={() => handleToggleStatus(complemento)}
                              >
                                {complemento.status ? 'Desativar' : 'Ativar'}
                              </MenuItem>
                              <MenuItem
                                icon={<FaTrash />}
                                color="red.500"
                                onClick={() => handleDeleteClick(complemento)}
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

      {/* Modal para adicionar/editar complemento */}
      <ComplementoFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        complemento={selectedComplemento}
        onSuccess={fetchComplementos}
      />

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteComplemento}
        title="Excluir Complemento"
        message={`Tem certeza que deseja excluir o complemento "${selectedComplemento?.nome}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  )
}
