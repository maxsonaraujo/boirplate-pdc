'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Card,
  CardBody,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Icon,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FaPhone, FaSearch, FaListAlt } from 'react-icons/fa';
import { DeliveryHeader } from '@/components/delivery/DeliveryHeader';

export default function AcompanharPedidoPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const toast = useToast();
  const [telefone, setTelefone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenExistente, setTokenExistente] = useState<string | null>(null);

  const bgCard = useColorModeValue('white', 'gray.800');
  const inputRef = useRef<HTMLInputElement>(null);

  // Verificar se já existe um telefone salvo para este slug
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem(`delivery_phone_${slug}`);
      if (savedPhone) {
        setTokenExistente(savedPhone);
      }
    }
  }, [slug]);

  // Buscar informações do tenant ao carregar a página
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setTenantLoading(true);
        const response = await fetch(`/api/delivery/tenant`);
        if (!response.ok) throw new Error('Erro ao carregar informações do restaurante');

        const data = await response.json();
        setTenant(data.tenant);
      } catch (error) {
        console.error('Erro ao buscar tenant:', error);
      } finally {
        setTenantLoading(false);
      }
    };

    fetchTenant();
  }, [slug]);

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Formatar o número de telefone para manter apenas dígitos
    value = value.replace(/\D/g, '');

    // Formatar para exibição
    if (value.length > 0) {
      if (value.length <= 2) {
        value = `(${value}`;
      } else if (value.length <= 7) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
      } else if (value.length <= 11) {
        value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
      } else {
        value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
      }
    }

    setTelefone(value);
    setError('');
  };

  const handleSearch = async () => {
    // Validar formato do telefone
    const phoneDigits = telefone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError('Por favor, insira um número de telefone válido');
      return;
    }

    try {
      // Salvar telefone no localStorage para acesso futuro
      localStorage.setItem(`delivery_phone_${slug}`, phoneDigits);

      // Redirecionar para a página de listagem de pedidos
      router.push(`/loja/meus-pedidos?telefone=${phoneDigits}`);
    } catch (error) {
      console.error('Erro ao processar:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }finally{
      setIsLoading(false);
    }
  };

  const handleAcessarPedidos = () => {
    if (tokenExistente) {
      router.push(`/loja/meus-pedidos?telefone=${tokenExistente}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    if (tokenExistente) {
      handleAcessarPedidos();
    }else{
      setIsLoadingToken(false); 
    }
  }, [tokenExistente])

  const primaryColor = tenant?.corPrimaria || 'teal.500';

  if (isLoadingToken)
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color={primaryColor} />
      </Box>
    );
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <DeliveryHeader tenant={tenant} loading={tenantLoading} cartItemsCount={0} slug={slug} />

      <Container maxW="container.md" py={8} mt={16}>
        {tokenExistente && (
          <Alert
            status="info"
            variant="subtle"
            borderRadius="md"
            mb={6}
            flexDirection={{ base: "column", sm: "row" }}
            alignItems={{ base: "center", sm: "flex-start" }}
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center">
              <AlertIcon />
              <Text ml={2}>Você já tem acesso aos seus pedidos com o telefone cadastrado</Text>
            </Box>
            <Button
              size="sm"
              colorScheme="blue"
              leftIcon={<FaListAlt />}
              onClick={handleAcessarPedidos}
              mt={{ base: 3, sm: 0 }}
            >
              Acessar meus pedidos
            </Button>
          </Alert>
        )}

        <Card bg={bgCard} boxShadow="md">
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Box textAlign="center">
                <Heading size="lg" mb={2} color={primaryColor}>Acompanhe seus Pedidos</Heading>
                <Text>Informe o número de telefone usado no pedido para acompanhar o status</Text>
              </Box>

              <FormControl isInvalid={!!error}>
                <FormLabel>Número de telefone</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaPhone} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    ref={inputRef}
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    onKeyPress={handleKeyPress}
                    maxLength={16}
                    focusBorderColor={primaryColor}
                  />
                </InputGroup>
                <FormErrorMessage>{error}</FormErrorMessage>
              </FormControl>

              <Button
                leftIcon={<FaSearch />}
                colorScheme="teal"
                onClick={handleSearch}
                isLoading={isLoading}
                loadingText="Buscando..."
                bg={primaryColor}
              >
                Buscar Pedidos
              </Button>

              <Text fontSize="sm" color="gray.500">
                Seus pedidos mais recentes dos últimos 7 dias serão exibidos associados a este telefone.
                Se você fez um pedido com outro número, utilize o número usado no momento do pedido.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Button
          variant="outline"
          mt={4}
          width="100%"
          onClick={() => router.push(`/loja`)}
        >
          Voltar ao cardápio
        </Button>
      </Container>
    </Box>
  );
}
