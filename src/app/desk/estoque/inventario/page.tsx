'use client'

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  useToast,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Progress,
  Divider,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import {
  FaBalanceScale,
  FaSearch,
  FaBoxOpen,
  FaEdit,
  FaCheck,
  FaSave,
  FaHistory,
  FaClipboardCheck,
  FaCalendarAlt,
  FaFilter,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { formatCurrency, formatDate } from '@/utils/format';
import Link from 'next/link';
import { useRef } from 'react';
import { useFetchData } from '@/hooks/useFetchData';
import { useEntityCrud } from '@/hooks/useEntityCrud';
import { getStatusColor } from '@/utils/statusHelper';

// Interface para os insumos do inventário
interface InsumoInventario {
  id: number;
  codigo: string;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  precoCusto: number;
  categoria?: {
    id: number;
    nome: string;
  };
  unidadeMedida?: {
    id: number;
    nome: string;
    simbolo: string;
  };
  // Campos para o ajuste
  novoEstoque?: number;
  observacao?: string;
  selecionado?: boolean;
}

// Interface para categorias
interface Categoria {
  id: number;
  nome: string;
}

// Interface para histórico de inventário
interface InventarioHistorico {
  id: number;
  data: string | Date;
  observacoes?: string;
  responsavel: {
    id: number;
    name: string;
  };
  itens: Array<{
    id: number;
    insumoId: number;
    insumoNome: string;
    estoqueAnterior: number;
    estoqueNovo: number;
    diferenca: number;
    unidadeMedida?: string;
  }>;
}

export default function InventarioPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef(null);
  
  // Estados principais
  const [insumos, setInsumos] = useState<InsumoInventario[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para inventário atual
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInsumos, setFilteredInsumos] = useState<InsumoInventario[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');
  const [observacoesInventario, setObservacoesInventario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para histórico
  const [historicoInventarios, setHistoricoInventarios] = useState<InventarioHistorico[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [selectedInventario, setSelectedInventario] = useState<InventarioHistorico | null>(null);
  
  // Estados para modal de detalhes
  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  
  // Cores
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Carregar insumos usando o hook personalizado
  const { data: insumosData, isLoading: isLoadingInsumos, refetch: refetchInsumos } = useFetchData<InsumoInventario>({
    url: '/api/estoque/insumos',
    params: { status: 'true' },
    transformResponse: (data) => data.insumos,
    errorMessage: 'Não foi possível carregar os insumos para inventário',
  });
  
  // Configurar insumos quando dados são carregados
  useEffect(() => {
    if (insumosData) {
      setInsumos(insumosData.map(insumo => ({
        ...insumo,
        novoEstoque: insumo.estoqueAtual,
        selecionado: false
      })));
      setIsLoading(false);
    }
  }, [insumosData]);
  
  // Carregar categorias para o filtro
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('/api/estoque/categorias?status=true');
        if (response.ok) {
          const data = await response.json();
          setCategoriasDisponiveis(data.categorias);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };
    
    fetchCategorias();
  }, []);
  
  // Filtrar insumos quando o termo de busca ou categoria mudar
  useEffect(() => {
    const filteredItems = insumos.filter(insumo => {
      // Filtrar por categoria
      if (categoriaFilter && insumo.categoria?.id.toString() !== categoriaFilter) {
        return false;
      }
      
      // Filtrar por termo de busca (case insensitive)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          insumo.nome.toLowerCase().includes(term) ||
          insumo.codigo.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
    
    setFilteredInsumos(filteredItems);
  }, [insumos, searchTerm, categoriaFilter]);
  
  // Buscar histórico de inventários
  const fetchHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const response = await fetch('/api/estoque/inventario');
      if (!response.ok) {
        throw new Error('Erro ao buscar histórico de inventários');
      }
      
      const data = await response.json();
      setHistoricoInventarios(data.inventarios);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de inventários',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingHistorico(false);
    }
  };
  
  // Carregar histórico na montagem do componente
  useEffect(() => {
    fetchHistorico();
  }, []);
  
  // Handlers para o formulário de inventário
  const handleNovoEstoqueChange = (id: number, value: string) => {
    const novoValor = parseFloat(value) || 0;
    
    setInsumos(insumos.map(insumo => {
      if (insumo.id === id) {
        return {
          ...insumo,
          novoEstoque: novoValor,
          selecionado: novoValor !== insumo.estoqueAtual // Marca como selecionado se o valor for diferente
        };
      }
      return insumo;
    }));
  };
  
  const handleObservacaoChange = (id: number, observacao: string) => {
    setInsumos(insumos.map(insumo => {
      if (insumo.id === id) {
        return {
          ...insumo,
          observacao
        };
      }
      return insumo;
    }));
  };
  
  const handleSelectAllChange = (checked: boolean) => {
    setInsumos(insumos.map(insumo => ({
      ...insumo,
      selecionado: checked
    })));
  };
  
  // Cálculo de estatísticas para o inventário atual
  const getTotalItensSelecionados = () => {
    return insumos.filter(insumo => insumo.selecionado).length;
  };
  
  const getTotalDiferencaEstoque = () => {
    return insumos
      .filter(insumo => insumo.selecionado)
      .reduce((total, insumo) => {
        const diferenca = (insumo.novoEstoque || 0) - insumo.estoqueAtual;
        return total + Math.abs(diferenca);
      }, 0);
  };
  
  const getTotalDiferencaValor = () => {
    return insumos
      .filter(insumo => insumo.selecionado)
      .reduce((total, insumo) => {
        const diferenca = (insumo.novoEstoque || 0) - insumo.estoqueAtual;
        return total + (Math.abs(diferenca) * insumo.precoCusto);
      }, 0);
  };
  
  // Confirmação do inventário
  const handleConfirmInventario = () => {
    const selecionados = insumos.filter(insumo => insumo.selecionado);
    
    if (selecionados.length === 0) {
      toast({
        title: 'Nenhum item selecionado',
        description: 'Selecione pelo menos um item para ajustar o estoque',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Abrir diálogo de confirmação
    onOpen();
  };
  
  const processarInventario = async () => {
    const itensSelecionados = insumos
      .filter(insumo => insumo.selecionado)
      .map(insumo => ({
        insumoId: insumo.id,
        estoqueAtual: insumo.estoqueAtual,
        novoEstoque: insumo.novoEstoque,
        observacao: insumo.observacao
      }));
    
    if (itensSelecionados.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/estoque/inventario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itens: itensSelecionados,
          observacoes: observacoesInventario
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar inventário');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Inventário processado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Recarregar insumos
      refetchInsumos();
      
      // Limpar formulário
      setObservacoesInventario('');
      
      // Recarregar histórico
      fetchHistorico();
      
      // Fechar modal de confirmação
      onClose();
      
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao processar o inventário',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler para visualizar detalhes de um inventário
  const handleViewDetail = (inventario: InventarioHistorico) => {
    setSelectedInventario(inventario);
    onDetailOpen();
  };

  return (
    <Box p={5}>
      <Breadcrumb mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/estoque">Estoque</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Inventário</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" display="flex" alignItems="center">
          <Icon as={FaBalanceScale} mr={2} />
          {tenant ? `Inventário de Estoque - ${tenant.nome}` : 'Inventário de Estoque'}
        </Heading>
      </Flex>
      
      <Tabs colorScheme="teal" isLazy>
        <TabList>
          <Tab><Icon as={FaClipboardCheck} mr={2} />Fazer Inventário</Tab>
          <Tab><Icon as={FaHistory} mr={2} />Histórico de Ajustes</Tab>
        </TabList>
        
        <TabPanels>
          {/* Tab de Realizar Inventário */}
          <TabPanel p={0} pt={5}>
            <Card bg={cardBg} boxShadow="md" mb={6}>
              <CardHeader bg={useColorModeValue('gray.50', 'gray.700')}>
                <VStack align="stretch" spacing={4}>
                  <Heading size="md" mb={2}>Ajuste de Estoque</Heading>
                  
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Como fazer inventário:</Text>
                      <Text>1. Ajuste as quantidades reais de cada item no campo "Novo Estoque"</Text>
                      <Text>2. Os itens com valores diferentes serão selecionados automaticamente</Text>
                      <Text>3. Inclua observações, se necessário</Text>
                      <Text>4. Clique em "Processar Inventário" para confirmar as mudanças</Text>
                    </Box>
                  </Alert>
                  
                  <HStack justify="space-between" wrap="wrap" gap={2}>
                    <FormControl maxW="300px">
                      <FormLabel>Filtrar por Categoria</FormLabel>
                      <Select 
                        value={categoriaFilter} 
                        onChange={(e) => setCategoriaFilter(e.target.value)}
                      >
                        <option value="">Todas as categorias</option>
                        {categoriasDisponiveis.map(cat => (
                          <option key={cat.id} value={cat.id.toString()}>{cat.nome}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl maxW="300px">
                      <FormLabel>Buscar Insumo</FormLabel>
                      <InputGroup>
                        <InputLeftElement>
                          <Icon as={FaSearch} color="gray.300" />
                        </InputLeftElement>
                        <Input
                          placeholder="Nome ou código do insumo"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </FormControl>
                    
                    <FormControl maxW="500px">
                      <FormLabel>Observações do Inventário</FormLabel>
                      <Textarea
                        placeholder="Observações gerais sobre este inventário"
                        value={observacoesInventario}
                        onChange={(e) => setObservacoesInventario(e.target.value)}
                      />
                    </FormControl>
                  </HStack>
                  
                  <HStack justify="space-between" wrap="wrap">
                    <Flex align="center">
                      <input 
                        type="checkbox" 
                        id="selectAll" 
                        onChange={(e) => handleSelectAllChange(e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      <FormLabel htmlFor="selectAll" mb="0">Selecionar Todos</FormLabel>
                    </Flex>
                    
                    <HStack>
                      <Text fontWeight="medium">Itens Selecionados: </Text>
                      <Badge colorScheme="blue" fontSize="md">{getTotalItensSelecionados()}</Badge>
                      
                      <Text fontWeight="medium" ml={4}>Diferença Total: </Text>
                      <Badge colorScheme="purple" fontSize="md">{getTotalDiferencaEstoque().toFixed(2)} un.</Badge>
                      
                      <Text fontWeight="medium" ml={4}>Valor do Ajuste: </Text>
                      <Badge colorScheme="green" fontSize="md">{formatCurrency(getTotalDiferencaValor())}</Badge>
                    </HStack>
                  </HStack>
                </VStack>
              </CardHeader>
              
              <CardBody overflow="auto">
                {isLoading ? (
                  <Flex justify="center" p={8}>
                    <Spinner size="xl" />
                  </Flex>
                ) : filteredInsumos.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    Nenhum insumo encontrado com os filtros selecionados.
                  </Alert>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                        <Tr>
                          <Th width="40px">Sel.</Th>
                          <Th>Insumo</Th>
                          <Th>Categoria</Th>
                          <Th isNumeric>Estoque Atual</Th>
                          <Th isNumeric>Novo Estoque</Th>
                          <Th isNumeric>Diferença</Th>
                          <Th>Observação</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredInsumos.map((insumo) => {
                          const diferenca = (insumo.novoEstoque || 0) - insumo.estoqueAtual;
                          return (
                            <Tr key={insumo.id} bg={insumo.selecionado ? useColorModeValue('yellow.50', 'yellow.900') : undefined}>
                              <Td>
                                <input 
                                  type="checkbox" 
                                  checked={insumo.selecionado}
                                  onChange={(e) => {
                                    setInsumos(insumos.map(item => 
                                      item.id === insumo.id ? {...item, selecionado: e.target.checked} : item
                                    ));
                                  }}
                                />
                              </Td>
                              <Td fontWeight="medium">
                                <Text>{insumo.nome}</Text>
                                <Text fontSize="xs" color="gray.500">{insumo.codigo}</Text>
                              </Td>
                              <Td>{insumo.categoria?.nome || '-'}</Td>
                              <Td isNumeric>
                                {insumo.estoqueAtual.toFixed(2)} {insumo.unidadeMedida?.simbolo || ''}
                              </Td>
                              <Td>
                                <NumberInput 
                                  min={0} 
                                  step={0.1}
                                  value={insumo.novoEstoque}
                                  onChange={(value) => handleNovoEstoqueChange(insumo.id, value)}
                                  size="sm"
                                >
                                  <NumberInputField textAlign="right" />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </Td>
                              <Td isNumeric>
                                <Text 
                                  color={
                                    diferenca > 0 ? 'green.500' : 
                                    diferenca < 0 ? 'red.500' : 
                                    undefined
                                  }
                                  fontWeight={diferenca !== 0 ? 'bold' : 'normal'}
                                >
                                  {diferenca > 0 ? '+' : ''}{diferenca.toFixed(2)} {insumo.unidadeMedida?.simbolo || ''}
                                </Text>
                              </Td>
                              <Td>
                                <Input 
                                  placeholder="Motivo do ajuste"
                                  size="sm"
                                  value={insumo.observacao || ''}
                                  onChange={(e) => handleObservacaoChange(insumo.id, e.target.value)}
                                />
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                )}
                
                <Flex justify="center" mt={6}>
                  <Button 
                    colorScheme="green" 
                    leftIcon={<FaSave />}
                    size="lg"
                    onClick={handleConfirmInventario}
                    isDisabled={getTotalItensSelecionados() === 0}
                    px={10}
                  >
                    Processar Inventário
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Tab de Histórico de Inventários */}
          <TabPanel p={0} pt={5}>
            <Card bg={cardBg} boxShadow="md">
              <CardHeader>
                <Heading size="md">Histórico de Inventários</Heading>
              </CardHeader>
              
              <CardBody>
                {loadingHistorico ? (
                  <Flex justify="center" p={8}>
                    <Spinner size="xl" />
                  </Flex>
                ) : historicoInventarios.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    Nenhum registro de inventário encontrado.
                  </Alert>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Data</Th>
                          <Th>Responsável</Th>
                          <Th isNumeric>Itens Ajustados</Th>
                          <Th>Observações</Th>
                          <Th>Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {historicoInventarios.map((inventario) => (
                          <Tr key={inventario.id}>
                            <Td whiteSpace="nowrap">{formatDate(inventario.data)}</Td>
                            <Td>{inventario.responsavel?.name || 'Sistema'}</Td>
                            <Td isNumeric>
                              <Badge colorScheme="blue" fontSize="md">
                                {inventario.itens.length}
                              </Badge>
                            </Td>
                            <Td>
                              {inventario.observacoes || '-'}
                            </Td>
                            <Td>
                              <Button
                                size="sm"
                                colorScheme="teal"
                                leftIcon={<FaEdit />}
                                onClick={() => handleViewDetail(inventario)}
                              >
                                Detalhes
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Diálogo de confirmação */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar Ajuste de Estoque
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack align="start" spacing={4}>
                <Text>
                  Você está prestes a ajustar {getTotalItensSelecionados()} {getTotalItensSelecionados() === 1 ? 'item' : 'itens'} de estoque.
                </Text>
                <Text>
                  Diferença total: {getTotalDiferencaEstoque().toFixed(2)} unidades
                </Text>
                <Text>
                  Valor do ajuste: {formatCurrency(getTotalDiferencaValor())}
                </Text>
                <Alert status="warning">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Esta ação atualizará o estoque real e não pode ser desfeita. Deseja continuar?
                  </Text>
                </Alert>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} isDisabled={isSubmitting}>
                Cancelar
              </Button>
              <Button 
                colorScheme="green" 
                onClick={processarInventario} 
                ml={3}
                isLoading={isSubmitting}
              >
                Confirmar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* Modal de detalhes do inventário */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Detalhes do Inventário
            <Text fontSize="sm" color="gray.500" mt={1}>
              Realizado em {selectedInventario ? formatDate(selectedInventario.data) : ''}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedInventario && (
              <VStack align="stretch" spacing={4}>
                <HStack>
                  <Text fontWeight="bold">Responsável:</Text>
                  <Text>{selectedInventario.responsavel?.name || 'Sistema'}</Text>
                </HStack>
                
                {selectedInventario.observacoes && (
                  <Box>
                    <Text fontWeight="bold">Observações:</Text>
                    <Text>{selectedInventario.observacoes}</Text>
                  </Box>
                )}
                
                <Divider />
                
                <Text fontWeight="bold">Itens Ajustados:</Text>
                
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Insumo</Th>
                      <Th isNumeric>Estoque Anterior</Th>
                      <Th isNumeric>Novo Estoque</Th>
                      <Th isNumeric>Diferença</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {selectedInventario.itens.map((item) => (
                      <Tr key={item.id}>
                        <Td>{item.insumoNome}</Td>
                        <Td isNumeric>{item.estoqueAnterior.toFixed(2)} {item.unidadeMedida}</Td>
                        <Td isNumeric>{item.estoqueNovo.toFixed(2)} {item.unidadeMedida}</Td>
                        <Td isNumeric>
                          <Text 
                            color={
                              item.diferenca > 0 ? 'green.500' : 
                              item.diferenca < 0 ? 'red.500' : 
                              undefined
                            }
                            fontWeight="bold"
                          >
                            {item.diferenca > 0 ? '+' : ''}{item.diferenca.toFixed(2)} {item.unidadeMedida}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onDetailClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
