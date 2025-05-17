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
  InputLeftElement,
  Badge,
  Tooltip,
  Icon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Box,
  useColorModeValue
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { FaCheck, FaInfoCircle, FaMoneyBillWave } from 'react-icons/fa'
import { formatCurrency } from '@/utils/format'

interface ComplementoFormModalProps {
  isOpen: boolean
  onClose: () => void
  complemento: any | null
  onSuccess: () => void
}

export function ComplementoFormModal({
  isOpen,
  onClose,
  complemento,
  onSuccess
}: ComplementoFormModalProps) {
  const initialFormState = {
    nome: '',
    descricao: '',
    precoAdicional: 0,
    status: true
  }

  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [relacionamentos, setRelacionamentos] = useState<any>(null)
  
  const toast = useToast()

  // Inicializar formulário quando um complemento for selecionado para edição
  useEffect(() => {
    if (complemento) {
      setFormData({
        nome: complemento.nome || '',
        descricao: complemento.descricao || '',
        precoAdicional: complemento.precoAdicional || 0,
        status: complemento.status !== undefined ? complemento.status : true
      })
      
      // Buscar relacionamentos se estiver editando
      if (complemento.id) {
        fetchRelacionamentos(complemento.id)
      }
    } else {
      setFormData(initialFormState)
      setRelacionamentos(null)
    }

    setErrors({})
  }, [complemento, isOpen])

  // Buscar relacionamentos para mostrar informações adicionais
  const fetchRelacionamentos = async (id: number) => {
    try {
      const response = await fetch(`/api/complementos/${id}`)
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

  // Manipular mudança no campo de preço
  const handlePriceChange = (value) => {
    setFormData({
      ...formData,
      precoAdicional: parseFloat(value) || 0
    })
    
    if (errors.precoAdicional) {
      setErrors({
        ...errors,
        precoAdicional: null
      })
    }
  }

  // Validar o formulário
  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (formData.precoAdicional < 0) {
      newErrors.precoAdicional = 'Preço adicional não pode ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enviar o formulário
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const url = complemento
        ? `/api/complementos/${complemento.id}`
        : '/api/complementos'

      const method = complemento ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Ocorreu um erro ao salvar o complemento')
      }

      toast({
        title: 'Sucesso',
        description: complemento
          ? 'Complemento atualizado com sucesso'
          : 'Complemento criado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      onClose()
      onSuccess && onSuccess()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o complemento',
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
          {complemento ? 'Editar Complemento' : 'Novo Complemento'}
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
                placeholder="Nome do complemento"
              />
              <FormErrorMessage>{errors.nome}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={errors.precoAdicional}>
              <FormLabel>Preço Adicional</FormLabel>
              <InputGroup>
                <InputLeftElement
                  pointerEvents="none"
                  color="gray.500"
                >
                  R$
                </InputLeftElement>
                <NumberInput
                  min={0}
                  precision={2}
                  step={0.5}
                  value={formData.precoAdicional}
                  onChange={handlePriceChange}
                  w="full"
                >
                  <NumberInputField pl={10} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </InputGroup>
              <FormErrorMessage>{errors.precoAdicional}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descrição opcional do complemento"
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
                {formData.status ? 'Ativo' : 'Inativo'}
              </Text>
            </FormControl>

            {complemento && relacionamentos && relacionamentos.totalProdutos > 0 && (
              <Box 
                p={3} 
                bg={useColorModeValue('blue.50', 'blue.900')} 
                borderRadius="md"
              >
                <HStack>
                  <Icon as={FaInfoCircle} color="blue.500" />
                  <Text fontWeight="medium">Informações adicionais</Text>
                </HStack>
                <Text fontSize="sm" mt={1}>
                  Este complemento está associado a {relacionamentos.totalProdutos} produto(s).
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
            leftIcon={<FaCheck />}
          >
            {complemento ? 'Salvar' : 'Criar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
