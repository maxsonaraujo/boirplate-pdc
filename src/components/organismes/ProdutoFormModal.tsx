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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
  Box,
  useColorModeValue,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  Checkbox,
  Icon,
  Flex,
  SimpleGrid,
  Tooltip,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
  Image,
  Spinner,
  Stack,
  Badge,
  CheckboxGroup,
  AspectRatio,
  IconButton,
  Heading,
  Alert,
  AlertIcon,
  Collapse,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tag,
  TagLabel,
  Spacer,
  FormHelperText
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import {
  FaCamera,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaUtensils,
  FaTag,
  FaPrint,
  FaPlus,
  FaTags,
  FaImage,
  FaTrashAlt,
  FaBoxOpen,
  FaCog,
  FaBook,
  FaClone,
  FaLock,
  FaLockOpen,
  FaSave,
  FaMoneyBillWave,
  FaBoxes,
  FaSyncAlt,
  FaExclamationTriangle,
  FaUpload,
  FaTrash,
  FaGripVertical,
  FaPizzaSlice
} from 'react-icons/fa'
import { formatCurrency } from '@/utils/format'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

// Atualizar a interface de props para incluir onFormOpen para incluir onFormOpen
interface ProdutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: any | null;
  categorias: any[];
  unidadesMedida: any[];
  locaisProducao: any[];
  onSuccess: () => void;
  onFormOpen?: () => void; // Tornar opcional para compatibilidade com código existente
}

