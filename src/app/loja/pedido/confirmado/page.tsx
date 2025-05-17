'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Button, 
  VStack, 
  Flex, 
  Icon, 
  Card, 
  CardBody, 
  Badge, 
  useColorModeValue,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { FaCheckCircle, FaArrowRight, FaHome, FaListUl } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import {DeliveryHeader} from '@/components/delivery/DeliveryHeader';

export default function PedidoConfirmadoPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('id');
  const pedidoNumero = searchParams.get('numero');
  const toast = useToast();
  
  const [tenant, setTenant] = useState<any>(null);
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const bgCard = useColorModeValue('white', 'gray.800');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar informações do tenant
        const tenantResponse = await fetch(`/api/delivery/tenant`);
        if (!tenantResponse.ok) throw new Error('Erro ao carregar informações do restaurante');
        const tenantData = await tenantResponse.json();
        setTenant(tenantData.tenant);
        
        // Se tiver ID, buscar detalhes do pedido
        if (pedidoId) {
          try {
            const pedidoResponse = await fetch(`/api/delivery/orders/${pedidoId}`);
            if (pedidoResponse.ok) {
              const pedidoData = await pedidoResponse.json();
              setPedido(pedidoData.order);
            }
          } catch (error) {
            console.error('Erro ao buscar detalhes do pedido:', error);
            // Não exibimos erro se não conseguirmos carregar os detalhes
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar algumas informações',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug, pedidoId, toast]);
  
  const handleAcompanharPedido = () => {
    if (pedidoId) {
      router.push(`/loja/pedido/${pedidoId}`);
    } else {
      router.push(`/loja/acompanhar`);
    }
  };
  
  const primaryColor = tenant?.corPrimaria || 'teal.500';
  
  if (loading) {
    return (
      <Box>
        <DeliveryHeader tenant={tenant} loading={true} cartItemsCount={0} slug={slug as string}/>
        <Container maxW="container.md" py={8} textAlign="center">
          <Spinner size="xl" />
          <Text mt={4}>Carregando informações...</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <DeliveryHeader tenant={tenant} loading={false} cartItemsCount={0} slug={slug as string}/>
      
      <Container maxW="container.md" py={8}>
        <Card bg={bgCard} mb={6} borderTopWidth="4px" borderTopColor={primaryColor}>
          <CardBody>
            <Flex direction="column" align="center" py={6}>
              <Icon as={FaCheckCircle} boxSize={16} color="green.500" mb={4} />
              
              <Heading size="lg" textAlign="center" mb={3}>
                Pedido Recebido com Sucesso!
              </Heading>
              
              <Text textAlign="center" fontSize="lg" mb={4}>
                Seu pedido foi registrado e está sendo processado.
              </Text>
              
              {pedidoNumero && (
                <Badge colorScheme="teal" fontSize="xl" p={2} borderRadius="md" mb={4}>
                  Pedido #{pedidoNumero}
                </Badge>
              )}
              
              <Text color="gray.500" mb={6} textAlign="center">
                Você receberá atualizações sobre o status do seu pedido.
              </Text>
              
              <VStack spacing={4} width="100%" maxW="400px">
                <Button 
                  colorScheme="teal" 
                  size="lg" 
                  width="100%" 
                  rightIcon={<FaArrowRight />}
                  onClick={handleAcompanharPedido}
                  bg={primaryColor}
                >
                  Acompanhar Pedido
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  width="100%"
                  leftIcon={<FaHome />}
                  onClick={() => router.push(`/loja`)}
                >
                  Voltar ao Cardápio
                </Button>
              </VStack>
            </Flex>
          </CardBody>
        </Card>
        
        {pedido && (
          <Card bg={bgCard} mb={6}>
            <CardBody>
              <Heading size="md" mb={4} color={primaryColor}>Resumo do Pedido</Heading>
              
              <VStack align="stretch" spacing={3}>
                <Flex justify="space-between">
                  <Text fontWeight="medium">Subtotal:</Text>
                  <Text>R$ {pedido.valorItens?.toFixed(2)}</Text>
                </Flex>
                
                {pedido.tipo === 'DELIVERY' && (
                  <Flex justify="space-between">
                    <Text fontWeight="medium">Taxa de Entrega:</Text>
                    <Text>R$ {pedido.taxaEntrega?.toFixed(2)}</Text>
                  </Flex>
                )}
                
                <Flex justify="space-between" fontWeight="bold" fontSize="lg">
                  <Text>Total:</Text>
                  <Text color={primaryColor}>R$ {pedido.valorTotal?.toFixed(2)}</Text>
                </Flex>
                
                <Box pt={2}>
                  <Text fontWeight="medium" mb={1}>Forma de pagamento:</Text>
                  <Text>{pedido.formaPagamento}</Text>
                  {pedido.troco && (
                    <Text fontSize="sm">Troco para: R$ {pedido.troco.toFixed(2)}</Text>
                  )}
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}
        
        <Card bg={bgCard}>
          <CardBody>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Você também pode acompanhar seu pedido a qualquer momento 
              usando seu número de telefone na <a href={`/loja/acompanhar`} style={{ textDecoration: 'underline' }}>
                página de acompanhamento
              </a>.
            </Text>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}
