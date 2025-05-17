'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Flex,
  HStack,
  VStack,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Input,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Checkbox,
  Progress,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  useColorModeValue,
  useDisclosure,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  FaArrowLeft,
  FaSave,
  FaCheckCircle,
  FaBoxOpen,
  FaClipboardCheck,
  FaInfoCircle,
  FaFileInvoice,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { formatCurrency, formatDate } from '@/utils/format';
import Link from 'next/link';

// Interfaces para tipagem
interface ItemRecebimento {
  id: number;
  insumoId: number;
  nome: string;
  quantidade: number;
  quantidadeRecebida: number;
  valorUnitario: number;
  completo: boolean;
}

interface FormularioRecebimento {
  itens: ItemRecebimento[];
  numeroNota: string;
  completo: boolean;
}

interface CompraItem {
  id: number;
  insumoId: number;
  quantidade: number;
  valorUnitario: number;
  quantidadeRecebida?: number;
  insumo: {
    id: number;
    nome: string;
    unidadeMedida?: {
      simbolo: string;
    };
  };
}

interface Compra {
  id: number;
  codigo: string;
  dataCompra: string;
  dataEntrega?: string;
  dataPrevisaoEntrega?: string;
  numeroNota?: string;
  status: string;
  valorTotal: number;
  itens: CompraItem[];
}

