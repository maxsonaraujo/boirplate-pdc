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
  VStack,
  Divider,
  InputRightElement,
  Tooltip,
  Textarea,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaSave, FaCity, FaFilter, FaMoneyBillWave, FaSearch, FaInfoCircle, FaLayerGroup } from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { formatCurrency } from '@/utils/format';

// Interface para cidade
interface Cidade {
  id: number;
  nome: string;
  estado: string;
  valorEntrega: number;
  tempoEstimado?: string;
  ativo: boolean;
  _count?: {
    bairros: number;
  };
}

// Interface para bairro
interface Bairro {
  id?: number;
  nome: string;
  cidadeId: number;
  grupoBairroId?: number | null;
  valorEntregaPersonalizado?: number | null;
  tempoEstimadoPersonalizado?: string | null;
  ativo: boolean;
  cidade?: {
    nome: string;
    estado: string;
    valorEntrega: number;
    tempoEstimado?: string;
  };
  grupoBairro?: {
    id: number;
    nome: string;
    valorEntrega: number;
    tempoEstimado?: string;
  } | null;
}

// Interface para grupo de bairros
interface GrupoBairro {
  id?: number;
  nome: string;
  descricao?: string;
  valorEntrega: number;
  tempoEstimado?: string;
  ativo: boolean;
  _count?: {
    bairros: number;
  };
}

