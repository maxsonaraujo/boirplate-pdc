'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Stack,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Grid,
  GridItem,
  useSteps,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue,
  Icon,
  Button,
  useToast
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaMotorcycle,
  FaUtensils,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaMoneyBillWave,
  FaClock,
  FaRegClock,
  FaRegCheckCircle
} from 'react-icons/fa';
import { DeliveryHeader } from '@/components/delivery/DeliveryHeader';
import { Notifications } from '@/components/delivery/order-status/notifications';
import { StatusFuncionamento } from '@/components/delivery/StatusFuncionamento';

// Steps for order tracking
const steps = [
  { title: 'Recebido', description: 'Pedido recebido' },
  { title: 'Confirmado', description: 'Pedido confirmado' },
  { title: 'Em preparo', description: 'Seu pedido está sendo preparado' },
  { title: 'Saiu para entrega', description: 'A caminho da sua casa' },
  { title: 'Entregue', description: 'Pedido entregue' },
];

// Status mapping
const statusToStep: Record<string, number> = {
  'pending': 0,
  'confirmed': 1,
  'preparing': 2,
  'delivery': 3,
  'delivered': 4,
  'cancelled': -1 // Special case
};

export default function OrderStatusPage() {
  const { slug, orderId } = useParams();
  const router = useRouter();
  const toast = useToast();
  
  const [tenant, setTenant] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track current step for the stepper
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  
  // Fetch tenant and order data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tenant information
        const tenantResponse = await fetch(`/api/delivery/tenant`);
        
        if (!tenantResponse.ok) {
          throw new Error('Não foi possível carregar informações do estabelecimento');
        }
        
        const tenantData = await tenantResponse.json();
        setTenant(tenantData.tenant);
        
        // Fetch order details
        const orderResponse = await fetch(`/api/delivery/orders/${orderId}?tenantId=${tenantData.tenant.id}`);
        
        if (!orderResponse.ok) {
          throw new Error('Não foi possível carregar informações do pedido');
        }
        
        const orderData = await orderResponse.json();
        setOrder(orderData.order);
        
        // Update stepper based on order status
        if (orderData.order && orderData.order.status) {
          const statusStep = statusToStep[orderData.order.status];
          if (statusStep >= 0) {
            setActiveStep(statusStep);
          }
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Ocorreu um erro ao carregar os dados do pedido');
      } finally {
        setLoading(false);
      }
    };
    
    if (slug && orderId) {
      fetchData();
    }
    
    // Set up polling to check order status
    const intervalId = setInterval(() => {
      if (tenant?.id) {
        checkOrderStatus();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [slug, orderId, tenant?.id]);
  
  // Function to check order status updates
  const checkOrderStatus = async () => {
    try {
      if (!tenant || !orderId) return;
      
      const response = await fetch(`/api/delivery/orders/${orderId}?tenantId=${tenant.id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // If status has changed, update the order and show a notification
        if (data.order && order && data.order.status !== order.status) {
          setOrder(data.order);
          
          // Update stepper
          const statusStep = statusToStep[data.order.status];
          if (statusStep >= 0) {
            setActiveStep(statusStep);
          }
          
          // Show notification
          toast({
            title: 'Status atualizado!',
            description: `Seu pedido foi ${getStatusText(data.order.status)}`,
            status: 'info',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pedido:', error);
    }
  };
  
  // Format order status for display
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'aguardando confirmação',
      'confirmed': 'confirmado',
      'preparing': 'em preparo',
      'delivery': 'saiu para entrega',
      'delivered': 'entregue',
      'cancelled': 'cancelado'
    };
    
    return statusMap[status] || status;
  };
  
  // Format price for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };
  
  // Format date for display
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
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  if (loading) {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <DeliveryHeader 
          tenant={tenant}
          loading={true} 
          cartItemsCount={0}
          onCartClick={() => {}}
          slug={slug as string}
        />
        <Flex justify="center" align="center" h="60vh" direction="column">
          <Spinner size="xl" mb={4} />
          <Text>Carregando status do pedido...</Text>
        </Flex>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <DeliveryHeader 
          tenant={tenant}
          loading={false} 
          cartItemsCount={0}
          slug={slug as string}
          onCartClick={() => router.push(``)}
        />
        <Box maxW="4xl" mx="auto" p={5} mt={10}>
          <Alert 
            status="error" 
            variant="subtle" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            textAlign="center" 
            borderRadius="md"
            py={6}
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Erro ao carregar detalhes do pedido
            </AlertTitle>
            <AlertDescription maxWidth="md">
              {error}
              <Button 
                colorScheme="red" 
                mt={4} 
                onClick={() => router.push(``)}
              >
                Voltar para a loja
              </Button>
            </AlertDescription>
          </Alert>
        </Box>
      </Box>
    );
  }
  
  // If order is cancelled
  if (order?.status === 'cancelled') {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <DeliveryHeader 
          slug=''
          tenant={tenant}
          loading={false} 
          cartItemsCount={0}
          onCartClick={() => router.push(``)}
        />
        <Box maxW="4xl" mx="auto" p={5} mt={10}>
          <Alert 
            status="error" 
            variant="subtle" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            textAlign="center" 
            borderRadius="md"
            py={6}
          >
            <Icon as={FaTimesCircle} boxSize="40px" color="red.500" />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Pedido Cancelado
            </AlertTitle>
            <AlertDescription maxWidth="md">
              <Text mb={3}>
                Infelizmente, o seu pedido #{order.numero} foi cancelado.
              </Text>
              <Text mb={5} fontSize="sm" color="gray.500">
                Se você tiver dúvidas sobre o motivo do cancelamento, 
                entre em contato com o estabelecimento.
              </Text>
              <Button 
                colorScheme="blue" 
                onClick={() => router.push(`/loja`)}
              >
                Fazer novo pedido
              </Button>
            </AlertDescription>
          </Alert>
          
          {/* Additional order details for reference */}
          <Card mt={6} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Heading size="md">Detalhes do Pedido #{order.numero}</Heading>
                <Text>Data: {formatDate(order.dataPedido)}</Text>
                <Text>Total: {formatCurrency(order.valorTotal)}</Text>
                <Text>Método de Pagamento: {order.formaPagamento}</Text>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <DeliveryHeader 
        tenant={tenant}
        loading={false} 
        cartItemsCount={0}
        onCartClick={() => router.push(``)}
        slug={slug as string}
      />
      
      <Box maxW="4xl" mx="auto" p={5}>
        {/* Status Heading */}
        <Stack 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align={{ base: 'flex-start', md: 'center' }}
          mb={6}
        >
          <Box>
            <Heading size="lg" mb={1}>
              Acompanhe seu Pedido
            </Heading>
            <Text color="gray.500">
              Pedido #{order.numero} • {formatDate(order.dataPedido)}
            </Text>
          </Box>
          <Badge 
            colorScheme={
              order.status === 'pending' ? 'orange' :
              order.status === 'confirmed' ? 'blue' :
              order.status === 'preparing' ? 'purple' :
              order.status === 'delivery' ? 'teal' :
              order.status === 'delivered' ? 'green' : 'gray'
            }
            fontSize="md"
            py={1}
            px={3}
            borderRadius="md"
          >
            {order.status === 'pending' && 'Aguardando Confirmação'}
            {order.status === 'confirmed' && 'Pedido Confirmado'}
            {order.status === 'preparing' && 'Em Preparo'}
            {order.status === 'delivery' && 'Saiu para Entrega'}
            {order.status === 'delivered' && 'Entregue'}
          </Badge>
        </Stack>
        
        {/* Status estacionamento */}
        <Box mb={6}>
          <StatusFuncionamento tenantId={tenant?.id} />
        </Box>
        
        {/* Status stepper */}
        <Card bg={bgColor} mb={6} boxShadow="md">
          <CardBody>
            <Stepper 
              index={activeStep} 
              colorScheme={
                order.status === 'pending' ? 'orange' :
                order.status === 'confirmed' ? 'blue' :
                order.status === 'preparing' ? 'purple' :
                order.status === 'delivery' ? 'teal' :
                order.status === 'delivered' ? 'green' : 'gray'
              }
              size="lg"
              mb={4}
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus 
                      complete={<StepIcon />} 
                      incomplete={<StepNumber />} 
                      active={
                        index === 0 ? <Icon as={FaShoppingBag} /> :
                        index === 1 ? <Icon as={FaCheckCircle} /> :
                        index === 2 ? <Icon as={FaUtensils} /> :
                        index === 3 ? <Icon as={FaMotorcycle} /> :
                        <Icon as={FaRegCheckCircle} />
                      }
                    />
                  </StepIndicator>
                  <Box flexShrink={0}>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </Box>
                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
            
            {/* Current status explanation */}
            <Alert 
              status={
                order.status === 'pending' ? 'warning' :
                order.status === 'confirmed' ? 'info' :
                order.status === 'preparing' ? 'info' :
                order.status === 'delivery' ? 'info' :
                'success'
              } 
              variant="subtle"
              borderRadius="md"
            >
              <AlertIcon />
              <Box>
                <AlertTitle>
                  {order.status === 'pending' && 'Aguardando Confirmação'}
                  {order.status === 'confirmed' && 'Pedido Confirmado'}
                  {order.status === 'preparing' && 'Pedido em Preparo'}
                  {order.status === 'delivery' && 'Pedido em Rota de Entrega'}
                  {order.status === 'delivered' && 'Pedido Entregue'}
                </AlertTitle>
                <AlertDescription>
                  {order.status === 'pending' && 'Seu pedido foi recebido e está aguardando confirmação pelo estabelecimento.'}
                  {order.status === 'confirmed' && 'Seu pedido foi confirmado e em breve entrará em preparo.'}
                  {order.status === 'preparing' && 'Seu pedido está sendo preparado na cozinha.'}
                  {order.status === 'delivery' && 'Seu pedido já saiu para entrega e está a caminho do seu endereço.'}
                  {order.status === 'delivered' && 'Seu pedido foi entregue com sucesso. Bom apetite!'}
                </AlertDescription>
              </Box>
            </Alert>
          </CardBody>
        </Card>
        
        {/* Order details */}
        <Grid 
          templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
          gap={6}
          mb={6}
        >
          {/* Order Items */}
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Card bg={bgColor} boxShadow="md" h="100%">
              <CardHeader borderBottomWidth="1px" borderColor={borderColor} pb={3}>
                <Heading size="md">Itens do Pedido</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {order.itens.map((item: any, idx: number) => (
                    <Box key={idx}>
                      <Flex justify="space-between" mb={1}>
                        <Text fontWeight="bold">
                          {item.quantidade}x {item.nome}
                        </Text>
                        <Text fontWeight="semibold">
                          {formatCurrency(item.valorTotal)}
                        </Text>
                      </Flex>
                      
                      {item.observacoes && (
                        <Text fontSize="sm" color="gray.500" mb={1}>
                          Obs: {item.observacoes}
                        </Text>
                      )}
                      
                      {/* Render item options */}
                      {item.opcoes && item.opcoes.sabores && item.opcoes.sabores.length > 0 && (
                        <HStack wrap="wrap" spacing={1} mb={1}>
                          {item.opcoes.sabores.map((sabor: any, i: number) => (
                            <Badge key={i} colorScheme="purple" mb={1}>
                              {sabor.nome}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                      
                      {idx < order.itens.length - 1 && <Divider mt={2} />}
                    </Box>
                  ))}
                  
                  {/* Order totals */}
                  <Box borderTopWidth="1px" borderColor={borderColor} pt={4} mt={2}>
                    <Flex justify="space-between" mb={2}>
                      <Text>Subtotal</Text>
                      <Text>{formatCurrency(order.valorItens)}</Text>
                    </Flex>
                    
                    <Flex justify="space-between" mb={2}>
                      <Text>Taxa de entrega</Text>
                      <Text>{formatCurrency(order.taxaEntrega)}</Text>
                    </Flex>
                    
                    <Flex justify="space-between" fontWeight="bold">
                      <Text>Total</Text>
                      <Text>{formatCurrency(order.valorTotal)}</Text>
                    </Flex>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
          
          {/* Order Info */}
          <GridItem>
            <Card bg={bgColor} boxShadow="md" mb={6}>
              <CardHeader borderBottomWidth="1px" borderColor={borderColor} pb={3}>
                <Heading size="md">Informações da Entrega</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Cliente */}
                  <Box>
                    <Text fontWeight="bold" mb={1}>Cliente</Text>
                    <Text>{order.cliente.nome}</Text>
                    <Text>{order.cliente.telefone}</Text>
                  </Box>
                  
                  {/* Endereço */}
                  {order.enderecoEntrega && (
                    <Box>
                      <Text fontWeight="bold" mb={1}>Endereço</Text>
                      <HStack align="flex-start">
                        <Icon as={FaMapMarkerAlt} mt={1} color="red.500" />
                        <Text>
                          {order.enderecoEntrega.rua}, {order.enderecoEntrega.numero}
                          {order.enderecoEntrega.complemento ? `, ${order.enderecoEntrega.complemento}` : ''}
                          <br />
                          {order.enderecoEntrega.bairro}, {order.enderecoEntrega.cidade}
                          {order.enderecoEntrega.referencia && (
                            <>
                              <br />
                              <Text as="span" fontSize="sm" color="gray.500">
                                Referência: {order.enderecoEntrega.referencia}
                              </Text>
                            </>
                          )}
                        </Text>
                      </HStack>
                    </Box>
                  )}
                  
                  {/* Pagamento */}
                  <Box>
                    <Text fontWeight="bold" mb={1}>Pagamento</Text>
                    <HStack>
                      <Icon as={FaMoneyBillWave} color="green.500" />
                      <Text>{order.formaPagamento}</Text>
                    </HStack>
                    {order.troco && (
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Troco para: {formatCurrency(order.troco)}
                      </Text>
                    )}
                  </Box>
                  
                  {/* Tempo estimado */}
                  {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'delivery') && (
                    <Box>
                      <Text fontWeight="bold" mb={1}>Tempo Estimado</Text>
                      <HStack>
                        <Icon as={FaClock} color="orange.500" />
                        <Text>Aprox. {tenant?.tempoEstimadoEntregaMin || 30}-{tenant?.tempoEstimadoEntregaMax || 60} min</Text>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
            
            {/* Estabelecimento */}
            <Card bg={bgColor} boxShadow="md">
              <CardHeader borderBottomWidth="1px" borderColor={borderColor} pb={3}>
                <Heading size="md">Estabelecimento</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="bold">{tenant?.nome}</Text>
                  
                  {tenant?.telefoneLoja && (
                    <HStack>
                      <Icon as={FaPhoneAlt} color="blue.500" />
                      <Text>{tenant.telefoneLoja}</Text>
                    </HStack>
                  )}
                  
                  {tenant?.enderecoLoja && (
                    <HStack align="flex-start">
                      <Icon as={FaMapMarkerAlt} mt={1} color="red.500" />
                      <Text>{tenant.enderecoLoja}</Text>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
        
        {/* Notifications */}
        <Card bg={bgColor} boxShadow="md" mb={6}>
          <CardBody>
            <Notifications orderId={Number(orderId)} tenantId={tenant?.id} />
          </CardBody>
        </Card>
        
        {/* Bottom actions */}
        <Flex justify="center" mb={8}>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={() => router.push(``)}
            leftIcon={<FaShoppingBag />}
          >
            Voltar para a loja
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
