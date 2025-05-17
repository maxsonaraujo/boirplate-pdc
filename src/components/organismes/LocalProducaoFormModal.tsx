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
    Switch,
    FormErrorMessage,
    VStack,
    HStack,
    Divider,
    useToast,
    Text,
    Box,
    useColorModeValue,
    Textarea,
    InputGroup,
    InputLeftElement
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { FaCheck, FaPlus, FaPrint } from 'react-icons/fa'

export function LocalProducaoFormModal({ isOpen, onClose, localProducao, onSuccess }) {
    const initialFormState = {
        nome: '',
        descricao: '',
        status: true,
        impressora: ''
    }

    const [formData, setFormData] = useState(initialFormState)
    const [errors, setErrors] = useState<any>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const toast = useToast()

    // Inicializar formulário quando um local de produção for selecionado para edição
    useEffect(() => {
        if (localProducao) {
            setFormData({
                nome: localProducao.nome || '',
                descricao: localProducao.descricao || '',
                status: localProducao.status !== undefined ? localProducao.status : true,
                impressora: localProducao.impressora || ''
            })
        } else {
            setFormData(initialFormState)
        }

        setErrors({})
    }, [localProducao, isOpen])

    // Manipular mudanças no formulário
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        })

        // Limpar erro ao editar o campo
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            })
        }
    }

    // Manipular interruptores (switches)
    const handleSwitchChange = (name) => {
        setFormData({
            ...formData,
            [name]: !formData[name]
        })
    }

    // Validar o formulário
    const validateForm = () => {
        const newErrors: any = {}

        if (!formData.nome.trim()) {
            newErrors.nome = 'Nome é obrigatório'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Enviar o formulário
    const handleSubmit = async () => {
        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            const url = localProducao
                ? `/api/locais-producao/${localProducao.id}`
                : '/api/locais-producao'

            const method = localProducao ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Ocorreu um erro ao salvar o local de produção')
            }

            toast({
                title: 'Sucesso',
                description: localProducao
                    ? 'Local de produção atualizado com sucesso'
                    : 'Local de produção criado com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true
            })

            onClose()
            onSuccess && onSuccess()
        } catch (error:any) {
            console.error('Erro ao salvar local de produção:', error)
            toast({
                title: 'Erro',
                description: error.message || 'Ocorreu um erro ao salvar o local de produção',
                status: 'error',
                duration: 5000,
                isClosable: true
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {localProducao ? 'Editar Local de Produção' : 'Novo Local de Produção'}
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired isInvalid={errors.nome}>
                            <FormLabel>Nome do Local</FormLabel>
                            <Input
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                placeholder="Ex: Cozinha, Bar, Confeitaria"
                            />
                            <FormErrorMessage>{errors.nome}</FormErrorMessage>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Descrição</FormLabel>
                            <Textarea
                                name="descricao"
                                value={formData.descricao || ''}
                                onChange={handleChange}
                                placeholder="Descrição do local (opcional)"
                                size="sm"
                                resize="vertical"
                                rows={3}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Impressora</FormLabel>
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <Box p={2}><FaPrint /></Box>
                                </InputLeftElement>
                                <Input
                                    name="impressora"
                                    value={formData.impressora || ''}
                                    onChange={handleChange}
                                    placeholder="Nome da impressora associada a este local"
                                />
                            </InputGroup>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                Nome da impressora para emissão de comandas. Deixe em branco se não houver impressora.
                            </Text>
                        </FormControl>

                        <Divider my={2} />

                        <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="status" mb="0">
                                Status
                            </FormLabel>
                            <Switch
                                id="status"
                                colorScheme="teal"
                                isChecked={formData.status}
                                onChange={() => handleSwitchChange('status')}
                            />
                            <Text ml={2} fontSize="sm" color={formData.status ? 'green.500' : 'red.500'}>
                                {formData.status ? 'Ativo' : 'Inativo'}
                            </Text>
                        </FormControl>

                        {localProducao && (
                            <Box
                                mt={4}
                                p={4}
                                bg={useColorModeValue('gray.50', 'gray.700')}
                                borderRadius="md"
                            >
                                <Text fontWeight="medium" mb={2}>
                                    Informações Adicionais
                                </Text>

                                <Text fontSize="sm">
                                    Criado em: {new Date(localProducao.criadoEm).toLocaleString()}
                                </Text>
                                <Text fontSize="sm">
                                    Última atualização: {new Date(localProducao.atualizadoEm).toLocaleString()}
                                </Text>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        colorScheme="teal"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        leftIcon={localProducao ? <FaCheck /> : <FaPlus />}
                    >
                        {localProducao ? 'Salvar Alterações' : 'Criar Local'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
