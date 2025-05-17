'use client'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Image,
  Box,
  Text,
  Flex,
  VStack,
  HStack,
  Badge,
  Divider,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Grid,
  GridItem,
  Icon,
  Tag,
  TagLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Wrap,
  WrapItem,
  TagRightIcon,
  Heading,
  Alert,
  AlertIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner
} from '@chakra-ui/react'
import {
  FaTag,
  FaPrint,
  FaBoxes,
  FaMoneyBillWave,
  FaUtensils,
  FaBalanceScale,
  FaExclamationTriangle,
  FaInfoCircle,
  FaImage,
  FaCalendarAlt,
  FaBarcode,
  FaClock,
  FaWarehouse,
  FaShoppingCart,
  FaListOl,
  FaBook,
  FaPlus
} from 'react-icons/fa'
import { formatCurrency, formatDate } from '@/utils/format'
import { useState, useEffect } from 'react'

// Modificação no componente FichaTecnicaTab para exibir os dados corretamente
const FichaTecnicaTab = ({ produto }) => {
  if (!produto.fichaTecnica ||
    !produto.fichaTecnica.ingredientes ||
    produto.fichaTecnica.ingredientes.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Text>Este produto não possui ficha técnica cadastrada.</Text>
      </Alert>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Heading size="sm" mb={2}>Ingredientes</Heading>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Ingrediente</Th>
              <Th>Quantidade</Th>
              <Th isNumeric>Custo</Th>
            </Tr>
          </Thead>
          <Tbody>
            {produto.fichaTecnica.ingredientes.map((ingrediente, index) => (
              <Tr key={index}>
                <Td>{ingrediente.nome}</Td>
                <Td>
                  {ingrediente.quantidade} {ingrediente.unidadeMedida?.simbolo || ''}
                </Td>
                <Td isNumeric>{formatCurrency(ingrediente.custo)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {produto.fichaTecnica.modoPreparo && (
        <Box>
          <Heading size="sm" mb={2}>Modo de Preparo</Heading>
          <Text whiteSpace="pre-wrap">{produto.fichaTecnica.modoPreparo}</Text>
        </Box>
      )}

      <Box>
        <Heading size="sm" mb={2}>Informações</Heading>
        <SimpleGrid columns={2} spacing={4}>
          <Stat>
            <StatLabel>Rendimento</StatLabel>
            <StatNumber>{produto.fichaTecnica.rendimento || 1}</StatNumber>
            <StatHelpText>
              {produto.unidadeMedida ? produto.unidadeMedida.nome : 'Porções'}
            </StatHelpText>
          </Stat>
        </SimpleGrid>
      </Box>
    </VStack>
  );
};

// Modificação no componente ComplementosTab para exibir os complementos corretamente
const ComplementosTab = ({ produto }) => {
  // Verificar se existem grupos de complementos associados ao produto
  const temGruposComplementos = produto.gruposComplementos &&
    Array.isArray(produto.gruposComplementos) &&
    produto.gruposComplementos.length > 0;

  if (!temGruposComplementos) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Text>Este produto não possui complementos configurados.</Text>
      </Alert>
    );
  }

  return (
    <VStack align="stretch" spacing={5}>
      {produto.gruposComplementos.map((grupo) => (
        <Box
          key={grupo.grupoComplementoId}
          borderWidth="1px"
          borderRadius="md"
          p={4}
          bg={useColorModeValue('white', 'gray.700')}
        >
          <HStack justify="space-between" mb={2}>
            <Heading size="sm">{grupo.grupoComplemento.nome}</Heading>
            <Badge colorScheme={grupo.obrigatorio ? "red" : "green"}>
              {grupo.obrigatorio ? "Obrigatório" : "Opcional"}
            </Badge>
          </HStack>

          {grupo.grupoComplemento.descricao && (
            <Text fontSize="sm" color="gray.500" mb={3}>
              {grupo.grupoComplemento.descricao}
            </Text>
          )}

          <Text fontSize="sm" mb={3}>
            <Icon as={FaInfoCircle} mr={1} color="blue.500" />
            {grupo.minSelecao === grupo.maxSelecao
              ? `Selecionar exatamente ${grupo.minSelecao}`
              : grupo.minSelecao > 0 && grupo.maxSelecao > 0
                ? `Selecionar de ${grupo.minSelecao} até ${grupo.maxSelecao}`
                : grupo.minSelecao > 0
                  ? `Selecionar no mínimo ${grupo.minSelecao}`
                  : grupo.maxSelecao > 0
                    ? `Selecionar até ${grupo.maxSelecao}`
                    : 'Sem regras de seleção'
            }
          </Text>

          <Divider mb={3} />

          {grupo.grupoComplemento.complementos && grupo.grupoComplemento.complementos.length > 0 ? (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={3}>
              {grupo.grupoComplemento.complementos.map((item) => (
                <HStack
                  key={item.complementoId}
                  justify="space-between"
                  p={2}
                  borderWidth="1px"
                  borderRadius="md"
                  bg={useColorModeValue('gray.50', 'gray.600')}
                >
                  <Text>{item.complemento?.nome}</Text>
                  <Badge colorScheme="green">
                    +{formatCurrency(item.complemento?.precoAdicional || 0)}
                  </Badge>
                </HStack>
              ))}
            </SimpleGrid>
          ) : (
            <Text fontSize="sm" color="red.500">Nenhum complemento neste grupo</Text>
          )}
        </Box>
      ))}
    </VStack>
  );
};

// Componente principal modificado para garantir que o modal apareça
export function PreviewModal({ isOpen, onClose, produto: initialProduto }) {
  const [produto, setProduto] = useState(initialProduto ?? {});
  const [isLoading, setIsLoading] = useState(false);


  // Carregar detalhes adicionais do produto quando o modal for aberto
  useEffect(() => {
    const fetchDetalhes = async () => {
      if (isOpen && initialProduto?.id) {
        setIsLoading(true);
        try {
          // Buscar dados da ficha técnica, complementos, etc.
          const response = await fetch(`/api/produtos/${initialProduto.id}`);
          if (response.ok) {
            const data = await response.json();
            const produtoData = { ...data.produto }

            // Buscar grupos de complementos
            const gruposResponse = await fetch(`/api/produtos/${initialProduto.id}/grupos-complementos`);
            if (gruposResponse.ok) {
              const gruposData = await gruposResponse.json();
              // Mesclar os dados de grupos com o produto atual
              const produtoFinal = { ...produtoData, gruposComplementos: gruposData.gruposProduto }
              setProduto(produtoFinal);
            } else {
              console.error('Erro ao carregar grupos de complementos:', gruposResponse.statusText);
              setProduto(produtoData);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar detalhes do produto:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchDetalhes();
  }, [isOpen, initialProduto?.id]);

  const infoBoxBg = useColorModeValue('gray.50', 'gray.700')

  // Garantir que o modal seja renderizado mesmo que não haja produto ainda
  // mas isOpen seja true
  if (isOpen && !produto) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Produto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex justify="center" align="center" h="300px">
              <Spinner size="xl" />
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" onClick={onClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Calcular o custo total da ficha técnica (se disponível)
  const calcularCustoTotal = () => {
    if (!produto?.fichaTecnica?.ingredientes?.length) return 0

    return produto.fichaTecnica.ingredientes.reduce(
      (total, ingrediente) => total + (ingrediente.custo || 0),
      0
    )
  }

  // Calcular margem de lucro
  const calcularMargemLucro = () => {
    const custo = calcularCustoTotal()
    if (custo <= 0) return 100

    const lucro = produto.precoVenda - custo
    return (lucro / produto.precoVenda) * 100
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FaUtensils} />
            <Text>{initialProduto?.nome || 'Produto'}</Text>
            {produto && !produto.status && (
              <Badge colorScheme="red" ml={2}>Inativo</Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isLoading ? (
            <Flex justify="center" align="center" h="300px">
              <Spinner size="xl" />
            </Flex>
          ) : (
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              {/* Coluna esquerda com imagem */}
              <GridItem colSpan={{ base: 12, md: 5 }}>
                <Box
                  bg={useColorModeValue('gray.100', 'gray.700')}
                  borderRadius="md"
                  overflow="hidden"
                  mb={4}
                  h="280px"
                >
                  {produto?.imagem ? (
                    <Image
                      src={produto.imagem}
                      alt={produto.nome}
                      objectFit="cover"
                      w="full"
                      h="full"
                    />
                  ) : (
                    <Flex
                      w="full"
                      h="full"
                      alignItems="center"
                      justifyContent="center"
                      color="gray.400"
                      flexDirection="column"
                    >
                      <Icon as={FaImage} boxSize={12} mb={2} />
                      <Text>Sem imagem</Text>
                    </Flex>
                  )}
                </Box>

                <Box p={4} bg={infoBoxBg} borderRadius="md" mb={4}>
                  <HStack spacing={2} mb={2}>
                    <Icon as={FaBarcode} />
                    <Text fontWeight="bold">Código:</Text>
                    <Text fontFamily="mono">{produto?.codigo}</Text>
                  </HStack>

                  <HStack spacing={2} mb={2} wrap="wrap">
                    <Icon as={FaTag} />
                    <Text fontWeight="bold">Categorias:</Text>
                    <Flex flexWrap="wrap" gap={1}>
                      {produto?.categorias && produto.categorias.map(cat => (
                        <Tag
                          key={cat.categoriaId}
                          size="sm"
                          colorScheme="teal"
                          borderRadius="full"
                        >
                          <TagLabel>{cat.categoria?.nome || `ID: ${cat.categoriaId}`}</TagLabel>
                        </Tag>
                      ))}
                    </Flex>
                  </HStack>

                  <HStack mb={2}>
                    <Icon as={FaMoneyBillWave} color="green.500" />
                    <Text fontWeight="bold">Preço:</Text>
                    <Text fontWeight="bold" color="green.500">
                      {formatCurrency(produto?.precoVenda || 0)}
                    </Text>
                  </HStack>

                  <HStack>
                    <Icon as={FaBalanceScale} />
                    <Text fontWeight="bold">Unidade:</Text>
                    <Text>
                      {produto?.unidadeMedida
                        ? `${produto.unidadeMedida.nome} (${produto.unidadeMedida.simbolo})`
                        : 'Não definida'}
                    </Text>
                  </HStack>
                </Box>

                <Box p={4} bg={infoBoxBg} borderRadius="md">
                  <Flex justifyContent="space-between" alignItems="center" mb={2}>
                    <HStack>
                      <Icon as={FaPrint} />
                      <Text fontWeight="bold">Comanda:</Text>
                    </HStack>

                    <Badge colorScheme={produto?.geraComanda !== false ? "green" : "red"}>
                      {produto?.geraComanda !== false ? "Gera Comanda" : "Sem Comanda"}
                    </Badge>
                  </Flex>

                  <HStack mb={2}>
                    <Icon as={FaWarehouse} />
                    <Text fontWeight="bold">Local de Produção:</Text>
                    <Text>
                      {produto?.localProducao
                        ? produto.localProducao.nome
                        : 'Conforme categoria'}
                    </Text>
                  </HStack>

                  <HStack>
                    <Icon as={FaClock} />
                    <Text fontWeight="bold">Tempo de Preparo:</Text>
                    <Text>{produto?.tempoPreparo ? `${produto.tempoPreparo} min` : 'Não definido'}</Text>
                  </HStack>
                </Box>
              </GridItem>

              {/* Coluna direita com informações */}
              <GridItem colSpan={{ base: 12, md: 7 }}>
                <Tabs colorScheme="teal" variant="enclosed" isLazy>
                  <TabList>
                    <Tab><Icon as={FaInfoCircle} mr={2} />Detalhes</Tab>
                    <Tab><Icon as={FaBook} mr={2} />Ficha Técnica</Tab>
                    <Tab><Icon as={FaPlus} mr={2} />Complementos</Tab>
                    <Tab><Icon as={FaBoxes} mr={2} />Estoque</Tab>
                  </TabList>

                  <TabPanels>
                    {/* Aba de Detalhes */}
                    <TabPanel>
                      <VStack align="stretch" spacing={4}>
                        {produto?.descricao && (
                          <>
                            <Text fontWeight="bold">Descrição:</Text>
                            <Box p={3} bg={infoBoxBg} borderRadius="md">
                              <Text whiteSpace="pre-wrap">{produto.descricao}</Text>
                            </Box>
                          </>
                        )}

                        <Text fontWeight="bold" mt={2}>
                          Categorias:
                        </Text>
                        <Box p={3} borderWidth={1} borderRadius="md">
                          {produto?.categorias && produto.categorias.length > 0 ? (
                            <VStack align="stretch" divider={<Divider />} spacing={2}>
                              {produto.categorias.map((cat: any) => {
                                const isPrincipal = cat.isPrincipal
                                return (
                                  <Flex
                                    key={cat.categoriaId}
                                    justify="space-between"
                                    align="center"
                                    borderLeftWidth={isPrincipal ? "4px" : "0"}
                                    borderLeftColor="teal.500"
                                    pl={isPrincipal ? 2 : 0}
                                  >
                                    <HStack>
                                      <Text fontWeight={isPrincipal ? "bold" : "normal"}>
                                        {cat.categoria?.nome || `ID: ${cat.categoriaId}`}
                                      </Text>
                                      {isPrincipal && (
                                        <Badge colorScheme="teal">Principal</Badge>
                                      )}
                                    </HStack>
                                  </Flex>
                                )
                              })}
                            </VStack>
                          ) : (
                            <Text color="gray.500">Nenhuma categoria associada</Text>
                          )}
                        </Box>

                        <Text fontWeight="bold" mt={2}>
                          Informações Adicionais:
                        </Text>
                        <Grid templateColumns="repeat(12, 1fr)" gap={4}>
                          <GridItem colSpan={{ base: 12, md: 6 }}>
                            <Box
                              p={3}
                              borderWidth={1}
                              borderRadius="md"
                              height="100%"
                            >
                              <VStack align="start" spacing={2}>
                                <Text fontWeight="medium">Cadastro:</Text>
                                {produto?.criadoEm && (
                                  <HStack>
                                    <Icon as={FaCalendarAlt} />
                                    <Text fontSize="sm">
                                      Criado em: {formatDate(produto.criadoEm)}
                                    </Text>
                                  </HStack>
                                )}
                                {produto?.atualizadoEm && (
                                  <HStack>
                                    <Icon as={FaCalendarAlt} />
                                    <Text fontSize="sm">
                                      Atualizado em: {formatDate(produto.atualizadoEm)}
                                    </Text>
                                  </HStack>
                                )}
                              </VStack>
                            </Box>
                          </GridItem>

                          <GridItem colSpan={{ base: 12, md: 6 }}>
                            <Box
                              p={3}
                              borderWidth={1}
                              borderRadius="md"
                              height="100%"
                            >
                              <VStack align="start" spacing={2}>
                                <Text fontWeight="medium">Status:</Text>
                                <Badge colorScheme={produto.status ? "green" : "red"} px={2} py={1}>
                                  {produto?.status ? "Produto Ativo" : "Produto Inativo"}
                                </Badge>
                              </VStack>
                            </Box>
                          </GridItem>
                        </Grid>
                      </VStack>
                    </TabPanel>

                    {/* Aba de Ficha Técnica */}
                    <TabPanel>
                      <FichaTecnicaTab produto={produto} />
                    </TabPanel>

                    {/* Aba de Complementos */}
                    <TabPanel>
                      <ComplementosTab produto={produto} />
                    </TabPanel>

                    {/* Aba de Estoque */}
                    <TabPanel>
                      <VStack align="stretch" spacing={4}>
                        <HStack>
                          <Badge px={2} py={1} borderRadius="full" colorScheme={produto.controlaEstoque ? "green" : "gray"}>
                            {produto?.controlaEstoque ? "Controle de Estoque Ativado" : "Sem Controle de Estoque"}
                          </Badge>
                        </HStack>

                        {produto?.controlaEstoque ? (
                          <Box p={4} borderWidth={1} borderRadius="md">
                            <Grid templateColumns="repeat(12, 1fr)" gap={4}>
                              <GridItem colSpan={{ base: 12, md: 6 }}>
                                <VStack align="start" spacing={3}>
                                  <HStack>
                                    <Icon as={FaBoxes} />
                                    <Text fontWeight="bold">Estoque Atual:</Text>
                                    <Text>{produto.estoqueAtual || 0} {produto.unidadeEstoque?.simbolo || produto.unidadeMedida?.simbolo || ''}</Text>
                                  </HStack>

                                  <HStack>
                                    <Icon as={FaExclamationTriangle} />
                                    <Text fontWeight="bold">Estoque Mínimo:</Text>
                                    <Text>{produto.estoqueMinimo || 0} {produto.unidadeEstoque?.simbolo || produto.unidadeMedida?.simbolo || ''}</Text>
                                  </HStack>
                                </VStack>
                              </GridItem>

                              <GridItem colSpan={{ base: 12, md: 6 }}>
                                <VStack align="start" spacing={3}>
                                  <HStack>
                                    <Text fontWeight="bold">Baixa Automática:</Text>
                                    <Badge colorScheme={produto.baixaAutomatica ? "green" : "red"}>
                                      {produto.baixaAutomatica ? "Sim" : "Não"}
                                    </Badge>
                                  </HStack>

                                  <HStack>
                                    <Text fontWeight="bold">Unidade de Estoque:</Text>
                                    <Text>
                                      {produto.unidadeEstoque
                                        ? `${produto.unidadeEstoque.nome} (${produto.unidadeEstoque.simbolo})`
                                        : produto.unidadeMedida
                                          ? `${produto.unidadeMedida.nome} (${produto.unidadeMedida.simbolo})`
                                          : 'Não definida'}
                                    </Text>
                                  </HStack>
                                </VStack>
                              </GridItem>
                            </Grid>
                          </Box>
                        ) : (
                          <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            h="200px"
                            bg={infoBoxBg}
                            borderRadius="md"
                            p={4}
                          >
                            <Icon as={FaInfoCircle} boxSize={8} color="gray.400" mb={4} />
                            <Text fontSize="lg" color="gray.500" textAlign="center">
                              Este produto não possui controle de estoque ativado.
                            </Text>
                            <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
                              Ideal para itens de produção contínua ou que são contabilizados através de seus ingredientes.
                            </Text>
                          </Flex>
                        )}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </GridItem>
            </Grid>
          )}
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="teal" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
