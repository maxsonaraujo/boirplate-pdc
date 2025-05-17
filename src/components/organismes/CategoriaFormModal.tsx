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
    HStack,
    Divider,
    useToast,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Text,
    Box,
    useColorModeValue,
    Textarea,
    Flex,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { ColorPicker } from '../molecules/ColorPicker'
import { IconSelector } from '../molecules/IconSelector'
import { FaCheck, FaTimes, FaTag, FaCog, FaList, FaPrint, FaPlus } from 'react-icons/fa'
import { Categoria, LocalProducao } from '@prisma/client'

export function CategoriaFormModal({ isOpen, onClose, categoria, categorias = [], locaisProducao = [], onSuccess }:
    {
        isOpen: boolean,
        onClose: () => void,
        categoria?: Categoria,
        categorias?: Categoria[],
        locaisProducao?: LocalProducao[],
        onSuccess?: () => void
    }
) {
    const initialFormState = {
        nome: '',
        descricao: '',
        status: true,
        ordemExibicao: null,
        geraComanda: true,
        localProducaoId: '',
        categoriaPaiId: '',
        cor: '#38B2AC', // teal.500
        icone: 'FaUtensils',
        visivelPdv: true,
        visivelDelivery: true,
        tempoPreparoPadrao: null
    }

    const [formData, setFormData] = useState(initialFormState)
    const [errors, setErrors] = useState<any>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const toast = useToast()

    // Inicializar formulário quando um categoria for selecionada para edição
    useEffect(() => {
        if (categoria) {
            setFormData({
                nome: categoria.nome || '',
                descricao: categoria.descricao || '',
                status: categoria.status !== undefined ? categoria.status : true,
                ordemExibicao: categoria.ordemExibicao || null as any,
                geraComanda: categoria.geraComanda !== undefined ? categoria.geraComanda : true,
                localProducaoId: categoria.localProducaoId || '' as any,
                categoriaPaiId: categoria.categoriaPaiId || '' as any,
                cor: categoria.cor || '#38B2AC',
                icone: categoria.icone || 'FaUtensils',
                visivelPdv: categoria.visivelPdv !== undefined ? categoria.visivelPdv : true,
                visivelDelivery: categoria.visivelDelivery !== undefined ? categoria.visivelDelivery : true,
                tempoPreparoPadrao: categoria.tempoPreparoPadrao || null as any
            })
        } else {
            setFormData(initialFormState)
        }

        setErrors({})
    }, [categoria, isOpen])

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

    // Manipular campos numéricos
    const handleNumberChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value === '' ? null : Number(value)
        })
    }

    // Manipular seleção de cor
    const handleColorChange = (color) => {
        setFormData({
            ...formData,
            cor: color && color.trim()
        })
    }

    // Manipular seleção de ícone
    const handleIconChange = (icon) => {
        setFormData({
            ...formData,
            icone: icon
        })
    }

    // Validar o formulário
    const validateForm = () => {
        const newErrors: any = {}

        if (!formData.nome.trim()) {
            newErrors.nome = 'Nome é obrigatório'
        }

        // Validar se categoria pai está tentando se referenciar (em caso de edição)
        if (categoria && formData.categoriaPaiId && Number(formData.categoriaPaiId) === categoria.id) {
            newErrors.categoriaPaiId = 'Uma categoria não pode ser pai de si mesma'
        }

        // Validar tempo de preparo
        if (formData.tempoPreparoPadrao !== null && formData.tempoPreparoPadrao < 0) {
            newErrors.tempoPreparoPadrao = 'O tempo de preparo não pode ser negativo'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Enviar o formulário
    const handleSubmit = async () => {
        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            const url = categoria
                ? `/api/categorias/${categoria.id}`
                : '/api/categorias'

            const method = categoria ? 'PUT' : 'POST'

            // Converter IDs para números, quando necessário
            const dataToSend = {
                ...formData,
                categoriaPaiId: formData.categoriaPaiId ? Number(formData.categoriaPaiId) : null,
                localProducaoId: formData.localProducaoId ? Number(formData.localProducaoId) : null
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Ocorreu um erro ao salvar a categoria')
            }

            toast({
                title: 'Sucesso',
                description: categoria
                    ? 'Categoria atualizada com sucesso'
                    : 'Categoria criada com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true
            })

            onClose()
            onSuccess && onSuccess()
        } catch (error: any) {
            console.error('Erro ao salvar categoria:', error)
            toast({
                title: 'Erro',
                description: error.message || 'Ocorreu um erro ao salvar a categoria',
                status: 'error',
                duration: 5000,
                isClosable: true
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Função auxiliar para filtrar categorias disponíveis como pai
    // Evita loops na hierarquia, removendo a categoria atual e suas subcategorias
    const getCategoriasPaiDisponiveis = () => {
        // Se não está editando, todas as categorias estão disponíveis
        if (!categoria) return categorias

        // Função recursiva para encontrar todos os IDs de subcategorias
        const getSubcategoriaIds = (catId: number, allCats: { id: number; categoriaPaiId?: number }[]): number[] => {
            const subIds = [catId]

            allCats.forEach(c => {
                if (c.categoriaPaiId === catId) {
                    subIds.push(...getSubcategoriaIds(c.id, allCats))
                }
            })

            return subIds
        }

        // Obter todos os IDs de subcategorias da categoria atual
        const idsParaExcluir = getSubcategoriaIds(categoria.id, categorias as any)

        // Filtrar categorias que não estão na lista de exclusão
        return categorias.filter((cat: Categoria) => !idsParaExcluir.includes(cat.id))
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {categoria ? 'Editar Categoria' : 'Nova Categoria'}
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <Tabs colorScheme="teal" variant="enclosed">
                        <TabList>
                            <Tab><Box mr={2}><FaTag /></Box> Básico</Tab>
                            <Tab><Box mr={2}><FaPrint /></Box> Produção</Tab>
                            <Tab><Box mr={2}><FaCog /></Box> Configurações</Tab>
                        </TabList>

                        <TabPanels>
                            {/* Tab 1: Informações Básicas */}
                            <TabPanel>
                                <VStack spacing={4} align="stretch">
                                    <FormControl isRequired isInvalid={errors.nome}>
                                        <FormLabel>Nome da Categoria</FormLabel>
                                        <Input
                                            name="nome"
                                            value={formData.nome}
                                            onChange={handleChange}
                                            placeholder="Ex: Pratos Principais"
                                        />
                                        <FormErrorMessage>{errors.nome}</FormErrorMessage>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Descrição</FormLabel>
                                        <Textarea
                                            name="descricao"
                                            value={formData.descricao || ''}
                                            onChange={handleChange}
                                            placeholder="Descrição da categoria (opcional)"
                                            size="sm"
                                            resize="vertical"
                                            rows={3}
                                        />
                                    </FormControl>

                                    <FormControl isInvalid={errors.categoriaPaiId}>
                                        <FormLabel>Categoria Pai</FormLabel>
                                        <Select
                                            name="categoriaPaiId"
                                            value={formData.categoriaPaiId}
                                            onChange={handleChange}
                                            placeholder="Selecione a categoria pai (opcional)"
                                        >
                                            {getCategoriasPaiDisponiveis()
                                                .filter((cat: Categoria) => !cat.categoriaPaiId) // Mostrar apenas categorias principais
                                                .map((cat: Categoria) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.nome}
                                                    </option>
                                                ))}
                                        </Select>
                                        <FormErrorMessage>{errors.categoriaPaiId}</FormErrorMessage>
                                    </FormControl>

                                    <HStack justify="space-between">
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
                                                {formData.status ? 'Ativa' : 'Inativa'}
                                            </Text>
                                        </FormControl>

                                        <FormControl maxW="150px">
                                            <FormLabel>Ordem de Exibição</FormLabel>
                                            <NumberInput
                                                min={0}
                                                value={formData.ordemExibicao || ''}
                                                onChange={(value) => handleNumberChange('ordemExibicao', value)}
                                            >
                                                <NumberInputField />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        </FormControl>
                                    </HStack>

                                    <Divider />

                                    <Flex justify="space-between" align="start">
                                        <FormControl flex="1" mr={4}>
                                            <FormLabel>Cor da Categoria</FormLabel>
                                            <ColorPicker
                                                color={formData.cor}
                                                onChange={handleColorChange}
                                            />
                                        </FormControl>

                                        <FormControl flex="1">
                                            <FormLabel>Ícone</FormLabel>
                                            <IconSelector
                                                selectedIcon={formData.icone}
                                                onChange={handleIconChange}
                                            />
                                        </FormControl>
                                    </Flex>
                                </VStack>
                            </TabPanel>

                            {/* Tab 2: Configurações de Produção */}
                            <TabPanel>
                                <VStack spacing={4} align="stretch">
                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel htmlFor="geraComanda" mb="0">
                                            Gera Comanda de Produção
                                        </FormLabel>
                                        <Switch
                                            id="geraComanda"
                                            colorScheme="teal"
                                            isChecked={formData.geraComanda}
                                            onChange={() => handleSwitchChange('geraComanda')}
                                        />
                                        <Text ml={2} fontSize="sm" color={formData.geraComanda ? 'green.500' : 'red.500'}>
                                            {formData.geraComanda ? 'Sim' : 'Não'}
                                        </Text>
                                    </FormControl>

                                    <FormControl isDisabled={!formData.geraComanda}>
                                        <FormLabel>Local de Produção</FormLabel>
                                        <Select
                                            name="localProducaoId"
                                            value={formData.localProducaoId}
                                            onChange={handleChange}
                                            placeholder="Selecione o local de produção"
                                        >
                                            {locaisProducao.map((local: LocalProducao) => (
                                                <option key={local.id} value={local.id}>
                                                    {local.nome}
                                                </option>
                                            ))}
                                        </Select>
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            Local onde os itens desta categoria serão preparados
                                        </Text>
                                    </FormControl>

                                    <FormControl isInvalid={errors.tempoPreparoPadrao}>
                                        <FormLabel>Tempo de Preparo Padrão (minutos)</FormLabel>
                                        <NumberInput
                                            min={0}
                                            value={formData.tempoPreparoPadrao || ''}
                                            onChange={(value) => handleNumberChange('tempoPreparoPadrao', value)}
                                        >
                                            <NumberInputField />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                        <FormErrorMessage>{errors.tempoPreparoPadrao}</FormErrorMessage>
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            Tempo estimado para preparo dos itens desta categoria
                                        </Text>
                                    </FormControl>
                                </VStack>
                            </TabPanel>

                            {/* Tab 3: Configurações Avançadas */}
                            <TabPanel>
                                <VStack spacing={4} align="stretch">
                                    <Text fontSize="sm" color="gray.500" mb={2}>
                                        Configure a visibilidade desta categoria nos diferentes canais de venda.
                                    </Text>

                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel htmlFor="visivelPdv" mb="0">
                                            Visível no PDV
                                        </FormLabel>
                                        <Switch
                                            id="visivelPdv"
                                            colorScheme="teal"
                                            isChecked={formData.visivelPdv}
                                            onChange={() => handleSwitchChange('visivelPdv')}
                                        />
                                    </FormControl>

                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel htmlFor="visivelDelivery" mb="0">
                                            Visível no Delivery
                                        </FormLabel>
                                        <Switch
                                            id="visivelDelivery"
                                            colorScheme="teal"
                                            isChecked={formData.visivelDelivery}
                                            onChange={() => handleSwitchChange('visivelDelivery')}
                                        />
                                    </FormControl>

                                    <Box
                                        mt={4}
                                        p={4}
                                        bg={useColorModeValue('gray.50', 'gray.700')}
                                        borderRadius="md"
                                    >
                                        <Text fontWeight="medium" mb={2}>
                                            Informações Adicionais
                                        </Text>

                                        {categoria && (
                                            <>
                                                <Text fontSize="sm">
                                                    Criado em: {new Date(categoria.criadoEm).toLocaleString()}
                                                </Text>
                                                <Text fontSize="sm">
                                                    Última atualização: {new Date(categoria.atualizadoEm).toLocaleString()}
                                                </Text>
                                            </>
                                        )}
                                    </Box>
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        colorScheme="teal"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        leftIcon={categoria ? <FaCheck /> : <FaPlus />}
                    >
                        {categoria ? 'Salvar Alterações' : 'Criar Categoria'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