export default function BairrosPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  
  // Estados
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [gruposBairro, setGruposBairro] = useState<GrupoBairro[]>([]);
  const [filteredBairros, setFilteredBairros] = useState<Bairro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBairros, setIsLoadingBairros] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedCidadeId, setSelectedCidadeId] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [selectedBairro, setSelectedBairro] = useState<Bairro | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoBairro | null>(null);
  
  // Estado para formulário de bairro
  const [bairroForm, setBairroForm] = useState<Bairro>({
    nome: '',
    cidadeId: 0,
    grupoBairroId: null,
    valorEntregaPersonalizado: null,
    tempoEstimadoPersonalizado: null,
    ativo: true
  });
  
  // Estado para formulário de grupo
  const [grupoForm, setGrupoForm] = useState<GrupoBairro>({
    nome: '',
    descricao: '',
    valorEntrega: 0,
    tempoEstimado: '30-45',
    ativo: true
  });
  
  // Estado para erros de formulário
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Modais
  const { 
    isOpen: isBairroModalOpen, 
    onOpen: onBairroModalOpen, 
    onClose: onBairroModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isGrupoModalOpen, 
    onOpen: onGrupoModalOpen, 
    onClose: onGrupoModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  
  // Buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar cidades
        const cidadesResponse = await fetch('/api/delivery/cidades');
        const cidadesData = await cidadesResponse.json();
        setCidades(cidadesData.cidades || []);
        
        // Buscar grupos de bairros
        const gruposResponse = await fetch('/api/delivery/bairros/grupos');
        const gruposData = await gruposResponse.json();
        setGruposBairro(gruposData.grupos || []);
        
        // Buscar todos os bairros
        const bairrosResponse = await fetch('/api/delivery/bairros?includeInactive=true');
        const bairrosData = await bairrosResponse.json();
        setBairros(bairrosData.bairros || []);
        setFilteredBairros(bairrosData.bairros || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados de bairros',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Filtrar bairros quando mudar a cidade selecionada ou texto de busca
  useEffect(() => {
    let filtered = [...bairros];
    
    // Filtrar por cidade
    if (selectedCidadeId) {
      filtered = filtered.filter(bairro => bairro.cidadeId === parseInt(selectedCidadeId));
    }
    
    // Filtrar por texto de busca
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(bairro => 
        bairro.nome.toLowerCase().includes(searchLower) ||
        bairro.cidade?.nome.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredBairros(filtered);
  }, [selectedCidadeId, searchText, bairros]);
  
  // Buscar bairros específicos de uma cidade
  const fetchBairrosByCidade = useCallback(async (cidadeId: number) => {
    try {
      setIsLoadingBairros(true);
      
      const response = await fetch(`/api/delivery/bairros?cidadeId=${cidadeId}&includeInactive=true`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar bairros');
      }
      
      const data = await response.json();
      return data.bairros || [];
    } catch (error) {
      console.error('Erro ao buscar bairros:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os bairros',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return [];
    } finally {
      setIsLoadingBairros(false);
    }
  }, [toast]);
  
  // Handlers para formulário de bairro
  const resetBairroForm = () => {
    setBairroForm({
      nome: '',
      cidadeId: parseInt(selectedCidadeId) || 0,
      grupoBairroId: null,
      valorEntregaPersonalizado: null,
      tempoEstimadoPersonalizado: null,
      ativo: true
    });
    setErrors({});
  };
  
  const handleAddBairro = () => {
    resetBairroForm();
    setSelectedBairro(null);
    onBairroModalOpen();
  };
  
  const handleEditBairro = (bairro: Bairro) => {
    setBairroForm({
      ...bairro,
      cidadeId: bairro.cidadeId,
      grupoBairroId: bairro.grupoBairroId || null,
      valorEntregaPersonalizado: bairro.valorEntregaPersonalizado,
      tempoEstimadoPersonalizado: bairro.tempoEstimadoPersonalizado || null
    });
    setSelectedBairro(bairro);
    onBairroModalOpen();
  };
  
  const handleBairroChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | 
    { target: { name: string, value: any } }
  ) => {
    const { name, value } = e.target;
    
    // Tratamento especial para campos numéricos
    if (name === 'cidadeId') {
      setBairroForm(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : 0
      }));
    } else {
      setBairroForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpar erro quando o campo for editado
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateBairroForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!bairroForm.nome.trim()) {
      newErrors.nome = 'Nome do bairro é obrigatório';
    }
    
    if (!bairroForm.cidadeId) {
      newErrors.cidadeId = 'Cidade é obrigatória';
    }
    
    if (bairroForm.valorEntregaPersonalizado !== null && bairroForm.valorEntregaPersonalizado < 0) {
      newErrors.valorEntregaPersonalizado = 'Valor de entrega não pode ser negativo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSaveBairro = async () => {
    if (!validateBairroForm()) {
      return;
    }
    
    try {
      const isUpdate = !!selectedBairro?.id;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate 
        ? `/api/delivery/bairros/${selectedBairro.id}` 
        : '/api/delivery/bairros';
      
      // Garantir que cidadeId seja um número
      const formData = {
        ...bairroForm,
        cidadeId: typeof bairroForm.cidadeId === 'string' 
          ? parseInt(bairroForm.cidadeId)
          : bairroForm.cidadeId
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar bairro');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Sucesso',
        description: `Bairro ${isUpdate ? 'atualizado' : 'adicionado'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar dados
      if (isUpdate) {
        setBairros(prev => prev.map(b => b.id === selectedBairro.id ? data.bairro : b));
      } else {
        setBairros(prev => [...prev, data.bairro]);
      }
      
      onBairroModalClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar bairro',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleDeleteBairro = (bairro: Bairro) => {
    setSelectedBairro(bairro);
    onDeleteOpen();
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedBairro?.id) return;
    
    try {
      const response = await fetch(`/api/delivery/bairros/${selectedBairro.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir bairro');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Bairro removido com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Remover da lista
      setBairros(prev => prev.filter(b => b.id !== selectedBairro.id));
      onDeleteClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir bairro',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handlers para formulário de grupo
  const resetGrupoForm = () => {
    setGrupoForm({
      nome: '',
      descricao: '',
      valorEntrega: 0,
      tempoEstimado: '30-45',
      ativo: true
    });
    setErrors({});
  };
  
  const handleAddGrupo = () => {
    resetGrupoForm();
    setSelectedGrupo(null);
    onGrupoModalOpen();
  };
  
  const handleEditGrupo = (grupo: GrupoBairro) => {
    setGrupoForm({
      ...grupo,
      valorEntrega: grupo.valorEntrega,
      tempoEstimado: grupo.tempoEstimado || '30-45'
    });
    setSelectedGrupo(grupo);
    onGrupoModalOpen();
  };
  
  const handleGrupoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | 
    { target: { name: string, value: any } }
  ) => {
    const { name, value } = e.target;
    setGrupoForm(prev => ({
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
  
  const validateGrupoForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!grupoForm.nome.trim()) {
      newErrors.nome = 'Nome do grupo é obrigatório';
    }
    
    if (grupoForm.valorEntrega < 0) {
      newErrors.valorEntrega = 'Valor de entrega não pode ser negativo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSaveGrupo = async () => {
    if (!validateGrupoForm()) {
      return;
    }
    
    try {
      const isUpdate = !!selectedGrupo?.id;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate 
        ? `/api/delivery/bairros/grupos/${selectedGrupo.id}` 
        : '/api/delivery/bairros/grupos';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grupoForm),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar grupo');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Sucesso',
        description: `Grupo ${isUpdate ? 'atualizado' : 'adicionado'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar dados
      if (isUpdate) {
        setGruposBairro(prev => prev.map(g => g.id === selectedGrupo.id ? data.grupo : g));
      } else {
        setGruposBairro(prev => [...prev, data.grupo]);
      }
      
      onGrupoModalClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar grupo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleDeleteGrupo = (grupo: GrupoBairro) => {
    setSelectedGrupo(grupo);
    onDeleteOpen();
  };
  
  // Exibir valor de entrega formatado com a fonte correta
  const renderEntregaValue = (bairro: Bairro) => {
    let valor = null;
    let source = '';
    
    if (bairro.valorEntregaPersonalizado !== null) {
      valor = bairro.valorEntregaPersonalizado;
      source = 'bairro';
    } else if (bairro.grupoBairro?.valorEntrega !== undefined) {
      valor = bairro.grupoBairro.valorEntrega;
      source = 'grupo';
    } else if (bairro.cidade?.valorEntrega !== undefined) {
      valor = bairro.cidade.valorEntrega;
      source = 'cidade';
    }
    
    return (
      <Flex align="center">
        <Text 
          fontWeight={source === 'bairro' ? 'bold' : 'normal'}
          color={source === 'bairro' ? 'teal.500' : source === 'grupo' ? 'blue.500' : 'gray.600'}
        >
          {formatCurrency(valor || 0)}
        </Text>
        
        <Tooltip 
          label={
            source === 'bairro' ? 'Valor específico para este bairro' : 
            source === 'grupo' ? `Valor do grupo "${bairro.grupoBairro?.nome}"` : 
            `Valor padrão da cidade "${bairro.cidade?.nome}"`
          }
        >
          <Box ml={1}>
            <Icon 
              as={FaInfoCircle} 
              color={source === 'bairro' ? 'teal.500' : source === 'grupo' ? 'blue.500' : 'gray.400'}
              fontSize="xs"
            />
          </Box>
        </Tooltip>
      </Flex>
    );
  };
  
  return (
    <Box p={5}>
      <HStack mb={6} justify="space-between">
        <Heading size="lg">
          {tenant ? `Gerenciamento de Bairros - ${tenant.nome}` : 'Gerenciamento de Bairros'}
        </Heading>
      </HStack>
      
      <Tabs 
        colorScheme="teal" 
        mb={6} 
        index={activeTab}
        onChange={(index) => setActiveTab(index)}
      >
        <TabList>
          <Tab>Bairros</Tab>
          <Tab>Grupos de Bairros</Tab>
        </TabList>
        
        <TabPanels>
          {/* Tab de Bairros */}
          <TabPanel p={0} pt={4}>
            <Card bg={bgCard} boxShadow="md" mb={6}>
              <CardHeader>
                <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                  <HStack>
                    <Icon as={FaMapMarkerAlt} color="teal.500" />
                    <Text fontWeight="bold">Gerenciar Preços de Entrega por Bairro</Text>
                  </HStack>
                  
                  <Button 
                    leftIcon={<FaPlus />} 
                    colorScheme="teal"
                    onClick={handleAddBairro}
                  >
                    Novo Bairro
                  </Button>
                </Flex>
              </CardHeader>
              
              <CardBody>
                <HStack mb={6} spacing={4}>
                  <FormControl>
                    <FormLabel>Filtrar por Cidade</FormLabel>
                    <Select
                      value={selectedCidadeId}
                      onChange={(e) => setSelectedCidadeId(e.target.value)}
                      placeholder="Todas as cidades"
                    >
                      {cidades.map(cidade => (
                        <option key={cidade.id} value={cidade.id}>
                          {cidade.nome} - {cidade.estado}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Pesquisar</FormLabel>
                    <InputGroup>
                      <Input
                        placeholder="Nome do bairro"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                      <InputRightElement>
                        <Icon as={FaSearch} color="gray.400" />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                </HStack>
              
                {isLoading ? (
                  <Flex justify="center" p={8}>
                    <Spinner size="xl" />
                  </Flex>
                ) : filteredBairros.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" py={8}>
                    <Icon as={FaMapMarkerAlt} boxSize={12} color="gray.300" mb={4} />
                    <Text color="gray.500" fontSize="lg" mb={4}>
                      {selectedCidadeId 
                        ? 'Nenhum bairro cadastrado para esta cidade' 
                        : 'Nenhum bairro cadastrado'
                      }
                    </Text>
                    <Button 
                      leftIcon={<FaPlus />} 
                      colorScheme="teal"
                      onClick={handleAddBairro}
                    >
                      Adicionar Bairro
                    </Button>
                  </Flex>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Bairro</Th>
                          <Th>Cidade</Th>
                          <Th>Grupo</Th>
                          <Th>Taxa de Entrega</Th>
                          <Th>Tempo Estimado</Th>
                          <Th>Status</Th>
                          <Th textAlign="center">Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredBairros.map(bairro => (
                          <Tr key={bairro.id}>
                            <Td fontWeight="medium">{bairro.nome}</Td>
                            <Td>
                              {bairro.cidade 
                                ? `${bairro.cidade.nome} - ${bairro.cidade.estado}` 
                                : 'N/A'
                              }
                            </Td>
                            <Td>
                              {bairro.grupoBairro 
                                ? (
                                  <Badge colorScheme="blue">
                                    {bairro.grupoBairro.nome}
                                  </Badge>
                                ) 
                                : 'Nenhum'
                              }
                            </Td>
                            <Td>{renderEntregaValue(bairro)}</Td>
                            <Td>
                              {bairro.tempoEstimadoPersonalizado 
                                ? <Text fontWeight="bold">{bairro.tempoEstimadoPersonalizado} min</Text> 
                                : bairro.grupoBairro?.tempoEstimado 
                                  ? <Text color="blue.500">{bairro.grupoBairro.tempoEstimado} min</Text>
                                  : bairro.cidade?.tempoEstimado 
                                    ? <Text color="gray.600">{bairro.cidade.tempoEstimado} min</Text>
                                    : '30-45 min'
                              }
                            </Td>
                            <Td>
                              <Badge colorScheme={bairro.ativo ? 'green' : 'red'}>
                                {bairro.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2} justify="center">
                                <IconButton
                                  aria-label="Editar bairro"
                                  icon={<FaEdit />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleEditBairro(bairro)}
                                />
                                <IconButton
                                  aria-label="Excluir bairro"
                                  icon={<FaTrash />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDeleteBairro(bairro)}
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
          
          {/* Tab de Grupos de Bairros */}
          <TabPanel p={0} pt={4}>
            <Card bg={bgCard} boxShadow="md" mb={6}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaLayerGroup} color="teal.500" />
                    <Text fontWeight="bold">Grupos de Bairros</Text>
                  </HStack>
                  
                  <Button 
                    leftIcon={<FaPlus />} 
                    colorScheme="teal"
                    onClick={handleAddGrupo}
                  >
                    Novo Grupo
                  </Button>
                </Flex>
              </CardHeader>
              
              <CardBody>
                {isLoading ? (
                  <Flex justify="center" p={8}>
                    <Spinner size="xl" />
                  </Flex>
                ) : gruposBairro.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" py={8}>
                    <Icon as={FaLayerGroup} boxSize={12} color="gray.300" mb={4} />
                    <Text color="gray.500" fontSize="lg" mb={4}>
                      Nenhum grupo de bairros cadastrado
                    </Text>
                    <Button 
                      leftIcon={<FaPlus />} 
                      colorScheme="teal"
                      onClick={handleAddGrupo}
                    >
                      Adicionar Grupo
                    </Button>
                  </Flex>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Nome</Th>
                          <Th>Descrição</Th>
                          <Th>Taxa de Entrega</Th>
                          <Th>Tempo Estimado</Th>
                          <Th>Bairros</Th>
                          <Th>Status</Th>
                          <Th textAlign="center">Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {gruposBairro.map(grupo => (
                          <Tr key={grupo.id}>
                            <Td fontWeight="medium">{grupo.nome}</Td>
                            <Td>{grupo.descricao || 'Sem descrição'}</Td>
                            <Td fontWeight="medium">{formatCurrency(grupo.valorEntrega)}</Td>
                            <Td>{grupo.tempoEstimado || '30-45'} min</Td>
                            <Td>
                              <Badge colorScheme="purple">
                                {grupo._count?.bairros || 0} bairros
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={grupo.ativo ? 'green' : 'red'}>
                                {grupo.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2} justify="center">
                                <IconButton
                                  aria-label="Editar grupo"
                                  icon={<FaEdit />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleEditGrupo(grupo)}
                                />
                                <IconButton
                                  aria-label="Excluir grupo"
                                  icon={<FaTrash />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDeleteGrupo(grupo)}
                                  isDisabled={grupo._count?.bairros ? grupo._count.bairros > 0 : false}
                                  title={grupo._count?.bairros ? "Não é possível excluir grupos com bairros associados" : ""}
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
        </TabPanels>
      </Tabs>
      
      {/* Modal para adicionar/editar bairro */}
      <Modal isOpen={isBairroModalOpen} onClose={onBairroModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedBairro ? 'Editar Bairro' : 'Novo Bairro'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired isInvalid={!!errors.nome}>
                <FormLabel>Nome do Bairro</FormLabel>
                <Input
                  name="nome"
                  value={bairroForm.nome}
                  onChange={handleBairroChange}
                  placeholder="Ex: Centro"
                />
                {errors.nome && (
                  <FormErrorMessage>{errors.nome}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors.cidadeId}>
                <FormLabel>Cidade</FormLabel>
                <Select
                  name="cidadeId"
                  value={bairroForm.cidadeId || ''}
                  onChange={handleBairroChange}
                  placeholder="Selecione a cidade"
                  isDisabled={!!selectedBairro} // Não permite mudar a cidade em edição
                >
                  {cidades.map(cidade => (
                    <option key={cidade.id} value={cidade.id}>
                      {cidade.nome} - {cidade.estado}
                    </option>
                  ))}
                </Select>
                {errors.cidadeId && (
                  <FormErrorMessage>{errors.cidadeId}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl>
                <FormLabel>Grupo de Bairros (opcional)</FormLabel>
                <Select
                  name="grupoBairroId"
                  value={bairroForm.grupoBairroId || ''}
                  onChange={(e) => handleBairroChange({
                    target: {
                      name: 'grupoBairroId',
                      value: e.target.value ? parseInt(e.target.value) : null
                    }
                  })}
                  placeholder="Selecione um grupo"
                >
                  <option value="">Nenhum grupo</option>
                  {gruposBairro.filter(g => g.ativo).map(grupo => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome} (Taxa: {formatCurrency(grupo.valorEntrega)})
                    </option>
                  ))}
                </Select>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Associar a um grupo aplicará a taxa de entrega do grupo a este bairro, a menos que você defina um valor personalizado abaixo.
                </Text>
              </FormControl>
              
              <Divider />
              
              <Box bg="blue.50" p={4} borderRadius="md">
                <HStack mb={2}>
                  <Icon as={FaMoneyBillWave} color="blue.500" />
                  <Text fontWeight="bold" color="blue.700">
                    Configurações de Entrega Personalizadas
                  </Text>
                </HStack>
                
                <Text fontSize="sm" color="blue.700" mb={4}>
                  Deixe os campos abaixo em branco para usar os valores padrão do grupo ou da cidade.
                </Text>
                
                <FormControl isInvalid={!!errors.valorEntregaPersonalizado}>
                  <FormLabel>Taxa de Entrega Personalizada</FormLabel>
                  <InputGroup>
                    <InputLeftAddon>R$</InputLeftAddon>
                    <NumberInput
                      value={bairroForm.valorEntregaPersonalizado === null ? '' : bairroForm.valorEntregaPersonalizado}
                      onChange={(value) => handleBairroChange({
                        target: {
                          name: 'valorEntregaPersonalizado',
                          value: value === '' ? null : parseFloat(value)
                        }
                      })}
                      min={0}
                      step={0.5}
                    >
                      <NumberInputField 
                        borderLeftRadius={0}
                        placeholder="Valor personalizado"
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </InputGroup>
                  {errors.valorEntregaPersonalizado && (
                    <FormErrorMessage>{errors.valorEntregaPersonalizado}</FormErrorMessage>
                  )}
                </FormControl>
                
                <FormControl mt={4}>
                  <FormLabel>Tempo Estimado Personalizado (min)</FormLabel>
                  <Input
                    name="tempoEstimadoPersonalizado"
                    value={bairroForm.tempoEstimadoPersonalizado || ''}
                    onChange={(e) => handleBairroChange({
                      target: {
                        name: 'tempoEstimadoPersonalizado',
                        value: e.target.value || null
                      }
                    })}
                    placeholder="Ex: 30-45"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Formato: "30-45" (mínimo-máximo). Deixe em branco para usar o padrão.
                  </Text>
                </FormControl>
              </Box>
              
              <FormControl display="flex" alignItems="center" mt={2}>
                <FormLabel htmlFor="ativo" mb="0">
                  Bairro Ativo
                </FormLabel>
                <Switch
                  id="ativo"
                  name="ativo"
                  isChecked={bairroForm.ativo}
                  onChange={(e) => handleBairroChange({
                    target: {
                      name: 'ativo',
                      value: e.target.checked
                    }
                  })}
                  colorScheme="teal"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onBairroModalClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="teal" 
              leftIcon={<FaSave />}
              onClick={handleSaveBairro}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal para adicionar/editar grupo */}
      <Modal isOpen={isGrupoModalOpen} onClose={onGrupoModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedGrupo ? 'Editar Grupo de Bairros' : 'Novo Grupo de Bairros'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired isInvalid={!!errors.nome}>
                <FormLabel>Nome do Grupo</FormLabel>
                <Input
                  name="nome"
                  value={grupoForm.nome}
                  onChange={handleGrupoChange}
                  placeholder="Ex: Zona Sul"
                />
                {errors.nome && (
                  <FormErrorMessage>{errors.nome}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Textarea
                  name="descricao"
                  value={grupoForm.descricao || ''}
                  onChange={handleGrupoChange}
                  placeholder="Breve descrição do grupo de bairros"
                  rows={3}
                />
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors.valorEntrega}>
                <FormLabel>Taxa de Entrega</FormLabel>
                <InputGroup>
                  <InputLeftAddon>R$</InputLeftAddon>
                  <NumberInput
                    value={grupoForm.valorEntrega}
                    onChange={(value) => handleGrupoChange({
                      target: {
                        name: 'valorEntrega',
                        value: parseFloat(value)
                      }
                    })}
                    min={0}
                    step={0.5}
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
                  value={grupoForm.tempoEstimado || ''}
                  onChange={handleGrupoChange}
                  placeholder="Ex: 30-45"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Formato: "30-45" (mínimo-máximo)
                </Text>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="ativo" mb="0">
                  Grupo Ativo
                </FormLabel>
                <Switch
                  id="ativo"
                  name="ativo"
                  isChecked={grupoForm.ativo}
                  onChange={(e) => handleGrupoChange({
                    target: {
                      name: 'ativo',
                      value: e.target.checked
                    }
                  })}
                  colorScheme="teal"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onGrupoModalClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="teal" 
              leftIcon={<FaSave />}
              onClick={handleSaveGrupo}
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
              {activeTab === 0 ? 'Excluir Bairro' : 'Excluir Grupo de Bairros'}
            </AlertDialogHeader>

            <AlertDialogBody>
              {activeTab === 0 && selectedBairro ? (
                <>
                  Tem certeza que deseja excluir o bairro <strong>{selectedBairro.nome}</strong>?
                </>
              ) : selectedGrupo && (
                <>
                  Tem certeza que deseja excluir o grupo <strong>{selectedGrupo.nome}</strong>?
                </>
              )}
              <Text mt={2}>Esta ação não poderá ser desfeita.</Text>
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
