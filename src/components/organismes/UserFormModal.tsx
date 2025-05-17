'use client'

import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    Switch,
    FormErrorMessage,
    VStack,
    useToast,
    Divider,
    Text
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'

type Role = {
    label: string
    description?: string
}

type Roles = {
    [key: string]: Role
}

export function UserFormModal({ isOpen, onClose, user, roles }: { 
    isOpen: boolean, 
    onClose: () => void, 
    user?: { id: string, name: string, email: string, role: string, active: boolean }, 
    roles: Roles 
}) {
    const initialFormState = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'WAITER', // Default role
        active: true
    }

    const [formData, setFormData] = useState(initialFormState)
    const [errors, setErrors] = useState<any>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const toast = useToast()

    // Preenche o formulário quando estiver editando um usuário
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                confirmPassword: '',
                role: user.role || 'WAITER',
                active: user.active !== undefined ? user.active : true
            })
        } else {
            setFormData(initialFormState)
        }

        // Limpa os erros quando o modal abre/fecha
        setErrors({})
    }, [user, isOpen])

    const validateForm = () => {
        const newErrors: any = {}

        // Validação do nome
        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório'
        }

        // Validação do email
        if (!formData.email.trim()) {
            newErrors.email = 'E-mail é obrigatório'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'E-mail inválido'
        }

        // Validação da senha (obrigatória apenas para novos usuários)
        if (!user) {
            if (!formData.password) {
                newErrors.password = 'Senha é obrigatória'
            } else if (formData.password.length < 6) {
                newErrors.password = 'A senha deve ter pelo menos 6 caracteres'
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'As senhas não coincidem'
            }
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'A senha deve ter pelo menos 6 caracteres'
        } else if (
            formData.password &&
            formData.password !== formData.confirmPassword
        ) {
            newErrors.confirmPassword = 'As senhas não coincidem'
        }

        // Validação da função
        if (!formData.role) {
            newErrors.role = 'Função é obrigatória'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        })

        // Limpa o erro do campo quando o usuário começa a digitar
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: undefined
            })
        }
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            const apiUrl = user ? `/api/users/${user.id}` : '/api/users'
            const method = user ? 'PUT' : 'POST'

            // Prepara os dados para envio
            const userData: any = { ...formData }

            // Remove confirmPassword, pois não é necessário no backend
            delete userData.confirmPassword

            // Se estiver editando e não houver senha, remove o campo
            if (user && !userData.password) {
                delete userData.password
            }

            const response = await fetch(apiUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Erro ao salvar usuário')
            }

            toast({
                title: 'Sucesso',
                description: user ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true
            })

            onClose()
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Ocorreu um erro ao processar sua solicitação',
                status: 'error',
                duration: 5000,
                isClosable: true
            })
            console.error('Erro ao salvar usuário:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {user ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isInvalid={!!errors.name} isRequired>
                            <FormLabel>Nome</FormLabel>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nome completo"
                            />
                            <FormErrorMessage>{errors.name}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.email} isRequired>
                            <FormLabel>E-mail</FormLabel>
                            <Input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@exemplo.com"
                            />
                            <FormErrorMessage>{errors.email}</FormErrorMessage>
                        </FormControl>

                        <Divider />

                        <FormControl isInvalid={!!errors.password} isRequired={!user}>
                            <FormLabel>{user ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha'}</FormLabel>
                            <Input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="********"
                            />
                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.confirmPassword} isRequired={!user}>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <Input
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="********"
                            />
                            <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                        </FormControl>

                        <Divider />

                        <FormControl isInvalid={!!errors.role} isRequired>
                            <FormLabel>Função</FormLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                {Object.entries(roles).map(([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </Select>
                            <FormErrorMessage>{errors.role}</FormErrorMessage>
                        </FormControl>

                        <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="active" mb="0">
                                Ativo
                            </FormLabel>
                            <Switch
                                id="active"
                                name="active"
                                isChecked={formData.active}
                                onChange={handleChange}
                                colorScheme="teal"
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        colorScheme="teal"
                        isLoading={isSubmitting}
                        onClick={handleSubmit}
                    >
                        {user ? 'Atualizar' : 'Adicionar'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