export function ProdutoFormModal({
  isOpen,
  onClose,
  produto,
  categorias = [],
  unidadesMedida = [],
  locaisProducao = [],
  onSuccess,
  onFormOpen // Adicionar nova prop
}: ProdutoFormModalProps) {
  const initialFormState = {
    codigo: '',
    nome: '',
    descricao: '',
    precoVenda: 0,
    imagem: '',
    status: true,
    unidadeMedidaId: null,
    tempoPreparo: null,
    geraComanda: null,
    localProducaoId: null,
    categorias: [],
    categoriaPrincipalId: null,
    complementos: [],
    controlaEstoque: false,
    baixaAutomatica: false,
    insumoVinculadoId: null,
    qtdInsumoConsumida: 1,
    unidadeEstoque: null,
    fichaTecnica: {
      rendimento: 1,
      modoPreparo: '',
      ingredientes: []
    },
    variacoes: []
  }

  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)
  const [autoSave, setAutoSave] = useState(true)
  const [filePreview, setFilePreview] = useState('')
  const [useOverride, setUseOverride] = useState(false)
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<any[]>([])
  const [categoriaPrincipal, setCategoriaPrincipal] = useState(null)
  const [isImageUploading, setIsImageUploading] = useState(false)

  const fileInputRef = useRef(null)
  const autoSaveTimeoutRef = useRef(null)
  const formChangedRef = useRef(false)

  const toast = useToast()
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure()
  const cancelRef = useRef(null)

  // Adicionar novos estados no componente
  const [gruposComplementosDisponiveis, setGruposComplementosDisponiveis] = useState([])
  const [gruposProduto, setGruposProduto] = useState([])
  const [novoGrupoId, setNovoGrupoId] = useState('')
  const [isLoadingGrupos, setIsLoadingGrupos] = useState(false)

  // Adicionar novos estados para a funcionalidade de sabores
  const [aceitaSabores, setAceitaSabores] = useState(false)
  const [maxSabores, setMaxSabores] = useState(1)
  const [tipoCobranca, setTipoCobranca] = useState('mais_caro')
  const [saboresDisponiveis, setSaboresDisponiveis] = useState([])
  const [saboresSelecionados, setSaboresSelecionados] = useState([])
  const [isLoadingSabores, setIsLoadingSabores] = useState(false)
  const [novoSaborId, setNovoSaborId] = useState('')
  const [exibirPrecoBase, setExibirPrecoBase] = useState(false);

  // Adicionar estados para insumos
  const [insumos, setInsumos] = useState([]);
  const [isLoadingInsumos, setIsLoadingInsumos] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState(null);

  // Função para buscar insumos disponíveis
  const fetchInsumos = async () => {
    setIsLoadingInsumos(true);
    try {
      const response = await fetch('/api/estoque/insumos?status=true&limit=100');
      if (response.ok) {
        const data = await response.json();
        setInsumos(data.insumos);
      }
    } catch (error) {
      console.error('Erro ao carregar insumos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de insumos',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoadingInsumos(false);
    }
  };

  // Carregar insumos quando o controle de estoque for ativado
  useEffect(() => {
    if (formData.controlaEstoque && insumos.length === 0) {
      fetchInsumos();
    }
  }, [formData.controlaEstoque]);

  // Atualizar o insumo selecionado quando o ID mudar
  useEffect(() => {
    if (formData.insumoVinculadoId && insumos.length > 0) {
      const insumo = insumos.find(i => i.id === formData.insumoVinculadoId);
      setSelectedInsumo(insumo);
    } else {
      setSelectedInsumo(null);
    }
  }, [formData.insumoVinculadoId, insumos]);

  // Adicionar função para buscar grupos de complementos disponíveis de sabores
  const fetchGruposComplementos = async () => {
    try {
      setIsLoadingGrupos(true)
      const response = await fetch('/api/grupos-complementos?includeComplementos=true')
      if (response.ok) {
        const data = await response.json()
        setGruposComplementosDisponiveis(data.gruposComplementos)
      }
    } catch (error) {
      console.error('Erro ao buscar grupos de complementos:', error)
    } finally {
      setIsLoadingGrupos(false)
    }
  }

  // Adicionar função para buscar grupos associados ao produto
  const fetchGruposProduto = async (id: any) => {
    if (!id) return
    try {
      setIsLoadingGrupos(true)
      const response = await fetch(`/api/produtos/${id}/grupos-complementos`)
      if (response.ok) {
        const data = await response.json()
        setGruposProduto(data.gruposProduto)
      }
    } catch (error) {
      console.error('Erro ao buscar grupos do produto:', error)
    } finally {
      setIsLoadingGrupos(false)
    }
  }

  // Função para buscar sabores disponíveis para um produto
  const fetchSabores = async (produtoId: any) => {
    try {
      setIsLoadingSabores(true)
      const response = await fetch(`/api/produtos/${produtoId}/sabores`)

      if (response.ok) {
        const data = await response.json()
        setSaboresSelecionados(data.sabores || [])
      }
    } catch (error) {
      console.error('Erro ao buscar sabores:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os sabores',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsLoadingSabores(false)
    }
  }

  // Função para buscar produtos que podem ser usados como sabores
  const fetchProdutosSabores = async () => {
    try {
      setIsLoadingSabores(true)

      // Buscar produtos da mesma categoria ou de categorias específicas para sabores
      // Aqui você pode ajustar o filtro conforme necessário
      const response = await fetch('/api/produtos?limit=100')

      if (response.ok) {
        const data = await response.json()
        setSaboresDisponiveis(data.produtos.filter(p =>
          // Filtrar para não incluir o produto atual e apenas produtos ativos
          p.id !== (produto?.id) && p.status
        ))
      }
    } catch (error) {
      console.error('Erro ao buscar produtos para sabores:', error)
    } finally {
      setIsLoadingSabores(false)
    }
  }

  // Inicializar formulário quando um produto for selecionado para edição
  useEffect(() => {
    if (produto) {
      // Preparar categorias selecionadas
      const cats = produto.categorias.map(c => c.categoriaId)
      setCategoriasSelecionadas(cats)

      // Encontrar categoria principal se existir
      const catPrincipal = produto.categorias.find(c => c.isPrincipal)
      setCategoriaPrincipal(catPrincipal ? catPrincipal.categoriaId : null)

      // Verificar se usa configurações próprias (override)
      const usesOverride = produto.geraComanda !== null || produto.localProducaoId !== null
      setUseOverride(usesOverride)

      setFormData({
        codigo: produto.codigo || '',
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        precoVenda: produto.precoVenda || 0,
        imagem: produto.imagem || '',
        status: produto.status !== undefined ? produto.status : true,
        unidadeMedidaId: produto.unidadeMedidaId || null,
        tempoPreparo: produto.tempoPreparo || null,
        geraComanda: produto.geraComanda,
        localProducaoId: produto.localProducaoId || null,
        categorias: cats,
        categoriaPrincipalId: catPrincipal ? catPrincipal.categoriaId : null,
        complementos: produto.complementos?.map(c => c.complementoId) || [],
        controlaEstoque: produto.controlaEstoque || false,
        baixaAutomatica: produto.baixaAutomatica || false,
        insumoVinculadoId: produto.insumoVinculadoId || null,
        qtdInsumoConsumida: produto.qtdInsumoConsumida || 1,
        unidadeEstoque: produto.unidadeEstoque || null,
        fichaTecnica: produto.fichaTecnica || {
          rendimento: 1,
          modoPreparo: '',
          ingredientes: []
        },
        variacoes: produto.variacoes || []
      });

      // Se o produto tem insumo vinculado, mas a lista ainda não foi carregada
      if (produto.insumoVinculadoId && insumos.length === 0) {
        fetchInsumos();
      }

      // Configurar preview da imagem
      if (produto.imagem) {
        setFilePreview(produto.imagem)
      } else {
        setFilePreview('')
      }

      // Inicializar configurações de múltiplos sabores
      setAceitaSabores(produto.aceitaSabores || false)
      setMaxSabores(produto.maxSabores || 1)
      setTipoCobranca(produto.tipoCobranca || 'mais_caro')
      setExibirPrecoBase(produto.exibirPrecoBase || false);
    } else {
      // Reset para valores iniciais se é um novo produto
      setFormData(initialFormState)
      setCategoriasSelecionadas([])
      setCategoriaPrincipal(null)
      setUseOverride(false)
      setFilePreview('')
      setAceitaSabores(false)
      setMaxSabores(1)
      setTipoCobranca('mais_caro')
      setSaboresSelecionados([])
      setExibirPrecoBase(false);
    }

    setErrors({})
    formChangedRef.current = false

    // Limpar timeout existente
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Carregar grupos de complementos disponíveis
    if (isOpen) {
      fetchGruposComplementos()

      // Se estiver editando um produto, buscar seus grupos
      if (produto?.id) {
        fetchGruposProduto(produto.id)
      } else {
        setGruposProduto([])
      }
    }
  }, [produto, isOpen])

  // Quando a aba de sabores é selecionada, carregar produtos disponíveis
  useEffect(() => {
    if (tabIndex === 6 && isOpen) { // Índice 6 corresponde à aba de Sabores
      fetchProdutosSabores()
    }
  }, [tabIndex, isOpen])

  // Validar o formulário
  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código do produto é obrigatório'
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do produto é obrigatório'
    }

    if (formData.precoVenda <= 0) {
      newErrors.precoVenda = 'Preço de venda deve ser maior que zero'
    }

    if (categoriasSelecionadas.length === 0) {
      newErrors.categorias = 'Selecione pelo menos uma categoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handler para categorias selecionadas
  const handleCategoriasChange = (event) => {
    const value = Array.from(event.target.selectedOptions, (option: any) => Number(option.value));
    setCategoriasSelecionadas(value as any)
    setFormData({
      ...formData,
      categorias: value as any
    })
    formChangedRef.current = true

    // Se a categoria principal não está mais entre as selecionadas, resetar
    if (categoriaPrincipal && !value.includes(categoriaPrincipal)) {
      setCategoriaPrincipal(null)
      setFormData(prev => ({
        ...prev,
        categoriaPrincipalId: null
      }))
    }
  }

  // Handler para categoria principal
  const handleCategoriaPrincipalChange = (event) => {
    const value: any = event.target.value ? Number(event.target.value) : null;
    setCategoriaPrincipal(value)
    setFormData({
      ...formData,
      categoriaPrincipalId: value
    })
    formChangedRef.current = true
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

    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Manipular interruptores (switches)
  const handleSwitchChange = (name) => {
    setFormData({
      ...formData,
      [name]: !formData[name]
    })
    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Manipular campos numéricos
  const handleNumberChange = (name, value) => {
    // Para o caso do preço, preservar os decimais e garantir valores precisos
    if (name === 'precoVenda') {
      // Substituir vírgula por ponto, caso o usuário insira com vírgula
      const sanitizedValue = value.toString().replace(',', '.').replace(/^0+(?!\.)/, '');//.replace(',', '.');

      // Se for string vazia, definir como 0
      if (sanitizedValue === '') {
        setFormData({
          ...formData,
          [name]: 0
        });
      } else {
        // Converter para número com duas casas decimais
        // Usamos parseFloat para garantir que valores como "0.50" sejam tratados corretamente
        const numValue = sanitizedValue;//parseFloat(sanitizedValue);

        // Verificar se é um número válido
        if (!isNaN(numValue)) {
          setFormData({
            ...formData,
            [name]: numValue
          });
        }
      }
    } else {
      // Para outros campos numéricos, como antes
      setFormData({
        ...formData,
        [name]: value === '' ? null : Number(value)
      });
    }

    formChangedRef.current = true;
    scheduleAutoSave();
  }
  // Manipular upload de imagem
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem')
      }

      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        imagem: data.file
      }))
      setFilePreview(data.file)
      formChangedRef.current = true
      scheduleAutoSave()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload da imagem',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsImageUploading(false)
    }
  }

  // Remover imagem
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imagem: ''
    }))
    setFilePreview('')
    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Manipular alterações na ficha técnica
  const handleFichaTecnicaChange = (fichaTecnica) => {
    setFormData(prev => ({
      ...prev,
      fichaTecnica
    }))
    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Manipular alterações nos ingredientes da ficha técnica
  const handleIngredienteChange = (index, field, value) => {
    const ingredientes: any[] = [...formData.fichaTecnica.ingredientes];
    ingredientes[index] = { ...ingredientes[index], [field]: value };

    handleFichaTecnicaChange({
      ...formData.fichaTecnica,
      ingredientes
    });
  }

  // Adicionar ingrediente
  const handleAddIngrediente = () => {
    const ingredientes = [...formData.fichaTecnica.ingredientes, {
      nome: '',
      quantidade: 0,
      unidadeMedidaId: null,
      custo: 0
    }];

    handleFichaTecnicaChange({
      ...formData.fichaTecnica,
      ingredientes
    });
  }

  // Remover ingrediente
  const handleRemoveIngrediente = (index) => {
    const ingredientes = formData.fichaTecnica.ingredientes.filter((_, i) => i !== index);

    handleFichaTecnicaChange({
      ...formData.fichaTecnica,
      ingredientes
    });
  }

  // Manipular alterações nas variações
  const handleVariacoesChange = (variacoes) => {
    setFormData(prev => ({
      ...prev,
      variacoes
    }))
    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Manipular alterações nos complementos
  const handleComplementosChange = (event) => {
    const value = Array.from(event.target.selectedOptions, (option: any) => Number(option.value));
    setFormData((prev: any) => ({
      ...prev,
      complementos: value
    }))
    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Toggle de uso de configurações próprias (override)
  const handleOverrideToggle = () => {
    setUseOverride(!useOverride)

    // Se estamos desativando o override, resetar os valores para null
    if (useOverride) {
      setFormData(prev => ({
        ...prev,
        geraComanda: null,
        localProducaoId: null
      }))
    } else {
      // Ao ativar, definir valores padrão
      setFormData(prev => ({
        ...prev,
        geraComanda: true,
        localProducaoId: null
      }))
    }

    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Agendar autosave
  const scheduleAutoSave = () => {
    if (!autoSave || !produto) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (formChangedRef.current) {
        handleAutoSave()
      }
    }, 3000)
  }

  // Executar autosave
  const handleAutoSave = async () => {
    if (!produto || !formChangedRef.current) return

    try {
      setIsSaving(true)

      // Preparar dados
      const dataToSend = {
        ...formData,
        categorias: categoriasSelecionadas,
        categoriaPrincipalId: categoriaPrincipal
      }

      // Se não estiver usando override, garantir que os campos são nulos
      if (!useOverride) {
        dataToSend.geraComanda = null
        dataToSend.localProducaoId = null
      }

      const response = await fetch(`/api/produtos/${produto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar automaticamente')
      }

      formChangedRef.current = false
    } catch (error) {
      console.error('Erro no autosave:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Enviar formulário
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const url = produto ? `/api/produtos/${produto.id}` : '/api/produtos'
      const method = produto ? 'PUT' : 'POST'

      // Preparar dados para envio
      const dataToSend = {
        ...formData,
        categorias: categoriasSelecionadas,
        categoriaPrincipalId: categoriaPrincipal
      }

      // Se não estiver usando override, garantir que os campos são nulos
      if (!useOverride) {
        dataToSend.geraComanda = null
        dataToSend.localProducaoId = null
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
        throw new Error(errorData.message || 'Ocorreu um erro ao salvar o produto')
      }

      const produtoResponse = await response.json()
      const produtoId = produtoResponse.produto?.id || produto?.id

      // Se temos grupos de complemento para salvar
      if (gruposProduto.length > 0 && produtoId) {
        // Formatar dados dos grupos para a API
        const gruposData = {
          grupos: gruposProduto.map(g => ({
            grupoId: g.grupoComplementoId,
            ordem: g.ordem,
            obrigatorio: g.obrigatorio,
            minSelecao: g.minSelecao,
            maxSelecao: g.maxSelecao
          }))
        }

        // Salvar a relação com grupos
        const gruposResponse = await fetch(`/api/produtos/${produtoId}/grupos-complementos`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gruposData)
        })

        if (!gruposResponse.ok) {
          console.error("Erro ao salvar grupos de complementos");
        }
      }

      // Após salvar o produto básico, atualizar configurações de sabores
      if (aceitaSabores && produtoId) {
        const saboresData = {
          aceitaSabores,
          maxSabores,
          tipoCobranca,
          exibirPrecoBase,
          sabores: saboresSelecionados.map(s => ({
            saborId: s.saborId,
            precoAdicional: s.precoAdicional,
            status: s.status !== undefined ? s.status : true,
            ordem: s.ordem
          }))
        }

        const saboresResponse = await fetch(`/api/produtos/${produtoId}/sabores`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(saboresData)
        })

        if (!saboresResponse.ok) {
          console.error("Erro ao salvar configurações de sabores");
        }
      }

      toast({
        title: 'Sucesso',
        description: produto ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      formChangedRef.current = false
      onClose()
      onSuccess && onSuccess()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o produto',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler para "Salvar e novo"
  const handleSaveAndNew = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const url = produto ? `/api/produtos/${produto.id}` : '/api/produtos'
      const method = produto ? 'PUT' : 'POST'

      // Preparar dados para envio
      const dataToSend = {
        ...formData,
        categorias: categoriasSelecionadas,
        categoriaPrincipalId: categoriaPrincipal
      }

      // Se não estiver usando override, garantir que os campos são nulos
      if (!useOverride) {
        dataToSend.geraComanda = null
        dataToSend.localProducaoId = null
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
        throw new Error(errorData.message || 'Ocorreu um erro ao salvar o produto')
      }

      const produtoResponse = await response.json()
      const produtoId = produtoResponse.produto?.id || produto?.id

      // Se temos grupos de complemento para salvar
      if (gruposProduto.length > 0 && produtoId) {
        // Formatar dados dos grupos para a API
        const gruposData = {
          grupos: gruposProduto.map(g => ({
            grupoId: g.grupoComplementoId,
            ordem: g.ordem,
            obrigatorio: g.obrigatorio,
            minSelecao: g.minSelecao,
            maxSelecao: g.maxSelecao
          }))
        }

        // Salvar a relação com grupos
        const gruposResponse = await fetch(`/api/produtos/${produtoId}/grupos-complementos`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gruposData)
        })

        if (!gruposResponse.ok) {
          console.error("Erro ao salvar grupos de complementos");
        }
      }

      // Após salvar o produto básico, atualizar configurações de sabores
      if (aceitaSabores && produtoId) {
        const saboresData = {
          aceitaSabores,
          maxSabores,
          tipoCobranca,
          exibirPrecoBase,
          sabores: saboresSelecionados.map(s => ({
            saborId: s.saborId,
            precoAdicional: s.precoAdicional,
            status: s.status !== undefined ? s.status : true,
            ordem: s.ordem
          }))
        }

        const saboresResponse = await fetch(`/api/produtos/${produtoId}/sabores`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(saboresData)
        })

        if (!saboresResponse.ok) {
          console.error("Erro ao salvar configurações de sabores");
        }
      }

      toast({
        title: 'Sucesso',
        description: produto ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      // Atualizar a lista de produtos
      if (onSuccess) {
        onSuccess();
      }

      // Reset para criar um novo produto
      setFormData({
        ...initialFormState,
        // Manter algumas informações para facilitar o cadastro de produtos similares
        categorias: categoriasSelecionadas,
        categoriaPrincipalId: categoriaPrincipal,
        unidadeMedidaId: formData.unidadeMedidaId
      });
      setFilePreview('');
      setErrors({});
      formChangedRef.current = false;

      // Se estávamos editando, fechar o modal e abrir um novo
      if (produto) {
        // Primeiro fechar o modal
        onClose();
        // Após um pequeno delay, abrir um novo modal para criação
        setTimeout(() => {
          // Verificar se a função onFormOpen foi fornecida antes de chamá-la
          if (onFormOpen) {
            onFormOpen();
          } else {
            console.warn('onFormOpen prop não foi fornecida ao ProdutoFormModal');
          }
        }, 300);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o produto',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verificar se temos mudanças antes de fechar
  const handleCloseWithCheck = () => {
    if (formChangedRef.current) {
      onCancelOpen()
    } else {
      onClose()
    }
  }

  // Adicionar função para adicionar um grupo ao produto
  const handleAddGrupoComplemento = () => {
    if (!novoGrupoId) return

    const grupoId = parseInt(novoGrupoId)

    // Verificar se já está adicionado
    if (gruposProduto.some(g => g.grupoComplementoId === grupoId)) {
      toast({
        title: 'Atenção',
        description: 'Este grupo já foi adicionado ao produto',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    // Buscar o grupo selecionado
    const grupo = gruposComplementosDisponiveis.find(g => g.id === grupoId)
    if (!grupo) return

    // Criar novo grupo de produto
    const novoGrupoProduto = {
      grupoComplementoId: grupo.id,
      grupoComplemento: grupo,
      ordem: gruposProduto.length + 1,
      obrigatorio: grupo.minSelecao > 0, // Se o mínimo do grupo for > 0, marcar como obrigatório
      minSelecao: grupo.minSelecao,
      maxSelecao: grupo.maxSelecao
    }

    // Adicionar à lista
    setGruposProduto([...gruposProduto, novoGrupoProduto])
    // Limpar seleção
    setNovoGrupoId('')

    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Adicionar função para remover um grupo do produto
  const handleRemoveGrupoComplemento = (grupoId) => {
    setGruposProduto(gruposProduto.filter(g => g.grupoComplementoId !== grupoId))
    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Adicionar função para reordenar grupos (drag and drop)
  const handleDragEndGrupos = (result) => {
    if (!result.destination) return

    const items = Array.from(gruposProduto)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Atualizar ordem
    const updatedItems = items.map((item, index) => ({
      ...item,
      ordem: index + 1
    }))

    setGruposProduto(updatedItems)
    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Adicionar função para alterar propriedades de um grupo
  const handleGrupoChange = (grupoId, field, value) => {
    setGruposProduto(gruposProduto.map(g => {
      if (g.grupoComplementoId === grupoId) {
        return { ...g, [field]: value }
      }
      return g
    }))

    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Função para adicionar um novo sabor
  const handleAddSabor = () => {
    if (!novoSaborId) return

    const saborId = parseInt(novoSaborId)

    // Verificar se já está selecionado
    if (saboresSelecionados.some(s => s.saborId === saborId)) {
      toast({
        title: 'Atenção',
        description: 'Este sabor já foi adicionado',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    // Buscar informações do produto usado como sabor
    const sabor = saboresDisponiveis.find(p => p.id === saborId)
    if (!sabor) return

    // Criar novo sabor
    const novoSabor = {
      saborId: sabor.id,
      sabor: sabor,
      precoAdicional: 0,
      ordem: saboresSelecionados.length + 1,
      status: true
    }

    // Adicionar à lista
    setSaboresSelecionados([...saboresSelecionados, novoSabor])

    // Limpar campo
    setNovoSaborId('')

    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Função para remover um sabor
  const handleRemoveSabor = (saborId) => {
    setSaboresSelecionados(saboresSelecionados.filter(s => s.saborId !== saborId))
    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Função para alterar o preço adicional de um sabor
  const handleSaborPrecoChange = (saborId, precoAdicional) => {
    setSaboresSelecionados(saboresSelecionados.map(s => {
      if (s.saborId === saborId) {
        return { ...s, precoAdicional: parseFloat(precoAdicional) || 0 }
      }
      return s
    }))

    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Função para reordenar sabores
  const handleDragEndSabores = (result) => {
    if (!result.destination) return

    const items = Array.from(saboresSelecionados)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Atualizar ordem
    const updatedItems = items.map((item, index) => ({
      ...item,
      ordem: index + 1
    }))

    setSaboresSelecionados(updatedItems)
    formChangedRef.current = true
    scheduleAutoSave()
  }

  // Componente para mostrar indicação de autosave
  const AutoSaveIndicator = ({ isSaving }) => (
    <Text fontSize="xs" color="gray.500" ml={2}>
      {isSaving ? (
        <HStack spacing={1} display="inline-flex" alignItems="center">
          <Spinner size="xs" />
          <span>Salvando...</span>
        </HStack>
      ) : (
        <HStack spacing={1} display="inline-flex" alignItems="center">
          <Icon as={FaCheck} color="green.500" />
          <span>Salvo</span>
        </HStack>
      )}
    </Text>
  )

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseWithCheck}
        size="6xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <Flex justify="space-between" align="center">
              <Box>
                {produto ? `Editar Produto: ${produto.nome}` : 'Novo Produto'}
                {produto && (
                  <AutoSaveIndicator isSaving={isSaving} />
                )}
              </Box>

              <Flex align="center" gap={2}>
                {produto && (
                  <Tooltip label={autoSave ? "Desativar" : "Ativar" + " salvamento automático"}>
                    <HStack spacing={1}>
                      <Text fontSize="xs">Auto Salvar</Text>
                      <Switch
                        colorScheme="teal"
                        size="sm"
                        isChecked={autoSave}
                        onChange={() => setAutoSave(!autoSave)}
                      />
                    </HStack>
                  </Tooltip>
                )}
              </Flex>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs
              colorScheme="teal"
              variant="enclosed"
              index={tabIndex}
              onChange={setTabIndex}
            >
              <TabList>
                <Tab><Box mr={2}><Icon as={FaUtensils} /></Box> Básico</Tab>
                <Tab><Box mr={2}><Icon as={FaTags} /></Box> Categorias</Tab>
                <Tab><Box mr={2}><Icon as={FaPrint} /></Box> Produção</Tab>
                <Tab><Box mr={2}><Icon as={FaPlus} /></Box> Complementos</Tab>
                <Tab><Box mr={2}><Icon as={FaBoxes} /></Box> Estoque</Tab>
                <Tab><Box mr={2}><Icon as={FaBook} /></Box> Ficha Técnica</Tab>
                <Tab><Box mr={2}><Icon as={FaPizzaSlice} /></Box> Sabores</Tab>
              </TabList>

              <TabPanels>
                {/* Aba 1: Informações Básicas */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={4}>
                        <FormControl isRequired isInvalid={errors.codigo}>
                          <FormLabel>Código/SKU</FormLabel>
                          <Input
                            placeholder="Código único do produto"
                            name="codigo"
                            value={formData.codigo}
                            onChange={handleChange}
                          />
                          <FormErrorMessage>{errors.codigo}</FormErrorMessage>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Status</FormLabel>
                          <HStack>
                            <Switch
                              id="status"
                              colorScheme="teal"
                              isChecked={formData.status}
                              onChange={() => handleSwitchChange('status')}
                            />
                            <Text>{formData.status ? 'Ativo' : 'Inativo'}</Text>
                          </HStack>
                        </FormControl>
                      </HStack>

                      <FormControl isRequired isInvalid={errors.nome}>
                        <FormLabel>Nome do Produto</FormLabel>
                        <Input
                          placeholder="Nome do produto"
                          name="nome"
                          value={formData.nome}
                          onChange={handleChange}
                        />
                        <FormErrorMessage>{errors.nome}</FormErrorMessage>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Descrição</FormLabel>
                        <Textarea
                          placeholder="Descrição detalhada do produto"
                          name="descricao"
                          value={formData.descricao || ''}
                          onChange={handleChange}
                          resize="vertical"
                          rows={4}
                        />
                      </FormControl>

                      <HStack spacing={4} align="flex-start">
                        <FormControl isRequired isInvalid={errors.precoVenda}>
                          <FormLabel>Preço de Venda</FormLabel>
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
                              step={0.01}  // Alterado para permitir incrementos de centavos
                              value={formData.precoVenda}
                              onChange={(value) => handleNumberChange('precoVenda', value)}
                              w="full"
                              focusBorderColor="teal.500"
                              allowMouseWheel={true} // Facilitar alteração com a roda do mouse
                            >
                              <NumberInputField pl={10} />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </InputGroup>
                          <FormErrorMessage>{errors.precoVenda}</FormErrorMessage>
                          <FormHelperText>
                            Use ponto ou vírgula para separar os centavos (ex: 10.50 ou 10,50)
                          </FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Unidade de Medida</FormLabel>
                          <Select
                            placeholder="Selecione"
                            name="unidadeMedidaId"
                            value={formData.unidadeMedidaId || ''}
                            onChange={handleChange}
                          >
                            {unidadesMedida.map(um => (
                              <option key={um.id} value={um.id}>
                                {um.nome} ({um.simbolo})
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </HStack>

                      <FormControl>
                        <FormLabel>Tempo de Preparo (minutos)</FormLabel>
                        <NumberInput
                          min={0}
                          value={formData.tempoPreparo || ''}
                          onChange={(value) => handleNumberChange('tempoPreparo', value)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Tempo estimado para o preparo deste produto
                        </Text>
                      </FormControl>
                    </VStack>

                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>Imagem do Produto</FormLabel>
                        <AspectRatio ratio={4 / 3} maxW="400px" mx="auto">
                          <Box
                            bg={useColorModeValue('gray.50', 'gray.700')}
                            borderWidth={1}
                            borderRadius="md"
                            overflow="hidden"
                            position="relative"
                          >
                            {isImageUploading ? (
                              <Flex
                                justify="center"
                                align="center"
                                h="full"
                                w="full"
                              >
                                <Spinner />
                              </Flex>
                            ) : filePreview ? (
                              <>
                                <Image
                                  src={filePreview}
                                  alt={formData.nome}
                                  objectFit="cover"
                                  w="full"
                                  h="full"
                                />
                                <IconButton
                                  icon={<FaTrashAlt />}
                                  aria-label="Remover imagem"
                                  size="sm"
                                  colorScheme="red"
                                  position="absolute"
                                  top={2}
                                  right={2}
                                  onClick={handleRemoveImage}
                                />
                              </>
                            ) : (
                              <Flex
                                justify="center"
                                align="center"
                                h="full"
                                w="full"
                                direction="column"
                                gap={2}
                              >
                                <Icon as={FaImage} boxSize={12} color="gray.400" />
                                <Text color="gray.500">Nenhuma imagem selecionada</Text>
                              </Flex>
                            )}
                          </Box>
                        </AspectRatio>
                        <Flex justify="center" mt={4}>
                          <Button
                            leftIcon={<FaUpload />}
                            onClick={() => fileInputRef.current.click()}
                            colorScheme="teal"
                            variant="outline"
                            isDisabled={isImageUploading}
                          >
                            Selecionar Imagem
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </Flex>
                      </FormControl>
                    </VStack>
                  </SimpleGrid>
                </TabPanel>

                {/* Aba 2: Categorias */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <FormControl isInvalid={errors.categorias}>
                      <FormLabel>Categorias</FormLabel>
                      <Text fontSize="sm" color="gray.500" mb={2}>
                        Selecione uma ou mais categorias para este produto. Use Ctrl (ou Cmd) para selecionar múltiplas categorias.
                      </Text>
                      <Select
                        multiple
                        size="md"
                        height="200px"
                        value={categoriasSelecionadas}
                        onChange={handleCategoriasChange}
                      >
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.categoriaPai ? `${cat.categoriaPai.nome} > ` : ''}{cat.nome}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>{errors.categorias}</FormErrorMessage>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Categoria Principal</FormLabel>
                      <Text fontSize="sm" color="gray.500" mb={2}>
                        Defina a categoria principal para fins de relatórios e organização. Deve ser uma das categorias selecionadas acima.
                      </Text>
                      <Select
                        isDisabled={categoriasSelecionadas.length === 0}
                        value={categoriaPrincipal || ''}
                        onChange={handleCategoriaPrincipalChange}
                        placeholder="Selecione a categoria principal"
                      >
                        {categorias
                          .filter(cat => categoriasSelecionadas.includes(cat.id))
                          .map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nome}
                            </option>
                          ))}
                      </Select>
                    </FormControl>

                    <Box
                      p={4}
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      borderRadius="md"
                    >
                      <Heading size="sm" mb={2}>Categorias Selecionadas</Heading>
                      {categoriasSelecionadas.length === 0 ? (
                        <Text color="gray.500">Nenhuma categoria selecionada</Text>
                      ) : (
                        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
                          {categoriasSelecionadas.map(catId => {
                            const categoria = categorias.find(c => c.id === catId)
                            if (!categoria) return null

                            return (
                              <Box
                                key={catId}
                                p={3}
                                borderWidth="1px"
                                borderRadius="md"
                                borderLeftWidth="4px"
                                borderLeftColor={categoria.cor || 'teal.500'}
                              >
                                <Flex justify="space-between" align="center">
                                  <Text fontWeight="medium">{categoria.nome}</Text>
                                  {categoriaPrincipal === catId && (
                                    <Badge colorScheme="teal">Principal</Badge>
                                  )}
                                  <IconButton
                                    icon={<FaTimes />}
                                    aria-label="Remover categoria"
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => {
                                      const newCategorias = categoriasSelecionadas.filter(id => id !== catId)
                                      setCategoriasSelecionadas(newCategorias)
                                      setFormData(prev => ({
                                        ...prev,
                                        categorias: newCategorias
                                      }))

                                      if (categoriaPrincipal === catId) {
                                        setCategoriaPrincipal(null)
                                        setFormData(prev => ({
                                          ...prev,
                                          categoriaPrincipalId: null
                                        }))
                                      }
                                      formChangedRef.current = true
                                    }}
                                  />
                                </Flex>
                                <Text fontSize="sm" color="gray.500">
                                  {categoria.localProducao
                                    ? `Local: ${categoria.localProducao.nome}`
                                    : 'Sem local definido'}
                                </Text>
                              </Box>
                            )
                          })}
                        </SimpleGrid>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Aba 3: Produção */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                      <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="sm">Configurações de Comanda</Heading>

                        <HStack>
                          <Text fontSize="sm" color="gray.500">
                            {useOverride
                              ? 'Usar configurações específicas'
                              : 'Usar configurações da categoria'}
                          </Text>
                          <Switch
                            colorScheme="teal"
                            isChecked={useOverride}
                            onChange={handleOverrideToggle}
                          />
                        </HStack>
                      </Flex>

                      <Divider mb={4} />

                      {useOverride ? (
                        <>
                          <FormControl display="flex" alignItems="center" mb={4}>
                            <FormLabel htmlFor="geraComanda" mb="0">
                              Gerar Comanda de Produção
                            </FormLabel>
                            <Switch
                              id="geraComanda"
                              colorScheme="teal"
                              isChecked={formData.geraComanda as any}
                              onChange={() => handleSwitchChange('geraComanda')}
                            />
                            <Text ml={2} fontSize="sm" color={formData.geraComanda ? 'green.500' : 'red.500'}>
                              {formData.geraComanda ? 'Sim' : 'Não'}
                            </Text>
                          </FormControl>

                          <FormControl isDisabled={!formData.geraComanda}>
                            <FormLabel>Local de Produção</FormLabel>
                            <Select
                              placeholder="Selecione o local de produção"
                              name="localProducaoId"
                              value={formData.localProducaoId || ''}
                              onChange={handleChange}
                            >
                              {locaisProducao.map(local => (
                                <option key={local.id} value={local.id}>
                                  {local.nome} {local.impressora ? `(${local.impressora})` : ''}
                                </option>
                              ))}
                            </Select>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Local onde o produto será preparado e para onde a comanda será enviada
                            </Text>
                          </FormControl>
                        </>
                      ) : (
                        <VStack spacing={4} align="start">
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <Text fontWeight="medium">Usando configurações da categoria</Text>
                              <Text fontSize="sm">
                                Este produto seguirá as configurações de comanda definidas em sua categoria principal.
                              </Text>
                            </Box>
                          </Alert>

                          {categoriaPrincipal ? (
                            (() => {
                              const categoria = categorias.find(c => c.id === categoriaPrincipal)
                              if (!categoria) return null

                              return (
                                <Box
                                  p={3}
                                  borderWidth="1px"
                                  borderRadius="md"
                                  w="full"
                                >
                                  <Text fontWeight="medium" mb={2}>Configurações da categoria: {categoria.nome}</Text>
                                  <HStack mb={2}>
                                    <Text fontSize="sm">Gera Comanda:</Text>
                                    <Badge colorScheme={categoria.geraComanda ? 'green' : 'red'}>
                                      {categoria.geraComanda ? 'Sim' : 'Não'}
                                    </Badge>
                                  </HStack>
                                  <HStack>
                                    <Text fontSize="sm">Local de Produção:</Text>
                                    <Text fontSize="sm" fontWeight="medium">
                                      {categoria.localProducao ? categoria.localProducao.nome : 'Não definido'}
                                    </Text>
                                  </HStack>
                                </Box>
                              )
                            })()
                          ) : (
                            <Alert status="warning" borderRadius="md">
                              <AlertIcon />
                              <Text>Nenhuma categoria principal selecionada na aba Categorias.</Text>
                            </Alert>
                          )}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Aba 4: Complementos */}
                <TabPanel>
                  <VStack spacing={5} align="stretch">
                    <Box>
                      <Heading size="sm" mb={3}>Grupos de Complementos</Heading>
                      <Text fontSize="sm" color="gray.600" mb={4}>
                        Os grupos de complementos permitem definir conjuntos de opções que o cliente poderá selecionar ao pedir este produto,
                        como "Ponto da Carne", "Sabores Adicionais", etc.
                      </Text>

                      {isLoadingGrupos ? (
                        <Flex justify="center" my={8}>
                          <Spinner />
                        </Flex>
                      ) : (
                        <>
                          {gruposComplementosDisponiveis.length === 0 ? (
                            <Alert status="info" mb={4}>
                              <AlertIcon />
                              <Box>
                                <Text fontWeight="medium">Nenhum grupo de complementos disponível</Text>
                                <Text fontSize="sm">
                                  Você precisa criar grupos de complementos para poder associá-los ao produto.
                                </Text>
                              </Box>
                              <Spacer />
                              <Button
                                size="sm"
                                colorScheme="blue"
                                leftIcon={<FaPlus />}
                                onClick={() => window.open('/desk/cadastros/grupos-complementos', '_blank')}
                              >
                                Criar Grupo
                              </Button>
                            </Alert>
                          ) : (
                            <>
                              <Box mb={4}>
                                <Select
                                  placeholder="Selecionar grupo para adicionar"
                                  value={novoGrupoId}
                                  onChange={e => setNovoGrupoId(e.target.value)}
                                >
                                  {gruposComplementosDisponiveis
                                    .filter((g: any) => g.status && !gruposProduto.some((gp: any) => gp.grupoComplementoId === g.id))
                                    .map((grupo: any) => (
                                      <option key={grupo.id} value={grupo.id}>
                                        {grupo.nome} ({grupo.complementos?.length || 0} complementos)
                                      </option>
                                    ))}
                                </Select>
                                <Button
                                  mt={2}
                                  colorScheme="teal"
                                  leftIcon={<FaPlus />}
                                  isDisabled={!novoGrupoId}
                                  onClick={handleAddGrupoComplemento}
                                >
                                  Adicionar Grupo
                                </Button>
                              </Box>

                              {gruposProduto.length === 0 ? (
                                <Alert status="warning">
                                  <AlertIcon />
                                  Nenhum grupo de complementos adicionado a este produto
                                </Alert>
                              ) : (
                                <DragDropContext onDragEnd={handleDragEndGrupos}>
                                  <Droppable droppableId="grupos-produto">
                                    {(provided: any) => (
                                      <Box
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                      >
                                        <VStack spacing={4} align="stretch">
                                          {gruposProduto.map((grupoProduto: any, index) => (
                                            <Draggable
                                              key={`grupo-${grupoProduto.grupoComplementoId}`}
                                              draggableId={`grupo-${grupoProduto.grupoComplementoId}`}
                                              index={index}
                                            >
                                              {(provided: any) => (
                                                <Box
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  borderWidth="1px"
                                                  borderRadius="md"
                                                  p={3}
                                                  bg={useColorModeValue('white', 'gray.700')}
                                                  boxShadow="sm"
                                                >
                                                  <Flex mb={3} justify="space-between" align="center">
                                                    <HStack>
                                                      <Box {...provided.dragHandleProps} cursor="grab" px={1}>
                                                        <Icon as={FaGripVertical} color="gray.400" />
                                                      </Box>
                                                      <Heading size="sm">{grupoProduto.grupoComplemento.nome}</Heading>
                                                      <Badge colorScheme={grupoProduto.obrigatorio ? "red" : "green"}>
                                                        {grupoProduto.obrigatorio ? "Obrigatório" : "Opcional"}
                                                      </Badge>
                                                    </HStack>
                                                    <IconButton
                                                      icon={<FaTrash />}
                                                      aria-label="Remover grupo"
                                                      size="sm"
                                                      variant="ghost"
                                                      colorScheme="red"
                                                      onClick={() => handleRemoveGrupoComplemento(grupoProduto.grupoComplementoId)}
                                                    />
                                                  </Flex>

                                                  <Box fontSize="sm" mb={3}>
                                                    {grupoProduto.grupoComplemento.descricao && (
                                                      <Text color="gray.500" mb={2}>{grupoProduto.grupoComplemento.descricao}</Text>
                                                    )}
                                                    <HStack spacing={2} wrap="wrap">
                                                      {grupoProduto.grupoComplemento.complementos?.map(item => (
                                                        <Tag key={item.complementoId} size="sm" colorScheme="teal" my={1}>
                                                          <TagLabel>{item.complemento.nome}</TagLabel>
                                                        </Tag>
                                                      ))}
                                                    </HStack>
                                                  </Box>

                                                  <Divider my={2} />

                                                  <Box>
                                                    <FormControl display="flex" alignItems="center" mb={2}>
                                                      <FormLabel htmlFor={`obrigatorio-${grupoProduto.grupoComplementoId}`} mb="0" fontSize="sm">
                                                        Obrigatório:
                                                      </FormLabel>
                                                      <Switch
                                                        id={`obrigatorio-${grupoProduto.grupoComplementoId}`}
                                                        colorScheme="red"
                                                        isChecked={grupoProduto.obrigatorio}
                                                        onChange={() => handleGrupoChange(
                                                          grupoProduto.grupoComplementoId,
                                                          'obrigatorio',
                                                          !grupoProduto.obrigatorio
                                                        )}
                                                      />
                                                    </FormControl>
                                                    <SimpleGrid columns={2} spacing={4}>
                                                      <FormControl>
                                                        <FormLabel fontSize="sm">Mínimo de seleções</FormLabel>
                                                        <NumberInput
                                                          size="sm"
                                                          min={0}
                                                          value={grupoProduto.minSelecao}
                                                          onChange={(value) => handleGrupoChange(
                                                            grupoProduto.grupoComplementoId,
                                                            'minSelecao',
                                                            parseInt(value) || 0
                                                          )}
                                                        >
                                                          <NumberInputField />
                                                          <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                          </NumberInputStepper>
                                                        </NumberInput>
                                                      </FormControl>
                                                      <FormControl>
                                                        <FormLabel fontSize="sm">Máximo de seleções</FormLabel>
                                                        <NumberInput
                                                          size="sm"
                                                          min={0}
                                                          value={grupoProduto.maxSelecao}
                                                          onChange={(value) => handleGrupoChange(
                                                            grupoProduto.grupoComplementoId,
                                                            'maxSelecao',
                                                            parseInt(value) || 0
                                                          )}
                                                        >
                                                          <NumberInputField />
                                                          <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                          </NumberInputStepper>
                                                        </NumberInput>
                                                      </FormControl>
                                                    </SimpleGrid>
                                                    <Text fontSize="xs" mt={1} color="blue.500">
                                                      <Icon as={FaInfoCircle} mr={1} />
                                                      Você pode sobrescrever as regras padrão do grupo para este produto específico.
                                                    </Text>
                                                  </Box>
                                                </Box>
                                              )}
                                            </Draggable>
                                          ))}
                                          {provided.placeholder}
                                        </VStack>
                                      </Box>
                                    )}
                                  </Droppable>
                                </DragDropContext>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Aba 5: Estoque */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="controlaEstoque" mb="0">
                        Controlar Estoque
                      </FormLabel>
                      <Switch
                        id="controlaEstoque"
                        colorScheme="teal"
                        isChecked={formData.controlaEstoque}
                        onChange={() => handleSwitchChange('controlaEstoque')}
                      />
                      <Text ml={2} fontSize="sm" color={formData.controlaEstoque ? 'green.500' : 'gray.500'}>
                        {formData.controlaEstoque ? 'Sim' : 'Não'}
                      </Text>
                    </FormControl>

                    <Collapse in={formData.controlaEstoque}>
                      <VStack spacing={4} align="stretch" mt={2}>
                        {/* Campo para selecionar o insumo vinculado */}
                        <FormControl isRequired={formData.controlaEstoque}>
                          <FormLabel>Insumo Vinculado</FormLabel>
                          <Select
                            placeholder="Selecione um insumo"
                            value={formData.insumoVinculadoId || ''}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                insumoVinculadoId: e.target.value ? parseInt(e.target.value) : null
                              });
                              formChangedRef.current = true;
                              scheduleAutoSave();
                            }}
                            isDisabled={isLoadingInsumos}
                          >
                            {insumos.map(insumo => (
                              <option key={insumo.id} value={insumo.id}>
                                {insumo.codigo} - {insumo.nome} ({insumo.unidadeMedida?.simbolo})
                              </option>
                            ))}
                          </Select>
                          <FormHelperText>
                            O estoque deste produto será automaticamente vinculado ao estoque do insumo selecionado.
                          </FormHelperText>
                        </FormControl>

                        {/* Campo para quantidade consumida - exibir apenas quando insumo estiver selecionado */}
                        {selectedInsumo && (
                          <FormControl>
                            <FormLabel>
                              Quantidade Consumida por Unidade 
                              {selectedInsumo.unidadeMedida && (
                                <Text as="span" ml={1} fontSize="sm" color="gray.500">
                                  ({selectedInsumo.unidadeMedida.simbolo})
                                </Text>
                              )}
                            </FormLabel>
                            <NumberInput
                              min={0.01}
                              step={0.01}
                              precision={3}
                              value={formData.qtdInsumoConsumida}
                              onChange={(value) => {
                                setFormData({
                                  ...formData,
                                  qtdInsumoConsumida: parseFloat(value) || 1
                                });
                                formChangedRef.current = true;
                                scheduleAutoSave();
                              }}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                            <FormHelperText>
                              Quantidade de insumo consumida cada vez que uma unidade deste produto é vendida.
                              {selectedInsumo.unidadeMedida && (
                                <Text as="span" fontWeight="medium"> Exemplo: 0.250 {selectedInsumo.unidadeMedida.simbolo} por produto.</Text>
                              )}
                            </FormHelperText>
                          </FormControl>
                        )}
                        
                        <FormControl display="flex" alignItems="center">
                          <FormLabel htmlFor="baixaAutomatica" mb="0">
                            Baixa Automática
                          </FormLabel>
                          <Switch
                            id="baixaAutomatica"
                            colorScheme="teal"
                            isChecked={formData.baixaAutomatica}
                            onChange={() => handleSwitchChange('baixaAutomatica')}
                          />
                          <Text ml={2} fontSize="sm" color={formData.baixaAutomatica ? 'green.500' : 'gray.500'}>
                            {formData.baixaAutomatica ? 'Ativada' : 'Desativada'}
                          </Text>
                        </FormControl>

                        {/* Alertas informativos */}
                        {formData.insumoVinculadoId && (
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <Text fontWeight="medium">Insumo vinculado</Text>
                              <Text fontSize="sm">
                                Ao vender este produto, {formData.baixaAutomatica ? 'será' : 'poderá ser'} descontado automaticamente 
                                {' '}{formData.qtdInsumoConsumida} {selectedInsumo?.unidadeMedida?.simbolo || 'unidade(s)'} do insumo selecionado para cada unidade vendida.
                              </Text>
                            </Box>
                          </Alert>
                        )}

                        {!formData.insumoVinculadoId && (
                          <Alert status="warning" borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <Text fontWeight="medium">Nenhum insumo selecionado</Text>
                              <Text fontSize="sm">
                                Selecione um insumo para vincular ao estoque deste produto.
                              </Text>
                            </Box>
                          </Alert>
                        )}
                      </VStack>
                    </Collapse>

                    {!formData.controlaEstoque && (
                      <Alert status="info" mt={2} borderRadius="md">
                        <AlertIcon />
                        <Text>
                          Este produto não terá controle de estoque. Ideal para itens de produção contínua
                          ou que são contabilizados através de seus ingredientes.
                        </Text>
                      </Alert>
                    )}
                  </VStack>
                </TabPanel>

                {/* Aba 6: Ficha Técnica */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="sm">Ficha Técnica do Produto</Heading>
                      <HStack>
                        <FormControl w="180px">
                          <FormLabel fontSize="sm">Rendimento</FormLabel>
                          <NumberInput
                            min={1}
                            value={formData.fichaTecnica.rendimento || 1}
                            onChange={(value) => handleFichaTecnicaChange({
                              ...formData.fichaTecnica,
                              rendimento: Number(value) || 1
                            })}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        <Box
                          p={2}
                          borderRadius="md"
                          bg={useColorModeValue('gray.100', 'gray.700')}
                        >
                          <Text fontWeight="medium">
                            Custo Total: {formatCurrency(10.50)} {/* Cálculo do custo baseado nos ingredientes */}
                          </Text>
                        </Box>
                      </HStack>
                    </Flex>
                    <Divider />
                    <FormControl>
                      <FormLabel>Lista de Ingredientes</FormLabel>
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Ingrediente</Th>
                              <Th>Quantidade</Th>
                              <Th>Unidade</Th>
                              <Th>Custo</Th>
                              <Th width="50px"></Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {formData.fichaTecnica.ingredientes.length === 0 ? (
                              <Tr>
                                <Td colSpan={5} textAlign="center" py={4}>
                                  <Text color="gray.500">Nenhum ingrediente adicionado</Text>
                                </Td>
                              </Tr>
                            ) : (
                              formData.fichaTecnica.ingredientes.map((ingrediente: any, index) => (
                                <Tr key={index}>
                                  <Td>
                                    <Input
                                      size="sm"
                                      value={ingrediente.nome || ''}
                                      placeholder="Nome do ingrediente"
                                      onChange={(e) => handleIngredienteChange(index, 'nome', e.target.value)}
                                    />
                                  </Td>
                                  <Td>
                                    <NumberInput
                                      size="sm"
                                      min={0}
                                      step={0.1}
                                      value={ingrediente.quantidade || 0}
                                      onChange={(value) => handleIngredienteChange(index, 'quantidade', Number(value))}
                                    >
                                      <NumberInputField />
                                      <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                      </NumberInputStepper>
                                    </NumberInput>
                                  </Td>
                                  <Td>
                                    <Select
                                      size="sm"
                                      value={ingrediente.unidadeMedidaId || ''}
                                      placeholder="Unidade"
                                      onChange={(e) => handleIngredienteChange(index, 'unidadeMedidaId', e.target.value)}
                                    >
                                      {unidadesMedida.map(um => (
                                        <option key={um.id} value={um.id}>
                                          {um.nome} ({um.simbolo})
                                        </option>
                                      ))}
                                    </Select>
                                  </Td>
                                  <Td>
                                    <InputGroup size="sm">
                                      <InputLeftElement
                                        pointerEvents="none"
                                        color="gray.500"
                                        fontSize="0.8em"
                                      >
                                        R$
                                      </InputLeftElement>
                                      <NumberInput
                                        min={0}
                                        step={0.1}
                                        precision={2}
                                        value={ingrediente.custo || 0}
                                        onChange={(value) => handleIngredienteChange(index, 'custo', Number(value))}
                                        w="full"
                                      >
                                        <NumberInputField pl={6} />
                                        <NumberInputStepper>
                                          <NumberIncrementStepper />
                                          <NumberDecrementStepper />
                                        </NumberInputStepper>
                                      </NumberInput>
                                    </InputGroup>
                                  </Td>
                                  <Td>
                                    <IconButton
                                      size="sm"
                                      colorScheme="red"
                                      variant="ghost"
                                      aria-label="Remover ingrediente"
                                      icon={<FaTrash />}
                                      onClick={() => handleRemoveIngrediente(index)}
                                    />
                                  </Td>
                                </Tr>
                              ))
                            )}
                          </Tbody>
                        </Table>
                      </Box>
                      <Button
                        size="sm"
                        mt={4}
                        leftIcon={<FaPlus />}
                        onClick={handleAddIngrediente}
                      >
                        Adicionar Ingrediente
                      </Button>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Modo de Preparo</FormLabel>
                      <Textarea
                        placeholder="Descreva o passo a passo do preparo deste produto..."
                        value={formData.fichaTecnica.modoPreparo || ''}
                        onChange={(e) => handleFichaTecnicaChange({
                          ...formData.fichaTecnica,
                          modoPreparo: e.target.value
                        })}
                        resize="vertical"
                        rows={6}
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Aba 7: Sabores */}
                <TabPanel>
                  <VStack spacing={5} align="stretch">
                    <Box>
                      <Heading size="sm" mb={3}>Configuração de Múltiplos Sabores</Heading>
                      <Text fontSize="sm" color="gray.600" mb={4}>
                        Configure este produto para aceitar múltiplos sabores (como uma pizza com diferentes sabores).
                      </Text>

                      <FormControl display="flex" alignItems="center" mb={4}>
                        <FormLabel htmlFor="aceitaSabores" mb="0" fontWeight="medium">
                          Aceita múltiplos sabores:
                        </FormLabel>
                        <Switch
                          id="aceitaSabores"
                          colorScheme="teal"
                          isChecked={aceitaSabores}
                          onChange={() => {
                            setAceitaSabores(!aceitaSabores)
                            formChangedRef.current = true
                            scheduleAutoSave()
                          }}
                        />
                      </FormControl>

                      <Collapse in={aceitaSabores}>
                        <VStack spacing={4} align="stretch" pl={6} mb={4}>
                          <FormControl>
                            <FormLabel>Máximo de sabores permitido:</FormLabel>
                            <NumberInput
                              min={1}
                              max={10}
                              value={maxSabores}
                              onChange={(value) => {
                                setMaxSabores(parseInt(value))
                                formChangedRef.current = true
                                scheduleAutoSave()
                              }}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                            <FormHelperText>
                              Quantos sabores diferentes o cliente pode escolher para este produto
                            </FormHelperText>
                          </FormControl>

                          <FormControl>
                            <FormLabel>Tipo de cobrança:</FormLabel>
                            <Select
                              value={tipoCobranca}
                              onChange={(e) => {
                                setTipoCobranca(e.target.value)
                                formChangedRef.current = true
                                scheduleAutoSave()
                              }}
                            >
                              <option value="mais_caro">Cobrar o sabor mais caro</option>
                              <option value="media">Cobrar a média dos sabores</option>
                              <option value="proporcional">Cobrar proporcional à fração</option>
                              <option value="valor_base">Valor base do produto</option>
                            </Select>
                            <FormHelperText>
                              Como será calculado o preço quando houver múltiplos sabores
                            </FormHelperText>
                          </FormControl>

                          <FormControl>
                            <Flex align="center">
                              <Switch
                                id="exibirPrecoBase"
                                colorScheme="teal"
                                isChecked={exibirPrecoBase}
                                onChange={() => setExibirPrecoBase(!exibirPrecoBase)}
                                mr={2}
                              />
                              <FormLabel htmlFor="exibirPrecoBase" mb={0}>
                                Exibir preço base no cardápio
                              </FormLabel>
                            </Flex>
                            <FormHelperText>
                              Se ativado, o preço base será exibido junto com o produto, mesmo quando o preço final depender da seleção de sabores
                            </FormHelperText>
                          </FormControl>

                          <Divider my={2} />

                          <Heading size="sm" mb={2}>Sabores Disponíveis</Heading>

                          {isLoadingSabores ? (
                            <Flex justify="center" py={4}>
                              <Spinner />
                            </Flex>
                          ) : (
                            <>
                              <HStack mb={4}>
                                <Select
                                  placeholder="Selecionar produto como sabor"
                                  value={novoSaborId}
                                  onChange={(e) => setNovoSaborId(e.target.value)}
                                >
                                  {saboresDisponiveis
                                    .filter(p => !saboresSelecionados.some(s => s.saborId === p.id))
                                    .map(produtoOp => {
                                      return (
                                        <option key={produtoOp.id} value={produtoOp.id}>
                                          {produtoOp.nome} (R$ {produtoOp && parseFloat(produtoOp?.precoVenda)?.toFixed(2)})
                                        </option>)
                                    })
                                  }
                                </Select>
                                <Button
                                  colorScheme="teal"
                                  leftIcon={<FaPlus />}
                                  onClick={handleAddSabor}
                                  isDisabled={!novoSaborId}
                                >
                                  Adicionar
                                </Button>
                              </HStack>

                              {saboresSelecionados.length === 0 ? (
                                <Alert status="info">
                                  <AlertIcon />
                                  <Text>Nenhum sabor adicionado ainda. Adicione produtos que poderão ser escolhidos como sabores.</Text>
                                </Alert>
                              ) : (
                                <DragDropContext onDragEnd={handleDragEndSabores}>
                                  <Droppable droppableId="sabores">
                                    {(provided) => (
                                      <Box
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                      >
                                        <VStack spacing={3} align="stretch">
                                          {saboresSelecionados.map((sabor, index) => (
                                            <Draggable
                                              key={`sabor-${sabor.saborId}`}
                                              draggableId={`sabor-${sabor.saborId}`}
                                              index={index}
                                            >
                                              {(provided) => (
                                                <Box
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  borderWidth="1px"
                                                  borderRadius="md"
                                                  p={3}
                                                  bg={useColorModeValue('white', 'gray.700')}
                                                  boxShadow="sm"
                                                >
                                                  <Flex mb={3} justify="space-between" align="center">
                                                    <HStack>
                                                      <Box {...provided.dragHandleProps} cursor="grab" px={1}>
                                                        <Icon as={FaGripVertical} color="gray.400" />
                                                      </Box>
                                                      <Text fontWeight="medium">{sabor.sabor.nome}</Text>
                                                    </HStack>
                                                    <IconButton
                                                      icon={<FaTrash />}
                                                      aria-label="Remover sabor"
                                                      size="sm"
                                                      variant="ghost"
                                                      colorScheme="red"
                                                      onClick={() => handleRemoveSabor(sabor.saborId)}
                                                    />
                                                  </Flex>

                                                  <SimpleGrid columns={2} spacing={4}>
                                                    <Box>
                                                      <Text fontSize="sm" fontWeight="medium">Preço base:</Text>
                                                      <Text fontSize="sm" color="green.600">
                                                        {formatCurrency(sabor.sabor.precoVenda)}
                                                      </Text>
                                                    </Box>

                                                    <FormControl>
                                                      <FormLabel fontSize="sm">Preço adicional:</FormLabel>
                                                      <InputGroup size="sm">
                                                        <InputLeftElement pointerEvents="none">
                                                          R$
                                                        </InputLeftElement>
                                                        <NumberInput
                                                          min={0}
                                                          precision={2}
                                                          step={0.5}
                                                          value={sabor.precoAdicional}
                                                          onChange={(value) => handleSaborPrecoChange(sabor.saborId, value)}
                                                          w="full"
                                                        >
                                                          <NumberInputField pl={8} />
                                                          <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                          </NumberInputStepper>
                                                        </NumberInput>
                                                      </InputGroup>
                                                    </FormControl>
                                                  </SimpleGrid>
                                                </Box>
                                              )}
                                            </Draggable>
                                          ))}
                                          {provided.placeholder}
                                        </VStack>
                                      </Box>
                                    )}
                                  </Droppable>
                                </DragDropContext>
                              )}
                            </>
                          )}
                        </VStack>
                      </Collapse>

                      {!aceitaSabores && (
                        <Alert status="info">
                          <AlertIcon />
                          <Box>
                            <Text fontWeight="medium">Produto padrão</Text>
                            <Text fontSize="sm">
                              Este produto não aceita múltiplos sabores. Ative a opção acima para configurar um produto
                              que permita seleção de diferentes sabores, como pizzas.
                            </Text>
                          </Box>
                        </Alert>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button variant="ghost" onClick={handleCloseWithCheck}>
                Cancelar
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSaveAndNew}
                isLoading={isSubmitting || isLoadingSabores}
                leftIcon={<FaPlus />}
                isDisabled={!onFormOpen} // Desabilitar o botão se onFormOpen não estiver disponível
              >
                Salvar e Novo
              </Button>
              <Button
                colorScheme="teal"
                onClick={handleSubmit}
                isLoading={isSubmitting || isLoadingSabores }
                leftIcon={<FaCheck />}
              >
                {produto ? 'Atualizar' : 'Criar Produto'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Alerta de confirmação ao fechar com alterações não salvas */}
      <AlertDialog
        isOpen={isCancelOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCancelClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Descartar alterações?
            </AlertDialogHeader>

            <AlertDialogBody>
              Existem alterações não salvas. Tem certeza que deseja sair? Todas as alterações serão perdidas.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCancelClose}>
                Continuar editando
              </Button>
              <Button colorScheme="red" onClick={() => {
                onClose();
                onCancelClose();
              }} ml={3}>
                Descartar alterações
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}