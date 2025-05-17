'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Button,
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Divider,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Icon,
  VStack,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaFileInvoiceDollar, 
  FaCalendarAlt, 
  FaCheck, 
  FaTimes, 
  FaUser, 
  FaBuilding, 
  FaTruck, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaBoxOpen, 
  FaInfoCircle, 
  FaClipboardCheck,
  FaClipboardList,
  FaRegClock,
  FaRegCalendarAlt,
  FaRegCalendarCheck,
} from 'react-icons/fa';
import { formatCurrency, formatDate } from '@/utils/format';
import Link from 'next/link';

export default function DetalheCompraPage() {
  const router = useRouter();
  const { id } = useParams();
  const toast = useToast();
  
  const [compra, setCompra] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cores de background
  const cardBg = useColorModeValue('white', 'gray.800');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');
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
  
  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZADA': return 'green';
      case 'PENDENTE': return 'orange';
      case 'CANCELADA': return 'red';
      case 'PARCIAL': return 'blue';
      default: return 'gray';
    }
  };
  
  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZADO': return 'green';
      case 'PENDENTE': return 'orange';
      case 'PARCIAL': return 'blue';
      default: return 'gray';
    }
  };
  
  // Calcular o total de itens recebidos
  const calcularTotalRecebido = () => {
    if (!compra?.itens) return 0;
    return compra.itens.reduce((total: number, item: any) => total + (item.quantidadeRecebida || 0), 0);
  };
  
  // Calcular o valor total recebido
  const calcularValorRecebido = () => {
    if (!compra?.itens) return 0;
    return compra.itens.reduce(
      (total: number, item: any) => total + ((item.quantidadeRecebida || 0) * item.valorUnitario), 
      0
    );
  };
  
  // Calcular a porcentagem de recebimento
  const calcularPorcentagemRecebimento = () => {
    if (!compra?.itens) return 0;
    
    const totalQuantidade = compra.itens.reduce(
      (total: number, item: any) => total + item.quantidade, 
      0
    );
    
    if (totalQuantidade === 0) return 0;
    
    const totalRecebido = calcularTotalRecebido();
    return (totalRecebido / totalQuantidade) * 100;
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
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Compra {compra.codigo}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={2}>
        <Box>
          <HStack mb={1}>
            <Heading size="lg">Compra: {compra.codigo}</Heading>
            <Badge 
              colorScheme={getStatusColor(compra.status)} 
              fontSize="md" 
              py={0.5} 
              px={2}
            >
              {compra.status}
            </Badge>
          </HStack>
          <Text color="gray.500">
            Emitida em {formatDate(compra.dataCompra)}
          </Text>
        </Box>
        
        <HStack wrap="wrap">
          <Button 
            leftIcon={<FaArrowLeft />} 
            onClick={() => router.back()}
            variant="outline"
          >
            Voltar
          </Button>
          
          {compra.status === 'PENDENTE' && (
            <Button
              leftIcon={<FaClipboardCheck />}
              colorScheme="green"
              as={Link}
              href={`/desk/estoque/compras/${compra.id}/receber`}
            >
              Receber
            </Button>
          )}
          
          {compra.status === 'PARCIAL' && (
            <Button
              leftIcon={<FaClipboardCheck />}
              colorScheme="blue"
              as={Link}
              href={`/desk/estoque/compras/${compra.id}/receber`}
            >
              Continuar Recebimento
            </Button>
          )}
          
          {(compra.status === 'PENDENTE' || compra.status === 'PARCIAL') && (
            <Button
              leftIcon={<FaEdit />}
              colorScheme="teal"
              as={Link}
              href={`/desk/estoque/compras/${compra.id}/edit`}
            >
              Editar
            </Button>
          )}
        </HStack>
      </Flex>
      
      {/* Resumo da compra - Cards de estatísticas */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Stat bg={sectionBg} p={4} borderRadius="md" boxShadow="sm">
          <Flex mb={2}>
            <Icon as={FaFileInvoiceDollar} color="green.500" boxSize={5} mr={2} />
            <StatLabel>Valor Total da Compra</StatLabel>
          </Flex>
          <StatNumber>{formatCurrency(compra.valorTotal)}</StatNumber>
          <StatHelpText>{compra.itens?.length || 0} itens</StatHelpText>
        </Stat>
        
        {compra.status !== 'PENDENTE' && (
          <Stat bg={sectionBg} p={4} borderRadius="md" boxShadow="sm">
            <Flex mb={2}>
              <Icon as={FaBoxOpen} color="blue.500" boxSize={5} mr={2} />
              <StatLabel>Valor Recebido</StatLabel>
            </Flex>
            <StatNumber>
              {formatCurrency(calcularValorRecebido())}
            </StatNumber>
            <StatHelpText>
              {Math.round(calcularPorcentagemRecebimento())}% do total
            </StatHelpText>
          </Stat>
        )}
        
        <Stat bg={sectionBg} p={4} borderRadius="md" boxShadow="sm">
          <Flex mb={2}>
            <Icon 
              as={compra.fornecedor ? FaBuilding : FaInfoCircle} 
              color="purple.500" 
              boxSize={5} 
              mr={2} 
            />
            <StatLabel>Fornecedor</StatLabel>
          </Flex>
          <StatNumber fontSize="lg">
            {compra.fornecedor 
              ? (compra.fornecedor.nomeFantasia || compra.fornecedor.razaoSocial) 
              : 'Não definido'}
          </StatNumber>
          {compra.fornecedor && compra.fornecedor.codigo && (
            <StatHelpText>Código: {compra.fornecedor.codigo}</StatHelpText>
          )}
        </Stat>
      </SimpleGrid>
      
      {/* Detalhes da compra */}
      <Grid 
        templateColumns={{ base: "1fr", lg: "1fr 2fr" }} 
        gap={6} 
        mb={6}
      >
        {/* Informações Gerais */}
        <GridItem>
          <Card bg={cardBg} boxShadow="md">
            <CardHeader pb={2}>
              <Heading size="md">Informações Gerais</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>
                    Status da Compra
                  </Text>
                  <Badge 
                    colorScheme={getStatusColor(compra.status)} 
                    px={2} 
                    py={1}
                    fontSize="md"
                  >
                    {compra.status}
                  </Badge>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>
                    Datas
                  </Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon as={FaRegCalendarAlt} color="blue.500" />
                      <Text as="span" fontWeight="medium">Emissão:</Text>{' '}
                      {formatDate(compra.dataCompra)}
                    </ListItem>
                    
                    {compra.dataPrevisaoEntrega && (
                      <ListItem>
                        <ListIcon as={FaRegClock} color="orange.500" />
                        <Text as="span" fontWeight="medium">Previsão:</Text>{' '}
                        {formatDate(compra.dataPrevisaoEntrega)}
                      </ListItem>
                    )}
                    
                    {compra.dataEntrega && (
                      <ListItem>
                        <ListIcon as={FaRegCalendarCheck} color="green.500" />
                        <Text as="span" fontWeight="medium">Recebimento:</Text>{' '}
                        {formatDate(compra.dataEntrega)}
                      </ListItem>
                    )}
                  </List>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>
                    Nota Fiscal
                  </Text>
                  <Text fontWeight="medium">{compra.numeroNota || 'Não informada'}</Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>
                    Fornecedor
                  </Text>
                  {compra.fornecedor ? (
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">
                        {compra.fornecedor.nomeFantasia || compra.fornecedor.razaoSocial}
                      </Text>
                      {compra.fornecedor.cnpj && (
                        <Text fontSize="sm">CNPJ: {compra.fornecedor.cnpj}</Text>
                      )}
                      {compra.fornecedor.telefone && (
                        <Text fontSize="sm">Tel: {compra.fornecedor.telefone}</Text>
                      )}
                    </VStack>
                  ) : (
                    <Text>Fornecedor não definido</Text>
                  )}
                </Box>
                
                {compra.observacoes && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>
                        Observações
                      </Text>
                      <Text>{compra.observacoes}</Text>
                    </Box>
                  </>
                )}
                
                <Divider />
                
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color="gray.500" mb={1}>
                    Responsável
                  </Text>
                  <Text>
                    {compra.responsavel?.name || 'Sistema'}
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
        
        {/* Itens da Compra */}
        <GridItem>
          <Card bg={cardBg} boxShadow="md">
            <CardHeader pb={2}>
              <Heading size="md">Itens da Compra</Heading>
            </CardHeader>
            <CardBody>
              {!compra.itens || compra.itens.length === 0 ? (
                <Alert status="warning">
                  <AlertIcon />
                  Esta compra não possui itens registrados.
                </Alert>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Insumo</Th>
                        <Th isNumeric>Quantidade</Th>
                        <Th>Un.</Th>
                        <Th isNumeric>Valor Unitário</Th>
                        <Th isNumeric>Subtotal</Th>
                        {(compra.status === 'PARCIAL' || compra.status === 'FINALIZADA') && (
                          <>
                            <Th isNumeric>Recebido</Th>
                            <Th>Status</Th>
                          </>
                        )}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {compra.itens.map((item: any) => (
                        <Tr key={item.id}>
                          <Td>
                            <Link 
                              href={`/desk/estoque/insumos/${item.insumoId}`}
                              style={{ textDecoration: 'underline', color: 'teal' }}
                            >
                              {item.insumo.nome}
                            </Link>
                          </Td>
                          <Td isNumeric>{item.quantidade.toFixed(2)}</Td>
                          <Td>{item.insumo.unidadeMedida?.simbolo || '-'}</Td>
                          <Td isNumeric>{formatCurrency(item.valorUnitario)}</Td>
                          <Td isNumeric>{formatCurrency(item.quantidade * item.valorUnitario)}</Td>
                          {(compra.status === 'PARCIAL' || compra.status === 'FINALIZADA') && (
                            <>
                              <Td isNumeric>
                                {(item.quantidadeRecebida || 0).toFixed(2)}
                              </Td>
                              <Td>
                                <Badge colorScheme={getItemStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                              </Td>
                            </>
                          )}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  
                  <Flex justify="flex-end" mt={6}>
                    <Box 
                      p={4} 
                      bg={sectionBg} 
                      borderRadius="md" 
                      minW="200px"
                    >
                      <Flex justify="space-between" fontWeight="bold">
                        <Text>Total:</Text>
                        <Text>{formatCurrency(compra.valorTotal)}</Text>
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
      
      {/* Ações disponíveis */}
      {(compra.status === 'PENDENTE' || compra.status === 'PARCIAL') && (
        <Card bg={highlightBg} mb={6} variant="outline">
          <CardBody>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <HStack>
                <Icon as={FaInfoCircle} boxSize={6} color="yellow.600" />
                <Box>
                  <Heading size="sm">
                    {compra.status === 'PENDENTE' 
                      ? 'Esta compra ainda não foi recebida' 
                      : 'Esta compra foi parcialmente recebida'}
                  </Heading>
                  <Text>
                    {compra.status === 'PENDENTE'
                      ? 'Registre o recebimento dos itens quando a entrega for feita'
                      : 'Continue o recebimento para finalizar a compra'}
                  </Text>
                </Box>
              </HStack>
              
              <Button
                colorScheme="green"
                leftIcon={<FaClipboardCheck />}
                as={Link}
                href={`/desk/estoque/compras/${compra.id}/receber`}
              >
                {compra.status === 'PENDENTE' ? 'Receber Compra' : 'Continuar Recebimento'}
              </Button>
            </Flex>
          </CardBody>
        </Card>
      )}
    </Box>
  );
}
