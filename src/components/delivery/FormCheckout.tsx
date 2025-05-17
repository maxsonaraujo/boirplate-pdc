'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    Divider,
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    useToast,
    Spinner,
    Flex,
    Radio,
    RadioGroup,
    Stack,
    FormErrorMessage,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useColorModeValue,
    Card,
    CardBody,
    Image,
} from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { OrderSummary } from '@/components/delivery/OrderSummary';
import { DeliveryHeader } from '@/components/delivery/DeliveryHeader';

interface BairroPublico {
    id: number | null;
    nome: string;
    isCadastrado: boolean;
    taxaEntrega: number;
    fonte: string;
    grupoId: number | null;
    grupoNome: string | null;
}

export default function FormCheckout({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const { cart, clearCart, calculateTotal } = useCart();
    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.700');
    const slug = params.slug;

    const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [metodosPagamento, setMetodosPagamento] = useState<any[]>([]);
    const [taxaEntrega, setTaxaEntrega] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [tenant, setTenant] = useState<any>(null);

    const [customerInfo, setCustomerInfo] = useState({
        nome: '',
        telefone: '',
        email: '',
    });

    const [deliveryInfo, setDeliveryInfo] = useState({
        areaId: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        cidadeId: '',
        bairroId: '',
        referencia: '',
    });

    const [pickupInfo, setPickupInfo] = useState({
        horarioRetirada: '',
        observacaoRetirada: '',
    });

    const [paymentInfo, setPaymentInfo] = useState({
        metodo: '',
        troco: '',
        observacoes: '',
    });

    const [acceptsChange, setAcceptsChange] = useState(false);

    // Estados para cupom de desconto
    const [cupomCodigo, setCupomCodigo] = useState('');
    const [cupomAplicado, setCupomAplicado] = useState<any>(null);
    const [isValidatingCupom, setIsValidatingCupom] = useState(false);

    const [cidadesDisponiveis, setCidadesDisponiveis] = useState<any[]>([]);
    const [bairrosDisponiveis, setBairrosDisponiveis] = useState<any[]>([]);
    const [bairrosPublicos, setBairrosPublicos] = useState<BairroPublico[]>([]);
    const [isLoadingBairros, setIsLoadingBairros] = useState(false);
    const [isCadastrando, setIsCadastrando] = useState(false);
    const [isCustomBairro, setIsCustomBairro] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch tenant info
                const tenantResponse = await fetch(`/api/delivery/tenant`);
                const tenantData = await tenantResponse.json();
                setTenant(tenantData.tenant);

                // Buscar cidades disponíveis
                const cidadesResponse = await fetch(`/api/delivery/cidades?tenantId=${tenantData.tenant.id}`);
                const cidadesData = await cidadesResponse.json();
                setCidadesDisponiveis(cidadesData.cidades || []);

                const paymentResponse = await fetch(`/api/delivery/payment-methods`);
                const paymentData = await paymentResponse.json();

                setMetodosPagamento(paymentData.methods || []);
            } catch (error) {
                console.error('Erro ao carregar dados do checkout:', error);
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar os dados necessários para finalizar seu pedido.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (!cart || cart.length === 0) {
            router.push(``);
        } else {
            fetchData();
        }
    }, [slug, router, cart, toast]);

    useEffect(() => {
        const fetchBairros = async () => {
            if (!deliveryInfo.cidadeId) {
                setBairrosDisponiveis([]);
                setBairrosPublicos([]);
                return;
            }

            try {
                setIsLoadingBairros(true);

                // Buscar bairros cadastrados no sistema
                const responseCadastrados = await fetch(`/api/delivery/bairros?cidadeId=${deliveryInfo.cidadeId}`);

                if (!responseCadastrados.ok) {
                    throw new Error('Erro ao carregar bairros cadastrados');
                }

                const dataCadastrados = await responseCadastrados.json();
                setBairrosDisponiveis(dataCadastrados.bairros || []);

                // Calcular taxa de entrega baseada na cidade selecionada (caso não selecione um bairro específico)
                const cidadeSelecionada = cidadesDisponiveis.find(c => c.id === Number(deliveryInfo.cidadeId));
                if (cidadeSelecionada) {
                    setTaxaEntrega(cidadeSelecionada.valorEntrega || 0);
                }
            } catch (error) {
                console.error('Erro ao buscar bairros:', error);
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar os bairros desta cidade',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });

                // Fallback para cidade
                const cidadeSelecionada = cidadesDisponiveis.find(c => c.id === Number(deliveryInfo.cidadeId));
                if (cidadeSelecionada) {
                    setTaxaEntrega(cidadeSelecionada.valorEntrega || 0);
                }
            } finally {
                setIsLoadingBairros(false);
            }
        };

        fetchBairros();
    }, [deliveryInfo.cidadeId, cidadesDisponiveis, slug, toast]);

    const cadastrarBairroPublico = async (bairroNome: string) => {
        if (!deliveryInfo.cidadeId || !bairroNome) return;

        try {
            setIsCadastrando(true);

            const response = await fetch('/api/delivery/bairros/cadastrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: bairroNome,
                    cidadeId: deliveryInfo.cidadeId,
                    slug: slug
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao cadastrar bairro');
            }

            const data = await response.json();

            // Atualizar lista de bairros cadastrados
            setBairrosDisponiveis(prev => [...prev, data.bairro]);

            // Remover da lista de bairros públicos
            setBairrosPublicos(prev => prev.filter(b => b.nome.toLowerCase() !== bairroNome.toLowerCase()));

            // Selecionar o bairro recém-cadastrado
            setDeliveryInfo(prev => ({
                ...prev,
                bairroId: data.bairro.id,
                bairro: data.bairro.nome
            }));

            // Aplicar taxa de entrega
            calcularTaxaEntrega(data.bairro.id);

            toast({
                title: 'Bairro cadastrado',
                description: 'O bairro foi cadastrado com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Erro ao cadastrar bairro:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível cadastrar o bairro',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsCadastrando(false);
        }
    };

    const calcularTaxaEntrega = async (bairroId?: number | string, bairroNome?: string) => {
        try {
            const response = await fetch('/api/delivery/checkout/calcular-taxa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bairroId: bairroId || deliveryInfo.bairroId,
                    bairroNome: bairroNome || deliveryInfo.bairro,
                    cidadeId: deliveryInfo.cidadeId,
                    slug: slug
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao calcular taxa de entrega');
            }

            const data = await response.json();
            setTaxaEntrega(data.taxaEntrega);
            console.log('Taxa de entrega calculada:', data);
        } catch (error) {
            console.error('Erro ao calcular taxa de entrega:', error);
        }
    };

    useEffect(() => {
        if (deliveryInfo.bairroId || (deliveryInfo.bairro && deliveryInfo.cidadeId)) {
            calcularTaxaEntrega();
        }
    }, [deliveryInfo.bairroId, deliveryInfo.bairro, deliveryInfo.cidadeId]);

    useEffect(() => {
        console.log('Tipo de entrega selecionado:', deliveryType);
        console.log('Informações de entrega:', deliveryInfo);
        console.log('Informações de retirada:', pickupInfo);
        console.log('Informações de pagamento:', paymentInfo);
        console.log('Informações do cliente:', customerInfo);
        console.log('Taxa de entrega:', taxaEntrega);

    }, [deliveryInfo.areaId, deliveryType]);

    const handleDeliveryTypeChange = (value: 'delivery' | 'pickup') => {
        setDeliveryType(value);
        if (value === 'pickup') {
            setTaxaEntrega(0);
        }
    };

    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomerInfo((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Manter apenas números
        value = value.replace(/\D/g, '');

        // Aplicar a máscara
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

        handleCustomerChange({
            target: {
                name: 'telefone',
                value
            }
        } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDeliveryInfo((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handlePickupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPickupInfo((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPaymentInfo((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    // Função para validar e aplicar o cupom de desconto
    const handleValidarCupom = async () => {
        if (!cupomCodigo.trim()) {
            toast({
                title: 'Erro',
                description: 'Digite um código de cupom válido',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsValidatingCupom(true);
        try {
            const response = await fetch(`/api/delivery/cupons/validar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    codigo: cupomCodigo, 
                    tenantId: tenant?.id,
                    valorCompra: calculateTotal()
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao validar cupom');
            }

            setCupomAplicado(data.cupom);
            
            toast({
                title: 'Cupom aplicado!',
                description: `O cupom ${data.cupom.codigo} foi aplicado com sucesso`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Erro ao validar cupom:', error);
            setCupomAplicado(null);
            toast({
                title: 'Cupom inválido',
                description: error.message || 'O cupom informado não é válido ou não pode ser aplicado a este pedido',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsValidatingCupom(false);
        }
    };

    // Função para remover o cupom aplicado
    const handleRemoverCupom = () => {
        setCupomAplicado(null);
        setCupomCodigo('');
        toast({
            title: 'Cupom removido',
            description: 'O cupom foi removido do pedido',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
    };

    // Calcular o valor do desconto baseado no cupom aplicado
    const calcularValorDesconto = () => {
        if (!cupomAplicado) return 0;
        
        // O valor já vem calculado da API
        return cupomAplicado.valorDescontoCalculado || 0;
    };

    useEffect(() => {
        if (paymentInfo.metodo) {
            const selectedMethod = metodosPagamento.find(m => m.id.toString() === paymentInfo.metodo);
            setAcceptsChange(selectedMethod?.acceptsChange || false);

            // Se o método não aceita troco, limpar o campo de troco
            if (!selectedMethod?.acceptsChange) {
                setPaymentInfo(prev => ({
                    ...prev,
                    troco: ''
                }));
            }
        } else {
            setAcceptsChange(false);
        }
    }, [paymentInfo.metodo, metodosPagamento]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!customerInfo.nome.trim()) {
            newErrors.nome = 'Nome é obrigatório';
        }
        if (!customerInfo.telefone.trim()) {
            newErrors.telefone = 'Telefone é obrigatório';
        } else {
            const phoneDigits = customerInfo.telefone.replace(/\D/g, '');
            if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                newErrors.telefone = 'Telefone inválido';
            }
        }

        if (deliveryType === 'delivery') {
            if (!deliveryInfo.rua.trim()) {
                newErrors.rua = 'Rua é obrigatória';
            }
            if (!deliveryInfo.numero.trim()) {
                newErrors.numero = 'Número é obrigatório';
            }
            if (!deliveryInfo.bairro.trim() && !deliveryInfo.bairroId) {
                newErrors.bairro = 'Bairro é obrigatório';
            }
            if (!deliveryInfo.cidade.trim() && !deliveryInfo.cidadeId) {
                newErrors.cidade = 'Cidade é obrigatória';
            }
        }

        if (!paymentInfo.metodo) {
            newErrors.metodo = 'Selecione um método de pagamento';
        }

        // Se metodo de pagamento aceita troco e troco está preenchido, validar valor
        if (acceptsChange && paymentInfo.troco) {
            const trocoValue = parseFloat(paymentInfo.troco.replace(',', '.'));
            const totalValue = calculateTotal() + (deliveryType === 'delivery' ? taxaEntrega : 0);

            if (trocoValue <= totalValue) {
                newErrors.troco = 'O valor do troco deve ser maior que o valor total do pedido';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitOrder = async () => {
        console.log("customer", customerInfo)

        if (!validateForm()) {
            toast({
                title: 'Erro no formulário',
                description: 'Por favor, corrija os erros antes de continuar.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const orderData = {
                slug: slug,
                tipo: deliveryType.toUpperCase(),
                cliente: { ...customerInfo, telefone: customerInfo.telefone.replace(/\D/g, '') },
                entrega: deliveryType === 'delivery' ? deliveryInfo : null,
                retirada: deliveryType === 'pickup' ? pickupInfo : null,
                pagamento: {
                    ...paymentInfo,
                    troco: paymentInfo.troco ? parseFloat(paymentInfo.troco.replace(',', '.')) : null,
                },
                itens: cart.map((item) => ({
                    produtoId: item.id,
                    nome: item.nome,
                    quantidade: item.quantity,
                    valorUnitario: item.precoFinal || item.precoVenda,
                    valorTotal: (item.precoFinal || item.precoVenda) * item.quantity,
                    observacoes: item.observation || '',
                    opcoes: item.selectedOptions || {},
                })),
                valorItens: calculateTotal(),
                taxaEntrega: deliveryType === 'delivery' ? taxaEntrega : 0,
                valorDesconto: cupomAplicado ? calcularValorDesconto() : 0,
                cupom: cupomAplicado ? {
                    id: cupomAplicado.id,
                    codigo: cupomAplicado.codigo,
                    valorDesconto: calcularValorDesconto()
                } : null,
                valorTotal: calculateTotal() + (deliveryType === 'delivery' ? taxaEntrega : 0) - (cupomAplicado ? calcularValorDesconto() : 0),
            };

            console.log('Enviando pedido:', orderData);

            const response = await fetch('/api/delivery/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Erro ao finalizar pedido');
            }


            // Redirecionar para a página de confirmação com o ID do pedido
            setTimeout(() => {
                const finishedUrl = `/loja/pedido/${responseData.order.id}`;
                console.log("Finished URL", finishedUrl)
                router.push(finishedUrl);
            }, 1000);

            clearCart();

            toast({
                title: 'Pedido realizado com sucesso!',
                description: 'Seu pedido foi enviado ao restaurante',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

        } catch (error) {
            console.error('Erro ao finalizar pedido:', error);
            toast({
                title: 'Erro ao finalizar pedido',
                description: error.message || 'Ocorreu um erro ao enviar seu pedido. Tente novamente.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <Box>
                <DeliveryHeader
                    tenant={tenant}
                    loading={true}
                    cartItemsCount={cart.length}
                    slug={slug as string}
                />
                <Container maxW="container.xl" py={8} textAlign="center">
                    <Spinner size="xl" />
                    <Text mt={4}>Carregando informações...</Text>
                </Container>
            </Box>
        );
    }

    const primaryColor = tenant?.corPrimaria || 'teal.500';

    console.log("payment", metodosPagamento)





    return (
        <Box minH="100vh" bg={bgColor}>
            <DeliveryHeader
                tenant={tenant}
                loading={false}
                slug={slug as string}
                cartItemsCount={cart.length}
            />

            <Container maxW="container.xl" py={8}>
                <Flex justify="space-between" align="center" mb={6}>
                    <Heading size="lg" color={primaryColor}>Finalizar Pedido</Heading>

                    <Button
                        leftIcon={<Box as="span" fontSize="lg">←</Box>}
                        variant="outline"
                        colorScheme={tenant?.corPrimariaScheme || "teal"}
                        onClick={() => router.push(``)}
                        size="md"
                    >
                        Voltar
                    </Button>
                </Flex>

                <Flex direction={{ base: 'column', lg: 'row' }} gap={8}>
                    <Box flex="3" bg={bgColor} p={6} borderRadius="md" boxShadow="sm">
                        <VStack spacing={6} align="stretch">
                            <Box>
                                <Heading size="md" mb={4} color={primaryColor}>Como deseja receber seu pedido?</Heading>
                                <RadioGroup
                                    onChange={(value) => handleDeliveryTypeChange(value as 'delivery' | 'pickup')}
                                    value={deliveryType}
                                    colorScheme={tenant?.corPrimariaScheme || "teal"}
                                >
                                    <Stack direction={{ base: "column", md: "row" }} spacing={5}>
                                        <Radio value="delivery">
                                            <Text fontWeight="medium">Entrega no endereço</Text>
                                            <Text fontSize="sm" color="gray.500">
                                                Receba no conforto da sua casa
                                            </Text>
                                        </Radio>
                                        <Radio value="pickup">
                                            <Text fontWeight="medium">Retirar na loja</Text>
                                            <Text fontSize="sm" color="gray.500">
                                                Retire no restaurante e economize a taxa de entrega
                                            </Text>
                                        </Radio>
                                    </Stack>
                                </RadioGroup>
                            </Box>

                            <Divider />

                            <Box>
                                <Heading size="md" mb={4} color={primaryColor}>Seus dados</Heading>
                                <VStack spacing={4} align="stretch">
                                    <FormControl isRequired isInvalid={!!errors.nome}>
                                        <FormLabel>Nome completo</FormLabel>
                                        <Input
                                            name="nome"
                                            value={customerInfo.nome}
                                            onChange={handleCustomerChange}
                                            placeholder="Seu nome completo"
                                            focusBorderColor={primaryColor}
                                        />
                                        {errors.nome && <FormErrorMessage>{errors.nome}</FormErrorMessage>}
                                    </FormControl>

                                    <FormControl isRequired isInvalid={!!errors.telefone}>
                                        <FormLabel>Telefone</FormLabel>
                                        <Input
                                            name="telefone"
                                            value={customerInfo.telefone}
                                            onChange={handlePhoneChange}
                                            placeholder="(00) 00000-0000"
                                            focusBorderColor={primaryColor}
                                            maxLength={16}
                                        />
                                        {errors.telefone && <FormErrorMessage>{errors.telefone}</FormErrorMessage>}
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>E-mail (opcional)</FormLabel>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={customerInfo.email}
                                            onChange={handleCustomerChange}
                                            placeholder="seu@email.com"
                                            focusBorderColor={primaryColor}
                                        />
                                    </FormControl>
                                </VStack>
                            </Box>

                            <Divider />

                            {deliveryType === 'delivery' && (
                                <Box>
                                    <Heading size="md" mb={4} color={primaryColor}>Endereço de entrega</Heading>
                                    <VStack spacing={4} align="stretch">
                                        <FormControl isRequired isInvalid={!!errors.cidadeId}>
                                            <FormLabel>Cidade</FormLabel>
                                            <Select
                                                name="cidadeId"
                                                value={deliveryInfo.cidadeId}
                                                onChange={handleDeliveryChange}
                                                placeholder="Selecione a cidade"
                                                focusBorderColor={primaryColor}
                                                isDisabled={isLoadingBairros}
                                            >
                                                {cidadesDisponiveis.map((cidade) => (
                                                    <option key={cidade.id} value={cidade.id}>
                                                        {cidade.nome} - {cidade.estado} {cidade.valorEntrega > 0 ? `(Taxa: R$ ${cidade.valorEntrega.toFixed(2)})` : '(Taxa: Grátis)'}
                                                    </option>
                                                ))}
                                            </Select>
                                            {errors.cidadeId && <FormErrorMessage>{errors.cidadeId}</FormErrorMessage>}
                                        </FormControl>

                                        <FormControl isRequired isInvalid={!!errors.bairro}>
                                            <FormLabel>Bairro</FormLabel>
                                            {isLoadingBairros ? (
                                                <Select placeholder="Carregando bairros..." isDisabled>
                                                    <option disabled>Carregando...</option>
                                                </Select>
                                            ) : (
                                                <Select
                                                    name="bairroId"
                                                    value={deliveryInfo.bairroId || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;

                                                        if (value === "outro") {
                                                            setIsCustomBairro(true);
                                                            setDeliveryInfo(prev => ({
                                                                ...prev,
                                                                bairroId: "",
                                                                bairro: ""
                                                            }));
                                                        } else {
                                                            setIsCustomBairro(false);
                                                            setDeliveryInfo(prev => {
                                                                const bairro = bairrosDisponiveis.find(b => b.id === parseInt(value));
                                                                return {
                                                                    ...prev,
                                                                    bairroId: value,
                                                                    bairro: bairro ? bairro.nome : prev.bairro
                                                                }
                                                            });

                                                            calcularTaxaEntrega(value);
                                                        }
                                                    }}
                                                    placeholder="Selecione o bairro"
                                                    focusBorderColor={primaryColor}
                                                    isDisabled={!deliveryInfo.cidadeId || isLoadingBairros}
                                                >
                                                    {bairrosDisponiveis.length > 0 && (
                                                        bairrosDisponiveis.map((bairro) => (
                                                            <option key={`cadastrado-${bairro.id}`} value={bairro.id?.toString()}>
                                                                {bairro.nome}
                                                                {bairro.valorEntregaPersonalizado !== null ?
                                                                    ` (Taxa: R$ ${bairro.valorEntregaPersonalizado.toFixed(2)})` :
                                                                    bairro.grupoBairro ?
                                                                        ` (Taxa: R$ ${bairro.grupoBairro.valorEntrega.toFixed(2)})` :
                                                                        ''}
                                                            </option>
                                                        ))
                                                    )}
                                                    <option value="outro">Outro (digitar)</option>
                                                </Select>
                                            )}

                                            {isLoadingBairros && <Text fontSize="sm" color="gray.500">Carregando bairros...</Text>}

                                            {!isLoadingBairros && bairrosDisponiveis.length === 0 && deliveryInfo.cidadeId && (
                                                <Text fontSize="sm" color="orange.500">
                                                    Não foram encontrados bairros para esta cidade. Por favor, informe o nome do seu bairro manualmente abaixo.
                                                </Text>
                                            )}

                                            {errors.bairro && <FormErrorMessage>{errors.bairro}</FormErrorMessage>}
                                        </FormControl>

                                        {isCustomBairro && <FormControl isRequired={deliveryInfo.bairroId === "" || !deliveryInfo.bairroId} isInvalid={!!errors.bairro} isDisabled={deliveryInfo.bairroId !== "" && !!deliveryInfo.bairroId}>
                                            <FormLabel>{deliveryInfo.bairroId ? "Bairro selecionado" : "Digite seu bairro"}</FormLabel>
                                            <Input
                                                name="bairro"
                                                value={deliveryInfo.bairro}
                                                onChange={(e) => {
                                                    handleDeliveryChange(e);
                                                    if (deliveryInfo.bairroId) {
                                                        setDeliveryInfo(prev => ({ ...prev, bairroId: '' }));
                                                    }
                                                }}
                                                placeholder="Digite o nome do seu bairro"
                                                focusBorderColor={primaryColor}
                                            />
                                            {errors.bairro && <FormErrorMessage>{errors.bairro}</FormErrorMessage>}
                                            {!deliveryInfo.bairroId && deliveryInfo.bairro && (
                                                <Text fontSize="sm" color="blue.500" mt={1}>
                                                    Taxa de entrega será baseada na cidade selecionada
                                                </Text>
                                            )}
                                        </FormControl>}

                                        <HStack spacing={4}>
                                            <FormControl isRequired isInvalid={!!errors.rua} flex="3">
                                                <FormLabel>Rua</FormLabel>
                                                <Input
                                                    name="rua"
                                                    value={deliveryInfo.rua}
                                                    onChange={handleDeliveryChange}
                                                    placeholder="Nome da rua"
                                                    focusBorderColor={primaryColor}
                                                />
                                                {errors.rua && <FormErrorMessage>{errors.rua}</FormErrorMessage>}
                                            </FormControl>

                                            <FormControl isRequired isInvalid={!!errors.numero} flex="1">
                                                <FormLabel>Número</FormLabel>
                                                <Input
                                                    name="numero"
                                                    value={deliveryInfo.numero}
                                                    onChange={handleDeliveryChange}
                                                    placeholder="Nº"
                                                    focusBorderColor={primaryColor}
                                                />
                                                {errors.numero && <FormErrorMessage>{errors.numero}</FormErrorMessage>}
                                            </FormControl>
                                        </HStack>

                                        <FormControl>
                                            <FormLabel>Complemento (opcional)</FormLabel>
                                            <Input
                                                name="complemento"
                                                value={deliveryInfo.complemento}
                                                onChange={handleDeliveryChange}
                                                placeholder="Apto, bloco, etc."
                                                focusBorderColor={primaryColor}
                                            />
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel>Ponto de referência (opcional)</FormLabel>
                                            <Textarea
                                                name="referencia"
                                                value={deliveryInfo.referencia}
                                                onChange={handleDeliveryChange}
                                                placeholder="Ex: Próximo à farmácia, portão azul, etc."
                                                rows={2}
                                                focusBorderColor={primaryColor}
                                            />
                                        </FormControl>
                                    </VStack>
                                </Box>
                            )}

                            {deliveryType === 'pickup' && (
                                <Box>
                                    <VStack spacing={4} align="stretch">
                                        <Alert status="info" borderRadius="md">
                                            <AlertIcon />
                                            <VStack align="start" spacing={1}>
                                                <AlertTitle>Informações para retirada</AlertTitle>
                                                <AlertDescription>
                                                    Seu pedido ficará disponível para retirada no endereço da loja. Apresente seu nome ou número do pedido no balcão.
                                                </AlertDescription>
                                            </VStack>
                                        </Alert>
                                    </VStack>
                                </Box>
                            )}

                            <Divider />

                            <Box>
                                <Heading size="md" mb={4} color={primaryColor}>Cupom de desconto</Heading>
                                <VStack spacing={4} align="stretch">
                                    <FormControl>
                                        <FormLabel>Possui um código promocional?</FormLabel>
                                        <HStack>
                                            <Input
                                                value={cupomCodigo}
                                                onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                                                placeholder="Digite o código do cupom"
                                                focusBorderColor={primaryColor}
                                                isDisabled={!!cupomAplicado}
                                                autoCapitalize="characters"
                                                flex="3"
                                            />
                                            {!cupomAplicado ? (
                                                <Button
                                                    onClick={handleValidarCupom}
                                                    isLoading={isValidatingCupom}
                                                    colorScheme={tenant?.corPrimariaScheme || "teal"}
                                                    isDisabled={!cupomCodigo.trim()}
                                                    flex="1"
                                                >
                                                    Aplicar
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleRemoverCupom}
                                                    colorScheme="red"
                                                    flex="1"
                                                >
                                                    Remover
                                                </Button>
                                            )}
                                        </HStack>
                                    </FormControl>

                                    {cupomAplicado && (
                                        <Alert status="success" borderRadius="md">
                                            <AlertIcon />
                                            <Box flex="1">
                                                <AlertTitle>Cupom "{cupomAplicado.codigo}" aplicado!</AlertTitle>
                                                <AlertDescription display="block">
                                                    {cupomAplicado.tipoDesconto === 'PERCENTUAL'
                                                        ? `Desconto de ${cupomAplicado.valorDesconto}% aplicado ao pedido.`
                                                        : `Desconto de R$ ${cupomAplicado.valorDesconto.toFixed(2)} aplicado ao pedido.`}
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    )}
                                </VStack>
                            </Box>

                            <Divider />

                            <Box>
                                <Heading size="md" mb={4} color={primaryColor}>Forma de pagamento</Heading>
                                <VStack spacing={4} align="stretch">
                                    <FormControl isRequired isInvalid={!!errors.metodo}>
                                        <FormLabel>Método de pagamento</FormLabel>
                                        <Select
                                            name="metodo"
                                            value={paymentInfo.metodo}
                                            onChange={handlePaymentChange}
                                            placeholder="Selecione como deseja pagar"
                                            focusBorderColor={primaryColor}
                                        >
                                            {metodosPagamento.map((metodo) => (
                                                <option key={metodo.id} value={metodo.id}>
                                                    {metodo.name}
                                                </option>
                                            ))}
                                        </Select>
                                        {errors.metodo && <FormErrorMessage>{errors.metodo}</FormErrorMessage>}
                                    </FormControl>

                                    {acceptsChange && (
                                        <FormControl isInvalid={!!errors.troco}>
                                            <FormLabel>Troco para (opcional)</FormLabel>
                                            <Input
                                                name="troco"
                                                value={paymentInfo.troco}
                                                onChange={handlePaymentChange}
                                                placeholder="Ex: 50,00"
                                                focusBorderColor={primaryColor}
                                            />
                                            <Text fontSize="sm" color="gray.500" mt={1}>
                                                Deixe em branco se não precisa de troco
                                            </Text>
                                            {errors.troco && <FormErrorMessage>{errors.troco}</FormErrorMessage>}
                                        </FormControl>
                                    )}

                                    <FormControl>
                                        <FormLabel>Observações adicionais (opcional)</FormLabel>
                                        <Textarea
                                            name="observacoes"
                                            value={paymentInfo.observacoes}
                                            onChange={handlePaymentChange}
                                            placeholder="Alguma informação adicional sobre seu pedido?"
                                            rows={3}
                                            focusBorderColor={primaryColor}
                                        />
                                    </FormControl>
                                </VStack>
                            </Box>
                        </VStack>
                    </Box>

                    <Box flex="2" position="relative">
                        <Box
                            position={{ base: 'relative', lg: 'sticky' }}
                            top="20px"
                        >
                            <OrderSummary
                                cartItems={cart}
                                taxaEntrega={deliveryType === 'delivery' ? taxaEntrega : 0}
                                showCheckoutButton={false}
                                deliveryType={deliveryType}
                                cupomAplicado={cupomAplicado}
                                valorDesconto={calcularValorDesconto()}
                            />

                            <Button
                                colorScheme={tenant?.corPrimariaScheme || "teal"}
                                size="lg"
                                width="100%"
                                mt={4}
                                onClick={handleSubmitOrder}
                                isLoading={isSubmitting}
                                loadingText="Finalizando pedido..."
                                bg={primaryColor}
                            >
                                Finalizar Pedido
                            </Button>

                            <Button
                                variant="ghost"
                                width="100%"
                                mt={2}
                                onClick={() => router.push(``)}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                gap={2}
                            >
                                <Box as="span">←</Box>
                                <Text>Adicionar mais itens</Text>
                            </Button>
                        </Box>
                    </Box>
                </Flex>
            </Container>
        </Box>
    );
}
