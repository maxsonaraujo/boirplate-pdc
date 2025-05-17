'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  HStack,
  Spinner,
  Flex,
  useToast,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Switch,
  useColorModeValue,
  Icon,
  VStack,
  Divider,
  SimpleGrid,
  InputGroup,
  InputLeftAddon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Checkbox,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  IconButton,
  Image
} from '@chakra-ui/react';
import {
  FaTrash,
  FaSave,
  FaCog,
  FaCreditCard,
  FaMoneyBill,
  FaMobileAlt,
  FaRegCreditCard,
  FaRegMoneyBillAlt,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaStore,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaShoppingBag,
  FaGlobe,
  FaWhatsapp,
  FaMailBulk,
  FaImage,
  FaPalette,
  FaUpload,
  FaShoppingCart
} from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';

interface DeliveryConfig {
  deliveryAtivo: boolean;
  deliveryMinimoEntrega: string;
  taxaEntregaPadrao: string;
  tempoEstimadoEntregaMin: string;
  tempoEstimadoEntregaMax: string;
  observacaoEntrega: string;
  notificacoes: {
    emailAtivo: boolean;
    emailRemetente: string;
    whatsappAtivo: boolean;
    whatsappNumero: string;
    pushAtivo: boolean;
  };
  siteTitle?: string;
  siteDescription?: string;
  siteKeywords?: string;
  enderecoLoja?: string;
  telefoneLoja?: string;
  emailLoja?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  logotipo?: string;
  nome?: string;
}

