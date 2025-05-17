import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Divider,
  Button,
  Badge,
  useColorModeValue,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { formatCurrency } from '@/utils/format';
import { FaShoppingCart, FaMotorcycle, FaStore } from 'react-icons/fa';
import { useParams, useRouter } from 'next/navigation';

interface OrderSummaryProps {
  cartItems: any[];
  taxaEntrega?: number;
  showCheckoutButton?: boolean;
  deliveryType?: 'delivery' | 'pickup';
  cupomAplicado?: any;
  valorDesconto?: number;
}

export function OrderSummary({
  cartItems,
  taxaEntrega = 0,
  showCheckoutButton = true,
  deliveryType = 'delivery',
  cupomAplicado = null,
  valorDesconto = 0
}: OrderSummaryProps) {
  const router = useRouter();
  const { slug } = useParams();
  const bgColor = useColorModeValue('white', 'gray.700');

  // Calcular subtotal
  const subtotal = cartItems.reduce(
    (total, item) => total + item.precoFinal * item.quantity,
    0
  );

  // Calcular total (subtotal + taxa de entrega - desconto do cupom)
  const total = subtotal + (deliveryType === 'delivery' ? taxaEntrega : 0) - valorDesconto;

  // Ir para o checkout
  const handleCheckout = () => {
    if (!slug) {
      console.error('Slug não disponível para navegação');
      return;
    }

    router.push(`/loja/checkout`);
  };

  return (
    <Box bg={bgColor} p={6} borderRadius="md" boxShadow="sm">
      <HStack justify="space-between" mb={4} align="center">
        <Text fontSize="xl" fontWeight="bold">
          Resumo do Pedido
        </Text>
        <Badge colorScheme="teal" fontSize="md" px={2} py={1} borderRadius="md">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
        </Badge>
      </HStack>

      {/* Tipo de entrega ou retirada */}
      <Flex
        align="center"
        bg={useColorModeValue('gray.50', 'gray.700')}
        px={3}
        py={2}
        borderRadius="md"
        mb={4}
      >
        <Icon
          as={deliveryType === 'delivery' ? FaMotorcycle : FaStore}
          mr={2}
          color={deliveryType === 'delivery' ? 'blue.500' : 'green.500'}
        />
        <Text fontWeight="medium">
          {deliveryType === 'delivery' ? 'Entrega no endereço' : 'Retirada na loja'}
        </Text>
      </Flex>

      <Divider mb={4} />

      {/* Lista de itens */}
      <VStack spacing={3} align="stretch" mb={4} maxH="300px" overflowY="auto">
        {cartItems.map((item, index) => {
          console.log('Item do carrinho:', item);
          return (
            <HStack key={`${item.id}-${index}`} justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontWeight="medium">
                  {item.quantidade}x {item.nome}
                </Text>
                {item.observacoes && (
                  <Text fontSize="xs" color="gray.500">
                    {item.observacoes}
                  </Text>
                )}
                {item.opcoes && item.opcoes.sabores && item.opcoes.sabores.length > 0 && (
                  <Text fontSize="xs" color="purple.500">
                    {item.opcoes.sabores.map((s: any) => s.nome).join(', ')}
                  </Text>
                )}
              </VStack>
              <Text>{formatCurrency(item.precoFinal * item.quantity)}</Text>
            </HStack>
          )
        })}
      </VStack>

      <Divider mb={4} />

      {/* Totais */}
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between">
          <Text>Subtotal</Text>
          <Text>{formatCurrency(subtotal)}</Text>
        </HStack>

        {deliveryType === 'delivery' && (
          <HStack justify="space-between">
            <Text>Taxa de entrega</Text>
            <Text>
              {taxaEntrega > 0 ? formatCurrency(taxaEntrega) : 'Grátis'}
            </Text>
          </HStack>
        )}

        {deliveryType === 'pickup' && (
          <HStack justify="space-between">
            <Text color="green.500" fontWeight="medium">Economia na retirada</Text>
            <Text color="green.500" fontWeight="medium">
              {taxaEntrega > 0 ? `- ${formatCurrency(taxaEntrega)}` : 'R$ 0,00'}
            </Text>
          </HStack>
        )}

        {valorDesconto > 0 && (
          <HStack justify="space-between">
            <Text color="green.500" fontWeight="medium">
              Desconto {cupomAplicado?.codigo ? `(${cupomAplicado.codigo})` : ''}
            </Text>
            <Text color="green.500" fontWeight="medium">
              - {formatCurrency(valorDesconto)}
            </Text>
          </HStack>
        )}

        <Divider my={2} />

        <HStack justify="space-between" fontWeight="bold">
          <Text fontSize="lg">Total</Text>
          <Text fontSize="lg" color="teal.500">
            {formatCurrency(total)}
          </Text>
        </HStack>
      </VStack>

      {showCheckoutButton && (
        <Button
          leftIcon={<FaShoppingCart />}
          colorScheme="teal"
          size="lg"
          width="100%"
          mt={5}
          onClick={handleCheckout}
          isDisabled={cartItems.length === 0}
        >
          Finalizar Pedido
        </Button>
      )}
    </Box>
  );
}
