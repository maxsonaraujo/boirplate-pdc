import {
  Box,
  Flex,
  Text,
  Image,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  useColorModeValue,
  VStack,
  HStack,
  Divider
} from '@chakra-ui/react';
import { FaTrash, FaCommentAlt } from 'react-icons/fa';

interface CartItemProps {
  item: any;
  onUpdateQuantity: (id: number, quantity: number, options?: any) => void;
  onRemove: (id: number, options?: any) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };
  
  const handleUpdateQuantity = (value: number) => {
    onUpdateQuantity(item.id, value, item.options);
  };
  
  const handleRemove = () => {
    onRemove(item.id, item.options);
  };
  
  // Extract options data
  const sabores = item.selectedOptions?.sabores || [];
  const complementos = item.selectedOptions?.complementos || {};
  const observation = item.observation;
  
  // Get flat list of all selected complementos across groups
  const allComplementos: any[] = [];
  Object.entries(complementos).forEach(([groupId, selections]: [string, any]) => {
    if (Array.isArray(selections)) {
      selections.forEach(selectionId => {
        const grupo = item.grupoComplementos?.find(
          (g: any) => g.grupoComplementoId === parseInt(groupId)
        );
        const complemento = grupo?.grupoComplemento?.complementos?.find(
          (c: any) => c.complemento.id === selectionId
        )?.complemento;
        
        if (complemento) {
          allComplementos.push({
            nome: complemento.nome,
            preco: complemento.precoAdicional || 0
          });
        }
      });
    } else if (selections) {
      const grupo = item.grupoComplementos?.find(
        (g: any) => g.grupoComplementoId === parseInt(groupId)
      );
      const complemento = grupo?.grupoComplemento?.complementos?.find(
        (c: any) => c.complemento.id === selections
      )?.complemento;
      
      if (complemento) {
        allComplementos.push({
          nome: complemento.nome,
          preco: complemento.precoAdicional || 0
        });
      }
    }
  });
  
  // Calculate if there are any add-ons (ingredients or complementos with extra cost)
  const hasAddons = sabores.length > 0 || allComplementos.length > 0;
  
  return (
    <Box p={2} borderRadius="md">
      <Flex justify="space-between" align="center">
        <HStack spacing={3} flex={1}>
          {item.imagem && (
            <Image 
              src={item.imagem} 
              alt={item.nome}
              width="50px"
              height="50px"
              objectFit="cover"
              borderRadius="md"
            />
          )}
          
          <VStack align="start" spacing={0.5} flex={1}>
            <Text fontWeight="bold" fontSize="md">
              {item.nome}
            </Text>
            <Text color="gray.500" fontSize="xs" fontWeight="medium">
              {formatCurrency(item.precoFinal || item.precoVenda)}
            </Text>
          </VStack>
          
          <NumberInput 
            size="xs" 
            maxW="70px" 
            min={1} 
            max={99}
            value={item.quantity} 
            onChange={(_, value) => handleUpdateQuantity(value)}
          >
            <NumberInputField textAlign="center" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          
          <IconButton
            aria-label="Remover do carrinho"
            icon={<FaTrash />}
            size="xs"
            colorScheme="red"
            variant="ghost"
            onClick={handleRemove}
          />
        </HStack>
      </Flex>
      
      {/* Display sabores if any */}
      {sabores.length > 0 && (
        <Box mt={2} ml={8}>
          <Text fontSize="xs" fontWeight="medium" color="gray.500">
            Sabores:
          </Text>
          <VStack align="start" spacing={1} pl={2}>
            {sabores.map(sabor => (
              <HStack key={sabor.id} fontSize="xs">
                <Text fontWeight="medium">{sabor.nome}</Text>
                {sabor.preco > 0 && (
                  <Text color="gray.500">
                    ({formatCurrency(sabor.preco)})
                    {sabor.precoAdicional > 0 && ` +${formatCurrency(sabor.precoAdicional)}`}
                  </Text>
                )}
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
      
      {/* Display complementos if any */}
      {allComplementos.length > 0 && (
        <Box mt={2} ml={8}>
          <Text fontSize="xs" fontWeight="medium" color="gray.500">
            Complementos:
          </Text>
          <HStack flexWrap="wrap" spacing={1}>
            {allComplementos.map((comp, index) => (
              <Badge 
                key={index} 
                colorScheme="blue" 
                fontSize="2xs"
                mr={1}
                mb={1}
              >
                {comp.nome}
                {comp.preco > 0 && ` (+${formatCurrency(comp.preco)})`}
              </Badge>
            ))}
          </HStack>
        </Box>
      )}
      
      {/* Display observation if any */}
      {observation && (
        <Box mt={2} ml={8}>
          <Flex align="center">
            <FaCommentAlt size="12px" color="gray" />
            <Text fontSize="xs" fontWeight="medium" color="gray.500" ml={1}>
              Observação:
            </Text>
          </Flex>
          <Text fontSize="xs" color="gray.600" fontStyle="italic" pl={4} mt={0.5}>
            "{observation}"
          </Text>
        </Box>
      )}
      
      {/* Total for this item */}
      <Flex justify="flex-end" mt={2}>
        <Text fontWeight="bold" fontSize="sm">
          {formatCurrency((item.precoFinal || item.precoVenda) * item.quantity)}
        </Text>
      </Flex>
    </Box>
  );
}