export default function DeliveryConfigPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');

  const [config, setConfig] = useState<DeliveryConfig>({
    deliveryAtivo: true,
    deliveryMinimoEntrega: '0',
    taxaEntregaPadrao: '0',
    tempoEstimadoEntregaMin: '30',
    tempoEstimadoEntregaMax: '60',
    observacaoEntrega: '',
    notificacoes: {
      emailAtivo: false,
      emailRemetente: '',
      whatsappAtivo: false,
      whatsappNumero: '',
      pushAtivo: true
    },
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    enderecoLoja: '',
    telefoneLoja: '',
    emailLoja: '',
    corPrimaria: '#38B2AC',
    corSecundaria: '#319795',
    logotipo: '',
    nome: ''
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logotipo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/tenant/config');

      if (!response.ok) {
        throw new Error('Erro ao carregar configurações de delivery');
      }

      const data = await response.json();

      setConfig({
        deliveryAtivo: data.tenant?.deliveryAtivo !== false,
        deliveryMinimoEntrega: data.tenant?.deliveryMinimoEntrega?.toString() || '0',
        taxaEntregaPadrao: data.tenant?.taxaEntregaPadrao?.toString() || '0',
        tempoEstimadoEntregaMin: data.tenant?.tempoEstimadoEntregaMin?.toString() || '30',
        tempoEstimadoEntregaMax: data.tenant?.tempoEstimadoEntregaMax?.toString() || '60',
        observacaoEntrega: data.tenant?.observacaoEntrega || '',
        notificacoes: {
          emailAtivo: data.tenant?.notificacoes?.emailAtivo || false,
          emailRemetente: data.tenant?.notificacoes?.emailRemetente || '',
          whatsappAtivo: data.tenant?.notificacoes?.whatsappAtivo || false,
          whatsappNumero: data.tenant?.notificacoes?.whatsappNumero || '',
          pushAtivo: data.tenant?.notificacoes?.pushAtivo !== false
        },
        siteTitle: data.tenant?.siteTitle || '',
        siteDescription: data.tenant?.siteDescription || '',
        siteKeywords: data.tenant?.siteKeywords || '',
        enderecoLoja: data.tenant?.enderecoLoja || '',
        telefoneLoja: data.tenant?.telefoneLoja || '',
        emailLoja: data.tenant?.emailLoja || '',
        corPrimaria: data.tenant?.corPrimaria || '#38B2AC',
        corSecundaria: data.tenant?.corSecundaria || '#319795',
        logotipo: data.tenant?.logotipo || '',
        nome: data.tenant?.nome || 'Seu Restaurante'
      });

      setLogoPreview(data.tenant?.logotipo || null);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações de delivery',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleLogoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setConfig(prev => ({
      ...prev,
      logotipo: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setConfig((prev:any) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNumberChange = (name: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, '');
    if (value.length <= 10) {
      if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
      }
      if (value.length > 8) {
        value = `${value.substring(0, 9)}-${value.substring(9)}`;
      }
    } else {
      value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
    }

    setConfig(prev => ({
      ...prev,
      telefoneLoja: value
    }));

    if (errors.telefoneLoja) {
      setErrors(prev => ({ ...prev, telefoneLoja: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (config.deliveryMinimoEntrega && isNaN(parseFloat(config.deliveryMinimoEntrega))) {
      newErrors.deliveryMinimoEntrega = 'Valor mínimo deve ser um número';
    }

    if (config.taxaEntregaPadrao && isNaN(parseFloat(config.taxaEntregaPadrao))) {
      newErrors.taxaEntregaPadrao = 'Taxa de entrega deve ser um número';
    }

    if (config.tempoEstimadoEntregaMin && isNaN(parseInt(config.tempoEstimadoEntregaMin))) {
      newErrors.tempoEstimadoEntregaMin = 'Tempo mínimo deve ser um número';
    }

    if (config.tempoEstimadoEntregaMax && isNaN(parseInt(config.tempoEstimadoEntregaMax))) {
      newErrors.tempoEstimadoEntregaMax = 'Tempo máximo deve ser um número';
    }

    if (config.notificacoes.emailAtivo && !config.notificacoes.emailRemetente) {
      newErrors['notificacoes.emailRemetente'] = 'Email de remetente é obrigatório';
    }

    if (config.notificacoes.whatsappAtivo && !config.notificacoes.whatsappNumero) {
      newErrors['notificacoes.whatsappNumero'] = 'Número do WhatsApp é obrigatório';
    }

    if (config.emailLoja && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.emailLoja)) {
      newErrors.emailLoja = 'Email inválido';
    }

    // Validar formato de cor para as cores primária e secundária
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (config.corPrimaria && !hexColorRegex.test(config.corPrimaria)) {
      newErrors.corPrimaria = 'Formato inválido. Use #RRGGBB ou #RGB';
    }

    if (config.corSecundaria && !hexColorRegex.test(config.corSecundaria)) {
      newErrors.corSecundaria = 'Formato inválido. Use #RRGGBB ou #RGB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveConfig = async () => {
    if (!validateForm()) {
      toast({
        title: 'Erro',
        description: 'Verifique os erros no formulário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Se tiver um novo logo, fazer upload primeiro
      let logoPath = config.logotipo;

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Erro ao fazer upload do logotipo');
        }

        const uploadData = await uploadResponse.json();
        logoPath = uploadData.filePath;
      }

      const configData = {
        deliveryAtivo: config.deliveryAtivo,
        deliveryMinimoEntrega: parseFloat(config.deliveryMinimoEntrega) || 0,
        taxaEntregaPadrao: parseFloat(config.taxaEntregaPadrao) || 0,
        tempoEstimadoEntregaMin: parseInt(config.tempoEstimadoEntregaMin) || 30,
        tempoEstimadoEntregaMax: parseInt(config.tempoEstimadoEntregaMax) || 60,
        observacaoEntrega: config.observacaoEntrega,
        notificacoes: config.notificacoes,
        siteTitle: config.siteTitle,
        siteDescription: config.siteDescription,
        siteKeywords: config.siteKeywords,
        enderecoLoja: config.enderecoLoja,
        telefoneLoja: config.telefoneLoja,
        emailLoja: config.emailLoja,
        corPrimaria: config.corPrimaria,
        corSecundaria: config.corSecundaria,
        logotipo: logoPath
      };

      const response = await fetch('/api/tenant/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar configurações');
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações de delivery atualizadas com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchConfig();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar configurações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={5}>
      <HStack mb={6} justify="space-between">
        <Heading size="lg">
          {tenant ? `Configurações de Delivery - ${tenant.nome}` : 'Configurações de Delivery'}
        </Heading>

        <Button
          leftIcon={<FaSave />}
          colorScheme="teal"
          onClick={handleSaveConfig}
          isLoading={isSaving}
          loadingText="Salvando..."
        >
          Salvar Configurações
        </Button>
      </HStack>

      {isLoading ? (
        <Flex justify="center" p={8}>
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Tabs colorScheme="teal" variant="enclosed">
          <TabList>
            <Tab>
              <Icon as={FaStore} mr={2} />
              Geral
            </Tab>
            <Tab>
              <Icon as={FaGlobe} mr={2} />
              Contato e SEO
            </Tab>
            <Tab>
              <FaPalette style={{ marginRight: '8px' }} />
              Aparência
            </Tab>

            {/* <Tab>
              <Icon as={FaMailBulk} mr={2} />
              Notificações
            </Tab> */}
          </TabList>

          <TabPanels>
            <TabPanel>
              <Card bg={bgCard} boxShadow="md">
                <CardHeader>
                  <HStack>
                    <Icon as={FaCog} color="teal.500" />
                    <Text fontWeight="bold">Configurações Gerais do Delivery</Text>
                  </HStack>
                </CardHeader>

                <CardBody>
                  <VStack spacing={6} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="deliveryAtivo" mb="0">
                        Delivery Ativo
                      </FormLabel>
                      <Switch
                        id="deliveryAtivo"
                        name="deliveryAtivo"
                        colorScheme="teal"
                        size="lg"
                        isChecked={config.deliveryAtivo}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <Divider />

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl isInvalid={!!errors.deliveryMinimoEntrega}>
                        <FormLabel>Valor Mínimo para Entrega (R$)</FormLabel>
                        <InputGroup>
                          <InputLeftAddon>R$</InputLeftAddon>
                          <NumberInput
                            value={config.deliveryMinimoEntrega}
                            onChange={(value) => handleNumberChange('deliveryMinimoEntrega', value)}
                            min={0}
                            step={0.01}
                            flex="1"
                          >
                            <NumberInputField borderLeftRadius={0} />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </InputGroup>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Valor mínimo para aceitar pedidos de delivery
                        </Text>
                        {errors.deliveryMinimoEntrega && (
                          <FormErrorMessage>{errors.deliveryMinimoEntrega}</FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isInvalid={!!errors.taxaEntregaPadrao}>
                        <FormLabel>Taxa de Entrega Padrão (R$)</FormLabel>
                        <InputGroup>
                          <InputLeftAddon>R$</InputLeftAddon>
                          <NumberInput
                            value={config.taxaEntregaPadrao}
                            onChange={(value) => handleNumberChange('taxaEntregaPadrao', value)}
                            min={0}
                            step={0.01}
                            flex="1"
                          >
                            <NumberInputField borderLeftRadius={0} />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </InputGroup>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Taxa padrão para áreas sem configuração específica
                        </Text>
                        {errors.taxaEntregaPadrao && (
                          <FormErrorMessage>{errors.taxaEntregaPadrao}</FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isInvalid={!!errors.tempoEstimadoEntregaMin}>
                        <FormLabel>Tempo Mínimo de Entrega (min)</FormLabel>
                        <NumberInput
                          value={config.tempoEstimadoEntregaMin}
                          onChange={(value) => handleNumberChange('tempoEstimadoEntregaMin', value)}
                          min={1}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        {errors.tempoEstimadoEntregaMin && (
                          <FormErrorMessage>{errors.tempoEstimadoEntregaMin}</FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isInvalid={!!errors.tempoEstimadoEntregaMax}>
                        <FormLabel>Tempo Máximo de Entrega (min)</FormLabel>
                        <NumberInput
                          value={config.tempoEstimadoEntregaMax}
                          onChange={(value) => handleNumberChange('tempoEstimadoEntregaMax', value)}
                          min={1}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        {errors.tempoEstimadoEntregaMax && (
                          <FormErrorMessage>{errors.tempoEstimadoEntregaMax}</FormErrorMessage>
                        )}
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel>Observações para Delivery</FormLabel>
                      <Textarea
                        name="observacaoEntrega"
                        value={config.observacaoEntrega}
                        onChange={handleChange}
                        placeholder="Informações adicionais para o cliente sobre o delivery..."
                        rows={4}
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Estas informações serão exibidas na página de checkout.
                      </Text>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel>
              <Card bg={bgCard} boxShadow="md">
                <CardHeader>
                  <Flex align="center">
                    <Icon as={FaGlobe} mr={2} color="teal.500" />
                    <Text fontWeight="bold">Informações de Contato e SEO</Text>
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel>Título do Site</FormLabel>
                      <Input
                        name="siteTitle"
                        value={config.siteTitle}
                        onChange={handleChange}
                        placeholder="Título para SEO"
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Usado como título da página no navegador
                      </Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Descrição do Site</FormLabel>
                      <Input
                        name="siteDescription"
                        value={config.siteDescription}
                        onChange={handleChange}
                        placeholder="Descrição para SEO"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Palavras-chave</FormLabel>
                      <Input
                        name="siteKeywords"
                        value={config.siteKeywords}
                        onChange={handleChange}
                        placeholder="palavra1, palavra2, palavra3"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Endereço</FormLabel>
                      <Input
                        name="enderecoLoja"
                        value={config.enderecoLoja}
                        onChange={handleChange}
                        placeholder="Endereço da loja"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Telefone</FormLabel>
                      <Input
                        name="telefoneLoja"
                        value={config.telefoneLoja}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                        maxLength={16}
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Formato: (00) 00000-0000 para celular ou (00) 0000-0000 para fixo
                      </Text>
                    </FormControl>

                    <FormControl isInvalid={!!errors.emailLoja}>
                      <FormLabel>E-mail</FormLabel>
                      <Input
                        name="emailLoja"
                        value={config.emailLoja}
                        onChange={handleChange}
                        placeholder="contato@seudominio.com"
                        type="email"
                      />
                      {errors.emailLoja && (
                        <FormErrorMessage>{errors.emailLoja}</FormErrorMessage>
                      )}
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Aparência */}
            <TabPanel>
              <Card mb={6}>
                <CardHeader>
                  <Flex align="center">
                    <FaImage style={{ marginRight: '8px' }} />
                    <Text fontWeight="bold">Logotipo</Text>
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody>
                  <VStack spacing={4} align="center">
                    <Box
                      borderWidth="2px"
                      borderRadius="md"
                      borderStyle="dashed"
                      borderColor="gray.300"
                      p={6}
                      textAlign="center"
                      width="100%"
                    >
                      {logoPreview ? (
                        <Box position="relative" width="fit-content" mx="auto">
                          <Image
                            src={logoPreview}
                            alt="Logotipo"
                            maxH="150px"
                            objectFit="contain"
                            mx="auto"
                          />
                          <IconButton
                            aria-label="Remover logo"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            position="absolute"
                            top="-10px"
                            right="-10px"
                            borderRadius="full"
                            onClick={handleRemoveLogo}
                          />
                        </Box>
                      ) : (
                        <VStack spacing={3}>
                          <Box
                            p={4}
                            bg="gray.100"
                            borderRadius="full"
                            cursor="pointer"
                            onClick={handleLogoClick}
                          >
                            <FaUpload color="gray" />
                          </Box>
                          <Text color="gray.500">
                            Clique para fazer upload do logotipo
                          </Text>
                        </VStack>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                        accept="image/*"
                      />
                    </Box>
                    <Text fontSize="sm" color="gray.500">
                      Formatos recomendados: PNG, JPG. Tamanho máximo: 2MB
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card mb={6}>
                <CardHeader>
                  <Flex align="center">
                    <FaPalette style={{ marginRight: '8px' }} />
                    <Text fontWeight="bold">Cores do Tema</Text>
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl isRequired isInvalid={!!errors.corPrimaria}>
                      <FormLabel>Cor Primária</FormLabel>
                      <Flex>
                        <Input
                          name="corPrimaria"
                          value={config.corPrimaria}
                          onChange={handleChange}
                          placeholder="#38B2AC"
                          width="calc(100% - 40px)"
                        />
                        <Box
                          width="40px"
                          height="40px"
                          bg={config.corPrimaria}
                          borderRadius="md"
                          ml={2}
                        />
                      </Flex>
                      {errors.corPrimaria && (
                        <FormErrorMessage>{errors.corPrimaria}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.corSecundaria}>
                      <FormLabel>Cor Secundária</FormLabel>
                      <Flex>
                        <Input
                          name="corSecundaria"
                          value={config.corSecundaria}
                          onChange={handleChange}
                          placeholder="#319795"
                          width="calc(100% - 40px)"
                        />
                        <Box
                          width="40px"
                          height="40px"
                          bg={config.corSecundaria}
                          borderRadius="md"
                          ml={2}
                        />
                      </Flex>
                      {errors.corSecundaria && (
                        <FormErrorMessage>{errors.corSecundaria}</FormErrorMessage>
                      )}
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Flex align="center">
                    <FaGlobe style={{ marginRight: '8px' }} />
                    <Text fontWeight="bold">Pré-visualização do Delivery</Text>
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Text mb={4} fontSize="sm" color="gray.500">
                    Veja como o delivery ficará com as cores selecionadas:
                  </Text>

                  {/* Simulação da interface de delivery */}
                  <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden" mb={6} boxShadow="sm">
                    {/* Header do delivery */}
                    <Box bg="white" py={4} px={4} borderBottomWidth="1px" borderColor="gray.200">
                      <Flex justify="space-between" align="center">
                        <Flex align="center">
                          {logoPreview ? (
                            <Image src={logoPreview} alt="Logo" boxSize="40px" objectFit="cover" borderRadius="full" mr={3} />
                          ) : (
                            <Box bg={config.corPrimaria} color="white" borderRadius="full" p={2} mr={3} fontSize="lg" width="40px" height="40px" display="flex" alignItems="center" justifyContent="center">
                              {config.nome?.charAt(0) || '?'}
                            </Box>
                          )}
                          <Box>
                            <Text fontWeight="bold" color={config.corPrimaria}>{config.nome || "Nome do Restaurante"}</Text>
                            <Text fontSize="xs" color="gray.500">Delivery Online</Text>
                          </Box>
                        </Flex>
                        <Box
                          p={2}
                          borderRadius="md"
                          color={config.corPrimaria}
                          _hover={{ bg: `${config.corPrimaria}15` }}
                          cursor="pointer"
                        >
                          <FaShoppingCart />
                        </Box>
                      </Flex>
                    </Box>

                    {/* Content - Categorias */}
                    <Box p={4} bg="gray.50">
                      <Flex overflowX="auto" mb={4} pb={2} css={{
                        '&::-webkit-scrollbar': { height: '8px' },
                        '&::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E0', borderRadius: '8px' }
                      }}>
                        <Flex>
                          <Box
                            py={2}
                            px={4}
                            borderRadius="md"
                            bg="white"
                            borderBottomWidth="2px"
                            borderBottomColor={config.corPrimaria}
                            fontWeight="medium"
                            color={config.corPrimaria}
                            mr={2}
                          >
                            Categoria 1
                          </Box>
                          <Box py={2} px={4} borderRadius="md" bg="white" mr={2}>Categoria 2</Box>
                          <Box py={2} px={4} borderRadius="md" bg="white" mr={2}>Categoria 3</Box>
                        </Flex>
                      </Flex>

                      {/* Product cards */}
                      <SimpleGrid columns={2} spacing={3} mb={4}>
                        <Box
                          bg="white"
                          borderRadius="md"
                          overflow="hidden"
                          borderWidth="1px"
                          borderColor="gray.200"
                          _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                          transition="all 0.2s"
                        >
                          <Box height="100px" bg="gray.300" />
                          <Box p={3}>
                            <Text fontWeight="bold" fontSize="sm" mb={1} noOfLines={1}>Produto de Exemplo</Text>
                            <Text fontSize="xs" color="gray.500" mb={2} noOfLines={1}>Descrição do produto exemplo</Text>
                            <Flex justify="space-between" align="center">
                              <Text fontWeight="bold" fontSize="sm" color={config.corPrimaria}>R$ 25,90</Text>
                              <Text fontSize="xs" color="gray.500">+</Text>
                            </Flex>
                          </Box>
                        </Box>
                        <Box
                          bg="white"
                          borderRadius="md"
                          overflow="hidden"
                          borderWidth="1px"
                          borderColor="gray.200"
                        >
                          <Box height="100px" bg="gray.300" />
                          <Box p={3}>
                            <Text fontWeight="bold" fontSize="sm" mb={1} noOfLines={1}>Outro Produto</Text>
                            <Text fontSize="xs" color="gray.500" mb={2} noOfLines={1}>Descrição breve</Text>
                            <Flex justify="space-between" align="center">
                              <Text fontWeight="bold" fontSize="sm" color={config.corPrimaria}>R$ 18,90</Text>
                              <Text fontSize="xs" color="gray.500">+</Text>
                            </Flex>
                          </Box>
                        </Box>
                      </SimpleGrid>

                      {/* Botões e interação */}
                      <Box mt={4} p={4} bg="white" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                        <Flex direction="column" align="stretch">
                          <Button
                            bg={config.corPrimaria}
                            color="white"
                            size="sm"
                            mb={2}
                            _hover={{ opacity: 0.9 }}
                          >
                            Finalizar Pedido
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            borderColor={config.corPrimaria}
                            color={config.corPrimaria}
                            _hover={{ bg: `${config.corPrimaria}10` }}
                          >
                            Ver Cardápio
                          </Button>
                        </Flex>
                      </Box>
                    </Box>
                  </Box>

                  <Text fontSize="sm" color="gray.600">
                    Esta é uma prévia simplificada. O layout real do delivery pode variar ligeiramente,
                    mas as cores primária e secundária serão aplicadas conforme definido acima.
                  </Text>
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel>
              <Card bg={bgCard} boxShadow="md">
                <CardHeader>
                  <HStack>
                    <Icon as={FaMailBulk} color="teal.500" />
                    <Text fontWeight="bold">Configurações de Notificações</Text>
                  </HStack>
                </CardHeader>

                <CardBody>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="sm" mb={4}>Notificações por E-mail</Heading>

                      <FormControl display="flex" alignItems="center" mb={4}>
                        <FormLabel htmlFor="notificacoes.emailAtivo" mb="0">
                          Ativar notificações por e-mail
                        </FormLabel>
                        <Switch
                          id="notificacoes.emailAtivo"
                          name="notificacoes.emailAtivo"
                          colorScheme="teal"
                          isChecked={config.notificacoes.emailAtivo}
                          onChange={handleChange}
                        />
                      </FormControl>

                      {config.notificacoes.emailAtivo && (
                        <FormControl isInvalid={!!errors['notificacoes.emailRemetente']} mb={4}>
                          <FormLabel>E-mail de Remetente</FormLabel>
                          <Input
                            name="notificacoes.emailRemetente"
                            value={config.notificacoes.emailRemetente}
                            onChange={handleChange}
                            placeholder="pedidos@seurestaurante.com"
                            type="email"
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Este e-mail será usado como remetente nas notificações
                          </Text>
                          {errors['notificacoes.emailRemetente'] && (
                            <FormErrorMessage>{errors['notificacoes.emailRemetente']}</FormErrorMessage>
                          )}
                        </FormControl>
                      )}
                    </Box>

                    <Divider />

                    <Box>
                      <Heading size="sm" mb={4}>Notificações por WhatsApp</Heading>

                      <FormControl display="flex" alignItems="center" mb={4}>
                        <FormLabel htmlFor="notificacoes.whatsappAtivo" mb="0">
                          Ativar notificações por WhatsApp
                        </FormLabel>
                        <Switch
                          id="notificacoes.whatsappAtivo"
                          name="notificacoes.whatsappAtivo"
                          colorScheme="green"
                          isChecked={config.notificacoes.whatsappAtivo}
                          onChange={handleChange}
                        />
                      </FormControl>

                      {config.notificacoes.whatsappAtivo && (
                        <FormControl isInvalid={!!errors['notificacoes.whatsappNumero']} mb={4}>
                          <FormLabel>Número do WhatsApp Business</FormLabel>
                          <InputGroup>
                            <InputLeftAddon>+55</InputLeftAddon>
                            <Input
                              name="notificacoes.whatsappNumero"
                              value={config.notificacoes.whatsappNumero}
                              onChange={handleChange}
                              placeholder="11999999999"
                            />
                          </InputGroup>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Número que será usado para enviar as notificações (somente números)
                          </Text>
                          {errors['notificacoes.whatsappNumero'] && (
                            <FormErrorMessage>{errors['notificacoes.whatsappNumero']}</FormErrorMessage>
                          )}
                        </FormControl>
                      )}

                      <Box bg="green.50" p={4} borderRadius="md" color="green.800">
                        <HStack mb={2}>
                          <Icon as={FaWhatsapp} />
                          <Text fontWeight="semibold">Informações sobre WhatsApp API</Text>
                        </HStack>
                        <Text fontSize="sm">
                          Para utilizar as notificações via WhatsApp, é necessário ter uma conta
                          WhatsApp Business API. Você precisará configurar as credenciais
                          no painel de integrações.
                        </Text>
                      </Box>
                    </Box>

                    <Divider />

                    <Box>
                      <Heading size="sm" mb={4}>Notificações Push</Heading>

                      <FormControl display="flex" alignItems="center" mb={4}>
                        <FormLabel htmlFor="notificacoes.pushAtivo" mb="0">
                          Ativar notificações push
                        </FormLabel>
                        <Switch
                          id="notificacoes.pushAtivo"
                          name="notificacoes.pushAtivo"
                          colorScheme="purple"
                          isChecked={config.notificacoes.pushAtivo}
                          onChange={handleChange}
                        />
                      </FormControl>

                      <Box bg="purple.50" p={4} borderRadius="md" color="purple.800">
                        <HStack mb={2}>
                          <Icon as={FaMobileAlt} />
                          <Text fontWeight="semibold">Informações sobre notificações Push</Text>
                        </HStack>
                        <Text fontSize="sm">
                          As notificações push são exibidas para os clientes que estão
                          acompanhando o status do pedido na página de status do delivery.
                          Não é necessária nenhuma configuração adicional.
                        </Text>
                      </Box>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
}
