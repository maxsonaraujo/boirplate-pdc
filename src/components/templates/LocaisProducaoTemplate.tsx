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
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    Card,
    CardHeader,
    CardBody
} from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import {
    FaPlus,
    FaSearch,
    FaEllipsisV,
    FaEdit,
    FaTrash,
    FaPrint
} from 'react-icons/fa'
import { LocalProducaoFormModal } from '../organismes/LocalProducaoFormModal'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { LocalProducao } from '@prisma/client'

export function LocaisProducaoTemplate() {
    const [locaisProducao, setLocaisProducao] = useState([])
    const [selectedLocal, setSelectedLocal] = useState<LocalProducao | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('ativos')

    const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
    const toast = useToast()

    // Buscar locais de produção
    const fetchLocaisProducao = useCallback(async () => {
        setIsLoading(true)
        try {
            const includeInactive = filterStatus === 'todos' || filterStatus === 'inativos'
            const response = await fetch(`/api/locais-producao?includeInactive=${includeInactive}`)

            if (!response.ok) {
                throw new Error('Erro ao buscar locais de produção')
            }

            const data = await response.json()
            setLocaisProducao(data.locaisProducao)
        } catch (error) {
            console.error('Erro:', error)
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os locais de produção',
                status: 'error',
                duration: 3000,
                isClosable: true
            })
        } finally {
            setIsLoading(false)
        }
    }, [filterStatus, toast])

    useEffect(() => {
        fetchLocaisProducao()
    }, [fetchLocaisProducao])

    // Filtrar locais de produção
    const locaisFiltrados = locaisProducao.filter((local: LocalProducao) => {
        // Filtrar por termo de busca
        const matchesSearch =
            local.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (local.descricao && local.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (local.impressora && local.impressora.toLowerCase().includes(searchTerm.toLowerCase()))

        // Filtrar por status
        const matchesStatus =
            filterStatus === 'todos' ||
            (filterStatus === 'ativos' && local.status) ||
            (filterStatus === 'inativos' && !local.status)

        return matchesSearch && matchesStatus
    })

    // Abrir modal para adicionar novo local
    const handleAddLocal = () => {
        setSelectedLocal(null)
        onFormOpen()
    }

    // Abrir modal para editar local
    const handleEditLocal = (local) => {
        setSelectedLocal(local)
        onFormOpen()
    }

    // Abrir diálogo de confirmação para excluir local
    const handleDeleteClick = (local) => {
        setSelectedLocal(local)
        onDeleteOpen()
    }

    // Excluir local
    const handleDeleteLocal = async () => {
        try {
            const response = await fetch(`/api/locais-producao/${selectedLocal?.id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Erro ao excluir local de produção')
            }

            toast({
                title: 'Sucesso',
                description: 'Local de produção excluído com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true
            })

            fetchLocaisProducao()
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao excluir local de produção',
                status: 'error',
                duration: 3000,
                isClosable: true
            })
        } finally {
            onDeleteClose()
        }
    }

    return (
        <Box>
            <Heading size="lg" mb={6} color={useColorModeValue('gray.700', 'white')}>
                Gerenciamento de Locais de Produção
            </Heading>

            <Card bg={useColorModeValue('white', 'gray.800')} shadow="md" mb={6}>
                <CardHeader pb={0}>
                    <Flex justify="space-between" align="center" mb={4}>
                        <HStack>
                            <InputGroup maxW={{ md: '320px' }}>
                                <InputLeftElement pointerEvents="none">
                                    <FaSearch color="gray.300" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Buscar local de produção..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>

                            <Select
                                maxW={{ md: '180px' }}
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="ativos">Locais Ativos</option>
                                <option value="inativos">Locais Inativos</option>
                                <option value="todos">Todos os Locais</option>
                            </Select>
                        </HStack>

                        <Button
                            leftIcon={<FaPlus />}
                            colorScheme="teal"
                            onClick={handleAddLocal}
                        >
                            Novo Local
                        </Button>
                    </Flex>
                </CardHeader>

                <CardBody>
                    {isLoading ? (
                        <Flex justify="center" align="center" p={8}>
                            <Spinner size="lg" color="teal.500" />
                        </Flex>
                    ) : locaisFiltrados.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            Nenhum local de produção encontrado.
                        </Alert>
                    ) : (
                        <Box overflowX="auto">
                            <Table variant="simple">
                                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                                    <Tr>
                                        <Th>Nome</Th>
                                        <Th>Descrição</Th>
                                        <Th>Impressora</Th>
                                        <Th>Status</Th>
                                        <Th width="100px" textAlign="center">Ações</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {locaisFiltrados.map((local: LocalProducao) => (
                                        <Tr key={local.id}>
                                            <Td fontWeight="medium">
                                                <HStack>
                                                    <FaPrint />
                                                    <Text>{local.nome}</Text>
                                                </HStack>
                                            </Td>
                                            <Td>
                                                <Text noOfLines={1} maxW="300px">
                                                    {local.descricao || '-'}
                                                </Text>
                                            </Td>
                                            <Td>{local.impressora || '-'}</Td>
                                            <Td>
                                                <Badge colorScheme={local.status ? 'green' : 'red'}>
                                                    {local.status ? 'Ativo' : 'Inativo'}
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
                                                            onClick={() => handleEditLocal(local)}
                                                        >
                                                            Editar
                                                        </MenuItem>
                                                        <MenuItem
                                                            icon={<FaTrash />}
                                                            color="red.500"
                                                            onClick={() => handleDeleteClick(local)}
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
                </CardBody>
            </Card>

            {/* Modal para adicionar/editar local de produção */}
            <LocalProducaoFormModal
                isOpen={isFormOpen}
                onClose={onFormClose}
                localProducao={selectedLocal}
                onSuccess={fetchLocaisProducao}
            />

            {/* Diálogo de confirmação para exclusão */}
            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={onDeleteClose}
                onConfirm={handleDeleteLocal}
                title="Excluir Local de Produção"
                message={`Tem certeza que deseja excluir o local "${selectedLocal?.nome}"? Esta ação não poderá ser desfeita.`}
            />
        </Box>
    )
}