export default function ReceberCompraPage() {
  const router = useRouter();
  const { id } = useParams();
  const toast = useToast();
  const { 
    isOpen: isConfirmOpen, 
    onOpen: onConfirmOpen, 
    onClose: onConfirmClose 
  } = useDisclosure();
  const cancelRef = useRef(null);
  
  const [compra, setCompra] = useState<Compra | null>(null);
  const [formData, setFormData] = useState<FormularioRecebimento>({
    itens: [],
    numeroNota: '',
    completo: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cores de background
  const cardBg = useColorModeValue('white', 'gray.800');
  const highlightBg = useColorModeValue('yellow.50', 'yellow.900');

  // Fetch principal da compra
  useEffect(() => {
    const fetchCompra = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/estoque/compras/${id}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar compra');
        }
        const data = await response.json();
        setCompra(data.compra);
        
        // Inicializar dados do formulário
        const itensFormData = data.compra.itens.map((item: CompraItem) => ({
          id: item.id,
          insumoId: item.insumoId,
          nome: item.insumo.nome,
          quantidade: item.quantidade,
          quantidadeRecebida: item.quantidadeRecebida || 0,
          valorUnitario: item.valorUnitario,
          completo: false
        }));
        
        setFormData({
          itens: itensFormData,
          numeroNota: data.compra.numeroNota || '',
          completo: false
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os detalhes da compra',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchCompra();
    }
  }, [id, toast]);
  
  // Manipuladores de eventos para o formulário
  const handleQuantidadeChange = (itemId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setFormData((prev: any) => ({
      ...prev,
      itens: prev.itens.map((item: any) => {
        if (item.id === itemId) {
          // Limitar quantidade recebida à quantidade pedida
          const quantidadeRecebida = Math.min(numValue, item.quantidade);
          return { 
            ...item, 
            quantidadeRecebida,
            // Marcar como completo se quantidade recebida for igual à quantidade pedida
            completo: quantidadeRecebida >= item.quantidade
          };
        }
        return item;
      })
    }));
  };
  
  const handleCompletoChange = (itemId: number, checked: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      itens: prev.itens.map((item: any) => {
        if (item.id === itemId) {
          return { 
            ...item, 
            completo: checked,
            // Se marcar como completo, definir quantidade recebida igual à quantidade pedida
            quantidadeRecebida: checked ? item.quantidade : item.quantidadeRecebida
          };
        }
        return item;
      })
    }));
  };
  
  const handleTodosCompletosChange = (checked: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      completo: checked,
      itens: prev.itens.map((item: any) => ({
        ...item,
        completo: checked,
        quantidadeRecebida: checked ? item.quantidade : item.quantidadeRecebida
      }))
    }));
  };
  
  const handleNotaFiscalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({
      ...prev,
      numeroNota: e.target.value
    }));
  };
  
  // Cálculos para o sumário do recebimento
  const calcularTotalItens = () => {
    return formData.itens.length;
  };
  
  const calcularItensCompletos = () => {
    return formData.itens.filter((item: any) => item.completo).length;
  };
  
  const calcularItensRecebidos = () => {
    return formData.itens.filter((item: any) => item.quantidadeRecebida > 0).length;
  };
  
  const calcularValorRecebido = () => {
    return formData.itens.reduce(
      (total: number, item: any) => total + (item.quantidadeRecebida * item.valorUnitario),
      0
    );
  };
  
  const calcularPorcentagemRecebimento = () => {
    const totalQuantidade = formData.itens.reduce(
      (total: number, item: any) => total + item.quantidade,
      0
    );
    
    if (totalQuantidade === 0) return 0;
    
    const totalRecebido = formData.itens.reduce(
      (total: number, item: any) => total + item.quantidadeRecebida,
      0
    );
    
    return (totalRecebido / totalQuantidade) * 100;
  };
  
  // Função para salvar o recebimento
  const handleSaveReceive = async () => {
    // Verificar se há algum recebimento para processar
    const algumItemRecebido = formData.itens.some((item: any) => item.quantidadeRecebida > 0);
    
    if (!algumItemRecebido) {
      toast({
        title: 'Nenhum item recebido',
        description: 'Por favor, informe a quantidade recebida para pelo menos um item.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Se tudo estiver ok, abrir confirmação
    onConfirmOpen();
  };
  
  const confirmReceive = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/estoque/compras/${id}/receber`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar recebimento');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Recebimento processado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirecionar para a página de detalhes da compra
      router.push(`/desk/estoque/compras/${id}`);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao processar o recebimento',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      onConfirmClose();
    }
  };
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  if (!compra) {
    return (
      <Alert status="error" variant="left-accent">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Compra não encontrada</Text>
          <Text>A compra solicitada não existe ou foi removida.</Text>
          <Button 
            leftIcon={<FaArrowLeft />} 
            mt={3} 
            onClick={() => router.push('/desk/estoque/compras')}
          >
            Voltar para Lista
          </Button>
        </Box>
      </Alert>
    );
  }
  
  // Verificar se a compra pode ser recebida
  if (compra.status === 'FINALIZADA' || compra.status === 'CANCELADA') {
    return (
      <Alert status="warning" variant="left-accent">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Operação não permitida</Text>
          <Text>
            Esta compra está {compra.status.toLowerCase()} e não pode ser recebida.
          </Text>
          <Button 
            leftIcon={<FaArrowLeft />} 
            mt={3} 
            as={Link}
            href={`/desk/estoque/compras/${id}`}
          >
            Voltar para Detalhes
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Box p={5}>
      {/* Breadcrumb e header */}
      <Breadcrumb mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/desk/estoque">Estoque</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/desk/estoque/compras">Compras</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href={`/desk/estoque/compras/${id}`}>Compra {compra.codigo}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Receber</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={2}>
        <Box>
          <Heading size="lg">Recebimento de Compra</Heading>
          <Text color="gray.500">
            {compra.codigo} - {formatDate(compra.dataCompra)}
          </Text>
        </Box>
        
        <HStack>
          <Button 
            leftIcon={<FaArrowLeft />} 
            as={Link}
            href={`/desk/estoque/compras/${id}`}
            variant="outline"
          >
            Cancelar
          </Button>
          
          <Button
            leftIcon={<FaSave />}
            colorScheme="green"
            onClick={handleSaveReceive}
            isLoading={isSubmitting}
          >
            Salvar Recebimento
          </Button>
        </HStack>
      </Flex>
      
      {/* Informações da compra */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={6}>
        <Card bg={cardBg} boxShadow="md">
          <CardHeader bg={highlightBg} py={3}>
            <HStack>
              <Icon as={FaInfoCircle} boxSize={5} color="orange.500" />
              <Heading size="sm">Instruções</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={4}>
              <Text>
                Informe a quantidade recebida para cada item da compra.
              </Text>
              <Text>
                Você pode marcar itens como "Completo" para definir automaticamente a quantidade total.
              </Text>
              <Text>
                Itens não recebidos (quantidade zero) permanecerão pendentes.
              </Text>
              <Alert status="info" size="sm">
                <AlertIcon />
                O estoque será atualizado automaticamente após o recebimento.
              </Alert>
            </VStack>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md">
          <CardHeader bg={highlightBg} py={3}>
            <HStack>
              <Icon as={FaFileInvoice} boxSize={5} color="blue.500" />
              <Heading size="sm">Nota Fiscal</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <FormControl mb={4}>
              <FormLabel>Número da Nota Fiscal</FormLabel>
              <Input 
                placeholder="Informe o número da NF"
                value={formData.numeroNota}
                onChange={handleNotaFiscalChange}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Status do Recebimento</FormLabel>
              <Checkbox 
                colorScheme="green"
                isChecked={formData.completo}
                onChange={(e) => handleTodosCompletosChange(e.target.checked)}
              >
                Marcar todos os itens como completos
              </Checkbox>
            </FormControl>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md">
          <CardHeader bg={highlightBg} py={3}>
            <HStack>
              <Icon as={FaClipboardCheck} boxSize={5} color="green.500" />
              <Heading size="sm">Resumo do Recebimento</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={4} width="100%">
              <Box width="100%">
                <Flex justify="space-between" mb={1}>
                  <Text fontWeight="medium">Progresso:</Text>
                  <Text>{Math.round(calcularPorcentagemRecebimento())}%</Text>
                </Flex>
                <Progress
                  value={calcularPorcentagemRecebimento()}
                  colorScheme="green"
                  size="sm"
                  borderRadius="full"
                />
              </Box>
              
              <HStack width="100%" justify="space-between">
                <Text fontWeight="medium">Total de Itens:</Text>
                <Text>{calcularTotalItens()}</Text>
              </HStack>
              
              <HStack width="100%" justify="space-between">
                <Text fontWeight="medium">Itens Recebidos:</Text>
                <Text>{calcularItensRecebidos()}</Text>
              </HStack>
              
              <HStack width="100%" justify="space-between">
                <Text fontWeight="medium">Itens Completos:</Text>
                <Text>{calcularItensCompletos()}</Text>
              </HStack>
              
              <Divider />
              
              <HStack width="100%" justify="space-between">
                <Text fontWeight="medium">Valor Recebido:</Text>
                <Text fontWeight="bold" color="green.500">
                  {formatCurrency(calcularValorRecebido())}
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Tabela de itens para receber */}
      <Card bg={cardBg} boxShadow="md" mb={6}>
        <CardHeader>
          <Heading size="md">Itens para Recebimento</Heading>
        </CardHeader>
        <CardBody>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Insumo</Th>
                  <Th isNumeric>Qtd. Pedida</Th>
                  <Th>Un.</Th>
                  <Th isNumeric>Qtd. Recebida</Th>
                  <Th isNumeric>Valor Un.</Th>
                  <Th isNumeric>Subtotal</Th>
                  <Th>Completo</Th>
                </Tr>
              </Thead>
              <Tbody>
                {formData.itens.map((item: any) => (
                  <Tr key={item.id}>
                    <Td>{item.nome}</Td>
                    <Td isNumeric>{item.quantidade.toFixed(2)}</Td>
                    <Td>
                      {compra.itens.find((i: any) => i.id === item.id).insumo.unidadeMedida?.simbolo || '-'}
                    </Td>
                    <Td>
                      <NumberInput 
                        min={0} 
                        max={item.quantidade}
                        value={item.quantidadeRecebida}
                        onChange={(value) => handleQuantidadeChange(item.id, value)}
                        size="sm"
                      >
                        <NumberInputField textAlign="right" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Td>
                    <Td isNumeric>{formatCurrency(item.valorUnitario)}</Td>
                    <Td isNumeric>
                      {formatCurrency(item.quantidadeRecebida * item.valorUnitario)}
                    </Td>
                    <Td>
                      <Checkbox 
                        colorScheme="green"
                        isChecked={item.completo}
                        onChange={(e) => handleCompletoChange(item.id, e.target.checked)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
      
      {/* Botões de ação */}
      <Flex justify="flex-end" mb={6}>
        <Button
          colorScheme="green"
          size="lg"
          leftIcon={<FaClipboardCheck />}
          onClick={handleSaveReceive}
          isLoading={isSubmitting}
        >
          Finalizar Recebimento
        </Button>
      </Flex>
      
      {/* Diálogo de confirmação */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={onConfirmClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar Recebimento
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack align="start" spacing={4}>
                <Text>
                  Você está recebendo {calcularItensRecebidos()} itens no valor de {formatCurrency(calcularValorRecebido())}.
                </Text>
                <Text>
                  Este processo irá atualizar o estoque e não poderá ser desfeito.
                </Text>
                <Alert status="info">
                  <AlertIcon />
                  {calcularItensCompletos() === calcularTotalItens() 
                    ? 'Todos os itens serão marcados como recebidos.' 
                    : 'Os itens parciais poderão ser recebidos posteriormente.'}
                </Alert>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onConfirmClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="green" 
                onClick={confirmReceive} 
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
