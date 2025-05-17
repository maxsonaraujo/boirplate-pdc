'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Heading,
    Button,
    Card,
    CardHeader,
    CardBody,
    SimpleGrid,
    Text,
    Image,
    Spinner,
    Flex,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    Textarea,
    Switch,
    useDisclosure,
    useColorModeValue,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Icon,
    Badge,
    VStack,
    HStack,
    LinkBox,
    LinkOverlay,
    IconButton,
    InputGroup,
    InputLeftElement,
    FormHelperText,
    Center,
    Progress,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from '@chakra-ui/react';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSave,
    FaStore,
    FaSearch,
    FaExternalLinkAlt,
    FaMapMarkerAlt,
    FaUpload,
    FaImage,
    FaTimes
} from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';

// Interface para loja
interface Loja {
    id?: string;
    nome: string;
    endereco: string;
    imagem: string;
    link: string;
    ativo: boolean;
}

export default function LojasPage() {
    const { tenant } = useTenant();
    const toast = useToast();
    const cardBg = useColorModeValue('white', 'gray.800');
    const cardHoverBg = useColorModeValue('gray.50', 'gray.700');

    // Estados
    const [lojas, setLojas] = useState<Loja[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);
    const [filteredLojas, setFilteredLojas] = useState<Loja[]>([]);

    // Estado para upload de imagem
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imageSource, setImageSource] = useState<'url' | 'upload'>(selectedLoja && selectedLoja.imagem ? "upload" : 'url'); // Novo estado para controlar a fonte da imagem
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estado para formulário
    const [lojaForm, setLojaForm] = useState<Loja>({
        nome: '',
        endereco: '',
        imagem: '',
        link: '',
        ativo: true
    });

    // Estado para erros de formulário
    const [errors, setErrors] = useState<Record<string, string>>({});
    const cancelRef = useRef<HTMLButtonElement>(null);

    // Modais
    const {
        isOpen: isFormOpen,
        onOpen: onFormOpen,
        onClose: onFormClose
    } = useDisclosure();

    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onClose: onDeleteClose
    } = useDisclosure();

    // Carregar dados das lojas da API
    useEffect(() => {
        const fetchLojas = async () => {
            try {
                setIsLoading(true);

                const response = await fetch('/api/delivery/lojas');

                if (!response.ok) {
                    throw new Error('Erro ao carregar lojas');
                }

                const data = await response.json();
                setLojas(data.lojas || []);
                setFilteredLojas(data.lojas || []);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar os dados das lojas',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchLojas();
    }, [toast]);

    // Filtrar lojas quando mudar o texto de busca
    useEffect(() => {
        if (searchText.trim() === '') {
            setFilteredLojas(lojas);
        } else {
            const filtered = lojas.filter(loja =>
                loja.nome.toLowerCase().includes(searchText.toLowerCase()) ||
                loja.endereco.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredLojas(filtered);
        }
    }, [searchText, lojas]);

    // Handlers para formulário
    const resetLojaForm = () => {
        setLojaForm({
            nome: '',
            endereco: '',
            imagem: '',
            link: '',
            ativo: true
        });
        setErrors({});
    };

    const handleAddLoja = () => {
        resetLojaForm();
        setSelectedLoja(null);
        onFormOpen();
    };

    const handleEditLoja = (loja: Loja) => {
        setLojaForm({ ...loja });
        setSelectedLoja(loja);
        if(loja.imagem){
            setImageSource('upload');
        }
        onFormOpen();
    };

    const handleLojaChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> |
        { target: { name: string, value: any } }
    ) => {
        const { name, value } = e.target;
        setLojaForm(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpar erro quando o campo for editado
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateLojaForm = () => {
        const newErrors: Record<string, string> = {};

        if (!lojaForm.nome.trim()) {
            newErrors.nome = 'Nome da loja é obrigatório';
        }

        if (!lojaForm.endereco.trim()) {
            newErrors.endereco = 'Endereço da loja é obrigatório';
        }

        if (!lojaForm.link.trim()) {
            newErrors.link = 'Link da loja é obrigatório';
        } else if (!isValidURL(lojaForm.link)) {
            newErrors.link = 'Link inválido. Deve começar com http:// ou https://';
        }

        // Valida URL da imagem apenas se for do tipo URL (não validar quando for upload)
        if (lojaForm.imagem && imageSource === 'url' && !isValidURL(lojaForm.imagem)) {
            newErrors.imagem = 'URL da imagem inválida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidURL = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    const handleSaveLoja = async () => {
        if (!validateLojaForm()) {
            return;
        }

        setIsLoading(true); // Inicia o carregamento

        try {
            const isUpdate = !!selectedLoja?.id;

            // Preparar os dados para enviar à API
            const lojaData = {
                nome: lojaForm.nome,
                endereco: lojaForm.endereco,
                imagem: lojaForm.imagem,
                link: lojaForm.link,
                ativo: lojaForm.ativo
            };

            console.log('Dados que estão sendo enviados:', lojaData);

            let response;

            if (isUpdate && selectedLoja?.id) {
                // Atualizar loja existente
                response = await fetch(`/api/delivery/lojas/${selectedLoja.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(lojaData),
                });
            } else {
                // Criar nova loja
                response = await fetch('/api/delivery/lojas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(lojaData),
                });
            }

            // Log para debug
            console.log('Status da resposta:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erro retornado pela API:', errorData);
                throw new Error(errorData.error || 'Erro ao salvar loja');
            }

            const responseData = await response.json();
            console.log('Resposta de sucesso:', responseData);

            // Recarregar a lista de lojas para refletir as alterações
            const lojasResponse = await fetch('/api/delivery/lojas');
            const lojasData = await lojasResponse.json();
            setLojas(lojasData.lojas || []);

            toast({
                title: 'Sucesso',
                description: `Loja ${isUpdate ? 'atualizada' : 'adicionada'} com sucesso`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onFormClose();
        } catch (error: any) {
            console.error('Erro ao salvar loja:', error);
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao salvar loja',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false); // Finaliza o carregamento
        }
    };

    const handleDeleteLoja = (loja: Loja) => {
        setSelectedLoja(loja);
        onDeleteOpen();
    };

    const handleConfirmDelete = async () => {
        if (!selectedLoja?.id) return;

        try {
            const response = await fetch(`/api/delivery/lojas/${selectedLoja.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir loja');
            }

            // Atualizar estado local removendo a loja
            setLojas(prevLojas => prevLojas.filter(loja => loja.id !== selectedLoja.id));

            toast({
                title: 'Sucesso',
                description: 'Loja removida com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onDeleteClose();
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao excluir loja',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsUploading(true);
            setUploadProgress(30); // Simulação de progresso inicial

            // Simular progresso
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 300);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao fazer upload da imagem');
            }

            const data = await response.json();

            // Atualizar o estado de origem da imagem para 'upload'
            setImageSource('upload');

            setLojaForm((prev) => ({
                ...prev,
                imagem: data.file // O endpoint retorna 'file', não 'url'
            }));

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            toast({
                title: 'Sucesso',
                description: 'Imagem enviada com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error: any) {
            console.error('Erro no upload:', error);
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao fazer upload da imagem',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Box p={5}>
            <HStack mb={6} justify="space-between">
                <Heading size="lg">
                    {tenant ? `Nossas Lojas - ${tenant.nome}` : 'Nossas Lojas'}
                </Heading>
                <Button
                    leftIcon={<FaPlus />}
                    colorScheme="teal"
                    onClick={handleAddLoja}
                >
                    Nova Loja
                </Button>
            </HStack>

            <Card bg={cardBg} boxShadow="md" mb={6}>
                <CardHeader>
                    <Flex justify="space-between" align="center">
                        <HStack>
                            <Icon as={FaStore} color="teal.500" />
                            <Text fontWeight="bold">Lojas Cadastradas</Text>
                        </HStack>

                        <FormControl width="auto" minW="300px">
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={FaSearch} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Buscar lojas..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    size="md"
                                />
                            </InputGroup>
                        </FormControl>
                    </Flex>
                </CardHeader>

                <CardBody>
                    {isLoading ? (
                        <Flex justify="center" p={8}>
                            <Spinner size="xl" />
                        </Flex>
                    ) : filteredLojas.length === 0 ? (
                        <Flex direction="column" align="center" justify="center" py={8}>
                            <Icon as={FaStore} boxSize={12} color="gray.300" mb={4} />
                            <Text color="gray.500" fontSize="lg" mb={4}>
                                {searchText ? 'Nenhuma loja encontrada para esta busca' : 'Nenhuma loja cadastrada'}
                            </Text>
                            <Button
                                leftIcon={<FaPlus />}
                                colorScheme="teal"
                                onClick={handleAddLoja}
                            >
                                Adicionar Loja
                            </Button>
                        </Flex>
                    ) : (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {filteredLojas.map(loja => (
                                <LinkBox
                                    key={loja.id}
                                    as={Card}
                                    bg={cardBg}
                                    _hover={{
                                        transform: 'translateY(-5px)',
                                        shadow: 'lg',
                                        bg: cardHoverBg
                                    }}
                                    transition="all 0.3s"
                                    overflow="hidden"
                                    borderRadius="lg"
                                    position="relative"
                                >
                                    {!loja.ativo && (
                                        <Badge
                                            colorScheme="red"
                                            position="absolute"
                                            top={2}
                                            right={2}
                                            zIndex={1}
                                        >
                                            Inativa
                                        </Badge>
                                    )}

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
                                                <LinkOverlay href={loja.link} isExternal>
                                                    {loja.nome}
                                                </LinkOverlay>
                                            </Heading>

                                            <HStack>
                                                <Icon as={FaMapMarkerAlt} color="gray.500" />
                                                <Text color="gray.600" fontSize="sm" noOfLines={2}>
                                                    {loja.endereco}
                                                </Text>
                                            </HStack>

                                            <HStack justify="space-between" width="100%" pt={3}>
                                                <Button
                                                    size="sm"
                                                    rightIcon={<FaExternalLinkAlt />}
                                                    colorScheme="teal"
                                                    variant="outline"
                                                    as="a"
                                                    href={loja.link}
                                                    target="_blank"
                                                >
                                                    Visitar
                                                </Button>

                                                <HStack>
                                                    <IconButton
                                                        aria-label="Editar loja"
                                                        icon={<FaEdit />}
                                                        size="sm"
                                                        colorScheme="blue"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleEditLoja(loja);
                                                        }}
                                                    />
                                                    <IconButton
                                                        aria-label="Excluir loja"
                                                        icon={<FaTrash />}
                                                        size="sm"
                                                        colorScheme="red"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDeleteLoja(loja);
                                                        }}
                                                    />
                                                </HStack>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </LinkBox>
                            ))}
                        </SimpleGrid>
                    )}
                </CardBody>
            </Card>

            {/* Modal para adicionar/editar loja */}
            <Modal isOpen={isFormOpen} onClose={onFormClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {selectedLoja ? 'Editar Loja' : 'Nova Loja'}
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl isRequired isInvalid={!!errors.nome}>
                                <FormLabel>Nome da Loja</FormLabel>
                                <Input
                                    name="nome"
                                    value={lojaForm.nome}
                                    onChange={handleLojaChange}
                                    placeholder="Ex: Loja Central"
                                />
                                {errors.nome && (
                                    <FormErrorMessage>{errors.nome}</FormErrorMessage>
                                )}
                            </FormControl>

                            <FormControl isRequired isInvalid={!!errors.endereco}>
                                <FormLabel>Endereço</FormLabel>
                                <Textarea
                                    name="endereco"
                                    value={lojaForm.endereco}
                                    onChange={handleLojaChange}
                                    placeholder="Endereço completo da loja"
                                    rows={3}
                                />
                                {errors.endereco && (
                                    <FormErrorMessage>{errors.endereco}</FormErrorMessage>
                                )}
                            </FormControl>

                            <FormControl isRequired isInvalid={!!errors.link}>
                                <FormLabel>Link de Redirecionamento</FormLabel>
                                <Input
                                    name="link"
                                    value={lojaForm.link}
                                    onChange={handleLojaChange}
                                    placeholder="https://exemplo.com/minha-loja"
                                />
                                {errors.link ? (
                                    <FormErrorMessage>{errors.link}</FormErrorMessage>
                                ) : (
                                    <Text fontSize="xs" color="gray.500">
                                        Link para onde o usuário será redirecionado ao clicar na loja
                                    </Text>
                                )}
                            </FormControl>

                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="status" mb="0">
                                    Loja ativa
                                </FormLabel>
                                <Switch
                                    id="status"
                                    name="status"
                                    isChecked={lojaForm.ativo}
                                    onChange={(e) => {
                                        setLojaForm(prev => ({
                                            ...prev,
                                            ativo: e.target.checked
                                        }));
                                    }}
                                    colorScheme="teal"
                                />
                                <Text fontSize="xs" ml={2} color={lojaForm.ativo ? "green.500" : "gray.500"}>
                                    {lojaForm.ativo ? "Ativa" : "Inativa"}
                                </Text>
                            </FormControl>

                            <FormControl isInvalid={!!errors.imagem}>
                                <FormLabel>Imagem da Loja</FormLabel>

                                {!lojaForm.imagem ? (
                                    <Tabs
                                        variant="soft-rounded"
                                        colorScheme="teal"
                                        size="sm"
                                        mb={3}
                                        index={imageSource === 'url' ? 0 : 1}
                                        onChange={(index) => {
                                            // Ao mudar de aba, atualizamos a fonte da imagem e limpamos o valor atual
                                            const newSource = index === 0 ? 'url' : 'upload';
                                            setImageSource(newSource);

                                            // Se mudar para uma nova fonte, limpe o campo de imagem
                                            if (newSource !== imageSource) {
                                                setLojaForm(prev => ({ ...prev, imagem: '' }));
                                            }
                                        }}
                                    >
                                        <TabList>
                                            <Tab>URL de imagem</Tab>
                                            <Tab>Upload de arquivo</Tab>
                                        </TabList>

                                        <TabPanels>
                                            <TabPanel px={0} pt={3}>
                                                <Input
                                                    name="imagem"
                                                    value={lojaForm.imagem || ''}
                                                    onChange={(e) => {
                                                        handleLojaChange(e);
                                                        setImageSource('url');
                                                    }}
                                                    placeholder="https://exemplo.com/imagem.jpg"
                                                />
                                                <FormHelperText>
                                                    Insira uma URL válida de imagem já existente na internet
                                                </FormHelperText>
                                            </TabPanel>

                                            <TabPanel px={0} pt={3}>
                                                <Box
                                                    borderWidth="1px"
                                                    borderRadius="md"
                                                    borderStyle="dashed"
                                                    borderColor={isUploading ? "teal.300" : "gray.300"}
                                                    p={4}
                                                    cursor={isUploading ? "default" : "pointer"}
                                                    bg={isUploading ? "teal.50" : "transparent"}
                                                    _hover={{ bg: isUploading ? "teal.50" : "gray.50" }}
                                                    transition="all 0.2s"
                                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                                >
                                                    <Input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleImageUpload}
                                                        accept="image/*"
                                                        display="none"
                                                    />
                                                    <Center flexDirection="column" py={3}>
                                                        <Icon
                                                            as={isUploading ? FaUpload : FaImage}
                                                            boxSize={8}
                                                            color={isUploading ? "teal.500" : "gray.400"}
                                                            mb={3}
                                                        />
                                                        <Text fontWeight="medium" mb={1} textAlign="center">
                                                            {isUploading ? "Enviando..." : "Clique para selecionar uma imagem"}
                                                        </Text>
                                                        <Text fontSize="xs" color="gray.500" textAlign="center">
                                                            JPG, PNG ou GIF (máx. 5MB)
                                                        </Text>
                                                    </Center>
                                                    {isUploading && (
                                                        <Progress
                                                            value={uploadProgress}
                                                            size="sm"
                                                            mt={2}
                                                            colorScheme="teal"
                                                            borderRadius="full"
                                                        />
                                                    )}
                                                </Box>
                                                <FormHelperText>
                                                    Faça o upload de uma nova imagem do seu dispositivo
                                                </FormHelperText>
                                            </TabPanel>
                                        </TabPanels>
                                    </Tabs>
                                ) : (
                                    <Box mt={2} position="relative">
                                        <Image
                                            src={lojaForm.imagem}
                                            alt="Imagem da loja"
                                            maxHeight="200px"
                                            objectFit="contain"
                                            borderRadius="md"
                                            fallback={<Box bg="gray.200" h="200px" w="100%" display="flex" alignItems="center" justifyContent="center"><Text>Imagem não disponível</Text></Box>}
                                        />
                                        <HStack position="absolute" top={2} right={2} spacing={2}>
                                            <IconButton
                                                aria-label="Trocar imagem"
                                                icon={<FaEdit />}
                                                size="sm"
                                                colorScheme="blue"
                                                onClick={() => setLojaForm(prev => ({ ...prev, imagem: '' }))}
                                            />
                                            <IconButton
                                                aria-label="Remover imagem"
                                                icon={<FaTimes />}
                                                size="sm"
                                                colorScheme="red"
                                                onClick={() => setLojaForm(prev => ({ ...prev, imagem: '' }))}
                                            />
                                        </HStack>
                                        <Text fontSize="xs" mt={2} color="gray.500" textAlign="center">
                                            {imageSource === 'url' ? 'URL externa' : 'Imagem carregada'}
                                        </Text>
                                    </Box>
                                )}

                                {errors.imagem && (
                                    <FormErrorMessage>{errors.imagem}</FormErrorMessage>
                                )}
                            </FormControl>

                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="outline" mr={3} onClick={onFormClose}>
                            Cancelar
                        </Button>
                        <Button
                            colorScheme="teal"
                            leftIcon={<FaSave />}
                            onClick={handleSaveLoja}
                        >
                            Salvar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Confirmação de exclusão */}
            <AlertDialog
                isOpen={isDeleteOpen}
                leastDestructiveRef={cancelRef}
                onClose={onDeleteClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Excluir Loja
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {selectedLoja && (
                                <>
                                    Tem certeza que deseja excluir a loja <strong>{selectedLoja.nome}</strong>?
                                </>
                            )}
                            <Text mt={2}>Esta ação não poderá ser desfeita.</Text>
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onDeleteClose}>
                                Cancelar
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={handleConfirmDelete}
                                ml={3}
                            >
                                Excluir
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
}