import {
  Box,
  Image,
  Text,
  Stack,
  Heading,
  Flex,
  Badge,
  useColorModeValue,
  useTheme
} from '@chakra-ui/react';
import { useState } from 'react';
import { ProductModal } from './ProductModal';

interface ProductCardProps {
  product: any;
  onAddToCart: (product: any, quantity: number, options?: any, observation?: string) => void;
  tenantPrimaryColor?: string;
}

export function ProductCard({ product, onAddToCart, tenantPrimaryColor = 'teal.500' }: ProductCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const theme = useTheme();
  
  // Acessar cores do tema personalizado
  const primaryColor = theme.colors?.brand?.primary || tenantPrimaryColor;

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAddFromModal = (product: any, quantity: number, options: any, observation: string) => {
    onAddToCart(product, quantity, options, observation);
    setIsOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={bgColor}
        borderColor={borderColor}
        transition="all 0.3s"
        _hover={{ shadow: 'lg', transform: 'translateY(-2px)', cursor: 'pointer' }}
        onClick={handleOpenModal}
      >
        <Box position="relative">
          <Image
            src={product.imagem || '/images/default-product.jpg'}
            alt={product.nome}
            height="180px"
            width="100%"
            objectFit="cover"
          />

          {/* Badges for special conditions */}
          <Stack
            direction="row"
            position="absolute"
            top="10px"
            left="10px"
            spacing={2}
          >
            {product.aceitaSabores && (
              <Badge colorScheme="purple" variant="solid" borderRadius="full" px={2}>
                Múltiplos Sabores
              </Badge>
            )}
            {product.complementos?.length > 0 && (
              <Badge colorScheme="blue" variant="solid" borderRadius="full" px={2}>
                Personalizável
              </Badge>
            )}
          </Stack>
        </Box>

        <Box p={4}>
          <Heading size="md" mb={2} noOfLines={2}>
            {product.nome}
          </Heading>

          <Text fontSize="sm" color="gray.500" mb={3} noOfLines={2}>
            {product.descricao || 'Sem descrição disponível'}
          </Text>

          <Flex justifyContent="space-between" alignItems="center">
            {product.aceitaSabores && !product.exibirPrecoBase ? (
              <Text fontWeight="bold" fontSize="md" color={primaryColor}>

              </Text>
            ) : (
              <Text fontWeight="bold" fontSize="md" color={primaryColor}>
                {product.tipoCobranca === "valor_base" ? "" : "A partir de"} {formatCurrency(product.precoVenda)}
              </Text>
            )}

            <Text fontSize="sm" color="gray.500">
              Clique para selecionar
            </Text>
          </Flex>
        </Box>
      </Box>

      {/* Product detail modal for customization */}
      <ProductModal
        isOpen={isOpen}
        onClose={handleClose}
        product={product}
        onAddToCart={handleAddFromModal}
        tenantPrimaryColor={primaryColor}
      />
    </>
  );
}
