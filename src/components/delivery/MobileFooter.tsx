import { Box, Button, Flex, Icon, Text, useColorModeValue, useTheme, Badge } from '@chakra-ui/react';
import { useRouter, usePathname } from 'next/navigation';
import { FaListAlt, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '@/hooks/useCart';

interface MobileFooterProps {
  tenant: any;
  onCartClick?: () => void;
}

export function MobileFooter({ tenant, onCartClick }: MobileFooterProps) {
  const router = useRouter();
  const path = usePathname();
  const theme = useTheme();
  const { cart } = useCart();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Cor primária do tema
  const primaryColor = theme.colors?.brand?.primary || tenant?.corPrimaria || 'teal.500';
  
  // Verificar se deve ocultar o footer em determinadas rotas
  const shouldHide = path?.includes("meus-pedidos") || path?.includes("lojas") || path?.includes("acompanhar") || path?.includes("checkout");

  if (shouldHide) return null;

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      router.push('/loja');
    }
  };

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      zIndex="1000"
      bg={bgColor}
      borderTopWidth="1px"
      borderColor={borderColor}
      shadow="0 -2px 10px rgba(0,0,0,0.05)"
      py={2}
      px={4}
      display={{ base: 'block', md: 'none' }} // Exibir apenas em dispositivos móveis
      pb={4} // Adicionar paddingBottom para evitar conflito com elementos nativos
    >
      <Flex justify="space-between" align="center" gap={2}>
        <Button
          variant="ghost"
          onClick={() => router.push('/loja/acompanhar')}
          colorScheme={tenant?.corPrimariaScheme || "teal"}
          width="50%"
          py={6}
          borderRadius="md"
          leftIcon={<Icon as={FaListAlt} boxSize={5} />}
          _hover={{
            bg: `${primaryColor}20`
          }}
        >
          <Text fontSize="sm" fontWeight="medium">
            Meus Pedidos
          </Text>
        </Button>

        <Button
          variant="ghost"
          onClick={handleCartClick}
          colorScheme={tenant?.corPrimariaScheme || "teal"}
          width="50%"
          py={6}
          borderRadius="md"
          position="relative"
          _hover={{
            bg: `${primaryColor}20`
          }}
        >
          <Flex align="center" position="relative">
            <Icon as={FaShoppingCart} boxSize={5} mr={2} />
            {cart && cart.length > 0 && (
              <Badge
                position="absolute"
                top="-8px"
                right="-8px"
                colorScheme="red"
                borderRadius="full"
                minW="18px"
                height="18px"
                textAlign="center"
                fontSize="xs"
                padding="0"
              >
                {cart.length}
              </Badge>
            )}
            <Text fontSize="sm" fontWeight="medium">
              Meu Carrinho
            </Text>
          </Flex>
        </Button>
      </Flex>
    </Box>
  );
}