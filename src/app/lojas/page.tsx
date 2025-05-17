'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    SimpleGrid,
    Card,
    CardBody,
    Image,
    Badge,
    Button,
    VStack,
    HStack,
    Icon,
    Link,
    Spinner,
    Alert,
    AlertIcon,
    useColorModeValue,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaExternalLinkAlt, FaStore } from 'react-icons/fa';
import { DeliveryHeader } from '@/components/delivery/DeliveryHeader';
import { useRouter } from 'next/navigation';
import { MobileFooter } from '@/components/delivery/MobileFooter';

export default function LojasPublicPage() {
    const [lojas, setLojas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<any>(null);
    const [tenantLoading, setTenantLoading] = useState(true);
    const router = useRouter();

    const cardBg = useColorModeValue('white', 'gray.800');
    const cardHoverBg = useColorModeValue('gray.50', 'gray.700');

    // Buscar informações do tenant e lojas ao carregar a página
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Buscar informações do tenant
                setTenantLoading(true);
                const tenantResponse = await fetch('/api/delivery/tenant');
                if (!tenantResponse.ok) throw new Error('Erro ao carregar informações do restaurante');
                const tenantData = await tenantResponse.json();
                setTenant(tenantData.tenant);
                setTenantLoading(false);

                // Buscar lojas ativas
                setLoading(true);
                const response = await fetch('/api/delivery/lojas?includeInactive=false');
                if (!response.ok) throw new Error('Erro ao carregar lojas');
                const data = await response.json();
                
                // Filtrar apenas lojas ativas
                const lojasAtivas = data.lojas?.filter((loja: any) => loja.ativo) || [];
                setLojas(lojasAtivas);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Voltar para a página inicial
    const handleVoltarHome = () => {
        router.push('/');
    };

    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <DeliveryHeader
                tenant={tenant}
                loading={tenantLoading}
                cartItemsCount={0}
                slug=""
            />

            <Container maxW="container.lg" py={6}>
                <Heading 
                    as="h1" 
                    mb={4} 
                    size="xl" 
                    color={tenant?.corPrimaria || 'teal.500'}
                    textAlign="center"
                >
                    Nossas Lojas
                </Heading>
                
                <Text 
                    textAlign="center" 
                    mt={16}
                    mb={8} 
                    fontSize="2xl"
                    color={useColorModeValue('gray.600', 'gray.400')}
                >
                    Escolha a loja mais próxima de você
                </Text>

                {loading ? (
                    <Box textAlign="center" py={10}>
                        <Spinner size="xl" color={tenant?.corPrimaria || 'teal.500'} />
                        <Text mt={4}>Carregando lojas...</Text>
                    </Box>
                ) : lojas.length === 0 ? (
                    <Alert 
                        status="info" 
                        variant="subtle" 
                        flexDirection="column" 
                        alignItems="center" 
                        justifyContent="center" 
                        textAlign="center" 
                        py={10} 
                        borderRadius="lg"
                    >
                        <AlertIcon boxSize="40px" mr={0} mb={4} />
                        <AlertTitle fontSize="lg" mb={2}>Nenhuma loja disponível</AlertTitle>
                        <AlertDescription maxWidth="md">
                            No momento não temos lojas cadastradas. Por favor, tente novamente mais tarde.
                        </AlertDescription>
                        <Button
                            mt={6}
                            colorScheme="teal"
                            onClick={handleVoltarHome}
                        >
                            Voltar à Página Inicial
                        </Button>
                    </Alert>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {lojas.map((loja) => (
                            <Card
                                key={loja.id}
                                bg={cardBg}
                                _hover={{
                                    transform: 'translateY(-5px)',
                                    shadow: 'lg',
                                    bg: cardHoverBg
                                }}
                                transition="all 0.3s"
                                overflow="hidden"
                                borderRadius="lg"
                                shadow="md"
                            >
                                <Box height="200px" overflow="hidden">
                                    <Image
                                        src={loja.imagem || 'https://via.placeholder.com/400x200?text=Sem+Imagem'}
                                        alt={loja.nome}
                                        width="100%"
                                        height="100%"
                                        objectFit="cover"
                                        fallback={<Box bg="gray.200" h="100%" />}
                                    />
                                </Box>

                                <CardBody>
                                    <VStack align="start" spacing={2}>
                                        <Heading size="md" lineHeight="tight" noOfLines={2}>
                                            {loja.nome}
                                        </Heading>

                                        <HStack>
                                            <Icon as={FaMapMarkerAlt} color="gray.500" />
                                            <Text color="gray.600" fontSize="sm" noOfLines={2}>
                                                {loja.endereco}
                                            </Text>
                                        </HStack>

                                        <Button
                                            as={Link}
                                            href={loja.link}
                                            isExternal
                                            colorScheme={tenant?.corPrimariaScheme || "teal"}
                                            rightIcon={<FaExternalLinkAlt />}
                                            mt={4}
                                            width="full"
                                        >
                                            Visitar Esta Loja
                                        </Button>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}
                
                {/* <Box textAlign="center" mt={10}>
                    <Button
                        onClick={handleVoltarHome}
                        variant="outline"
                        colorScheme={tenant?.corPrimariaScheme || "teal"}
                        leftIcon={<Icon as={FaStore} />}
                    >
                        Voltar para Cardápio
                    </Button>
                </Box> */}
            </Container>
            <MobileFooter tenant={tenant} />
        </Box>
    );
}