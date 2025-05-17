'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useToast,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  HStack,
  ButtonGroup,
  Stack,
  TableContainer,
  Hide,
  Show,
  SimpleGrid
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowRight, FaHome, FaSignOutAlt, FaEye, FaChevronDown, FaExclamationTriangle } from 'react-icons/fa';
import { DeliveryHeader } from '@/components/delivery/DeliveryHeader';
import { getStatusColor, getStatusLabel } from '@/constants/pedidoStatus';
import { CustomerHeader } from '@/components/delivery/CustomerHeader';

export default function MeusPedidosPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const telefone = searchParams.get('telefone');
  const toast = useToast();
  
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clienteNome, setClienteNome] = useState<string>('');
  
  const bgCard = useColorModeValue('white', 'gray.800');
  const primaryColor = tenant?.corPrimaria || 'teal.500';

  // Verificar se o telefone está disponível
  useEffect(() => {
    if (!telefone) {
      // Se não tiver telefone no parâmetro, verificar no localStorage
      const savedPhone = localStorage.getItem(`delivery_phone_${slug}`);
      if (savedPhone) {
        router.replace(`/loja/meus-pedidos?telefone=${savedPhone}`);
      } else {
        router.replace(`/loja/acompanhar`);
      }
    }
  }, [telefone, router, slug]);

  // Buscar pedidos e informações do tenant
  useEffect(() => {
    const fetchData = async () => {
      if (!telefone) return;
      
      setLoading(true);
      try {
        // Buscar informações do tenant
        const tenantResponse = await fetch(`/api/delivery/tenant`);
        if (!tenantResponse.ok) throw new Error('Erro ao carregar informações do restaurante');
        const tenantData = await tenantResponse.json();
        setTenant(tenantData.tenant);
        
        // Buscar pedidos por telefone
        const pedidosResponse = await fetch(`/api/delivery/orders/buscar?telefone=${telefone}`);
        if (!pedidosResponse.ok) throw new Error('Erro ao buscar pedidos');
        
        const pedidosData = await pedidosResponse.json();
        setPedidos(pedidosData.pedidos || []);
        
        console.log('Dados recebidos da API:', pedidosData);
        
        // Definir nome do cliente com base nos dados recebidos
        // Primeiro tenta encontrar nos pedidos recentes
        if (pedidosData.pedidos && pedidosData.pedidos.length > 0 && pedidosData.pedidos[0].cliente) {
          setClienteNome(pedidosData.pedidos[0].cliente.nome || '');
        } 
        // Se não há pedidos recentes, procura na lista de clientes
        else if (pedidosData.clientes && pedidosData.clientes.length > 0) {
          // Usa o cliente mais recente (último cadastrado) - assume que o ID maior é o mais recente
          const clienteMaisRecente = [...pedidosData.clientes].sort((a, b) => b.id - a.id)[0];
          setClienteNome(clienteMaisRecente.nome || '');
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os pedidos',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug, telefone, toast]);

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Formatar valor para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.removeItem(`delivery_phone_${slug}`);
    router.push(`/loja/acompanhar`);
    toast({
      title: 'Desconectado',
      description: 'Você saiu da sua conta de acompanhamento',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Função para visualizar detalhes do pedido
  const handleViewOrder = (pedidoId: number) => {
    router.push(`/loja/pedido/${pedidoId}`);
  };

  // Componente de cartão para visualização em dispositivos móveis
  const PedidoCard = ({ pedido }: { pedido: any }) => (
    <Card variant="outline" mb={3}>
      <CardBody p={3}>
        <HStack justifyContent="space-between" mb={2}>
          <Badge fontSize="md" fontWeight="bold">#{pedido.numero}</Badge>
          <Badge colorScheme={getStatusColor(pedido.status)}>
            {getStatusLabel(pedido.status)}
          </Badge>
        </HStack>
        
        <Flex direction="column" gap={1} fontSize="sm" mb={3}>
          <Flex justify="space-between">
            <Text color="gray.500">Data:</Text>
            <Text fontWeight="medium">{formatDate(pedido.dataPedido)}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text color="gray.500">Valor:</Text>
            <Text fontWeight="bold">{formatCurrency(pedido.valorTotal)}</Text>
          </Flex>
        </Flex>
        
        <Button
          size="sm"
          colorScheme="teal"
          width="full"
          rightIcon={<FaArrowRight />}
          onClick={() => handleViewOrder(pedido.id)}
        >
          Acompanhar
        </Button>
      </CardBody>
    </Card>
  );

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <DeliveryHeader tenant={tenant} loading={loading} cartItemsCount={0} slug={slug} />
      
      <CustomerHeader 
        clientName={clienteNome}
        phoneNumber={telefone || ''}
        onLogout={handleLogout}
        slug={slug}
      />

      <Container maxW="container.lg" mt={8} py={6} px={{ base: 3, sm: 6 }}>
        <Card bg={bgCard} boxShadow="md" mb={6}>
          <CardHeader borderBottomWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} p={{ base: 3, md: 4 }}>
            <Heading size="md" color={primaryColor}>Meus Pedidos</Heading>
          </CardHeader>
          
          <CardBody p={{ base: 3, md: 4 }}>
            {loading ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="xl" />
              </Flex>
            ) : pedidos.length === 0 ? (
              <Alert
                status="info"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                py={6}
                borderRadius="md"
              >
                <AlertIcon boxSize={10} mr={0} mb={3} />
                <AlertTitle fontSize="lg" mb={2}>Nenhum pedido encontrado</AlertTitle>
                <AlertDescription maxW="md">
                  Não encontramos pedidos recentes associados a este número de telefone nos últimos 7 dias.
                </AlertDescription>
                <Button
                  mt={4}
                  colorScheme="teal"
                  onClick={() => router.push(`/loja`)}
                >
                  Fazer um pedido agora
                </Button>
              </Alert>
            ) : (
              <VStack spacing={4} align="stretch">
                {/* Visualização em tabela para desktop */}
                <Hide below="md">
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Pedido</Th>
                          <Th>Data</Th>
                          <Th>Valor</Th>
                          <Th>Status</Th>
                          <Th textAlign="right">Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {pedidos.map((pedido) => (
                          <Tr key={pedido.id}>
                            <Td fontWeight="medium">#{pedido.numero}</Td>
                            <Td>{formatDate(pedido.dataPedido)}</Td>
                            <Td>{formatCurrency(pedido.valorTotal)}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(pedido.status)}>
                                {getStatusLabel(pedido.status)}
                              </Badge>
                            </Td>
                            <Td textAlign="right">
                              <Button
                                size="sm"
                                colorScheme="teal"
                                variant="outline"
                                rightIcon={<FaArrowRight />}
                                onClick={() => handleViewOrder(pedido.id)}
                              >
                                Acompanhar
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Hide>
                
                {/* Visualização em cards para mobile */}
                <Show below="md">
                  {pedidos.map((pedido) => (
                    <PedidoCard key={pedido.id} pedido={pedido} />
                  ))}
                </Show>
                
                <Divider my={2} />
                
                <Box textAlign="center" fontSize="sm" color="gray.500">
                  Mostrando seus pedidos dos últimos 7 dias.
                </Box>
              </VStack>
            )}
          </CardBody>
        </Card>
        
        <Stack 
          direction={{ base: 'column', sm: 'row' }} 
          w="100%" 
          spacing={4} 
          mt={4}
        >
          <Button
            leftIcon={<FaHome />}
            variant="outline"
            width="100%"
            onClick={() => router.push(`/loja`)}
          >
            Voltar ao cardápio
          </Button>
          
          <Button
            leftIcon={<FaSignOutAlt />}
            colorScheme="red"
            variant="outline"
            width="100%"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
