import {
  Box,
  Flex,
  Text,
  Button,
  Icon,
  HStack,
  useColorModeValue,
  Container,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FaUser, FaSignOutAlt, FaListAlt, FaShoppingCart, FaChevronDown } from 'react-icons/fa';

interface CustomerHeaderProps {
  clientName: string;
  phoneNumber: string;
  onLogout: () => void;
  slug: string;
}

export function CustomerHeader({ clientName, phoneNumber, onLogout, slug }: CustomerHeaderProps) {
  const router = useRouter();
  const bg = useColorModeValue('teal.500', 'teal.200');
  const color = useColorModeValue('white', 'gray.800');
  
  // Formatar o telefone para exibição
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    
    // Se já estiver formatado
    if (phone.includes('(')) return phone;
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    }
    return phone;
  };
  
  const handleViewOrders = () => {
    router.push(`/loja/meus-pedidos?telefone=${phoneNumber}`);
  };
  
  const handleNewOrder = () => {
    router.push(`/loja`);
  };

  return (
    <Box bg={bg} color={color} py={2} shadow="md">
      <Container maxW="container.md">
        <Flex justify="space-between" align="center">
          <HStack spacing={2}>
            <Icon as={FaUser} />
            <Text fontWeight="medium" display={{ base: 'block', md: 'block' }}>
              {clientName || 'Olá, Cliente'}
            </Text>
          </HStack>

            <Menu>
            <MenuButton color={'white'}  _expanded={{ textColor: 'black' }} as={Button} rightIcon={<FaChevronDown />} variant="ghost" _hover={{ bg: 'teal.600' }} size={{ base: "sm", md: "md" }}>
              <HStack>
              <Box>
                <Text fontWeight="medium" fontSize="sm" >
                {formatPhone(phoneNumber)}
                </Text>
              </Box>
              </HStack>
            </MenuButton>
            <MenuList color="black">
              <MenuItem icon={<FaListAlt />} onClick={handleViewOrders}>
              Meus Pedidos
              </MenuItem>
              <MenuItem icon={<FaShoppingCart />} onClick={handleNewOrder}>
              Fazer Novo Pedido
              </MenuItem>
              <Divider my={2} />
              <MenuItem icon={<FaSignOutAlt />} onClick={onLogout} color="red.500">
              Sair
              </MenuItem>
            </MenuList>
            </Menu>
        </Flex>
      </Container>
    </Box>
  );
}
