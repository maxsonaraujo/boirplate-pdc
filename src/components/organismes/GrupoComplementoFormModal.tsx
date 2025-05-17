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
  Icon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Box,
  useColorModeValue,
  Select,
  Alert,
  AlertIcon,
  Table,
  Tbody,
  Tr,
  Td,
  Th,
  Thead,
  IconButton,
  Divider,
  Grid,
  GridItem,
  FormHelperText
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { FaCheck, FaInfoCircle, FaPlus, FaTrash, FaGripVertical, FaExclamationCircle } from 'react-icons/fa'
import { formatCurrency } from '@/utils/format'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

interface GrupoComplementoFormModalProps {
  isOpen: boolean
  onClose: () => void
  grupoComplemento: any | null
  onSuccess: () => void
}

export function GrupoComplementoFormModal({
  isOpen,
  onClose,
  grupoComplemento,
  onSuccess
}: GrupoComplementoFormModalProps) {
  const initialFormState = {
    nome: '',
    descricao: '',
    minSelecao: 0,
    maxSelecao: 0,
    status: true,
    complementos: []
  }

  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [relacionamentos, setRelacionamentos] = useState<any>(null)
  const [complementosDisponiveis, setComplementosDisponiveis] = useState<any[]>([])
  const [complementosSelecionados, setComplementosSelecionados] = useState<any[]>([])
  const [novoComplementoId, setNovoComplementoId] = useState('')
  
  const toast = useToast()

  // Carregar complementos disponíveis
  useEffect(() => {
    const fetchComplementos = async () => {
      try {
        const response = await fetch('/api/complementos')
        if (response.ok) {
          const data = await response.json()
          setComplementosDisponiveis(data.complementos)
        }
      } catch (error) {
        console.error('Erro ao buscar complementos:', error)
      }
    }

    if (isOpen) {
      fetchComplementos()
    }
  }, [isOpen])

  // Inicializar formulário quando um grupo for selecionado para edição
  useEffect(() => {
    if (grupoComplemento) {
      setFormData({
        nome: grupoComplemento.nome || '',
        descricao: grupoComplemento.descricao || '',
        minSelecao: grupoComplemento.minSelecao,
        maxSelecao: grupoComplemento.maxSelecao,
        status: grupoComplemento.status !== undefined ? grupoComplemento.status : true,
        complementos: grupoComplemento.complementos?.map(item => item.complementoId) || []
      })
      
      // Preparar complementos selecionados na ordem correta
      if (grupoComplemento.complementos) {
        const complementos = grupoComplemento.complementos
          .sort((a, b) => a.ordem - b.ordem)
          .map(item => ({
            id: item.complementoId,
            nome: item.complemento.nome,
            precoAdicional: item.complemento.precoAdicional
          }))

        setComplementosSelecionados(complementos)
      } else {
        setComplementosSelecionados([])
      }
      
      // Buscar relacionamentos se estiver editando
      if (grupoComplemento.id) {
        fetchRelacionamentos(grupoComplemento.id)
      }
    } else {
      setFormData(initialFormState)
      setComplementosSelecionados([])
      setRelacionamentos(null)
    }

    setErrors({})
    setNovoComplementoId('')
  }, [grupoComplemento, isOpen, complementosDisponiveis])

  // Buscar relacionamentos para mostrar informações adicionais
  const fetchRelacionamentos = async (id: number) => {
    try {
      const response = await fetch(`/api/grupos-complementos/${id}`)
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

  // Manipular mudança em campos numéricos
  const handleNumberChange = (field, value) => {
    const numValue = parseInt(value) || 0
    
    setFormData({
      ...formData,
      [field]: numValue
    })
    
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      })
    }
  }

  // Adicionar complemento à lista
  const handleAddComplemento = () => {
    if (!novoComplementoId) return

    const complementoId = parseInt(novoComplementoId)
    
    // Verificar se já está selecionado
    if (complementosSelecionados.some(c => c.id === complementoId)) {
      toast({
        title: 'Atenção',
        description: 'Este complemento já foi adicionado ao grupo',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    // Buscar informações do complemento
    const complemento = complementosDisponiveis.find(c => c.id === complementoId)
    if (!complemento) return
    
    // Adicionar à lista
    const novaLista = [
      ...complementosSelecionados,
      {
        id: complemento.id,
        nome: complemento.nome,
        precoAdicional: complemento.precoAdicional
      }
    ]
    
    setComplementosSelecionados(novaLista)
    
    // Atualizar IDs no formData
    setFormData({
      ...formData,
      complementos: novaLista.map(c => c.id)
    })
    
    // Limpar campo
    setNovoComplementoId('')
  }

  // Remover complemento da lista
  const handleRemoveComplemento = (id) => {
    const novaLista = complementosSelecionados.filter(c => c.id !== id)
    setComplementosSelecionados(novaLista)
    
    // Atualizar IDs no formData
    setFormData({
      ...formData,
      complementos: novaLista.map(c => c.id)
    })
  }

  // Lidar com reordenação de complementos por drag-and-drop
  const handleDragEnd = (result) => {
    if (!result.destination) return
    
    const items = Array.from(complementosSelecionados)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    setComplementosSelecionados(items)
    
    // Atualizar IDs no formData na nova ordem
    setFormData({
      ...formData,
      complementos: items.map(c => c.id)
    })
  }

  // Validar o formulário
  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (formData.minSelecao < 0) {
      newErrors.minSelecao = 'Seleção mínima não pode ser negativa'
    }

    if (formData.maxSelecao < formData.minSelecao && formData.maxSelecao !== 0) {
      newErrors.maxSelecao = 'Seleção máxima deve ser maior ou igual à mínima'
    }

    if (complementosSelecionados.length === 0) {
      newErrors.complementos = 'Adicione pelo menos um complemento ao grupo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enviar o formulário
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const url = grupoComplemento
        ? `/api/grupos-complementos/${grupoComplemento.id}`
        : '/api/grupos-complementos'

      const method = grupoComplemento ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Ocorreu um erro ao salvar o grupo de complementos')
      }

      toast({
        title: 'Sucesso',
        description: grupoComplemento
          ? 'Grupo de complementos atualizado com sucesso'
          : 'Grupo de complementos criado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      onClose()
      onSuccess && onSuccess()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o grupo de complementos',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {grupoComplemento ? 'Editar Grupo de Complementos' : 'Novo Grupo de Complementos'}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired isInvalid={errors.nome}>
              <FormLabel>Nome do Grupo</FormLabel>
              <Input
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Ponto da Carne, Sabores de Pizza, etc."
              />
              <FormErrorMessage>{errors.nome}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descrição opcional do grupo"
                size="sm"
                resize="vertical"
              />
              <FormHelperText>
                Uma descrição ajuda a entender o propósito deste grupo de complementos
              </FormHelperText>
            </FormControl>

            <Divider />

            <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
              <Text fontWeight="medium" mb={3}>Regras de Seleção</Text>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <FormControl isInvalid={errors.minSelecao}>
                    <FormLabel fontSize="sm">Mínimo de seleções</FormLabel>
                    <NumberInput
                      min={0}
                      value={formData.minSelecao}
                      onChange={(value) => handleNumberChange('minSelecao', value)}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>
                      0 = opcional, 1+ = obrigatório
                    </FormHelperText>
                    <FormErrorMessage>{errors.minSelecao}</FormErrorMessage>
                  </FormControl>
                </GridItem>
                
                <GridItem>
                  <FormControl isInvalid={errors.maxSelecao}>
                    <FormLabel fontSize="sm">Máximo de seleções</FormLabel>
                    <NumberInput
                      min={0}
                      value={formData.maxSelecao}
                      onChange={(value) => handleNumberChange('maxSelecao', value)}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>
                      0 = sem limite, 1+ = limite máximo
                    </FormHelperText>
                    <FormErrorMessage>{errors.maxSelecao}</FormErrorMessage>
                  </FormControl>
                </GridItem>
              </Grid>
              
              <Box mt={3} fontSize="sm">
                <Alert status={
                  formData.minSelecao === 0 && formData.maxSelecao === 0 ? 'warning' :
                  formData.maxSelecao > 0 && formData.minSelecao > formData.maxSelecao ? 'error' :
                  'info'
                } size="sm">
                  <AlertIcon />
                  {formData.minSelecao === 0 && formData.maxSelecao === 0 && 
                    'Sem regras definidas. O cliente poderá selecionar qualquer quantidade de opções.'
                  }
                  {formData.minSelecao > 0 && formData.maxSelecao === 0 && 
                    `O cliente deverá selecionar pelo menos ${formData.minSelecao} opção(ões), sem limite máximo.`
                  }
                  {formData.minSelecao === 0 && formData.maxSelecao > 0 && 
                    `O cliente poderá selecionar até ${formData.maxSelecao} opção(ões) ou nenhuma.`
                  }
                  {formData.minSelecao > 0 && formData.maxSelecao > 0 && formData.minSelecao === formData.maxSelecao && 
                    `O cliente deverá selecionar exatamente ${formData.minSelecao} opção(ões).`
                  }
                  {formData.minSelecao > 0 && formData.maxSelecao > 0 && formData.minSelecao < formData.maxSelecao && 
                    `O cliente deverá selecionar entre ${formData.minSelecao} e ${formData.maxSelecao} opção(ões).`
                  }
                  {formData.maxSelecao > 0 && formData.minSelecao > formData.maxSelecao && 
                    'Configuração inválida: o mínimo não pode ser maior que o máximo.'
                  }
                </Alert>
              </Box>
            </Box>

            <Divider />

            <Box>
              <HStack justify="space-between" mb={3}>
                <Text fontWeight="medium">Complementos do Grupo</Text>
                
                <FormControl display="flex" alignItems="center" w="auto">
                  <FormLabel htmlFor="status" mb="0" fontSize="sm">
                    Status:
                  </FormLabel>
                  <Switch
                    id="status"
                    colorScheme="teal"
                    isChecked={formData.status}
                    onChange={() => handleSwitchChange('status')}
                    ml={2}
                  />
                  <Text ml={2} fontSize="sm">
                    {formData.status ? 'Ativo' : 'Inativo'}
                  </Text>
                </FormControl>
              </HStack>
              
              <HStack mb={4}>
                <Select
                  placeholder="Selecionar complemento para adicionar"
                  value={novoComplementoId}
                  onChange={(e) => setNovoComplementoId(e.target.value)}
                >
                  {complementosDisponiveis
                    .filter(comp => !complementosSelecionados.some(c => c.id === comp.id))
                    .map(comp => (
                      <option key={comp.id} value={comp.id}>
                        {comp.nome} (+{formatCurrency(comp.precoAdicional)})
                      </option>
                    ))
                  }
                </Select>
                <Button 
                  colorScheme="teal" 
                  onClick={handleAddComplemento}
                  isDisabled={!novoComplementoId}
                >
                  <FaPlus />
                </Button>
              </HStack>
              
              {errors.complementos && (
                <Alert status="error" mb={3}>
                  <AlertIcon />
                  {errors.complementos}
                </Alert>
              )}
              
              {complementosSelecionados.length > 0 ? (
                <Box borderWidth={1} borderRadius="md">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="complementos">
                      {(provided) => (
                        <Box
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          <Table variant="simple" size="sm">
                            <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                              <Tr>
                                <Th width="30px"></Th>
                                <Th>Nome</Th>
                                <Th isNumeric>Preço</Th>
                                <Th width="40px"></Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {complementosSelecionados.map((comp, index) => (
                                <Draggable 
                                  key={`${comp.id}`} 
                                  draggableId={`${comp.id}`} 
                                  index={index}
                                >
                                  {(provided) => (
                                    <Tr 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                    >
                                      <Td {...provided.dragHandleProps}>
                                        <Icon as={FaGripVertical} color="gray.400" />
                                      </Td>
                                      <Td>{comp.nome}</Td>
                                      <Td isNumeric>
                                        <Text color="green.600">
                                          +{formatCurrency(comp.precoAdicional)}
                                        </Text>
                                      </Td>
                                      <Td>
                                        <IconButton
                                          icon={<FaTrash />}
                                          aria-label="Remover complemento"
                                          size="xs"
                                          variant="ghost"
                                          colorScheme="red"
                                          onClick={() => handleRemoveComplemento(comp.id)}
                                        />
                                      </Td>
                                    </Tr>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </Tbody>
                          </Table>
                        </Box>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Box>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  <Text>Nenhum complemento adicionado ainda</Text>
                </Alert>
              )}
            </Box>
            
            {grupoComplemento && relacionamentos && relacionamentos.totalProdutos > 0 && (
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
                  Este grupo está associado a {relacionamentos.totalProdutos} produto(s).
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
            {grupoComplemento ? 'Salvar' : 'Criar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
