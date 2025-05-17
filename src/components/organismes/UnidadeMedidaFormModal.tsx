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
  FormErrorMessage,
  Switch,
  VStack,
  HStack,
  Text,
  Textarea,
  useToast,
  InputGroup,
  InputRightElement,
  Badge,
  Tooltip,
  Icon
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { FaCheck, FaInfoCircle } from 'react-icons/fa'

interface UnidadeMedidaFormModalProps {
  isOpen: boolean
  onClose: () => void
  unidadeMedida: any | null
  onSuccess: () => void
}

export function UnidadeMedidaFormModal({
  isOpen,
  onClose,
  unidadeMedida,
  onSuccess
}: UnidadeMedidaFormModalProps) {
  const initialFormState = {
    nome: '',
    simbolo: '',
    descricao: '',
    status: true
  }

  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [relacionamentos, setRelacionamentos] = useState<any>(null)
  
  const toast = useToast()

  // Inicializar formulário quando uma unidade de medida for selecionada para edição
  useEffect(() => {
    if (unidadeMedida) {
      setFormData({
        nome: unidadeMedida.nome || '',
        simbolo: unidadeMedida.simbolo || '',
        descricao: unidadeMedida.descricao || '',
        status: unidadeMedida.status !== undefined ? unidadeMedida.status : true
      })
      
      // Buscar relacionamentos se estiver editando
      if (unidadeMedida.id) {
        fetchRelacionamentos(unidadeMedida.id)
      }
    } else {
      setFormData(initialFormState)
      setRelacionamentos(null)
    }

    setErrors({})
  }, [unidadeMedida, isOpen])

  // Buscar relacionamentos para mostrar informações adicionais
  const fetchRelacionamentos = async (id: number) => {
    try {
      const response = await fetch(`/api/unidades-medida/${id}`)
      if (response.ok) {
        const data = await response.json()
        setRelacionamentos(data.relacionamentos)
      }
    } catch (error) {
      console.error('Erro ao buscar relacionamentos:', error)
    }
  }

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

    if (!formData.simbolo.trim()) {
      newErrors.simbolo = 'Símbolo é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enviar o formulário
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const url = unidadeMedida
        ? `/api/unidades-medida/${unidadeMedida.id}`
        : '/api/unidades-medida'

      const method = unidadeMedida ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Ocorreu um erro ao salvar a unidade de medida')
      }

      toast({
        title: 'Sucesso',
        description: unidadeMedida
          ? 'Unidade de medida atualizada com sucesso'
          : 'Unidade de medida criada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      onClose()
      onSuccess && onSuccess()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar a unidade de medida',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {unidadeMedida ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired isInvalid={errors.nome}>
              <FormLabel>Nome</FormLabel>
              <Input
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Nome da unidade de medida"
              />
              <FormErrorMessage>{errors.nome}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={errors.simbolo}>
              <FormLabel>Símbolo</FormLabel>
              <InputGroup>
                <Input
                  name="simbolo"
                  value={formData.simbolo}
                  onChange={handleChange}
                  placeholder="Ex: kg, L, cm, un"
                  maxLength={10}
                />
                <InputRightElement width="4.5rem">
                  <Badge colorScheme="blue">{formData.simbolo}</Badge>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.simbolo}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descrição opcional da unidade de medida"
                size="sm"
                resize="vertical"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="status" mb="0">
                Status
              </FormLabel>
              <Switch
                id="status"
                colorScheme="teal"
                isChecked={formData.status}
                onChange={() => handleSwitchChange('status')}
                ml={2}
              />
              <Text ml={2}>
                {formData.status ? 'Ativa' : 'Inativa'}
              </Text>
            </FormControl>

            {unidadeMedida && relacionamentos && (
              <VStack align="start" spacing={2} mt={2} p={3} bg="gray.50" borderRadius="md">
                <HStack>
                  <Icon as={FaInfoCircle} color="blue.500" />
                  <Text fontWeight="medium">Informações adicionais</Text>
                </HStack>
                <Text fontSize="sm">
                  Esta unidade é usada por:
                </Text>
                <HStack spacing={2}>
                  <Tooltip label="Produtos que usam esta unidade como principal">
                    <Badge>{relacionamentos.totalProdutos || 0} produtos</Badge>
                  </Tooltip>
                  <Tooltip label="Produtos que usam esta unidade para estoque">
                    <Badge>{relacionamentos.totalProdutosEstoque || 0} estoques</Badge>
                  </Tooltip>
                  <Tooltip label="Ingredientes em fichas técnicas">
                    <Badge>{relacionamentos.totalIngredientes || 0} ingredientes</Badge>
                  </Tooltip>
                </HStack>
              </VStack>
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
            leftIcon={<FaCheck />}
          >
            {unidadeMedida ? 'Salvar' : 'Criar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
