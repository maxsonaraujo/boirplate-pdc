'use client'

import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    Input,
    Stack,
    Text,
    useColorModeValue,
    useToast,
    Avatar,
    VStack,
    HStack,
    Icon,
    InputGroup,
    InputLeftElement,
    InputRightElement
} from '@chakra-ui/react'
import { User } from '@prisma/client'
import { useState, useEffect } from 'react'
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaUserCog } from 'react-icons/fa'

export function PerfilTemplate() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [errors, setErrors] = useState<any>({})
    const toast = useToast()

    const bgColor = useColorModeValue('white', 'gray.800')
    const textColor = useColorModeValue('gray.700', 'gray.100')

    // Buscar dados do usuário logado
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/me')

                if (!response.ok) {
                    throw new Error('Falha ao buscar dados do usuário')
                }

                const data = await response.json()
                setUser(data.user)

                // Preencher o formulário com os dados do usuário
                setFormData(prevState => ({
                    ...prevState,
                    name: data.user.name,
                    email: data.user.email
                }))
            } catch (error) {
                console.error('Erro ao buscar dados do usuário:', error)
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar seus dados.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                })
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()
    }, [toast])

    // Processar alterações no formulário
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })

        // Limpar erro ao digitar
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            })
        }
    }

    // Validar formulário
    const validateForm = () => {
        const newErrors: any = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório'
        }

        // Removida a validação de e-mail, pois não será alterado

        // Validar senha apenas se algum campo de senha estiver preenchido
        if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
            if (!formData.currentPassword) {
                newErrors.currentPassword = 'Senha atual é obrigatória para alterar a senha'
            }

            if (!formData.newPassword) {
                newErrors.newPassword = 'Nova senha é obrigatória'
            } else if (formData.newPassword.length < 6) {
                newErrors.newPassword = 'A senha deve ter pelo menos 6 caracteres'
            }

            if (formData.newPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = 'As senhas não coincidem'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Atualizar perfil
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setUpdating(true)

        try {
            // Preparar dados para envio
            const updateData: any = {
                name: formData.name,
                // Removido o campo email do objeto de atualização
            }

            // Adicionar senhas se estiverem sendo alteradas
            if (formData.currentPassword) {
                updateData.currentPassword = formData.currentPassword
                updateData.newPassword = formData.newPassword
            }

            const response = await fetch('/api/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Erro ao atualizar perfil')
            }

            const data = await response.json()

            // Atualizar dados do usuário
            setUser(data.user)

            // Limpar campos de senha
            setFormData({
                ...formData,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })

            toast({
                title: 'Perfil atualizado',
                description: 'Suas informações foram atualizadas com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true
            })
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Ocorreu um erro ao atualizar seu perfil.',
                status: 'error',
                duration: 5000,
                isClosable: true
            })
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <Box p={4}>
                <Text>Carregando informações do perfil...</Text>
            </Box>
        )
    }

    return (
        <Box>
            <Heading mb={6} color={textColor}>Meu Perfil</Heading>

            <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                {/* Informações do usuário */}
                <Card bg={bgColor} shadow="md" borderRadius="lg" flex={{ base: 1, md: 1 }}>
                    <CardHeader pb={0}>
                        <Heading size="md" color={textColor}>Informações do Usuário</Heading>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={4} align="center">
                            <Avatar
                                size="2xl"
                                name={user?.name}
                                bg="teal.500"
                                color="white"
                            />
                            <VStack spacing={1}>
                                <Heading size="md">{user?.name}</Heading>
                                <Text color="gray.500">{user?.email}</Text>
                                <HStack mt={2}>
                                    <Badge role={user?.role} />
                                </HStack>
                            </VStack>
                            <Text fontSize="sm" color="gray.500" textAlign="center">
                                Conta criada em: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                            </Text>
                        </VStack>
                    </CardBody>
                </Card>

                {/* Formulário de edição */}
                <Card bg={bgColor} shadow="md" borderRadius="lg" flex={{ base: 1, md: 2 }}>
                    <CardHeader pb={0}>
                        <Heading size="md" color={textColor}>Editar Perfil</Heading>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={4}>
                                <FormControl isInvalid={!!errors.name}>
                                    <FormLabel>Nome</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <Icon as={FaUser} color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Seu nome completo"
                                        />
                                    </InputGroup>
                                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Email</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <Icon as={FaEnvelope} color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            isReadOnly
                                            bg={useColorModeValue('gray.100', 'whiteAlpha.100')}
                                            _hover={{ cursor: 'not-allowed' }}
                                        />
                                        <InputRightElement>
                                            <Icon as={FaLock} color="gray.400" title="O email não pode ser alterado" />
                                        </InputRightElement>
                                    </InputGroup>
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        O email é usado para login e não pode ser alterado.
                                    </Text>
                                </FormControl>

                                <Divider my={2} />
                                <Heading size="sm" color={textColor}>Alterar Senha</Heading>

                                <FormControl isInvalid={!!errors.currentPassword}>
                                    <FormLabel>Senha Atual</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <Icon as={FaLock} color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            name="currentPassword"
                                            type="password"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            placeholder="Digite sua senha atual"
                                        />
                                    </InputGroup>
                                    <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!errors.newPassword}>
                                    <FormLabel>Nova Senha</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <Icon as={FaLock} color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            name="newPassword"
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            placeholder="Digite uma nova senha"
                                        />
                                    </InputGroup>
                                    <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!errors.confirmPassword}>
                                    <FormLabel>Confirmar Nova Senha</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <Icon as={FaLock} color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            name="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirme a nova senha"
                                        />
                                    </InputGroup>
                                    <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                                </FormControl>

                                <Button
                                    mt={4}
                                    colorScheme="teal"
                                    isLoading={updating}
                                    type="submit"
                                    alignSelf="flex-end"
                                >
                                    Salvar Alterações
                                </Button>
                            </Stack>
                        </form>
                    </CardBody>
                </Card>
            </Flex>
        </Box>
    )
}

// Componente para exibir o cargo do usuário
function Badge({ role }) {
    const roleInfo = {
        ADMIN: { label: 'Administrador', colorScheme: 'red', icon: FaUserCog },
        MANAGER: { label: 'Gerente', colorScheme: 'orange', icon: FaUserCog },
        CASHIER: { label: 'Caixa', colorScheme: 'green', icon: FaIdCard },
        WAITER: { label: 'Garçom', colorScheme: 'blue', icon: FaUser }
    }

    const info = roleInfo[role] || { label: role, colorScheme: 'gray', icon: FaUser }

    return (
        <Flex
            align="center"
            bg={`${info.colorScheme}.100`}
            color={`${info.colorScheme}.700`}
            fontWeight="bold"
            px={3}
            py={1}
            borderRadius="full"
        >
            <Icon as={info.icon} mr={2} />
            <Text>{info.label}</Text>
        </Flex>
    )
}
