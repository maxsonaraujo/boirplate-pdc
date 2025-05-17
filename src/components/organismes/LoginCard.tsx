'use client'
import {
    Box,
    Button,
    Checkbox,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    Stack,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react'
import { useState } from 'react'
import { FaChartLine, FaEnvelope, FaLock, FaLongArrowAltRight, FaChartBar, FaChartPie, FaChartArea } from 'react-icons/fa'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export function LoginCard() {
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [lembrar, setLembrar] = useState(false)
    const [loading, setLoading] = useState(false)

    const toast = useToast({ position: 'top', isClosable: true })
    const router = useRouter()

    const cardBg = useColorModeValue('white', 'gray.800')
    const textColor = useColorModeValue('gray.700', 'gray.100')
    const brandColor = 'blue.500'

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await axios.post('/api/auth', { email, senha, remember: lembrar })
            toast({
                title: 'Login realizado com sucesso!',
                description: 'Redirecionando para o painel...',
                status: 'success',
                duration: 3000
            })
            router.push('/desk')
        } catch (err: any) {
            const message = err.response?.data?.message || 'Ocorreu um erro ao fazer login.'
            toast({
                title: 'Erro de autenticação',
                description: message,
                status: 'error',
                duration: 5000
            })
            setLoading(false)
        }
    }

    return (
        <Flex
            width={{ base: '90%', md: '900px' }}
            direction={{ base: 'column', md: 'row' }}
            overflow="hidden"
            boxShadow="0 20px 60px rgba(0,0,0,0.3)"
            borderRadius="xl"
            height={{ base: 'auto', md: '550px' }}
            backdropFilter="blur(10px)"
            background={useColorModeValue(
                'rgba(255, 255, 255, 0.9)',
                'rgba(26, 32, 44, 0.8)'
            )}
            border={useColorModeValue(
                '1px solid rgba(255,255,255,0.3)',
                '1px solid rgba(255,255,255,0.1)'
            )}
        >
            {/* Painel lateral com imagem */}
            <Box
                w={{ base: '100%', md: '50%' }}
                position="relative"
                overflow="hidden"
                bgGradient="linear(to-b, blue.600, blue.900)"
                p={{ base: 6, md: 0 }}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                borderRadius={{ base: '0', md: '0.75rem 0 0 0.75rem' }}
                boxShadow="2xl"
            >
                <Box
                    position={{ base: 'relative', md: 'absolute' }}
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    opacity="0.2"
                    bg="#0a192f"
                    backgroundSize="cover"
                    backgroundPosition="center"
                    mixBlendMode="overlay"
                    zIndex="1"
                />

                <Stack
                    zIndex="2"
                    spacing={4}
                    textAlign="center"
                    maxW="80%"
                    display={{ base: 'none', md: 'flex' }}
                >
                    <Icon as={FaChartLine} color="white" w={20} h={20} alignSelf="center" />
                    <Heading fontSize="3xl" fontWeight="bold" color="white">
                        Painel Financeiro
                    </Heading>
                    <Text color="white" fontSize="lg">
                        Visualize tendências e dados financeiros com facilidade
                    </Text>

                    <Box py={6}>
                        <Divider borderColor="whiteAlpha.400" />
                    </Box>

                    <VStack spacing={3} align="stretch">
                        <Feature title="Gráficos interativos" />
                        <Feature title="Análise de tendências" />
                        <Feature title="Relatórios avançados" />
                        <Feature title="Exportação de dados" />
                    </VStack>
                </Stack>
            </Box>

            {/* Formulário de login */}
            <Box
                w={{ base: '100%', md: '50%' }}
                p={8}
                bg={useColorModeValue('white', 'rgba(26, 32, 44, 0.9)')}
                display="flex"
                alignItems="center"
                borderRadius={{ base: '0', md: '0 0.75rem 0.75rem 0' }}
            >
                <VStack w="full" spacing={8}>
                    {/* Cabeçalho para mobile */}
                    <Stack
                        spacing={2}
                        display={{ base: 'flex', md: 'none' }}
                        alignItems="center"
                        mb={4}
                    >
                        <Flex
                            bg={brandColor}
                            w="60px"
                            h="60px"
                            borderRadius="full"
                            justify="center"
                            align="center"
                        >
                            <Icon as={FaChartLine} color="white" w={6} h={6} />
                        </Flex>
                        <Heading size="lg" color={textColor}>Painel Financeiro</Heading>
                    </Stack>

                    <Box w="full">
                        <Heading size="lg" mb={2} color={textColor}>
                            Bem-vindo de volta
                        </Heading>
                        <Text color={useColorModeValue("gray.500", "gray.400")}>
                            Faça login para acessar seu painel de controle
                        </Text>
                    </Box>

                    <form onSubmit={handleLogin} style={{ width: '100%' }}>
                        <VStack spacing={4} w="full">
                            <FormControl>
                                <FormLabel fontWeight="medium" color={textColor}>E-mail</FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none">
                                        <Icon as={FaEnvelope} color="gray.400" />
                                    </InputLeftElement>
                                    <Input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                                        borderColor={useColorModeValue('gray.300', 'whiteAlpha.300')}
                                        _hover={{ borderColor: brandColor }}
                                        _focus={{ borderColor: brandColor, boxShadow: `0 0 0 1px ${useColorModeValue('blue.500', 'blue.300')}` }}
                                    />
                                </InputGroup>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontWeight="medium" color={textColor}>Senha</FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none">
                                        <Icon as={FaLock} color="gray.400" />
                                    </InputLeftElement>
                                    <Input
                                        type="password"
                                        placeholder="********"
                                        value={senha}
                                        onChange={(e) => setSenha(e.target.value)}
                                        required
                                        bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                                        borderColor={useColorModeValue('gray.300', 'whiteAlpha.300')}
                                        _hover={{ borderColor: brandColor }}
                                        _focus={{ borderColor: brandColor, boxShadow: `0 0 0 1px ${useColorModeValue('blue.500', 'blue.300')}` }}
                                    />
                                </InputGroup>
                            </FormControl>

                            <Flex w="full" justify="space-between" align="center">
                                <Checkbox
                                    colorScheme="blue"
                                    isChecked={lembrar}
                                    onChange={(e) => setLembrar(e.target.checked)}
                                >
                                    <Text fontSize="sm">Lembrar-me</Text>
                                </Checkbox>
                                <Text
                                    fontSize="sm"
                                    color={brandColor}
                                    cursor="pointer"
                                    _hover={{ textDecoration: 'underline' }}
                                >
                                    Esqueceu a senha?
                                </Text>
                            </Flex>

                            <Button
                                type="submit"
                                w="full"
                                colorScheme="blue"
                                size="lg"
                                fontSize="md"
                                isLoading={loading}
                                loadingText="Entrando..."
                                mt={4}
                                rightIcon={<FaLongArrowAltRight />}
                                _hover={{
                                    transform: 'translateY(-2px)',
                                    boxShadow: 'lg',
                                }}
                                transition="all 0.2s"
                            >
                                Entrar
                            </Button>
                        </VStack>
                    </form>

                    <Box textAlign="center" w="full" pt={4}>
                        <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                            Este sistema é destinado apenas a usuários autorizados.
                        </Text>
                        <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")} mt={1}>
                            © {new Date().getFullYear()} Painel Financeiro | Desenvolvido por Giva Corp
                        </Text>
                    </Box>
                </VStack>
            </Box>
        </Flex>
    )
}

// Componente auxiliar para itens de recursos
const Feature = ({ title }) => (
    <Flex align="center" color="white">
        <Box w={1} h={1} borderRadius="full" bg="white" mr={2} />
        <Text fontSize="md">{title}</Text>
    </Flex>
)
