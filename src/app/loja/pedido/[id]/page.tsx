'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  VStack,
  HStack,
  Divider,
  Spinner,
  useToast,
  Button,
  Icon,
  Card,
  CardBody,
  useColorModeValue,
  Badge
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaArrowLeft, FaHome, FaTimesCircle, FaListAlt } from 'react-icons/fa';
import { DeliveryHeader } from '@/components/delivery/DeliveryHeader';
import { PedidoStatus } from '@/constants/pedidoStatus';
import { PedidoStatusBadge } from '@/components/delivery/PedidoStatusBadge';
import { PedidoStatusStepper } from '@/components/delivery/PedidoStatusStepper';
import { CustomerHeader } from '@/components/delivery/CustomerHeader';

interface OrderStatusProps {
  params: { slug: string; id: string };
}

export default function PedidoStatusPage({ params }: OrderStatusProps) {
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  const bgCard = useColorModeValue('white', 'gray.800');
  const backgroundMain = useColorModeValue('gray.50', 'gray.900')



  useEffect(() => {
    if (params) {
      (async () => {
        setSlug((await params).slug);
        setId((await params).id);
      })();
    }
  }, [params])
  // Verificar se usuário está "logado"
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const phoneFromStorage = localStorage.getItem(`delivery_phone_${slug}`);
      if (phoneFromStorage) {
        setIsLoggedIn(true);
        setSavedPhone(phoneFromStorage);
      }
    }
  }, [slug]);

  useEffect(() => {
    const fetchOrderDetails = async () => {

      if (!id)
        return;

      try {
        // setLoading(true);

        // Buscar informações do tenant
        const tenantResponse = await fetch(`/api/delivery/tenant`);
        if (!tenantResponse.ok) throw new Error('Erro ao carregar informações do restaurante');
        const tenantData = await tenantResponse.json();
        setTenant(tenantData.tenant);

        // Buscar detalhes do pedido
        const orderResponse = await fetch(`/api/delivery/orders/${id}`);
        if (!orderResponse.ok) throw new Error('Erro ao carregar informações do pedido');

        const orderData = await orderResponse.json();
        setOrder(orderData.order);
      } catch (error) {
        console.error('Erro ao buscar detalhes do pedido:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os detalhes do pedido',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();

    // Atualizar o status do pedido em intervalos regulares
    const interval = setInterval(fetchOrderDetails, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [slug, id, toast]);

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.removeItem(`delivery_phone_${slug}`);
    setIsLoggedIn(false);
    setSavedPhone(null);
    toast({
      title: 'Desconectado',
      description: 'Você saiu da sua conta de acompanhamento',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Box>
        <DeliveryHeader tenant={tenant} loading={true} cartItemsCount={0} slug={slug as string} />
        <Container maxW="container.md" py={8} mt={16} textAlign="center">
          <Spinner size="xl" />
          <Text mt={4}>Carregando informações do pedido...</Text>
        </Container>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box>
        <DeliveryHeader tenant={tenant} loading={false} cartItemsCount={0} slug={slug as string} />
        <Container maxW="container.md" py={8} textAlign="center">
          <Heading size="lg" mb={4} color="red.500">Pedido não encontrado</Heading>
          <Text mb={6}>Não conseguimos encontrar as informações deste pedido.</Text>
          <Button
            leftIcon={<FaHome />}
            colorScheme="teal"
            onClick={() => router.push(`/loja`)}
          >
            Voltar ao Cardápio
          </Button>
        </Container>
      </Box>
    );
  }

  const primaryColor = tenant?.corPrimaria || 'teal.500';
  const isOrderCancelled = order.status === PedidoStatus.CANCELLED;

  // Formatar data
  const formattedDate = new Date(order.dataPedido).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });


  console.log('Order:', order);
  return (
    <Box minH="100vh" bg={backgroundMain}>
      <DeliveryHeader tenant={tenant} loading={false} cartItemsCount={0} slug={slug} />

      {isLoggedIn && savedPhone && order.cliente && (
        <CustomerHeader
          clientName={order.cliente.nome}
          phoneNumber={savedPhone}
          onLogout={handleLogout}
          slug={slug}
        />
      )}

      <Container maxW="container.md" py={8} mt={4}>
        <HStack mb={6} spacing={4}>
          <Button
            leftIcon={<FaArrowLeft />}
            variant="outline"
            onClick={() =>
              isLoggedIn
                ? router.push(`/loja/meus-pedidos?telefone=${savedPhone}`)
                : router.push(`/loja`)
            }
            size="sm"
          >
            {isLoggedIn ? 'Voltar aos meus pedidos' : 'Voltar ao Cardápio'}
          </Button>

          {!isLoggedIn && savedPhone && (
            <Button
              leftIcon={<FaListAlt />}
              variant="outline"
              colorScheme="teal"
              onClick={() => router.push(`/loja/meus-pedidos?telefone=${savedPhone}`)}
              size="sm"
            >
              Meus Pedidos
            </Button>
          )}
        </HStack>

        {isOrderCancelled ? (
          <Card bg={bgCard} mb={6}>
            <CardBody>
              <Flex direction="column" align="center" p={4}>
                <Icon as={FaTimesCircle} boxSize={16} color="red.500" mb={4} />
                <Heading size="lg" textAlign="center" mb={2}>Pedido Cancelado</Heading>
                <Text textAlign="center" mb={4}>
                  Infelizmente o pedido #{order.numero} foi cancelado.
                </Text>
                <Text color="gray.500" fontSize="sm">
                  Se você tiver alguma dúvida, entre em contato conosco pelo telefone {tenant?.telefoneLoja || 'informado'}.
                </Text>
              </Flex>
            </CardBody>
          </Card>
        ) : (
          <>
            <Card bg={bgCard} mb={6} borderTopWidth="4px" borderTopColor={primaryColor}>
              <CardBody>
                <Flex direction="column" align="center" p={4}>
                  <Icon as={FaCheckCircle} boxSize={16} color="green.500" mb={4} />
                  <Heading size="lg" textAlign="center" mb={2}>Pedido Recebido!</Heading>
                  <Text textAlign="center" mb={4}>
                    Seu pedido foi recebido com sucesso e está sendo processado.
                  </Text>
                  <PedidoStatusBadge
                    status={order.status}
                    fontSize="lg"
                    p={2}
                    borderRadius="md"
                  >
                    Número do pedido: #{order.numero}
                  </PedidoStatusBadge>
                </Flex>
              </CardBody>
            </Card>

            <Card bg={bgCard} mb={6}>
              <CardBody>
                <Heading size="md" mb={4} color={primaryColor}>Status do Pedido</Heading>

                {/* Usando o componente de Stepper reutilizável */}
                <PedidoStatusStepper status={order.status} colorScheme="teal" />

                <Divider my={4} />

                <HStack justify="space-between" wrap="wrap">
                  <Text color="gray.600" fontSize="sm">
                    Pedido realizado em: {formattedDate}
                  </Text>

                  <PedidoStatusBadge status={order.status} />
                </HStack>
              </CardBody>
            </Card>
          </>
        )}

        <Card bg={bgCard} mb={6}>
          <CardBody>
            <Heading size="md" mb={4} color={primaryColor}>Detalhes do Pedido</Heading>

            <HStack justify="space-between" mb={2}>
              <Text fontWeight="bold">Tipo de pedido:</Text>
              <Badge colorScheme={order.tipo === 'DELIVERY' ? 'blue' : 'green'}>
                {order.tipo === 'DELIVERY' ? 'Entrega' : 'Retirada'}
              </Badge>
            </HStack>

            <Divider my={3} />

            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontWeight="bold" mb={1}>Dados de contato:</Text>
                <Text>{order.cliente?.nome}</Text>
                <Text>{order.cliente?.telefone}</Text>
                {order.cliente?.email && <Text>{order.cliente.email}</Text>}
              </Box>

              {order.tipo === 'DELIVERY' && order.enderecoEntrega && (
                <Box>
                  <Text fontWeight="bold" mb={1}>Endereço de entrega:</Text>
                  <Text>
                    {order.enderecoEntrega.rua}, {order.enderecoEntrega.numero}
                    {order.enderecoEntrega.complemento && `, ${order.enderecoEntrega.complemento}`}
                  </Text>
                  <Text>
                    {order.enderecoEntrega.bairro}, {order.enderecoEntrega.cidade}
                  </Text>
                  {order.enderecoEntrega.referencia && (
                    <Text>Referência: {order.enderecoEntrega.referencia}</Text>
                  )}
                </Box>
              )}

              <Box>
                <Text fontWeight="bold" mb={1}>Forma de pagamento:</Text>
                <HStack spacing={2}>
                  <Text>{order.pagamento?.metodoNome || order.formaPagamento}</Text>
                  {order.troco && (
                    <Badge colorScheme="green">Troco para: R$ {order.troco.toFixed(2)}</Badge>
                  )}
                </HStack>
              </Box>

              <Divider />

              <Box>
                <Text fontWeight="bold" mb={2}>Itens do pedido:</Text>
                <VStack align="stretch" spacing={3}>
                  {order.itens?.map((item: any, idx: number) => (
                    <Box key={idx} p={2} borderWidth="1px" borderRadius="md" borderColor="gray.200">
                      <HStack justify="space-between" mb={1}>
                        <Text fontWeight="medium">
                          {item.quantidade}x {item.produto.nome}
                        </Text>
                        <Text fontWeight="medium">R$ {item.valorTotal.toFixed(2)}</Text>
                      </HStack>
                      
                      {/* Exibição dos sabores */}
                      {item.opcoes?.sabores && item.opcoes.sabores.length > 0 && (
                        <Box ml={4} mb={1}>
                          <Text fontSize="sm" color="gray.600" fontWeight="medium">Sabores:</Text>
                          <Flex wrap="wrap" gap={1}>
                            {item.opcoes.sabores.map((sabor: any, saborIdx: number) => (
                              <Badge key={saborIdx} colorScheme="orange" variant="subtle" fontSize="xs">
                                {sabor.nome}
                                {sabor.precoAdicional > 0 && ` (+R$${sabor.precoAdicional.toFixed(2)})`}
                              </Badge>
                            ))}
                          </Flex>
                        </Box>
                      )}
                      
                      {/* Exibição dos complementos */}
                      {item.opcoes?.complementos && Object.keys(item.opcoes.complementos).length > 0 && (
                        <Box ml={4} mb={1}>
                          <Text fontSize="sm" color="gray.600" fontWeight="medium">Complementos:</Text>
                          <Flex wrap="wrap" gap={1}>
                            {Object.entries(item.opcoes.complementos).map(([grupoId, complementos]: [string, any]) => (
                              complementos.map((complemento: any, compIdx: number) => (
                                <Badge key={`${grupoId}-${compIdx}`} colorScheme="purple" variant="subtle" fontSize="xs">
                                  {complemento.nome}
                                  {complemento.precoAdicional > 0 && ` (+R$${complemento.precoAdicional.toFixed(2)})`}
                                </Badge>
                              ))
                            ))}
                          </Flex>
                        </Box>
                      )}
                      
                      {/* Observações do item */}
                      {item.observacoes && (
                        <Text fontSize="sm" color="gray.500" ml={4}>
                          Obs: {item.observacoes}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>

              <Divider />

              <VStack align="stretch" spacing={1}>
                <HStack justify="space-between">
                  <Text>Subtotal:</Text>
                  <Text>R$ {order.valorItens.toFixed(2)}</Text>
                </HStack>

                {order.tipo === 'DELIVERY' && (
                  <HStack justify="space-between">
                    <Text>Taxa de entrega:</Text>
                    <Text>R$ {order.taxaEntrega.toFixed(2)}</Text>
                  </HStack>
                )}

                <HStack justify="space-between" fontWeight="bold" fontSize="lg" pt={2}>
                  <Text>Total:</Text>
                  <Text color={primaryColor}>R$ {order.valorTotal.toFixed(2)}</Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        <HStack width="100%" spacing={4} mt={6}>
          <Button
            colorScheme="teal"
            size="lg"
            width="100%"
            onClick={() => router.push(`/loja`)}
            bg={primaryColor}
          >
            Fazer outro pedido
          </Button>

          {isLoggedIn && (
            <Button
              variant="outline"
              size="lg"
              width="100%"
              onClick={() => router.push(`/loja/meus-pedidos?telefone=${savedPhone}`)}
            >
              Meus pedidos
            </Button>
          )}
        </HStack>
      </Container>
    </Box>
  );
}
