'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Button,
  IconButton,
  Flex,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue,
  useDisclosure,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Divider,
  Progress,
  Icon,
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaExchangeAlt, 
  FaChartLine, 
  FaTrash, 
  FaHistory,
  FaBoxOpen,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaWarehouse,
  FaTag,
  FaBuilding,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';
import { formatCurrency, formatDate } from '@/utils/format';
import { InsumoFormModal } from '@/components/molecules/InsumoFormModal';
import { MovimentacaoModal } from '@/components/molecules/MovimentacaoModal';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { useTenant } from '@/hooks/useTenant';

export default function DetalheInsumoPage() {
  const router = useRouter();
  const { id } = useParams();
  const toast = useToast();
  const { tenant } = useTenant();
  
  const [insumo, setInsumo] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMovimentacoes, setIsLoadingMovimentacoes] = useState(false);
  
  // Estados de controle de paginação para movimentações
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovimentacoes, setTotalMovimentacoes] = useState(0);
  
  // Disclosures para modais
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  
  const { 
    isOpen: isMovimentacaoOpen, 
    onOpen: onMovimentacaoOpen, 
    onClose: onMovimentacaoClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  
  // Cores dos cards
  const cardBg = useColorModeValue('white', 'gray.800');
  const statBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch principal do insumo
  useEffect(() => {
    const fetchInsumo = async () => {
      setIsLoading(true);
      try {
        // Carregar insumo
        const response = await fetch(`/api/estoque/insumos/${id}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar insumo');
        }
        const data = await response.json();
        setInsumo(data.insumo);
        
        // Carregar categorias, fornecedores e unidades (para o modal de edição)
        await Promise.all([
          fetch('/api/estoque/categorias')
            .then((res) => res.ok ? res.json() : Promise.resolve({categorias: []}))
            .then((data) => setCategorias(data.categorias || [])),
          
          fetch('/api/fornecedores')
            .then((res) => res.ok ? res.json() : Promise.resolve({fornecedores: []}))
            .then((data) => setFornecedores(data.fornecedores || [])),
          
          fetch('/api/unidades-medida')
            .then((res) => res.ok ? res.json() : Promise.resolve({unidadesMedida: []}))
            .then((data) => setUnidadesMedida(data.unidadesMedida || []))
        ]);
        
        // Iniciar carregamento das movimentações
        fetchMovimentacoes(1);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o insumo',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchInsumo();
    }
  }, [id, toast]);
  
  // Função para buscar movimentações (pode ser chamada com diferentes páginas)
  const fetchMovimentacoes = async (page = 1) => {
    setIsLoadingMovimentacoes(true);
    try {
      const response = await fetch(`/api/estoque/movimentacoes?insumoId=${id}&page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error('Erro ao carregar movimentações');
      }
      const data = await response.json();
      setMovimentacoes(data.movimentacoes);
      setTotalMovimentacoes(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setIsLoadingMovimentacoes(false);
    }
  };
  
  // Refresh da página após edição ou movimentação
  const handleSuccess = async () => {
    try {
      const response = await fetch(`/api/estoque/insumos/${id}`);
      if (response.ok) {
        const data = await response.json();
        setInsumo(data.insumo);
        fetchMovimentacoes(1);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };
  
  // Handler para exclusão
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/estoque/insumos/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir insumo');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Insumo excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      router.push('/estoque/insumos');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao excluir o insumo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };
  
  // Determinar cor baseada no nível de estoque
  const getEstoqueColor = () => {
    if (!insumo) return 'gray';
    if (insumo.estoqueAtual <= 0) return 'red';
    if (insumo.estoqueAtual < insumo.estoqueMinimo) return 'orange';
    return 'green';
  };
  
  // Calcular porcentagem de estoque em relação ao mínimo
  const calcularPorcentagemEstoque = () => {
    if (!insumo || !insumo.estoqueMinimo) return 100;
    const porcentagem = (insumo.estoqueAtual / insumo.estoqueMinimo) * 100;
    return Math.min(porcentagem, 100); // Limitar a 100% para cálculo visual
  };
  
  // Determinar cor do tipo de movimentação
  const getMovimentacaoColor = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA': return 'green';
      case 'SAIDA': return 'red';
      case 'PRODUCAO': return 'blue';
      case 'DESCARTE': return 'orange';
      case 'AJUSTE': return 'purple';
      default: return 'gray';
    }
  };
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  if (!insumo) {
    return (
      <Alert status="error" variant="left-accent">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Insumo não encontrado</Text>
          <Text>O insumo solicitado não existe ou foi removido.</Text>
          <Button 
            leftIcon={<FaArrowLeft />} 
            mt={3} 
            onClick={() => router.push('/estoque/insumos')}
          >
            Voltar para Lista
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
          <BreadcrumbLink href="/estoque">Estoque</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/estoque/insumos">Insumos</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{insumo.nome}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={2}>
        <Box>
          <Heading size="lg">
            {insumo.nome} 
            {!insumo.status && <Badge ml={2} colorScheme="red">Inativo</Badge>}
          </Heading>
          <HStack mt={1}>
            <Badge colorScheme="blue" fontFamily="mono">{insumo.codigo}</Badge>
            {insumo.categoriaInsumo && (
              <Badge colorScheme="teal">{insumo.categoriaInsumo.nome}</Badge>
            )}
          </HStack>
        </Box>
        
        <HStack>
          <Button 
            leftIcon={<FaArrowLeft />} 
            onClick={() => router.back()}
            variant="outline"
          >
            Voltar
          </Button>
          
          <Button
            leftIcon={<FaExchangeAlt />}
            colorScheme="blue"
            onClick={onMovimentacaoOpen}
          >
            Movimentar
          </Button>
          
          <Button
            leftIcon={<FaEdit />}
            colorScheme="teal"
            onClick={onEditOpen}
          >
            Editar
          </Button>
          
          <IconButton
            icon={<FaTrash />}
            aria-label="Excluir"
            colorScheme="red"
            variant="outline"
            onClick={onDeleteOpen}
          />
        </HStack>
      </Flex>
      
      {/* Resumo estatístico */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
          <StatLabel display="flex" alignItems="center">
            <Icon as={FaBoxOpen} mr={2} />
            Estoque Atual
          </StatLabel>
          <StatNumber color={`${getEstoqueColor()}.500`}>
            {insumo.estoqueAtual.toFixed(2)} {insumo.unidadeMedida?.simbolo}
          </StatNumber>
          <StatHelpText>
            Mínimo: {insumo.estoqueMinimo.toFixed(2)} {insumo.unidadeMedida?.simbolo}
          </StatHelpText>
          <Progress 
            value={calcularPorcentagemEstoque()} 
            colorScheme={getEstoqueColor()} 
            size="sm" 
            borderRadius="full"
          />
        </Stat>
        
        <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
          <StatLabel display="flex" alignItems="center">
            <Icon as={FaTag} mr={2} />
            Valor do Estoque
          </StatLabel>
          <StatNumber color="green.500">
            {formatCurrency(insumo.estoqueAtual * insumo.precoCusto)}
          </StatNumber>
          <StatHelpText>
            Preço unitário: {formatCurrency(insumo.precoCusto)}
          </StatHelpText>
        </Stat>
        
        <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
          <StatLabel display="flex" alignItems="center">
            <Icon as={FaHistory} mr={2} />
            Movimentações
          </StatLabel>
          <StatNumber>{totalMovimentacoes}</StatNumber>
          <StatHelpText>
            Última: {movimentacoes.length > 0 ? formatDate(movimentacoes[0].criadoEm) : 'Nenhuma'}
          </StatHelpText>
        </Stat>
      </SimpleGrid>
      
      {/* Informações detalhadas em tabs */}
      <Card bg={cardBg} mb={6} boxShadow="md">
        <CardBody p={0}>
          <Tabs colorScheme="teal">
            <TabList px={4}>
              <Tab><Icon as={FaBoxOpen} mr={2} />Detalhes</Tab>
              <Tab><Icon as={FaHistory} mr={2} />Movimentações</Tab>
              <Tab><Icon as={FaWarehouse} mr={2} />Estoque</Tab>
            </TabList>
            
            <TabPanels>
              {/* Tab de Detalhes */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                  <Box>
                    <Heading size="sm" mb={3}>Informações Gerais</Heading>
                    
                    {insumo.descricao && (
                      <Box mb={4}>
                        <Text fontWeight="medium" mb={1}>Descrição:</Text>
                        <Text>{insumo.descricao}</Text>
                      </Box>
                    )}
                    
                    <SimpleGrid columns={2} spacing={4} mb={4}>
                      <Box>
                        <Text fontWeight="medium">Categoria:</Text>
                        <Text>{insumo.categoriaInsumo?.nome || 'Não definida'}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="medium">Unidade de Medida:</Text>
                        <Text>
                          {insumo.unidadeMedida 
                            ? `${insumo.unidadeMedida.nome} (${insumo.unidadeMedida.simbolo})` 
                            : 'Não definida'}
                        </Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="medium">Preço de Custo:</Text>
                        <Text>{formatCurrency(insumo.precoCusto)}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="medium">Status:</Text>
                        <Flex align="center">
                          <Icon 
                            as={insumo.status ? FaCheck : FaTimes} 
                            color={insumo.status ? 'green.500' : 'red.500'} 
                            mr={2} 
                          />
                          <Text>{insumo.status ? 'Ativo' : 'Inativo'}</Text>
                        </Flex>
                      </Box>
                    </SimpleGrid>
                    
                    <Heading size="sm" mb={3}>Fornecedor</Heading>
                    {insumo.fornecedorPrincipal ? (
                      <Box>
                        <HStack mb={1}>
                          <Icon as={FaBuilding} />
                          <Text fontWeight="medium">
                            {insumo.fornecedorPrincipal.nomeFantasia || 
                             insumo.fornecedorPrincipal.razaoSocial}
                          </Text>
                        </HStack>
                        
                        {insumo.fornecedorPrincipal.telefone && (
                          <Text fontSize="sm">Tel: {insumo.fornecedorPrincipal.telefone}</Text>
                        )}
                        
                        {insumo.fornecedorPrincipal.email && (
                          <Text fontSize="sm">Email: {insumo.fornecedorPrincipal.email}</Text>
                        )}
                      </Box>
                    ) : (
                      <Text color="gray.500">Nenhum fornecedor principal definido</Text>
                    )}
                  </Box>
                  
                  <Box>
                    <Heading size="sm" mb={3}>Controle de Estoque</Heading>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                      <Box>
                        <Text fontWeight="medium">Estoque Atual:</Text>
                        <Badge 
                          colorScheme={getEstoqueColor()} 
                          fontSize="md" 
                          p={1}
                        >
                          {insumo.estoqueAtual.toFixed(2)} {insumo.unidadeMedida?.simbolo}
                        </Badge>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="medium">Estoque Mínimo:</Text>
                        <Text>{insumo.estoqueMinimo.toFixed(2)} {insumo.unidadeMedida?.simbolo}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="medium">Localização:</Text>
                        <Text>{insumo.localizacaoEstoque || 'Não definida'}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="medium">Valor em Estoque:</Text>
                        <Text fontWeight="bold" color="green.600">
                          {formatCurrency(insumo.estoqueAtual * insumo.precoCusto)}
                        </Text>
                      </Box>
                    </SimpleGrid>
                    
                    <Heading size="sm" mb={3}>Controle de Validade</Heading>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontWeight="medium">Dias de Validade:</Text>
                        <Text>
                          {insumo.diasValidade 
                           ? `${insumo.diasValidade} dias` 
                           : 'Não definido'}
                        </Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="medium">Notificar Vencimento:</Text>
                        <Flex align="center">
                          <Icon 
                            as={insumo.notificarVencimento !== false ? FaCheck : FaTimes} 
                            color={insumo.notificarVencimento !== false ? 'green.500' : 'red.500'} 
                            mr={2} 
                          />
                          <Text>{insumo.notificarVencimento !== false ? 'Sim' : 'Não'}</Text>
                        </Flex>
                      </Box>
                    </SimpleGrid>
                    
                    <Divider my={4} />
                    
                    <Box>
                      <Text fontWeight="medium" mb={1}>Criado em:</Text>
                      <Text>{formatDate(insumo.criadoEm)}</Text>
                    </Box>
                    
                    <Box mt={2}>
                      <Text fontWeight="medium" mb={1}>Última atualização:</Text>
                      <Text>{formatDate(insumo.atualizadoEm)}</Text>
                    </Box>
                  </Box>
                </SimpleGrid>
              </TabPanel>
              
              {/* Tab de Movimentações */}
              <TabPanel>
                {isLoadingMovimentacoes ? (
                  <Flex justify="center" p={6}>
                    <Spinner />
                  </Flex>
                ) : movimentacoes.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    Nenhuma movimentação encontrada para este insumo.
                  </Alert>
                ) : (
                  <>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Data</Th>
                          <Th>Tipo</Th>
                          <Th isNumeric>Quantidade</Th>
                          <Th>Responsável</Th>
                          <Th>Observação</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {movimentacoes.map((mov) => (
                          <Tr key={mov.id}>
                            <Td>{formatDate(mov.criadoEm, true)}</Td>
                            <Td>
                              <Badge colorScheme={getMovimentacaoColor(mov.tipoMovimentacao)}>
                                {mov.tipoMovimentacao}
                              </Badge>
                            </Td>
                            <Td isNumeric>
                              {mov.quantidade.toFixed(2)} {insumo.unidadeMedida?.simbolo}
                            </Td>
                            <Td>{mov.responsavel?.name || 'Sistema'}</Td>
                            <Td 
                              maxW="200px" 
                              overflow="hidden" 
                              textOverflow="ellipsis" 
                              whiteSpace="nowrap"
                            >
                              {mov.observacao || '-'}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                    
                    {/* Paginação */}
                    <Flex justify="space-between" align="center" mt={4}>
                      <Text fontSize="sm">
                        Mostrando {movimentacoes.length} de {totalMovimentacoes} movimentações
                      </Text>
                      
                      <HStack>
                        <Button
                          size="sm"
                          onClick={() => fetchMovimentacoes(currentPage - 1)}
                          isDisabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        
                        <Text fontSize="sm">
                          Página {currentPage} de {totalPages}
                        </Text>
                        
                        <Button
                          size="sm"
                          onClick={() => fetchMovimentacoes(currentPage + 1)}
                          isDisabled={currentPage >= totalPages}
                        >
                          Próxima
                        </Button>
                      </HStack>
                    </Flex>
                  </>
                )}
                
                <Flex justify="center" mt={6}>
                  <Button
                    leftIcon={<FaExchangeAlt />}
                    colorScheme="blue"
                    onClick={onMovimentacaoOpen}
                  >
                    Nova Movimentação
                  </Button>
                </Flex>
              </TabPanel>
              
              {/* Tab de Estoque */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card variant="outline">
                    <CardHeader bg="gray.50" pb={2}>
                      <Heading size="sm">Status de Estoque</Heading>
                    </CardHeader>
                    <CardBody>
                      <Box mb={4}>
                        <Text mb={2}>Nível de Estoque:</Text>
                        <Progress 
                          value={calcularPorcentagemEstoque()} 
                          colorScheme={getEstoqueColor()} 
                          size="lg" 
                          borderRadius="md"
                          mb={2}
                        />
                        
                        <Flex justify="space-between">
                          <Text fontSize="sm">0</Text>
                          <Text fontSize="sm" fontWeight="medium">
                            Mínimo: {insumo.estoqueMinimo.toFixed(2)}
                          </Text>
                        </Flex>
                      </Box>
                      
                      <Stat>
                        <StatLabel>Status</StatLabel>
                        <StatNumber color={`${getEstoqueColor()}.500`}>
                          {insumo.estoqueAtual <= 0 
                            ? 'Em Falta' 
                            : insumo.estoqueAtual < insumo.estoqueMinimo 
                              ? 'Abaixo do Mínimo'
                              : 'Adequado'}
                        </StatNumber>
                        <StatHelpText>
                          {insumo.estoqueAtual > 0 && insumo.estoqueMinimo > 0 && (
                            <>
                              {Math.round((insumo.estoqueAtual / insumo.estoqueMinimo) * 100)}% do estoque mínimo
                            </>
                          )}
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card variant="outline">
                    <CardHeader bg="gray.50" pb={2}>
                      <Heading size="sm">Ações</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={2} spacing={4}>
                        <Button
                          leftIcon={<FaExchangeAlt />}
                          colorScheme="blue"
                          onClick={onMovimentacaoOpen}
                          height="100%"
                          py={8}
                        >
                          Registrar Movimentação
                        </Button>
                        
                        <Button
                          leftIcon={<FaChartLine />}
                          colorScheme="teal"
                          variant="outline"
                          height="100%"
                          py={8}
                          onClick={() => router.push(`/estoque/movimentacoes?insumoId=${insumo.id}`)}
                        >
                          Ver Histórico Completo
                        </Button>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
      
      {/* Modais */}
      <InsumoFormModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        insumo={insumo}
        categorias={categorias}
        fornecedores={fornecedores}
        unidadesMedida={unidadesMedida}
        onSuccess={handleSuccess}
      />
      
      <MovimentacaoModal
        isOpen={isMovimentacaoOpen}
        onClose={onMovimentacaoClose}
        insumo={insumo}
        onSuccess={handleSuccess}
      />
      
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
        title="Excluir Insumo"
        message={`Tem certeza que deseja excluir o insumo "${insumo.nome}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  );
}
