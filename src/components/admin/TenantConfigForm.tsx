'use client';

import { useState, useRef } from 'react';
import {
  Box,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Button,
  Switch,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Divider,
  FormErrorMessage,
  Image,
  useColorModeValue,
  Flex,
  IconButton,
  Text,
  Tooltip,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs
} from '@chakra-ui/react';
import { FaSave, FaStore, FaPalette, FaGlobe, FaImage, FaUpload, FaTrash, FaShoppingCart } from 'react-icons/fa';

interface TenantConfigFormProps {
  tenant: any;
  onSave: (data: any) => void;
  isSaving: boolean;
}

export function TenantConfigForm({ tenant, onSave, isSaving }: TenantConfigFormProps) {
  const [formData, setFormData] = useState({
    nome: tenant?.nome || '',
    slug: tenant?.slug || '',
    dominio: tenant?.dominio || '',
    corPrimaria: tenant?.corPrimaria || '#38B2AC',
    corSecundaria: tenant?.corSecundaria || '#319795',
    logotipo: tenant?.logotipo || '',
    ativo: tenant?.ativo !== false,
    // Configurações de delivery
    deliveryAtivo: tenant?.deliveryAtivo !== false,
    deliveryMinimoEntrega: tenant?.deliveryMinimoEntrega?.toString() || '0',
    tempoEstimadoEntregaMin: tenant?.tempoEstimadoEntregaMin?.toString() || '30',
    tempoEstimadoEntregaMax: tenant?.tempoEstimadoEntregaMax?.toString() || '60',
    // Configurações do site
    siteTitle: tenant?.siteTitle || '',
    siteDescription: tenant?.siteDescription || '',
    siteKeywords: tenant?.siteKeywords || '',
    enderecoLoja: tenant?.enderecoLoja || '',
    telefoneLoja: tenant?.telefoneLoja || '',
    emailLoja: tenant?.emailLoja || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logotipo || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Função para formatar telefone com máscara
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove todos os caracteres não numéricos
    value = value.replace(/\D/g, '');
    
    // Aplica a máscara conforme a quantidade de dígitos
    if (value.length <= 10) {
      // Formato (00) 0000-0000 para telefones fixos
      if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
      }
      if (value.length > 8) {
        value = `${value.substring(0, 9)}-${value.substring(9)}`;
      }
    } else {
      // Formato (00) 00000-0000 para celulares
      value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
    }
    
    setFormData(prev => ({
      ...prev,
      telefoneLoja: value
    }));
    
    // Clear error for this field
    if (errors.telefoneLoja) {
      setErrors(prev => ({ ...prev, telefoneLoja: '' }));
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
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

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
    }

    if (!formData.dominio.trim()) {
      newErrors.dominio = 'Domínio é obrigatório';
    }

    // Validar cores
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(formData.corPrimaria)) {
      newErrors.corPrimaria = 'Formato de cor inválido (ex: #38B2AC)';
    }
    if (!hexColorRegex.test(formData.corSecundaria)) {
      newErrors.corSecundaria = 'Formato de cor inválido (ex: #319795)';
    }

    // Validar valores numéricos
    if (formData.deliveryMinimoEntrega && isNaN(parseFloat(formData.deliveryMinimoEntrega))) {
      newErrors.deliveryMinimoEntrega = 'Valor mínimo de entrega deve ser um número';
    }
    
    if (formData.tempoEstimadoEntregaMin && isNaN(parseInt(formData.tempoEstimadoEntregaMin))) {
      newErrors.tempoEstimadoEntregaMin = 'Tempo mínimo deve ser um número';
    }
    
    if (formData.tempoEstimadoEntregaMax && isNaN(parseInt(formData.tempoEstimadoEntregaMax))) {
      newErrors.tempoEstimadoEntregaMax = 'Tempo máximo deve ser um número';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Preparar dados para envio, incluindo upload de logotipo se houver
    let dataToSend = { ...formData };

    // Se houver um novo arquivo de logotipo, enviar primeiro
    if (logoFile) {
      const formData = new FormData();
      formData.append('file', logoFile);

      try {
        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          dataToSend.logotipo = uploadData.filePath;
        } else {
          throw new Error('Falha ao fazer upload do logotipo');
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        setErrors(prev => ({ ...prev, logotipo: 'Erro ao fazer upload do logotipo' }));
        return;
      }
    } else if (!logoPreview) {
      // Se removeu o logotipo
      dataToSend.logotipo = null;
    }

    // Converter valores numéricos
    dataToSend.deliveryMinimoEntrega = dataToSend.deliveryMinimoEntrega ? parseFloat(dataToSend.deliveryMinimoEntrega) : 0;
    dataToSend.tempoEstimadoEntregaMin = dataToSend.tempoEstimadoEntregaMin ? parseInt(dataToSend.tempoEstimadoEntregaMin) : 30;
    dataToSend.tempoEstimadoEntregaMax = dataToSend.tempoEstimadoEntregaMax ? parseInt(dataToSend.tempoEstimadoEntregaMax) : 60;

    // Enviar ao pai para salvar
    onSave(dataToSend);
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Tabs colorScheme="teal">
        <TabList>
          <Tab><FaStore style={{ marginRight: '8px' }} /> Informações Básicas</Tab>
          <Tab><FaPalette style={{ marginRight: '8px' }} /> Aparência</Tab>
          <Tab><FaGlobe style={{ marginRight: '8px' }} /> Delivery</Tab>
          <Tab><FaGlobe style={{ marginRight: '8px' }} /> Contato</Tab>
        </TabList>

        <TabPanels>
          {/* Informações Básicas */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Flex align="center">
                  <FaStore style={{ marginRight: '8px' }} />
                  <Text fontWeight="bold">Informações do Estabelecimento</Text>
                </Flex>
              </CardHeader>
              <Divider />
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isRequired isInvalid={!!errors.nome}>
                    <FormLabel>Nome do Estabelecimento</FormLabel>
                    <Input
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      placeholder="Nome do seu negócio"
                    />
                    {errors.nome && (
                      <FormErrorMessage>{errors.nome}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.slug}>
                    <FormLabel>Slug</FormLabel>
                    <Input
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="nome-do-seu-negocio"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Usado na URL do seu site (apenas letras minúsculas, números e hífen)
                    </Text>
                    {errors.slug && (
                      <FormErrorMessage>{errors.slug}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.dominio}>
                    <FormLabel>Domínio</FormLabel>
                    <Input
                      name="dominio"
                      value={formData.dominio}
                      onChange={handleChange}
                      placeholder="seudominio.com.br"
                    />
                    {errors.dominio && (
                      <FormErrorMessage>{errors.dominio}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Switch
                      name="ativo"
                      isChecked={formData.ativo}
                      onChange={handleChange}
                      colorScheme="teal"
                      size="lg"
                    />
                    <Text fontSize="sm" color={formData.ativo ? "green.500" : "red.500"} ml={2} mt={1}>
                      {formData.ativo ? "Ativo" : "Inativo"}
                    </Text>
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
                        value={formData.corPrimaria}
                        onChange={handleChange}
                        placeholder="#38B2AC"
                        width="calc(100% - 40px)"
                      />
                      <Box
                        width="40px"
                        height="40px"
                        bg={formData.corPrimaria}
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
                        value={formData.corSecundaria}
                        onChange={handleChange}
                        placeholder="#319795"
                        width="calc(100% - 40px)"
                      />
                      <Box
                        width="40px"
                        height="40px"
                        bg={formData.corSecundaria}
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
                          <Box bg={formData.corPrimaria} color="white" borderRadius="full" p={2} mr={3} fontSize="lg" width="40px" height="40px" display="flex" alignItems="center" justifyContent="center">
                            {formData.nome.charAt(0) || '?'}
                          </Box>
                        )}
                        <Box>
                          <Text fontWeight="bold" color={formData.corPrimaria}>{formData.nome || "Nome do Restaurante"}</Text>
                          <Text fontSize="xs" color="gray.500">Delivery Online</Text>
                        </Box>
                      </Flex>
                      <Box 
                        p={2} 
                        borderRadius="md" 
                        color={formData.corPrimaria} 
                        _hover={{ bg: `${formData.corPrimaria}15` }}
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
                          borderBottomColor={formData.corPrimaria}
                          fontWeight="medium"
                          color={formData.corPrimaria}
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
                            <Text fontWeight="bold" fontSize="sm" color={formData.corPrimaria}>R$ 25,90</Text>
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
                            <Text fontWeight="bold" fontSize="sm" color={formData.corPrimaria}>R$ 18,90</Text>
                            <Text fontSize="xs" color="gray.500">+</Text>
                          </Flex>
                        </Box>
                      </Box>
                    </SimpleGrid>

                    {/* Botões e interação */}
                    <Box mt={4} p={4} bg="white" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                      <Flex direction="column" align="stretch">
                        <Button 
                          bg={formData.corPrimaria} 
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
                          borderColor={formData.corPrimaria}
                          color={formData.corPrimaria}
                          _hover={{ bg: `${formData.corPrimaria}10` }}
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

          {/* Delivery */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Flex align="center">
                  <FaGlobe style={{ marginRight: '8px' }} />
                  <Text fontWeight="bold">Configurações de Delivery</Text>
                </Flex>
              </CardHeader>
              <Divider />
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb={0}>Delivery Ativo</FormLabel>
                    <Switch
                      name="deliveryAtivo"
                      isChecked={formData.deliveryAtivo}
                      onChange={handleChange}
                      colorScheme="teal"
                      size="lg"
                    />
                  </FormControl>

                  <FormControl isInvalid={!!errors.deliveryMinimoEntrega}>
                    <FormLabel>Valor Mínimo para Entrega (R$)</FormLabel>
                    <Input
                      name="deliveryMinimoEntrega"
                      value={formData.deliveryMinimoEntrega}
                      onChange={handleChange}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                    />
                    {errors.deliveryMinimoEntrega && (
                      <FormErrorMessage>{errors.deliveryMinimoEntrega}</FormErrorMessage>
                    )}
                  </FormControl>

                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl isInvalid={!!errors.tempoEstimadoEntregaMin}>
                      <FormLabel>Tempo Mínimo de Entrega (min)</FormLabel>
                      <Input
                        name="tempoEstimadoEntregaMin"
                        value={formData.tempoEstimadoEntregaMin}
                        onChange={handleChange}
                        placeholder="30"
                        type="number"
                        min="1"
                      />
                      {errors.tempoEstimadoEntregaMin && (
                        <FormErrorMessage>{errors.tempoEstimadoEntregaMin}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.tempoEstimadoEntregaMax}>
                      <FormLabel>Tempo Máximo de Entrega (min)</FormLabel>
                      <Input
                        name="tempoEstimadoEntregaMax"
                        value={formData.tempoEstimadoEntregaMax}
                        onChange={handleChange}
                        placeholder="60"
                        type="number"
                        min="1"
                      />
                      {errors.tempoEstimadoEntregaMax && (
                        <FormErrorMessage>{errors.tempoEstimadoEntregaMax}</FormErrorMessage>
                      )}
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Contato */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Flex align="center">
                  <FaGlobe style={{ marginRight: '8px' }} />
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
                      value={formData.siteTitle}
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
                      value={formData.siteDescription}
                      onChange={handleChange}
                      placeholder="Descrição para SEO"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Palavras-chave</FormLabel>
                    <Input
                      name="siteKeywords"
                      value={formData.siteKeywords}
                      onChange={handleChange}
                      placeholder="palavra1, palavra2, palavra3"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Endereço</FormLabel>
                    <Input
                      name="enderecoLoja"
                      value={formData.enderecoLoja}
                      onChange={handleChange}
                      placeholder="Endereço da loja"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Telefone</FormLabel>
                    <Input
                      name="telefoneLoja"
                      value={formData.telefoneLoja}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                      maxLength={16}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Formato: (00) 00000-0000 para celular ou (00) 0000-0000 para fixo
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>E-mail</FormLabel>
                    <Input
                      name="emailLoja"
                      value={formData.emailLoja}
                      onChange={handleChange}
                      placeholder="contato@seudominio.com"
                      type="email"
                    />
                  </FormControl>
                </SimpleGrid>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Flex justify="flex-end" mt={6}>
        <Button
          type="submit"
          colorScheme="teal"
          size="lg"
          leftIcon={<FaSave />}
          isLoading={isSaving}
          loadingText="Salvando..."
        >
          Salvar Configurações
        </Button>
      </Flex>
    </Box>
  );
}
