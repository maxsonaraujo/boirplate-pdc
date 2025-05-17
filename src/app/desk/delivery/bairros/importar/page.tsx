'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  FormControl,
  FormLabel,
  Select,
  HStack,
  VStack,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Flex,
  useToast,
  InputGroup,
  Input,
  InputRightElement,
  Icon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  Progress,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { FaDownload, FaSearch, FaCity, FaMoneyBillWave, FaSave } from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { useRouter } from 'next/navigation';

interface Cidade {
  id: number;
  nome: string;
  estado: string;
  valorEntrega: number;
}

interface GrupoBairro {
  id: number;
  nome: string;
  valorEntrega: number;
}

interface BairroPublico {
  id: number | null;
  nome: string;
  isCadastrado: boolean;
  taxaEntrega: number;
  fonte: string;
  grupoId: number | null;
  grupoNome: string | null;
  selecionado?: boolean;
  grupoBairroId?: number | null;
  valorEntregaPersonalizado?: number | null;
}

export default function ImportarBairrosPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const router = useRouter();
  const bgCard = useColorModeValue('white', 'gray.800');
  
  // Estados
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [gruposBairro, setGruposBairro] = useState<GrupoBairro[]>([]);
  const [bairrosPublicos, setBairrosPublicos] = useState<BairroPublico[]>([]);
  const [filteredBairros, setFilteredBairros] = useState<BairroPublico[]>([]);
  const [selectedCidadeId, setSelectedCidadeId] = useState<string>('');
  const [isLoadingCidades, setIsLoadingCidades] = useState(true);
  const [isLoadingBairros, setIsLoadingBairros] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectAll, setSelectAll] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [taxaPadrao, setTaxaPadrao] = useState<number>(0);
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  const [apiSource, setApiSource] = useState<string>('auto');
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);
  
  // Buscar cidades e grupos disponíveis
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingCidades(true);
        
        // Buscar cidades
        const cidadesResponse = await fetch('/api/delivery/cidades');
        const cidadesData = await cidadesResponse.json();
        setCidades(cidadesData.cidades || []);
        
        // Buscar grupos de bairros
        const gruposResponse = await fetch('/api/delivery/bairros/grupos');
        const gruposData = await gruposResponse.json();
        setGruposBairro(gruposData.grupos || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as cidades e grupos',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingCidades(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Buscar bairros públicos ao selecionar cidade
  useEffect(() => {
    const fetchBairros = async () => {
      if (!selectedCidadeId) {
        setBairrosPublicos([]);
        setFilteredBairros([]);
        return;
      }
      
      try {
        setIsLoadingBairros(true);
        
        const url = `/api/delivery/bairros/publicos?cidadeId=${selectedCidadeId}&slug=${tenant?.slug}&source=${apiSource}`;
        console.log("Buscando bairros de:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar bairros');
        }
        
        const data = await response.json();
        
        // Definir taxa padrão da cidade
        setTaxaPadrao(data.cidade?.taxaPadrao || 0);
        
        // Preparar os bairros com campos adicionais
        const bairrosPreparados = data.bairros.map((bairro: BairroPublico) => ({
          ...bairro,
          selecionado: false,
          grupoBairroId: bairro.grupoId,
          valorEntregaPersonalizado: null
        }));
        
        setBairrosPublicos(bairrosPreparados);
        setFilteredBairros(bairrosPreparados);
      } catch (error) {
        console.error('Erro ao buscar bairros:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os bairros desta cidade',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingBairros(false);
      }
    };
    
    fetchBairros();
  }, [selectedCidadeId, tenant?.slug, toast, apiSource]);
  
  // Atualizar fonte de busca de bairros
  const handleBuscarNovamenteBairros = async () => {
    try {
      setIsLoadingAPI(true);
      
      // Alternar entre as fontes de dados
      let novaFonte = 'ibge';
      if (apiSource === 'ibge') novaFonte = 'osm';
      else if (apiSource === 'osm') novaFonte = 'generic';
      else if (apiSource === 'generic') novaFonte = 'ibge';
      else novaFonte = 'ibge';
      
      setApiSource(novaFonte);
      
      toast({
        title: 'Buscando bairros',
        description: `Tentando API: ${novaFonte.toUpperCase()}`,
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao buscar bairros:', error);
    } finally {
      setIsLoadingAPI(false);
    }
  };
  
  // Filtrar bairros por texto de busca
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredBairros(bairrosPublicos);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = bairrosPublicos.filter(bairro => 
        bairro.nome.toLowerCase().includes(searchLower)
      );
      setFilteredBairros(filtered);
    }
  }, [searchText, bairrosPublicos]);
  
  // Handler para seleção de bairros
  const handleToggleBairro = (index: number) => {
    const newBairros = [...filteredBairros];
    newBairros[index].selecionado = !newBairros[index].selecionado;
    setFilteredBairros(newBairros);
    
    // Atualizar estado geral de bairros
    const allBairros = [...bairrosPublicos];
    const targetBairro = allBairros.find(b => b.nome === newBairros[index].nome);
    if (targetBairro) {
      targetBairro.selecionado = newBairros[index].selecionado;
      setBairrosPublicos(allBairros);
    }
    
    // Verificar se todos estão selecionados
    const allSelected = newBairros.every(b => b.selecionado);
    setSelectAll(allSelected);
  };
  
  // Handler para selecionar todos os bairros
  const handleSelectAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    
    const newBairros = filteredBairros.map(bairro => ({
      ...bairro,
      selecionado: newValue
    }));
    setFilteredBairros(newBairros);
    
    // Atualizar estado geral
    const updatedBairrosPublicos = bairrosPublicos.map(bairro => {
      if (filteredBairros.some(fb => fb.nome === bairro.nome)) {
        return { ...bairro, selecionado: newValue };
      }
      return bairro;
    });
    setBairrosPublicos(updatedBairrosPublicos);
  };
  
  // Handler para atualizar taxa personalizada
  const handleTaxaChange = (index: number, value: number | null) => {
    const newBairros = [...filteredBairros];
    newBairros[index].valorEntregaPersonalizado = value;
    setFilteredBairros(newBairros);
    
    // Atualizar estado geral
    const allBairros = [...bairrosPublicos];
    const targetBairro = allBairros.find(b => b.nome === newBairros[index].nome);
    if (targetBairro) {
      targetBairro.valorEntregaPersonalizado = value;
      setBairrosPublicos(allBairros);
    }
  };
  
  // Handler para atualizar grupo de bairro
  const handleGrupoChange = (index: number, value: string) => {
    const newBairros = [...filteredBairros];
    newBairros[index].grupoBairroId = value ? parseInt(value) : null;
    setFilteredBairros(newBairros);
    
    // Atualizar estado geral
    const allBairros = [...bairrosPublicos];
    const targetBairro = allBairros.find(b => b.nome === newBairros[index].nome);
    if (targetBairro) {
      targetBairro.grupoBairroId = value ? parseInt(value) : null;
      setBairrosPublicos(allBairros);
    }
  };
  
  // Handler para atualizar grupo para todos selecionados
  const handleApplyGroupToSelected = () => {
    if (!selectedGrupo) return;
    
    const newBairros = filteredBairros.map(bairro => ({
      ...bairro,
      grupoBairroId: bairro.selecionado ? parseInt(selectedGrupo) : bairro.grupoBairroId
    }));
    setFilteredBairros(newBairros);
    
    // Atualizar estado geral
    const updatedBairrosPublicos = bairrosPublicos.map(bairro => {
      if (bairro.selecionado) {
        return { ...bairro, grupoBairroId: parseInt(selectedGrupo) };
      }
      return bairro;
    });
    setBairrosPublicos(updatedBairrosPublicos);
    
    toast({
      title: 'Grupo aplicado',
      description: 'O grupo foi aplicado aos bairros selecionados',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Importar bairros selecionados
  const handleImportBairros = async () => {
    const bairrosSelecionados = bairrosPublicos.filter(b => b.selecionado && !b.isCadastrado);
    
    if (bairrosSelecionados.length === 0) {
      toast({
        title: 'Nenhum bairro selecionado',
        description: 'Selecione pelo menos um bairro para importar',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsImporting(true);
      setProgressTotal(bairrosSelecionados.length);
      setProgressValue(0);
      
      let importados = 0;
      let falhas = 0;
      
      // Importar bairros um por um
      for (const bairro of bairrosSelecionados) {
        try {
          const response = await fetch('/api/delivery/bairros/cadastrar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nome: bairro.nome,
              cidadeId: selectedCidadeId,
              slug: tenant?.slug,
              grupoBairroId: bairro.grupoBairroId,
              valorEntregaPersonalizado: bairro.valorEntregaPersonalizado
            }),
          });
          
          if (response.ok) {
            importados++;
          } else {
            falhas++;
          }
        } catch (error) {
          console.error(`Erro ao importar bairro ${bairro.nome}:`, error);
          falhas++;
        }
        
        // Atualizar progresso
        setProgressValue(prev => prev + 1);
      }
      
      // Mensagem de resultado
      toast({
        title: 'Importação concluída',
        description: `${importados} bairros importados com sucesso. ${falhas} falhas.`,
        status: importados > 0 ? 'success' : 'warning',
        duration: 5000,
        isClosable: true,
      });
      
      // Se importou com sucesso, redirecionar para a página de bairros
      if (importados > 0) {
        setTimeout(() => {
          router.push('/desk/delivery/bairros');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao importar bairros:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro durante a importação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Box p={5}>
      <HStack mb={6} justify="space-between">
        <Heading size="lg">Importar Bairros</Heading>
        
        <Button 
          onClick={() => router.push('/desk/delivery/bairros')}
          variant="outline"
          colorScheme="teal"
        >
          Voltar
        </Button>
      </HStack>
      
      <Card bg={bgCard} boxShadow="md" mb={6}>
        <CardHeader>
          <HStack>
            <Icon as={FaCity} color="teal.500" />
            <Text fontWeight="bold">Selecione a cidade</Text>
          </HStack>
        </CardHeader>
        
        <CardBody>
          {isLoadingCidades ? (
            <Flex justify="center" p={4}>
              <Spinner size="lg" />
            </Flex>
          ) : (
            <FormControl>
              <Select
                value={selectedCidadeId}
                onChange={(e) => setSelectedCidadeId(e.target.value)}
                placeholder="Selecione uma cidade"
                isDisabled={isImporting}
              >
                {cidades.map(cidade => (
                  <option key={cidade.id} value={cidade.id}>
                    {cidade.nome} - {cidade.estado}
                  </option>
                ))}
              </Select>
            </FormControl>
          )}
        </CardBody>
      </Card>
      
      {selectedCidadeId && (
        <Card bg={bgCard} boxShadow="md">
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <Icon as={FaDownload} color="teal.500" />
                <Text fontWeight="bold">Bairros disponíveis para importação</Text>
              </HStack>
              
              <HStack>
                <Button
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<Icon as={FaSearch} />}
                  onClick={handleBuscarNovamenteBairros}
                  isLoading={isLoadingAPI || isLoadingBairros}
                  loadingText="Buscando..."
                  isDisabled={!selectedCidadeId || isImporting}
                >
                  Buscar mais bairros
                </Button>
                
                <FormControl maxW="300px">
                  <InputGroup>
                    <Input
                      placeholder="Buscar bairro"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      isDisabled={isImporting}
                    />
                    <InputRightElement>
                      <Icon as={FaSearch} color="gray.400" />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </HStack>
            </HStack>
          </CardHeader>
          
          <CardBody>
            {isLoadingBairros ? (
              <Flex justify="center" p={8}>
                <Spinner size="xl" />
              </Flex>
            ) : filteredBairros.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={8}>
                <Text color="gray.500" fontSize="lg" mb={4}>
                  Nenhum bairro encontrado para esta cidade
                </Text>
              </Flex>
            ) : (
              <VStack spacing={4} align="stretch">
                {/* Painel de ações em lote */}
                <Box p={4} bg="blue.50" borderRadius="md">
                  <VStack align="stretch" spacing={4}>
                    <Heading size="sm" color="blue.700">Ações em lote para bairros selecionados</Heading>
                    
                    <HStack spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">Aplicar grupo</FormLabel>
                        <Select
                          placeholder="Selecione um grupo"
                          value={selectedGrupo}
                          onChange={(e) => setSelectedGrupo(e.target.value)}
                          isDisabled={isImporting}
                        >
                          <option value="">Nenhum grupo</option>
                          {gruposBairro.map(grupo => (
                            <option key={grupo.id} value={grupo.id}>
                              {grupo.nome} (Taxa: R$ {grupo.valorEntrega.toFixed(2)})
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <Button
                        mt={8}
                        colorScheme="blue"
                        onClick={handleApplyGroupToSelected}
                        isDisabled={!selectedGrupo || isImporting}
                      >
                        Aplicar aos selecionados
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
                
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th width="50px">
                          <Checkbox
                            isChecked={selectAll}
                            onChange={handleSelectAll}
                            isDisabled={isImporting}
                          />
                        </Th>
                        <Th>Bairro</Th>
                        <Th>Status</Th>
                        <Th>Grupo</Th>
                        <Th>Taxa de Entrega</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredBairros.map((bairro, index) => (
                        <Tr key={`${bairro.nome}-${index}`}>
                          <Td>
                            <Checkbox
                              isChecked={bairro.selecionado}
                              onChange={() => handleToggleBairro(index)}
                              isDisabled={bairro.isCadastrado || isImporting}
                            />
                          </Td>
                          <Td fontWeight="medium">{bairro.nome}</Td>
                          <Td>
                            <Badge colorScheme={bairro.isCadastrado ? "green" : "blue"}>
                              {bairro.isCadastrado ? "Já cadastrado" : "Disponível"}
                            </Badge>
                          </Td>
                          <Td>
                            <Select
                              value={bairro.grupoBairroId?.toString() || ""}
                              onChange={(e) => handleGrupoChange(index, e.target.value)}
                              placeholder="Nenhum"
                              size="sm"
                              width="200px"
                              isDisabled={!bairro.selecionado || bairro.isCadastrado || isImporting}
                            >
                              <option value="">Nenhum grupo</option>
                              {gruposBairro.map(grupo => (
                                <option key={grupo.id} value={grupo.id}>
                                  {grupo.nome} (R$ {grupo.valorEntrega.toFixed(2)})
                                </option>
                              ))}
                            </Select>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <Icon as={FaMoneyBillWave} color="green.500" />
                              
                              <NumberInput
                                defaultValue={bairro.valorEntregaPersonalizado || taxaPadrao}
                                min={0}
                                step={0.5}
                                onChange={(value) => handleTaxaChange(
                                  index, 
                                  value === '' ? null : parseFloat(value)
                                )}
                                size="sm"
                                width="150px"
                                isDisabled={!bairro.selecionado || bairro.isCadastrado || isImporting}
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
                
                {isImporting && (
                  <Box py={4}>
                    <Text mb={2}>Importando bairros... {progressValue} de {progressTotal}</Text>
                    <Progress 
                      value={(progressValue / progressTotal) * 100} 
                      size="lg" 
                      colorScheme="teal" 
                      borderRadius="md"
                    />
                  </Box>
                )}
                
                <Flex justify="space-between" mt={4}>
                  <Text>
                    {filteredBairros.filter(b => b.selecionado && !b.isCadastrado).length} bairros selecionados para importação
                  </Text>
                  
                  <Button
                    colorScheme="teal"
                    leftIcon={<FaSave />}
                    onClick={handleImportBairros}
                    isLoading={isImporting}
                    loadingText="Importando..."
                    isDisabled={filteredBairros.filter(b => b.selecionado && !b.isCadastrado).length === 0}
                  >
                    Importar Bairros Selecionados
                  </Button>
                </Flex>
              </VStack>
            )}
          </CardBody>
        </Card>
      )}
    </Box>
  );
}
