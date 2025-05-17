import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Box,
  Divider,
  Stack,
  Text,
  useToast,
  FormErrorMessage,
  Tag,
  HStack,
  Checkbox,
  UnorderedList,
  ListItem,
  VStack,
  Collapse,
  Spinner,
  Badge,
  Flex,
  Heading,
  Icon,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/format';
import { FaInfoCircle, FaPlus } from 'react-icons/fa';
import { CategoriaInsumoFormModal } from './CategoriaInsumoFormModal';

interface InsumoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: any | null;
  categorias: any[];
  fornecedores: any[];
  unidadesMedida?: any[];
  onSuccess: () => void;
}

export function InsumoFormModal({
  isOpen,
  onClose,
  insumo,
  categorias: categoriasRecebidas,
  fornecedores,
  unidadesMedida = [],
  onSuccess,
}: InsumoFormModalProps) {
  // Estados do formulário
  const [formData, setFormData] = useState({
    id: '',
    codigo: '',
    nome: '',
    descricao: '',
    precoCusto: '0',
    categoriaInsumoId: '',
    unidadeMedidaId: '',
    fornecedorPrincipalId: '',
    estoqueMinimo: '0',
    estoqueInicial: '0',
    localizacaoEstoque: '',
    diasValidade: '',
    notificarVencimento: true,
    status: true,
  });

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUnidades, setIsLoadingUnidades] = useState(false);
  const [unidadesMedidaLocal, setUnidadesMedidaLocal] = useState(unidadesMedida);
  const toast = useToast();

  // Adicionar a opção para criar produto
  const [criarProduto, setCriarProduto] = useState(false);
  const [margemLucro, setMargemLucro] = useState(50); // 50% de margem padrão

  // Adicionar função para alternar entre opção de criar produto
  const handleCriarProdutoToggle = () => {
    setCriarProduto(!criarProduto);

    // Se ativou a opção e as categorias ainda não foram carregadas
    if (!criarProduto && categoriasProduto.length === 0) {
      carregarCategoriasProduto();
    }
  };

  // Adicionar state para gerenciar categorias localmente
  const [categorias, setCategorias] = useState<any[]>(categoriasRecebidas || []);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);

  // Estados para categorias de produto
  const [categoriasProduto, setCategoriasProduto] = useState<any[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [categoriaPrincipal, setCategoriaPrincipal] = useState<string | null>(null);
  const [isLoadingCategoriasProduto, setIsLoadingCategoriasProduto] = useState(false);

  // Atualizar categorias quando as props mudarem
  useEffect(() => {
    setCategorias(categoriasRecebidas || []);
  }, [categoriasRecebidas]);

  // Função para carregar categorias de produtos
  const carregarCategoriasProduto = async () => {
    setIsLoadingCategoriasProduto(true);
    try {
      const response = await fetch('/api/categorias');
      if (response.ok) {
        const data = await response.json();
        setCategoriasProduto(data.categorias || []);
      } else {
        console.error('Erro ao carregar categorias de produtos');
      }
    } catch (error) {
      console.error('Erro ao carregar categorias de produtos:', error);
    } finally {
      setIsLoadingCategoriasProduto(false);
    }
  };

  // Carregar categorias de produtos quando o modal é aberto e a opção "criarProduto" está marcada
  useEffect(() => {
    if (isOpen && criarProduto && categoriasProduto.length === 0) {
      carregarCategoriasProduto();
    }
  }, [isOpen, criarProduto]);

  // Efeito para carregar unidades de medida se não foram fornecidas
  useEffect(() => {
    const loadUnidadesMedida = async () => {
      if (unidadesMedida.length === 0) {
        setIsLoadingUnidades(true);
        try {
          const response = await fetch('/api/unidades-medida');
          if (response.ok) {
            const data = await response.json();
            unidadesMedida = data.unidadesMedida;
            setUnidadesMedidaLocal(unidadesMedida);
          }
        } catch (error) {
          console.error('Erro ao carregar unidades de medida:', error);
        } finally {
          setIsLoadingUnidades(false);
        }
      }
    };

    if (isOpen) {
      loadUnidadesMedida();
    }
  }, [isOpen]);

  // Efeito para preencher formulário quando receber dados de edição
  useEffect(() => {
    if (insumo) {
      setFormData({
        id: insumo.id,
        codigo: insumo.codigo || '',
        nome: insumo.nome || '',
        descricao: insumo.descricao || '',
        precoCusto: insumo.precoCusto?.toString() || '0',
        categoriaInsumoId: insumo.categoriaInsumoId?.toString() || '',
        unidadeMedidaId: insumo.unidadeMedidaId?.toString() || '',
        fornecedorPrincipalId: insumo.fornecedorPrincipalId?.toString() || '',
        estoqueMinimo: insumo.estoqueMinimo?.toString() || '0',
        estoqueInicial: '0', // Não preencher estoque inicial na edição
        localizacaoEstoque: insumo.localizacaoEstoque || '',
        diasValidade: insumo.diasValidade?.toString() || '',
        notificarVencimento: insumo.notificarVencimento !== false,
        status: insumo.status !== false,
      });
    } else {
      // Reset do formulário
      setFormData({
        id: '',
        codigo: '',
        nome: '',
        descricao: '',
        precoCusto: '0',
        categoriaInsumoId: '',
        unidadeMedidaId: '',
        fornecedorPrincipalId: '',
        estoqueMinimo: '0',
        estoqueInicial: '0',
        localizacaoEstoque: '',
        diasValidade: '',
        notificarVencimento: true,
        status: true,
      });

      // Reset das categorias selecionadas
      setCategoriasSelecionadas([]);
      setCategoriaPrincipal(null);
    }
    setErrors({});
  }, [insumo, isOpen]);

  // Handler para inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler para números
  const handleNumberChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler para switches (boolean)
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handler para categorias selecionadas
  const handleCategoriasChange = (event) => {
    const value = Array.from(event.target.selectedOptions, (option: any) => option.value);
    setCategoriasSelecionadas(value);

    // Se a categoria principal não está mais entre as selecionadas, resetar
    if (categoriaPrincipal && !value.includes(categoriaPrincipal)) {
      setCategoriaPrincipal(null);
    }
  };

  // Handler para categoria principal
  const handleCategoriaPrincipalChange = (event) => {
    const value = event.target.value ? event.target.value : null;
    setCategoriaPrincipal(value);
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código é obrigatório';
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.unidadeMedidaId) {
      newErrors.unidadeMedidaId = 'Unidade de medida é obrigatória';
    }

    if (parseFloat(formData.precoCusto) < 0) {
      newErrors.precoCusto = 'Preço de custo não pode ser negativo';
    }

    if (parseFloat(formData.estoqueMinimo) < 0) {
      newErrors.estoqueMinimo = 'Estoque mínimo não pode ser negativo';
    }

    // Validar estoque inicial apenas para novo cadastro
    if (!insumo && parseFloat(formData.estoqueInicial) < 0) {
      newErrors.estoqueInicial = 'Estoque inicial não pode ser negativo';
    }

    // Validar categorias se a opção de criar produto estiver marcada
    if (criarProduto && categoriasSelecionadas.length === 0) {
      newErrors.categorias = 'Selecione pelo menos uma categoria para o produto';
    }

    return newErrors;
  };

  // Calcular preço de venda sugerido
  const calcularPrecoVendaSugerido = (precoCusto: number) => {
    return precoCusto * (1 + margemLucro / 100);
  };

  // Função para salvar insumo e possivelmente criar produto
  const handleSave = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Salvar insumo
      const url = insumo?.id ? `/api/estoque/insumos/${insumo.id}` : '/api/estoque/insumos';
      const method = insumo?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar insumo');
      }

      const responseData = await response.json();

      // Se opção de criar produto estiver marcada
      if (criarProduto && !insumo?.id) { // Só criar produto para novos insumos
        const produtoData = {
          codigo: formData.codigo,
          nome: formData.nome,
          descricao: formData.descricao || '',
          precoVenda: calcularPrecoVendaSugerido(parseFloat(formData.precoCusto)),
          precoCompra: parseFloat(formData.precoCusto),
          unidadeMedidaId: formData.unidadeMedidaId,
          estoqueAtual: parseFloat(formData.estoqueInicial || '0'),
          controlaEstoque: true,
          baixaAutomatica: true,
          qtdInsumoConsumida: 1,
          insumoVinculadoId: responseData.insumo.id, // Vincular ao insumo recém-criado
          status: true,
          categorias: categoriasSelecionadas, // Incluir categorias selecionadas
          categoriaPrincipalId: categoriaPrincipal // Incluir categoria principal
        };

        const produtoResponse = await fetch('/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(produtoData),
        });

        if (!produtoResponse.ok) {
          // Não abortar a operação se a criação do produto falhar
          console.error('Erro ao criar produto, mas insumo foi salvo com sucesso');
          toast({
            title: 'Atenção',
            description: 'Insumo salvo com sucesso, mas houve erro ao criar o produto associado',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Sucesso',
            description: 'Insumo e produto criados com sucesso',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: 'Sucesso',
          description: insumo?.id
            ? 'Insumo atualizado com sucesso'
            : 'Insumo criado com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para adicionar nova categoria
  const handleAddCategoria = () => {
    setIsCategoriaModalOpen(true);
  };

  // Handler para sucesso na criação de categoria
  const handleCategoriaSuccess = async (novaCategoria: any) => {
    // Adicionar nova categoria ao estado local
    const novasCategorias = [...categorias, novaCategoria];
    setCategorias(novasCategorias);

    // Selecionar a nova categoria no formulário
    setFormData({
      ...formData,
      categoriaInsumoId: novaCategoria.id.toString(),
    });

    toast({
      title: 'Categoria criada',
      description: 'Nova categoria adicionada com sucesso',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{insumo ? 'Editar Insumo' : 'Novo Insumo'}</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Tabs>
              <TabList>
                <Tab>Informações Básicas</Tab>
                <Tab>Estoque</Tab>
                <Tab>Detalhes Adicionais</Tab>
                {!insumo?.id && <Tab>Produto para Venda</Tab>}
              </TabList>

              <TabPanels>
                {/* Aba de Informações Básicas */}
                <TabPanel>
                  <Stack spacing={4}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired isInvalid={!!errors.codigo}>
                        <FormLabel>Código</FormLabel>
                        <Input
                          name="codigo"
                          value={formData.codigo}
                          onChange={handleChange}
                          placeholder="Código do insumo"
                        />
                        {errors.codigo && (
                          <FormErrorMessage>{errors.codigo}</FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isInvalid={!!errors.status}>
                        <FormLabel>Status</FormLabel>
                        <HStack>
                          <Switch
                            colorScheme="green"
                            isChecked={formData.status}
                            onChange={(e) => handleSwitchChange('status', e.target.checked)}
                          />
                          <Text>{formData.status ? 'Ativo' : 'Inativo'}</Text>
                        </HStack>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl isRequired isInvalid={!!errors.nome}>
                      <FormLabel>Nome</FormLabel>
                      <Input
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        placeholder="Nome do insumo"
                      />
                      {errors.nome && (
                        <FormErrorMessage>{errors.nome}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl>
                      <FormLabel>Descrição</FormLabel>
                      <Textarea
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleChange}
                        placeholder="Descrição detalhada do insumo"
                        rows={3}
                      />
                    </FormControl>

                    <FormControl isInvalid={!!errors.categoriaInsumoId}>
                      <FormLabel>Categoria</FormLabel>
                      <HStack>
                        <Select
                          name="categoriaInsumoId"
                          value={formData.categoriaInsumoId}
                          onChange={handleChange}
                          placeholder="Selecione uma categoria"
                          flex="1"
                        >
                          {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </option>
                          ))}
                        </Select>
                        <Button
                          leftIcon={<FaPlus />}
                          colorScheme="teal"
                          onClick={handleAddCategoria}
                          size="md"
                        >
                          Nova
                        </Button>
                      </HStack>
                      <FormHelperText>
                        As categorias ajudam a organizar os insumos por tipo
                      </FormHelperText>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.unidadeMedidaId}>
                      <FormLabel>Unidade de Medida</FormLabel>
                      <Select
                        name="unidadeMedidaId"
                        value={formData.unidadeMedidaId}
                        onChange={handleChange}
                        placeholder="Selecione uma unidade"
                        isDisabled={isLoadingUnidades}
                      >
                        {unidadesMedidaLocal.map((unidade) => (
                          <option key={unidade.id} value={unidade.id}>
                            {unidade.nome} ({unidade.simbolo})
                          </option>
                        ))}
                      </Select>
                      {errors.unidadeMedidaId && (
                        <FormErrorMessage>{errors.unidadeMedidaId}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.precoCusto}>
                      <FormLabel>Preço de Custo</FormLabel>
                      <NumberInput
                        min={0}
                        precision={2}
                        value={formData.precoCusto}
                        onChange={(value) => handleNumberChange('precoCusto', value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      {errors.precoCusto && (
                        <FormErrorMessage>{errors.precoCusto}</FormErrorMessage>
                      )}
                    </FormControl>
                  </Stack>
                </TabPanel>

                {/* Aba de Estoque */}
                <TabPanel>
                  <Stack spacing={4}>
                    <FormControl isInvalid={!!errors.estoqueMinimo}>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <NumberInput
                        min={0}
                        precision={2}
                        value={formData.estoqueMinimo}
                        onChange={(value) => handleNumberChange('estoqueMinimo', value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <FormHelperText>
                        Quantidade mínima do estoque para alertas
                      </FormHelperText>
                      {errors.estoqueMinimo && (
                        <FormErrorMessage>{errors.estoqueMinimo}</FormErrorMessage>
                      )}
                    </FormControl>

                    {!insumo && (
                      <FormControl isInvalid={!!errors.estoqueInicial}>
                        <FormLabel>Estoque Inicial</FormLabel>
                        <NumberInput
                          min={0}
                          precision={2}
                          value={formData.estoqueInicial}
                          onChange={(value) => handleNumberChange('estoqueInicial', value)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>
                          Quantidade inicial em estoque (se houver)
                        </FormHelperText>
                        {errors.estoqueInicial && (
                          <FormErrorMessage>{errors.estoqueInicial}</FormErrorMessage>
                        )}
                      </FormControl>
                    )}

                    <FormControl>
                      <FormLabel>Localização no Estoque</FormLabel>
                      <Input
                        name="localizacaoEstoque"
                        value={formData.localizacaoEstoque}
                        onChange={handleChange}
                        placeholder="Ex: Prateleira A, Gaveta 3"
                      />
                      <FormHelperText>
                        Informação para facilitar a localização física do item
                      </FormHelperText>
                    </FormControl>

                    <Divider my={2} />

                    <Box>
                      <Text fontWeight="medium" mb={2}>
                        Controle de Validade
                      </Text>

                      <FormControl>
                        <FormLabel>Dias de Validade Padrão</FormLabel>
                        <NumberInput
                          min={0}
                          value={formData.diasValidade}
                          onChange={(value) => handleNumberChange('diasValidade', value)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>
                          Duração padrão em dias após recebimento (0 = sem validade)
                        </FormHelperText>
                      </FormControl>

                      <FormControl mt={3}>
                        <FormLabel>Notificar Vencimento</FormLabel>
                        <HStack>
                          <Switch
                            colorScheme="orange"
                            isChecked={formData.notificarVencimento}
                            onChange={(e) =>
                              handleSwitchChange('notificarVencimento', e.target.checked)
                            }
                          />
                          <Text>
                            {formData.notificarVencimento
                              ? 'Ativado'
                              : 'Desativado'}
                          </Text>
                        </HStack>
                        <FormHelperText>
                          Receber alertas quando itens estiverem próximos do vencimento
                        </FormHelperText>
                      </FormControl>
                    </Box>
                  </Stack>
                </TabPanel>

                {/* Aba de Detalhes Adicionais */}
                <TabPanel>
                  <Stack spacing={4}>
                    <FormControl>
                      <FormLabel>Fornecedor Principal</FormLabel>
                      <Select
                        name="fornecedorPrincipalId"
                        value={formData.fornecedorPrincipalId}
                        onChange={handleChange}
                        placeholder="Selecione um fornecedor"
                      >
                        {fornecedores.map((fornecedor) => (
                          <option key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nomeFantasia || fornecedor.razaoSocial}
                          </option>
                        ))}
                      </Select>
                      <FormHelperText>
                        Fornecedor padrão para compras deste insumo
                      </FormHelperText>
                    </FormControl>

                    {insumo && (
                      <Box
                        p={4}
                        bg="gray.50"
                        borderRadius="md"
                        borderLeft="4px solid"
                        borderColor="blue.500"
                      >
                        <Text fontWeight="medium" mb={2}>
                          Informações do Sistema
                        </Text>

                        <HStack justifyContent="space-between" mb={1}>
                          <Text fontSize="sm">Estoque Atual:</Text>
                          <Tag size="md" colorScheme="green">
                            {insumo.estoqueAtual?.toFixed(2) || '0.00'}
                            {unidadesMedida.find(u => u.id === parseInt(formData.unidadeMedidaId))?.simbolo}
                          </Tag>
                        </HStack>

                        <HStack justifyContent="space-between">
                          <Text fontSize="sm">Valor em Estoque:</Text>
                          <Tag size="md" colorScheme="blue">
                            {formatCurrency(
                              (insumo.estoqueAtual || 0) * parseFloat(formData.precoCusto)
                            )}
                          </Tag>
                        </HStack>
                      </Box>
                    )}
                  </Stack>
                </TabPanel>

                {/* Aba para configuração do produto (apenas para novos insumos) */}
                {!insumo?.id && (
                  <TabPanel>
                    <VStack spacing={5} align="stretch">
                      <Box 
                        p={4} 
                        borderWidth="1px" 
                        borderRadius="md" 
                        bgColor="gray.50"
                        borderLeft="4px solid" 
                        borderLeftColor="green.500"
                      >
                        <FormControl>
                          <HStack mb={3}>
                            <Checkbox
                              isChecked={criarProduto}
                              onChange={handleCriarProdutoToggle}
                              colorScheme="green"
                              size="lg"
                            />
                            <FormLabel fontWeight="bold" mb="0">
                              Disponibilizar como Produto para Venda
                            </FormLabel>
                          </HStack>
                          
                          <Text fontSize="sm" color={criarProduto ? "black" : "gray.500"}>
                            Ao ativar esta opção, um produto com o mesmo nome e código deste insumo será 
                            automaticamente criado no cadastro de produtos.
                          </Text>
                        </FormControl>
                      </Box>

                      <Collapse in={criarProduto} animateOpacity>
                        <VStack spacing={5} align="stretch" mt={3}>
                          <FormControl>
                            <FormLabel>Margem de Lucro (%)</FormLabel>
                            <HStack>
                              <Input
                                type="number"
                                value={margemLucro}
                                onChange={(e) => setMargemLucro(Number(e.target.value))}
                                width="100px"
                              />
                              <Text>%</Text>
                            </HStack>
                            <FormHelperText>
                              Preço de venda sugerido: {
                                formData.precoCusto
                                  ? formatCurrency(calcularPrecoVendaSugerido(parseFloat(formData.precoCusto)))
                                  : '-'
                              }
                            </FormHelperText>
                          </FormControl>

                          <FormControl isInvalid={!!errors.categorias}>
                            <FormLabel>Categorias do Produto</FormLabel>
                            <Text fontSize="sm" color="gray.500" mb={2}>
                              Selecione uma ou mais categorias para o produto. Use Ctrl (ou Cmd) para selecionar múltiplas categorias.
                            </Text>
                            {isLoadingCategoriasProduto ? (
                              <Flex justify="center" p={4}>
                                <Spinner />
                              </Flex>
                            ) : (
                              <Select
                                multiple
                                size="md"
                                height="200px"
                                value={categoriasSelecionadas}
                                onChange={handleCategoriasChange}
                              >
                                {categoriasProduto.map(cat => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.categoriaPai ? `${cat.categoriaPai.nome} > ` : ''}{cat.nome}
                                  </option>
                                ))}
                              </Select>
                            )}
                            {errors.categorias && (
                              <FormErrorMessage>{errors.categorias}</FormErrorMessage>
                            )}
                          </FormControl>

                          <FormControl>
                            <FormLabel>Categoria Principal</FormLabel>
                            <Text fontSize="sm" color="gray.500" mb={2}>
                              Defina a categoria principal para fins de relatórios e organização. Deve ser uma das categorias selecionadas acima.
                            </Text>
                            <Select
                              isDisabled={categoriasSelecionadas.length === 0}
                              value={categoriaPrincipal || ''}
                              onChange={handleCategoriaPrincipalChange}
                              placeholder="Selecione a categoria principal"
                            >
                              {categoriasProduto
                                .filter(cat => categoriasSelecionadas.includes(cat.id))
                                .map(cat => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.nome}
                                  </option>
                                ))}
                            </Select>
                          </FormControl>

                          <Box
                            p={4}
                            bg="gray.50"
                            borderRadius="md"
                          >
                            <Heading size="sm" mb={2}>Categorias Selecionadas</Heading>
                            {categoriasSelecionadas.length === 0 ? (
                              <Text color="gray.500">Nenhuma categoria selecionada</Text>
                            ) : (
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                {categoriasSelecionadas.map(catId => {
                                  const categoria = categoriasProduto.find(c => c.id === catId);
                                  if (!categoria) return null;

                                  return (
                                    <Box
                                      key={catId}
                                      p={3}
                                      borderWidth="1px"
                                      borderRadius="md"
                                      borderLeftWidth="4px"
                                      borderLeftColor={categoria.cor || 'teal.500'}
                                    >
                                      <Flex justify="space-between" align="center">
                                        <Text fontWeight="medium">{categoria.nome}</Text>
                                        {categoriaPrincipal === catId && (
                                          <Badge colorScheme="teal">Principal</Badge>
                                        )}
                                      </Flex>
                                      <Text fontSize="sm" color="gray.500">
                                        {categoria.localProducao
                                          ? `Local: ${categoria.localProducao.nome}`
                                          : 'Sem local definido'}
                                      </Text>
                                    </Box>
                                  );
                                })}
                              </SimpleGrid>
                            )}
                          </Box>

                          <Box bgColor="blue.50" p={4} borderRadius="md">
                            <Flex alignItems="center" mb={2}>
                              <Icon as={FaInfoCircle} color="blue.500" mr={2} />
                              <Heading size="sm" color="blue.700">Configurações Automáticas</Heading>
                            </Flex>
                            <Text fontSize="sm" mb={2}>
                              Ao criar um produto, as seguintes configurações serão aplicadas automaticamente:
                            </Text>
                            <UnorderedList fontSize="sm" spacing={1} pl={4}>
                              <ListItem>Mesmo código e nome do insumo</ListItem>
                              <ListItem>Controle de estoque ativado</ListItem>
                              <ListItem>Baixa automática de estoque ativada</ListItem>
                              <ListItem>Insumo vinculado automaticamente (1:1)</ListItem>
                              <ListItem>Preço de venda calculado com a margem definida</ListItem>
                            </UnorderedList>
                          </Box>
                        </VStack>
                      </Collapse>
                    </VStack>
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleSave}
              isLoading={isSubmitting}
            >
              {insumo ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para adicionar nova categoria */}
      <CategoriaInsumoFormModal
        isOpen={isCategoriaModalOpen}
        onClose={() => setIsCategoriaModalOpen(false)}
        onSuccess={handleCategoriaSuccess}
      />
    </>
  );
}
