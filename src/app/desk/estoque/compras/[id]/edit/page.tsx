'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  FormErrorMessage,
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  InputGroup,
  InputRightElement,
  Spinner,
  Link as ChakraLink,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaSave,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaSearch,
  FaCheck,
  FaTimes,
  FaEdit,
  FaInfoCircle,
} from 'react-icons/fa';
import Link from 'next/link';
import { useTenant } from '@/hooks/useTenant';
import { formatCurrency, formatDate } from '@/utils/format';
import { useRef } from 'react';

// Item para o formulário
interface ItemCompra {
  id?: number;
  insumoId: number;
  insumoNome: string;
  unidadeMedida: string;
  precoCusto: number;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
  quantidadeRecebida?: number;
  status?: string;
}

// Fornecedor para o formulário
interface Fornecedor {
  id: number;
  codigo: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
}

// Insumo para o formulário
interface Insumo {
  id: number;
  codigo: string;
  nome: string;
  precoCusto: number;
  unidadeMedida?: {
    id: number;
    nome: string;
    simbolo: string;
  };
}

export default function EditarCompraPage() {
  const router = useRouter();
  const { id } = useParams();
  const toast = useToast();
  const { tenant } = useTenant();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    fornecedorId: '',
    dataCompra: new Date().toISOString().split('T')[0],
    dataPrevisaoEntrega: '',
    numeroNota: '',
    observacoes: '',
    itens: [] as ItemCompra[],
    status: 'PENDENTE',
  });
  
  // Estados para carregamento e seleção
  const [compraOriginal, setCompraOriginal] = useState<any>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [searchInsumo, setSearchInsumo] = useState('');
  const [isLoadingInsumos, setIsLoadingInsumos] = useState(false);
  const [isLoadingFornecedores, setIsLoadingFornecedores] = useState(false);
  const [isLoadingCompra, setIsLoadingCompra] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Estados para modal de confirmação
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef(null);
  
  // Estados para o item atual sendo editado
  const [currentItem, setCurrentItem] = useState<ItemCompra>({
    insumoId: 0,
    insumoNome: '',
    unidadeMedida: '',
    precoCusto: 0,
    quantidade: 0,
    valorUnitario: 0,
    subtotal: 0
  });
  
  // Cores
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Buscar dados da compra existente
  useEffect(() => {
    const fetchCompra = async () => {
      setIsLoadingCompra(true);
      try {
        const response = await fetch(`/api/estoque/compras/${id}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar compra');
        }
        
        const data = await response.json();
        setCompraOriginal(data.compra);
        
        // Transformar os dados para o formato do formulário
        const itensFormatados = data.compra.itens.map((item: any) => ({
          id: item.id,
          insumoId: item.insumoId,
          insumoNome: item.insumo.nome,
          unidadeMedida: item.insumo.unidadeMedida?.simbolo || '',
          precoCusto: item.insumo.precoCusto,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          subtotal: item.quantidade * item.valorUnitario,
          quantidadeRecebida: item.quantidadeRecebida,
          status: item.status
        }));
        
        setFormData({
          fornecedorId: data.compra.fornecedorId.toString(),
          dataCompra: data.compra.dataCompra ? new Date(data.compra.dataCompra).toISOString().split('T')[0] : '',
          dataPrevisaoEntrega: data.compra.dataPrevisaoEntrega ? new Date(data.compra.dataPrevisaoEntrega).toISOString().split('T')[0] : '',
          numeroNota: data.compra.numeroNota || '',
          observacoes: data.compra.observacoes || '',
          itens: itensFormatados,
          status: data.compra.status
        });
        
        // Verificar se a compra pode ser editada
        if (data.compra.status === 'FINALIZADA' || data.compra.status === 'CANCELADA') {
          toast({
            title: 'Atenção',
            description: `Compras com status ${data.compra.status.toLowerCase()} não podem ser editadas.`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          router.push(`/estoque/compras/${id}`);
        }
      } catch (error) {
        console.error('Erro ao carregar compra:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da compra',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        router.push('/estoque/compras');
      } finally {
        setIsLoadingCompra(false);
      }
    };
    
    if (id) {
      fetchCompra();
    }
  }, [id, router, toast]);
  
  // Buscar fornecedores
  useEffect(() => {
    const fetchFornecedores = async () => {
      setIsLoadingFornecedores(true);
      try {
        const response = await fetch('/api/fornecedores?status=true');
        if (!response.ok) {
          throw new Error('Erro ao buscar fornecedores');
        }
        
        const data = await response.json();
        setFornecedores(data.fornecedores);
        
        // Se já temos o fornecedor da compra, selecione-o
        if (formData.fornecedorId && data.fornecedores.length > 0) {
          const fornecedor = data.fornecedores.find((f: Fornecedor) => f.id === parseInt(formData.fornecedorId));
          if (fornecedor) {
            setSelectedFornecedor(fornecedor);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os fornecedores',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingFornecedores(false);
      }
    };
    
    fetchFornecedores();
  }, [formData.fornecedorId, toast]);
  
  // Buscar insumos quando pesquisar
  useEffect(() => {
    const fetchInsumos = async () => {
      if (!searchInsumo && !selectedFornecedor) return;
      
      setIsLoadingInsumos(true);
      try {
        let url = '/api/estoque/insumos?status=true';
        
        if (searchInsumo) {
          url += `&search=${encodeURIComponent(searchInsumo)}`;
        }
        
        if (selectedFornecedor?.id) {
          url += `&fornecedorId=${selectedFornecedor.id}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Erro ao buscar insumos');
        }
        
        const data = await response.json();
        setInsumos(data.insumos);
      } catch (error) {
        console.error('Erro ao carregar insumos:', error);
      } finally {
        setIsLoadingInsumos(false);
      }
    };
    
    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      fetchInsumos();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchInsumo, selectedFornecedor]);
  
  // Manipuladores de mudanças no formulário
  const handleFornecedorChange = (id: string) => {
    setFormData({
      ...formData,
      fornecedorId: id
    });
    
    if (!id) {
      setSelectedFornecedor(null);
      return;
    }
    
    const fornecedor = fornecedores.find(f => f.id === parseInt(id));
    if (fornecedor) {
      setSelectedFornecedor(fornecedor);
    }
  };
  
  const handleInsumoChange = (id: string) => {
    if (!id) {
      setSelectedInsumo(null);
      return;
    }
    
    const insumo = insumos.find(i => i.id === parseInt(id));
    if (insumo) {
      setSelectedInsumo(insumo);
      setCurrentItem({
        insumoId: insumo.id,
        insumoNome: insumo.nome,
        unidadeMedida: insumo.unidadeMedida?.simbolo || '',
        precoCusto: insumo.precoCusto,
        quantidade: 1,
        valorUnitario: insumo.precoCusto,
        subtotal: insumo.precoCusto
      });
    }
  };
  
  const handleItemQuantidadeChange = (value: string) => {
    const quantidade = parseFloat(value) || 0;
    setCurrentItem(prev => {
      const subtotal = quantidade * prev.valorUnitario;
      return {
        ...prev,
        quantidade,
        subtotal
      };
    });
  };
  
  const handleItemValorUnitarioChange = (value: string) => {
    const valorUnitario = parseFloat(value) || 0;
    setCurrentItem(prev => {
      const subtotal = prev.quantidade * valorUnitario;
      return {
        ...prev,
        valorUnitario,
        subtotal
      };
    });
  };
  
  // Adicionar item à compra
  const handleAddItem = () => {
    if (!selectedInsumo) {
      toast({
        title: 'Erro',
        description: 'Selecione um insumo para adicionar à compra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (currentItem.quantidade <= 0) {
      toast({
        title: 'Erro',
        description: 'A quantidade deve ser maior que zero',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Verificar se o insumo já está na lista
    const itemExistente = formData.itens.find(item => item.insumoId === currentItem.insumoId);
    
    if (itemExistente) {
      // Se o item já foi recebido parcialmente, mostrar alerta
      if (itemExistente.quantidadeRecebida && itemExistente.quantidadeRecebida > 0) {
        toast({
          title: 'Atenção',
          description: 'Este item já foi parcialmente recebido. Alterações podem afetar o recebimento.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Atualizar o item existente
      setFormData(prev => ({
        ...prev,
        itens: prev.itens.map(item => 
          item.insumoId === currentItem.insumoId
            ? { 
                ...item, 
                quantidade: item.quantidade + currentItem.quantidade,
                subtotal: (item.quantidade + currentItem.quantidade) * item.valorUnitario 
              }
            : item
        )
      }));
    } else {
      // Adicionar como novo item
      setFormData(prev => ({
        ...prev,
        itens: [...prev.itens, { ...currentItem, quantidadeRecebida: 0, status: 'PENDENTE' }]
      }));
    }
    
    // Limpar seleção após adicionar
    setSelectedInsumo(null);
    setSearchInsumo('');
    setCurrentItem({
      insumoId: 0,
      insumoNome: '',
      unidadeMedida: '',
      precoCusto: 0,
      quantidade: 0,
      valorUnitario: 0,
      subtotal: 0
    });
  };
  
  // Remover item da compra
  const handleRemoveItem = (index: number) => {
    const item = formData.itens[index];
    
    // Verificar se o item já foi recebido
    if (item.quantidadeRecebida && item.quantidadeRecebida > 0) {
      toast({
        title: 'Erro',
        description: 'Não é possível remover um item que já foi recebido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };
  
  // Calcular total da compra
  const calcularTotal = () => {
    return formData.itens.reduce((total, item) => total + item.subtotal, 0);
  };
  
  // Validar formulário antes de enviar
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.fornecedorId) {
      newErrors.fornecedorId = 'Selecione um fornecedor';
    }
    
    if (!formData.dataCompra) {
      newErrors.dataCompra = 'Data de compra é obrigatória';
    }
    
    if (formData.itens.length === 0) {
      newErrors.itens = 'Adicione pelo menos um item à compra';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handler para submissão do formulário
  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Mostrar diálogo de confirmação
    onOpen();
  };
  
  // Finalizar e salvar a compra
  const finalizarCompra = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/estoque/compras/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar compra');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Compra atualizada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirecionar para a página de detalhes da compra
      router.push(`/estoque/compras/${id}`);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao atualizar a compra',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };
  
  // Helper para obter a cor baseada no status da compra
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZADA': return 'green';
      case 'PENDENTE': return 'orange';
      case 'CANCELADA': return 'red';
      case 'PARCIAL': return 'blue';
      default: return 'gray';
    }
  };
  
  if (isLoadingCompra) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  // Verificar se a compra pode ser editada
  if (compraOriginal && (compraOriginal.status === 'FINALIZADA' || compraOriginal.status === 'CANCELADA')) {
    return (
      <Alert status="warning" variant="left-accent" m={5}>
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Esta compra não pode ser editada</Text>
          <Text>
            Compras com status "{compraOriginal.status.toLowerCase()}" não podem ser modificadas.
          </Text>
          <Button 
            leftIcon={<FaArrowLeft />} 
            mt={3} 
            as={Link}
            href={`/estoque/compras/${id}`}
          >
            Voltar para Detalhes
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Box p={5}>
      {/* Breadcrumb */}
      <Breadcrumb mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/estoque">Estoque</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/estoque/compras">Compras</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href={`/estoque/compras/${id}`}>Compra {compraOriginal?.codigo}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Editar</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" display="flex" alignItems="center">
          <FaEdit style={{ marginRight: '0.5rem' }} />
          Editar Compra: {compraOriginal?.codigo}
        </Heading>
        
        <HStack>
          <Button 
            leftIcon={<FaArrowLeft />} 
            as={Link}
            href={`/estoque/compras/${id}`}
            variant="outline"
          >
            Cancelar
          </Button>
          
          <Button
            colorScheme="teal"
            leftIcon={<FaSave />}
            onClick={handleSubmit}
            isDisabled={formData.itens.length === 0}
          >
            Salvar Alterações
          </Button>
        </HStack>
      </Flex>
      
      {/* Status da compra */}
      <Alert 
        status={
          formData.status === 'PENDENTE' ? 'warning' : 
          formData.status === 'PARCIAL' ? 'info' : 'success'
        } 
        mb={6}
      >
        <AlertIcon />
        <Text>
          Esta compra está com status <Badge colorScheme={getStatusColor(formData.status)}>{formData.status}</Badge>
          {formData.status === 'PARCIAL' && ' - alguns itens já foram recebidos'}
          {formData.status === 'PENDENTE' && ' - ainda não foi recebida'}
        </Text>
      </Alert>
      
      {/* Formulário Principal */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
        {/* Dados da Compra */}
        <GridItem>
          <Card bg={cardBg} boxShadow="md" mb={6}>
            <CardHeader>
              <Heading size="md">Dados da Compra</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired isInvalid={!!errors.fornecedorId}>
                  <FormLabel>Fornecedor</FormLabel>
                  <Select
                    placeholder="Selecione o fornecedor"
                    value={formData.fornecedorId}
                    onChange={(e) => handleFornecedorChange(e.target.value)}
                    isDisabled={isLoadingFornecedores}
                  >
                    {fornecedores.map((fornecedor) => (
                      <option key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nomeFantasia || fornecedor.razaoSocial}
                      </option>
                    ))}
                  </Select>
                  {errors.fornecedorId && (
                    <FormErrorMessage>{errors.fornecedorId}</FormErrorMessage>
                  )}
                </FormControl>
                
                {selectedFornecedor && (
                  <Box 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <Text fontWeight="medium">Fornecedor Selecionado:</Text>
                    <Text>{selectedFornecedor.razaoSocial}</Text>
                    {selectedFornecedor.cnpj && <Text fontSize="sm">CNPJ: {selectedFornecedor.cnpj}</Text>}
                    {selectedFornecedor.telefone && <Text fontSize="sm">Tel: {selectedFornecedor.telefone}</Text>}
                    <HStack mt={2}>
                      <ChakraLink 
                        as={Link} 
                        href={`/estoque/fornecedores/${selectedFornecedor.id}`} 
                        color="teal.500" 
                        fontSize="sm"
                      >
                        Ver detalhes
                      </ChakraLink>
                    </HStack>
                  </Box>
                )}
                
                <FormControl isRequired isInvalid={!!errors.dataCompra}>
                  <FormLabel>Data da Compra</FormLabel>
                  <Input
                    type="date"
                    value={formData.dataCompra}
                    onChange={(e) => setFormData({ ...formData, dataCompra: e.target.value })}
                  />
                  {errors.dataCompra && (
                    <FormErrorMessage>{errors.dataCompra}</FormErrorMessage>
                  )}
                </FormControl>
                
                <FormControl>
                  <FormLabel>Previsão de Entrega</FormLabel>
                  <Input
                    type="date"
                    value={formData.dataPrevisaoEntrega}
                    onChange={(e) => setFormData({ ...formData, dataPrevisaoEntrega: e.target.value })}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Número da Nota Fiscal</FormLabel>
                  <Input
                    placeholder="Número da NF (se disponível)"
                    value={formData.numeroNota}
                    onChange={(e) => setFormData({ ...formData, numeroNota: e.target.value })}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Observações</FormLabel>
                  <Textarea
                    placeholder="Observações sobre a compra"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>
          
          {/* Área de Seleção de Itens */}
          <Card bg={cardBg} boxShadow="md">
            <CardHeader>
              <Heading size="md">Adicionar Itens</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Buscar Insumo</FormLabel>
                  <InputGroup>
                    <Input
                      placeholder="Digite para buscar insumos"
                      value={searchInsumo}
                      onChange={(e) => setSearchInsumo(e.target.value)}
                    />
                    <InputRightElement>
                      {isLoadingInsumos ? <Spinner size="sm" /> : <FaSearch />}
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Selecionar Insumo</FormLabel>
                  <Select
                    placeholder="Selecione um insumo"
                    value={selectedInsumo?.id || ''}
                    onChange={(e) => handleInsumoChange(e.target.value)}
                    isDisabled={insumos.length === 0}
                  >
                    {insumos.map((insumo) => (
                      <option key={insumo.id} value={insumo.id}>
                        {insumo.nome} ({formatCurrency(insumo.precoCusto)})
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedInsumo && (
                  <>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <FormControl isRequired>
                          <FormLabel>Quantidade</FormLabel>
                          <NumberInput
                            min={0.01}
                            step={0.1}
                            value={currentItem.quantidade}
                            onChange={handleItemQuantidadeChange}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl isRequired>
                          <FormLabel>Valor Unitário</FormLabel>
                          <NumberInput
                            min={0.01}
                            step={0.1}
                            value={currentItem.valorUnitario}
                            onChange={handleItemValorUnitarioChange}
                            precision={2}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </GridItem>
                    </Grid>
                    
                    <Flex justify="space-between">
                      <Text fontWeight="bold">Subtotal:</Text>
                      <Text fontWeight="bold">{formatCurrency(currentItem.subtotal)}</Text>
                    </Flex>
                    
                    <Button
                      colorScheme="teal"
                      leftIcon={<FaPlus />}
                      onClick={handleAddItem}
                      width="full"
                    >
                      Adicionar Item
                    </Button>
                  </>
                )}
                
                {formData.itens.length === 0 && !selectedInsumo && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text>
                      Busque e selecione os insumos para adicionar à compra
                    </Text>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
        
        {/* Lista de Itens */}
        <GridItem>
          <Card bg={cardBg} boxShadow="md">
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Itens da Compra</Heading>
                <Badge colorScheme="blue" fontSize="md">
                  {formData.itens.length} {formData.itens.length === 1 ? 'item' : 'itens'}
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              {formData.itens.length === 0 ? (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Text>
                    Nenhum item adicionado à compra.
                  </Text>
                </Alert>
              ) : (
                <>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Insumo</Th>
                          <Th isNumeric>Quantidade</Th>
                          <Th>Un.</Th>
                          <Th isNumeric>Valor Un.</Th>
                          <Th isNumeric>Subtotal</Th>
                          <Th textAlign="center">Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {formData.itens.map((item, index) => (
                          <Tr key={item.id || index}>
                            <Td fontWeight="medium">{item.insumoNome}</Td>
                            <Td isNumeric>{item.quantidade.toFixed(2)}</Td>
                            <Td>{item.unidadeMedida}</Td>
                            <Td isNumeric>{formatCurrency(item.valorUnitario)}</Td>
                            <Td isNumeric fontWeight="bold">{formatCurrency(item.subtotal)}</Td>
                            <Td textAlign="center">
                              <IconButton
                                aria-label="Remover item"
                                icon={<FaTrash />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleRemoveItem(index)}
                                isDisabled={item.quantidadeRecebida !== undefined && item.quantidadeRecebida > 0}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                  
                  <Divider my={4} />
                  
                  <Flex justify="flex-end">
                    <Box 
                      p={4} 
                      bg={useColorModeValue('gray.50', 'gray.700')} 
                      borderRadius="md" 
                      minW="200px"
                    >
                      <Flex justify="space-between" fontWeight="bold" fontSize="lg">
                        <Text>Total:</Text>
                        <Text color="green.500">{formatCurrency(calcularTotal())}</Text>
                      </Flex>
                    </Box>
                  </Flex>
                </>
              )}
              
              {errors.itens && (
                <Alert status="error" mt={4} borderRadius="md">
                  <AlertIcon />
                  {errors.itens}
                </Alert>
              )}
            </CardBody>
          </Card>
          
          {/* Ações do Formulário */}
          <Flex justify="flex-end" mt={6} gap={4}>
            <Button 
              leftIcon={<FaArrowLeft />} 
              as={Link}
              href={`/estoque/compras/${id}`}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              colorScheme="teal"
              leftIcon={<FaSave />}
              onClick={handleSubmit}
              isDisabled={formData.itens.length === 0}
              size="lg"
            >
              Salvar Alterações
            </Button>
          </Flex>
        </GridItem>
      </Grid>
      
      {/* Diálogo de confirmação */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar Alterações
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack align="start" spacing={3}>
                <Text>
                  Você está modificando uma compra com {formData.itens.length} itens no valor total de {formatCurrency(calcularTotal())}.
                </Text>
                <Text>
                  Deseja confirmar estas alterações?
                </Text>
                {formData.status === 'PARCIAL' && (
                  <Alert status="warning">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Esta compra já teve recebimentos parciais. Alterações podem impactar os itens já recebidos.
                    </Text>
                  </Alert>
                )}
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="teal" 
                onClick={finalizarCompra} 
                ml={3}
                isLoading={isSubmitting}
              >
                Confirmar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
