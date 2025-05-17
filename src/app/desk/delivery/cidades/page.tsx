'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Badge,
  Spinner,
  Flex,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Select,
  Switch,
  useDisclosure,
  useColorModeValue,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Icon,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaSave, FaCity, FaFilter, FaMoneyBillWave, FaSearch } from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { formatCurrency } from '@/utils/format';

// Interface para a cidade
interface Cidade {
  id?: number;
  nome: string;
  estado: string;
  valorEntrega?: number;
  tempoEstimado?: string;
  ativo: boolean;
  _count?: {
    bairros: number;
  };
}

// Interface para estado do IBGE
interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

// Interface para cidade do IBGE
interface CidadeIBGE {
  id: number;
  nome: string;
}

export default function CidadesEntregaPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  
  // Estados
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [estadosIBGE, setEstadosIBGE] = useState<Estado[]>([]);
  const [cidadesIBGE, setCidadesIBGE] = useState<CidadeIBGE[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIBGE, setIsLoadingIBGE] = useState(false);
  const [cidadeForm, setCidadeForm] = useState<Cidade>({
    nome: '',
    estado: '',
    valorEntrega: 0,
    tempoEstimado: '30-45',
    ativo: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCidade, setSelectedCidade] = useState<Cidade | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  
  // Disclosure para o modal de edição/adição
  const { 
    isOpen: isModalOpen, 
    onOpen: onModalOpen, 
    onClose: onModalClose 
  } = useDisclosure();
  
  // Disclosure para o modal de confirmação de exclusão
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  
  // Buscar cidades
  const fetchCidades = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/delivery/cidades?includeInactive=true');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar cidades');
      }
      
      const data = await response.json();
      setCidades(data.cidades || []);
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as cidades disponíveis',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Buscar estados do IBGE
  const fetchEstados = useCallback(async () => {
    try {
      const response = await fetch('/api/delivery/ibge?tipo=estados');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar estados do IBGE');
      }
      
      const data = await response.json();
      setEstadosIBGE(data.estados || []);
    } catch (error) {
      console.error('Erro ao buscar estados do IBGE:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os estados do IBGE',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);
  
  // Buscar cidades do IBGE por estado
  const fetchCidadesIBGE = useCallback(async (uf: string) => {
    if (!uf) {
      setCidadesIBGE([]);
      return;
    }
    
    try {
      setIsLoadingIBGE(true);
      
      const response = await fetch(`/api/delivery/ibge?tipo=cidades&uf=${uf}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar cidades do IBGE');
      }
      
      const data = await response.json();
      setCidadesIBGE(data.cidades || []);
    } catch (error) {
      console.error('Erro ao buscar cidades do IBGE:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as cidades do IBGE',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingIBGE(false);
    }
  }, [toast]);
  
  // Carregar dados iniciais
  useEffect(() => {
    fetchCidades();
    fetchEstados();
  }, [fetchCidades, fetchEstados]);
  
  // Buscar cidades quando o estado for selecionado
  useEffect(() => {
    if (selectedEstado) {
      fetchCidadesIBGE(selectedEstado);
    }
  }, [selectedEstado, fetchCidadesIBGE]);
  
  // Filtrar cidades IBGE pelo texto de busca
  const filteredCidadesIBGE = cidadesIBGE.filter(c => 
    searchText ? c.nome.toLowerCase().includes(searchText.toLowerCase()) : true
  );
  
  // Limpar formulário
  const resetForm = () => {
    setCidadeForm({
      nome: '',
      estado: '',
      valorEntrega: 0,
      tempoEstimado: '30-45',
      ativo: true
    });
    setErrors({});
  };
  
  // Abrir modal para adicionar nova cidade
  const handleAddCidade = () => {
    resetForm();
    setSelectedCidade(null);
    onModalOpen();
  };
  
  // Abrir modal para editar cidade existente
  const handleEditCidade = (cidade: Cidade) => {
    setCidadeForm({
      ...cidade,
      valorEntrega: cidade.valorEntrega || 0
    });
    setSelectedCidade(cidade);
    onModalOpen();
  };
  
  // Preparar para excluir cidade
  const handleDeleteClick = (cidade: Cidade) => {
    setSelectedCidade(cidade);
    onDeleteOpen();
  };
  
  // Confirmar exclusão de cidade
  const handleConfirmDelete = async () => {
    if (!selectedCidade?.id) return;
    
    try {
      const response = await fetch(`/api/delivery/cidades/${selectedCidade.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir cidade');
      }
      
      toast({
        title: 'Sucesso',
        description: data.message || 'Cidade removida com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchCidades();
      onDeleteClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir cidade',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handler para mudanças no formulário
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | 
    { target: { name: string, value: any } }
  ) => {
    const { name, value } = e.target;
    setCidadeForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro quando o campo for editado
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validação de formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!cidadeForm.nome.trim()) {
      newErrors.nome = 'Nome da cidade é obrigatório';
    }
    
    if (!cidadeForm.estado) {
      newErrors.estado = 'Estado é obrigatório';
    }
    
    if (cidadeForm.valorEntrega !== undefined && cidadeForm.valorEntrega < 0) {
      newErrors.valorEntrega = 'Valor de entrega não pode ser negativo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Salvar cidade (criar ou atualizar)
  const handleSaveCidade = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const isUpdate = !!selectedCidade?.id;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate 
        ? `/api/delivery/cidades/${selectedCidade.id}` 
        : '/api/delivery/cidades';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cidadeForm),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar cidade');
      }
      
      toast({
        title: 'Sucesso',
        description: `Cidade ${isUpdate ? 'atualizada' : 'adicionada'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchCidades();
      onModalClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar cidade',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Adicionar cidade do IBGE
  const handleAddIBGECidade = async (cidadeIBGE: CidadeIBGE) => {
    try {
      // Verificar se a cidade já está cadastrada
      const cidadeExistente = cidades.find(c => 
        c.nome === cidadeIBGE.nome && c.estado === selectedEstado
      );
      
      if (cidadeExistente) {
        toast({
          title: 'Atenção',
          description: 'Esta cidade já está cadastrada',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const novoForm: Cidade = {
        nome: cidadeIBGE.nome,
        estado: selectedEstado,
        valorEntrega: 0,
        tempoEstimado: '30-45',
        ativo: true
      };
      
      const response = await fetch('/api/delivery/cidades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoForm),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar cidade');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Cidade adicionada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchCidades();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar cidade',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box p={5}>
      <HStack mb={6} justify="space-between">
        <Heading size="lg">
          {tenant ? `Cidades Disponíveis - ${tenant.nome}` : 'Cidades Disponíveis'}
        </Heading>
        

      </HStack>
      
      <Tabs 
        colorScheme="teal" 
        mb={6} 
        index={activeTab}
        onChange={(index) => setActiveTab(index)}
      >
        <TabList>
          <Tab>Cidades Cadastradas</Tab>
          <Tab>Adicionar da Lista IBGE</Tab>
        </TabList>
        
        <TabPanels>
          {/* Primeira Tab - Cidades Cadastradas */}
          <TabPanel p={0} pt={4}>
            <Card bg={bgCard} boxShadow="md">
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaCity} color="teal.500" />
                    <Text fontWeight="bold">Cidades Disponíveis para Entrega</Text>
                  </HStack>
                </Flex>
              </CardHeader>
              
              <CardBody>
                {isLoading ? (
                  <Flex justify="center" p={8}>
                    <Spinner size="xl" />
                  </Flex>
                ) : cidades.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" py={8}>
                    <Icon as={FaCity} boxSize={12} color="gray.300" mb={4} />
                    <Text color="gray.500" fontSize="lg" mb={4}>
                      Nenhuma cidade disponível cadastrada
                    </Text>
                    <Button 
                      leftIcon={<FaPlus />} 
                      colorScheme="teal"
                      onClick={handleAddCidade}
                    >
                      Adicionar Cidade
                    </Button>
                  </Flex>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Cidade</Th>
                          <Th>Estado</Th>
                          <Th>Taxa de Entrega</Th>
                          <Th>Tempo Estimado</Th>
                          <Th>Bairros</Th>
                          <Th>Status</Th>
                          <Th textAlign="center">Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {cidades.map((cidade) => (
                          <Tr key={cidade.id}>
                            <Td>
                              <Text fontWeight="medium">{cidade.nome}</Text>
                            </Td>
                            <Td>{cidade.estado}</Td>
                            <Td>
                              {cidade.valorEntrega !== undefined 
                                ? formatCurrency(cidade.valorEntrega) 
                                : formatCurrency(0)
                              }
                            </Td>
                            <Td>{cidade.tempoEstimado || '30-45'} min</Td>
                            <Td>
                              <Badge colorScheme="purple">
                                {cidade._count?.bairros || 0} bairros
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={cidade.ativo ? 'green' : 'red'}>
                                {cidade.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2} justify="center">
                                <IconButton
                                  aria-label="Editar cidade"
                                  icon={<FaEdit />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleEditCidade(cidade)}
                                />
                                <IconButton
                                  aria-label="Excluir cidade"
                                  icon={<FaTrash />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDeleteClick(cidade)}
                                  isDisabled={cidade._count?.bairros ? cidade._count.bairros > 0 : false}
                                  title={cidade._count?.bairros ? "Não é possível excluir cidades com bairros" : ""}
                                />
                              </HStack>
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
          
          {/* Segunda Tab - Adicionar da Lista IBGE */}
          <TabPanel p={0} pt={4}>
            <Card bg={bgCard} boxShadow="md">
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaFilter} color="teal.500" />
                    <Text fontWeight="bold">Selecione um estado para ver as cidades</Text>
                  </HStack>
                </Flex>
              </CardHeader>
              
              <CardBody>
                <HStack mb={6}>
                  <FormControl>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      value={selectedEstado}
                      onChange={(e) => setSelectedEstado(e.target.value)}
                      placeholder="Selecione um estado"
                    >
                      {estadosIBGE.map(estado => (
                        <option key={estado.id} value={estado.sigla}>
                          {estado.sigla} - {estado.nome}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {selectedEstado && (
                    <FormControl>
                      <FormLabel>Buscar cidade</FormLabel>
                      <InputGroup>
                        <Input
                          placeholder="Digite o nome da cidade"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                        />
                        <InputLeftAddon>
                          <Icon as={FaSearch} />
                        </InputLeftAddon>
                      </InputGroup>
                    </FormControl>
                  )}
                </HStack>
                
                {isLoadingIBGE ? (
                  <Flex justify="center" p={8}>
                    <Spinner size="xl" />
                  </Flex>
                ) : !selectedEstado ? (
                  <Flex direction="column" align="center" justify="center" py={8}>
                    <Icon as={FaFilter} boxSize={12} color="gray.300" mb={4} />
                    <Text color="gray.500" fontSize="lg">
                      Selecione um estado para ver as cidades disponíveis
                    </Text>
                  </Flex>
                ) : filteredCidadesIBGE.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" py={8}>
                    <Icon as={FaCity} boxSize={12} color="gray.300" mb={4} />
                    <Text color="gray.500" fontSize="lg">
                      Nenhuma cidade encontrada com os critérios selecionados
                    </Text>
                  </Flex>
                ) : (
                  <Box overflowX="auto" maxH="500px" overflowY="auto">
                    <Table variant="simple">
                      <Thead position="sticky" top={0} bg={bgCard} zIndex={1}>
                        <Tr>
                          <Th>Cidade</Th>
                          <Th>Já Cadastrada</Th>
                          <Th textAlign="center">Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredCidadesIBGE.map((cidadeIBGE) => {
                          const jaCadastrada = cidades.some(c => 
                            c.nome === cidadeIBGE.nome && c.estado === selectedEstado
                          );
                          return (
                            <Tr key={cidadeIBGE.id}>
                              <Td>
                                <Text fontWeight="medium">{cidadeIBGE.nome}</Text>
                              </Td>
                              <Td>
                                <Badge colorScheme={jaCadastrada ? "green" : "gray"}>
                                  {jaCadastrada ? "Sim" : "Não"}
                                </Badge>
                              </Td>
                              <Td textAlign="center">
                                <Button
                                  size="sm"
                                  colorScheme="teal"
                                  leftIcon={<FaPlus />}
                                  onClick={() => handleAddIBGECidade(cidadeIBGE)}
                                  isDisabled={jaCadastrada}
                                >
                                  Adicionar
                                </Button>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Modal para adicionar/editar cidade */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedCidade ? 'Editar Cidade' : 'Nova Cidade'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <FormControl isRequired isInvalid={!!errors.nome} mb={4}>
              <FormLabel>Nome da Cidade</FormLabel>
              <Input
                name="nome"
                value={cidadeForm.nome}
                onChange={handleFormChange}
                placeholder="Ex: São Paulo"
              />
              {errors.nome && (
                <FormErrorMessage>{errors.nome}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.estado} mb={4}>
              <FormLabel>Estado</FormLabel>
              <Select
                name="estado"
                value={cidadeForm.estado}
                onChange={handleFormChange}
                placeholder="Selecione o estado"
              >
                {estadosIBGE.map(estado => (
                  <option key={estado.id} value={estado.sigla}>
                    {estado.sigla} - {estado.nome}
                  </option>
                ))}
              </Select>
              {errors.estado && (
                <FormErrorMessage>{errors.estado}</FormErrorMessage>
              )}
            </FormControl>
            
            <HStack align="start" spacing={4} mb={4}>
              <FormControl isInvalid={!!errors.valorEntrega}>
                <FormLabel>Taxa de Entrega</FormLabel>
                <InputGroup>
                  <InputLeftAddon>R$</InputLeftAddon>
                  <NumberInput
                    min={0}
                    step={0.5}
                    value={cidadeForm.valorEntrega}
                    onChange={(value) => 
                      handleFormChange({ 
                        target: { 
                          name: 'valorEntrega', 
                          value: parseFloat(value) 
                        } 
                      })
                    }
                    width="100%"
                  >
                    <NumberInputField borderLeftRadius={0} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </InputGroup>
                {errors.valorEntrega && (
                  <FormErrorMessage>{errors.valorEntrega}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl>
                <FormLabel>Tempo Estimado (min)</FormLabel>
                <Input
                  name="tempoEstimado"
                  value={cidadeForm.tempoEstimado || ''}
                  onChange={handleFormChange}
                  placeholder="Ex: 30-45"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Formato: "30-45" (mínimo-máximo)
                </Text>
              </FormControl>
            </HStack>
            
            <FormControl display="flex" alignItems="center" mb={4}>
              <FormLabel htmlFor="ativo" mb="0">
                Cidade Ativa
              </FormLabel>
              <Switch
                id="ativo"
                name="ativo"
                isChecked={cidadeForm.ativo}
                onChange={(e) => 
                  handleFormChange({ 
                    target: { 
                      name: 'ativo', 
                      value: e.target.checked 
                    } 
                  })
                }
                colorScheme="teal"
              />
            </FormControl>
            
            <Box p={4} bg="blue.50" borderRadius="md">
              <HStack>
                <Icon as={FaMoneyBillWave} color="blue.500" />
                <Text fontWeight="medium" color="blue.700">
                  Informações de Cobrança
                </Text>
              </HStack>
              <Text fontSize="sm" color="blue.700" mt={2}>
                A taxa de entrega definida aqui será usada como padrão para toda a cidade.
                Você também pode definir valores diferentes para grupos de bairros ou bairros específicos
                nas seções Grupos de Bairros e Bairros.
              </Text>
            </Box>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onModalClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="teal" 
              leftIcon={<FaSave />}
              onClick={handleSaveCidade}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Confirmação de exclusão */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={undefined}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Cidade
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir a cidade <strong>{selectedCidade?.nome} - {selectedCidade?.estado}</strong>? 
              Esta ação não poderá ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleConfirmDelete} 
                ml={3}
              >
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
