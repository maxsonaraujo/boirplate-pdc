import {
  Box,
  Flex,
  Heading,
  IconButton,
  Image,
  Skeleton,
  Text,
  useColorModeValue,
  Badge,
  useTheme
} from '@chakra-ui/react';
import { usePathname, useRouter } from 'next/navigation';
import { FaShoppingCart } from 'react-icons/fa';

interface DeliveryHeaderProps {
  tenant: any;
  loading: boolean;
  cartItemsCount: number;
  onCartClick?: () => void;
  slug: string;
}

export function DeliveryHeader({ tenant, loading, cartItemsCount, onCartClick, slug }: DeliveryHeaderProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const theme = useTheme();
  const router = useRouter();
  const path = usePathname()

  // Acessar cores do tema personalizado
  const primaryColor = theme.colors?.brand?.primary || tenant?.corPrimaria || 'teal.500';

  return (
    <Box 
      bg={bgColor} 
      py={4} 
      px={6} 
      borderBottomWidth="1px" 
      borderColor={borderColor} 
      shadow="md"
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="1000"
      width="100%"
    >
      <Flex maxW="container.xl" mx="auto" justify="space-between" align="center">
        {loading ? (
          <Flex align="center">
            <Skeleton height="40px" width="40px" borderRadius="full" mr={4} />
            <Skeleton height="24px" width="150px" />
          </Flex>
        ) : (
          <Flex align="center">
            {tenant?.logotipo ? (
              <Image
                src={tenant.logotipo}
                alt={tenant?.nome || 'Restaurante'}
                boxSize="50px"
                objectFit="cover"
                borderRadius="full"
                mr={4}
              />
            ) : (
              <Box
                bg={primaryColor}
                color="white"
                borderRadius="full"
                p={3}
                mr={4}
                fontSize="xl"
                fontWeight="bold"
                textAlign="center"
                width="50px"
                height="50px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {tenant?.nome?.charAt(0) || '?'}
              </Box>
            )}
            <Box>
              <Heading size="md" color={primaryColor}>
                {tenant?.nome || 'Restaurante'}
              </Heading>
              <Text fontSize="sm" color="gray.500">Delivery Online</Text>
            </Box>
          </Flex>
        )}


        {/* Meus pedidos*/}
        {path.includes("meus-pedidos") || path.includes("lojas") ? <></> : <IconButton
          aria-label="Meus pedidos"
          icon={<Text fontSize="lg" color={primaryColor}>Meus Pedidos</Text>}
          colorScheme="teal"
          variant="ghost"
          onClick={() => {
            router.push(`/loja/acompanhar`);
          }}
          fontSize="20px"
          _hover={{
            bg: `${primaryColor}30`
          }}
          mr={4}
          display={{ base: "none", md: "flex" }} // Ocultar em dispositivos móveis
        />}



        {/* Carrinho de compras */}
        {onCartClick ? <IconButton
          aria-label="Carrinho de compras"
          icon={
            <Flex position="relative">
              <FaShoppingCart />
              {cartItemsCount > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  top="-8px"
                  right="-8px"
                  minW="18px"
                  height="18px"
                  textAlign="center"
                  fontSize="xs"
                  padding="0"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Flex>
          }
          colorScheme="teal"
          variant="ghost"
          onClick={onCartClick}
          fontSize="20px"
          _hover={{
            bg: `${primaryColor}30`
          }}
        /> : <></>}
      </Flex>
    </Box>
  );
}
