'use client'

import {
    Box,
    Button,
    Flex,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useColorModeValue,
    Text,
    Badge,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useDisclosure,
    HStack,
    InputGroup,
    Input,
    InputLeftElement,
    Select,
    Stack,
    useToast
} from '@chakra-ui/react'
import { FaPlus, FaSearch, FaEllipsisV, FaEdit, FaTrash, FaUserShield, FaUserCog } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { UserFormModal } from '../organismes/UserFormModal'
import { User } from '@prisma/client'

// Tipos de usuários para o gerenciamento
const ROLES = {
    ADMIN: { label: 'Administrador', color: 'red' },
    MANAGER: { label: 'Gerente', color: 'orange' },
    CASHIER: { label: 'Caixa', color: 'green' },
    WAITER: { label: 'Garçom', color: 'blue' },
}

export function UsuariosTemplate() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState('')
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()

    const fetchUsers = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/users')
            if (!response.ok) throw new Error('Erro ao buscar usuários')

            const data = await response.json()
            setUsers(data.users)
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar a lista de usuários',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
            console.error('Erro ao buscar usuários:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleAddUser = () => {
        setSelectedUser(null)
        onOpen()
    }

    const handleEditUser = (user) => {
        setSelectedUser(user)
        onOpen()
    }

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'DELETE',
                })

                if (!response.ok) throw new Error('Erro ao excluir usuário')

                toast({
                    title: 'Sucesso',
                    description: 'Usuário excluído com sucesso',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                })

                // Atualiza a lista de usuários
                fetchUsers()
            } catch (error) {
                toast({
                    title: 'Erro',
                    description: 'Não foi possível excluir o usuário',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                })
                console.error('Erro ao excluir usuário:', error)
            }
        }
    }

    const filteredUsers = users.filter((user: User) => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = filterRole === '' || user.role === filterRole

        return matchesSearch && matchesRole
    })

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg" color={useColorModeValue('gray.700', 'white')}>
                    Gerenciamento de Usuários
                </Heading>
                <Button
                    leftIcon={<FaPlus />}
                    colorScheme="teal"
                    onClick={handleAddUser}
                >
                    Novo Usuário
                </Button>
            </Flex>

            <Stack
                direction={{ base: 'column', md: 'row' }}
                spacing={4}
                mb={6}
            >
                <InputGroup maxW={{ md: '320px' }}>
                    <InputLeftElement pointerEvents="none">
                        <FaSearch color="gray.300" />
                    </InputLeftElement>
                    <Input
                        placeholder="Buscar usuário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </InputGroup>

                <Select
                    placeholder="Filtrar por função"
                    maxW={{ md: '220px' }}
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                >
                    {Object.entries(ROLES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </Select>
            </Stack>

            <Box
                bg={useColorModeValue('white', 'gray.800')}
                shadow="md"
                rounded="lg"
                overflow="hidden"
            >
                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                            <Tr>
                                <Th>Nome</Th>
                                <Th>E-mail</Th>
                                <Th>Função</Th>
                                <Th>Status</Th>
                                <Th width="100px" textAlign="center">Ações</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {isLoading ? (
                                <Tr>
                                    <Td colSpan={5} textAlign="center" py={6}>
                                        <Text>Carregando...</Text>
                                    </Td>
                                </Tr>
                            ) : filteredUsers.length === 0 ? (
                                <Tr>
                                    <Td colSpan={5} textAlign="center" py={6}>
                                        <Text>Nenhum usuário encontrado</Text>
                                    </Td>
                                </Tr>
                            ) : (
                                filteredUsers.map((user: User) => (
                                    <Tr key={user.id}>
                                        <Td>
                                            <HStack>
                                                {user.role === 'ADMIN' && (
                                                    <Box color="red.500" mr={2}>
                                                        <FaUserShield />
                                                    </Box>
                                                )}
                                                {user.role === 'MANAGER' && (
                                                    <Box color="orange.500" mr={2}>
                                                        <FaUserCog />
                                                    </Box>
                                                )}
                                                <Text fontWeight="medium">{user.name}</Text>
                                            </HStack>
                                        </Td>
                                        <Td>{user.email}</Td>
                                        <Td>
                                            <Badge colorScheme={ROLES[user.role]?.color || 'gray'}>
                                                {ROLES[user.role]?.label || user.role}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <Badge colorScheme={user.active ? 'green' : 'red'}>
                                                {user.active ? 'Ativo' : 'Inativo'}
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
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        Editar
                                                    </MenuItem>
                                                    <MenuItem
                                                        icon={<FaTrash />}
                                                        color="red.500"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        Excluir
                                                    </MenuItem>
                                                </MenuList>
                                            </Menu>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </Box>

            {/* Modal para adicionar/editar usuários */}
            <UserFormModal
                isOpen={isOpen}
                onClose={() => {
                    onClose()
                    fetchUsers() // Recarrega a lista após fechar o modal
                }}
                user={selectedUser || undefined}
                roles={ROLES}
            />
        </Box>
    )
}
