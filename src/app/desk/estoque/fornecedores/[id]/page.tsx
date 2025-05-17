'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Button,
  Flex,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue,
  useDisclosure,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Icon,
  VStack,
  Divider,
} from '@chakra-ui/react';
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUser,
  FaFileInvoiceDollar,
  FaBoxOpen,
  FaClipboardList,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaPlus,
  FaEye,
} from 'react-icons/fa';
import { formatCurrency, formatDate, formatCNPJ } from '@/utils/format';
import { FornecedorFormModal } from '@/components/molecules/FornecedorFormModal';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import Link from 'next/link';

export default function DetalheFornecedorPage() {
  const router = useRouter();
  const { id } = useParams();
  const toast = useToast();

  const [fornecedor, setFornecedor] = useState<any>(null);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Disclosures para modais
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();

  // Cores dos cards
  const cardBg = useColorModeValue('white', 'gray.800');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch principal do fornecedor
  useEffect(() => {
    const fetchFornecedor = async () => {
      setIsLoading(true);
      try {
        // Carregar fornecedor
        const response = await fetch(`/api/fornecedores/${id}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar fornecedor');
        }
        const data = await response.json();
        setFornecedor(data.fornecedor);
        setInsumos(data.insumos || []);
        setCompras(data.compras || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o fornecedor',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchFornecedor();
    }
  }, [id, toast]);

  // Refresh da página após edição
  const handleSuccess = async () => {
    try {
      const response = await fetch(`/api/fornecedores/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFornecedor(data.fornecedor);
        setInsumos(data.insumos || []);
        setCompras(data.compras || []);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };

  // Handler para exclusão
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/fornecedores/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir fornecedor');
      }

      toast({
        title: 'Sucesso',
        description: 'Fornecedor excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      router.push('fornecedores');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao excluir o fornecedor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!fornecedor) {
    return (
      <Alert status="error" variant="left-accent">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Fornecedor não encontrado</Text>
          <Text>O fornecedor solicitado não existe ou foi removido.</Text>
          <Button
            leftIcon={<FaArrowLeft />}
            mt={3}
            onClick={() => router.push('/desk/cadastro/fornecedores')}
          >
            Voltar para Lista
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Box p={5}>
      {/* Breadcrumb e header */}
      <Breadcrumb mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/desk/estoque">Estoque</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="fornecedores">Fornecedores</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{fornecedor.nomeFantasia || fornecedor.razaoSocial}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={2}>
        <Box>
          <HStack>
            <Heading size="lg">
              {fornecedor.nomeFantasia || fornecedor.razaoSocial}
            </Heading>
            {!fornecedor.status && <Badge ml={2} colorScheme="red">Inativo</Badge>}
          </HStack>
          <HStack mt={1}>
            <Badge colorScheme="blue" fontFamily="mono">{fornecedor.codigo}</Badge>
            {fornecedor.cnpj && (
              <Badge colorScheme="gray">CNPJ: {formatCNPJ(fornecedor.cnpj)}</Badge>
            )}
          </HStack>
        </Box>

        <HStack>
          <Button
            leftIcon={<FaArrowLeft />}
            onClick={() => router.back()}
            variant="outline"
          >
            Voltar
          </Button>

          <Button
            leftIcon={<FaFileInvoiceDollar />}
            colorScheme="blue"
            as={Link}
            href={`/desk/estoque/compras/new?fornecedorId=${fornecedor.id}`}
          >
            Nova Compra
          </Button>

          <Button
            leftIcon={<FaEdit />}
            colorScheme="teal"
            onClick={onEditOpen}
          >
            Editar
          </Button>

          <Button
            leftIcon={<FaTrash />}
            colorScheme="red"
            variant="outline"
            onClick={onDeleteOpen}
            isDisabled={
              (fornecedor._count?.insumos > 0 ||
                fornecedor._count?.compras > 0 ||
                fornecedor._count?.lotes > 0)
            }
          >
            Excluir
          </Button>
        </HStack>
      </Flex>

      {/* Informações detalhadas em tabs */}
      <Card bg={cardBg} mb={6} boxShadow="md">
        <CardBody p={0}>
          <Tabs colorScheme="teal">
            <TabList px={4}>
              <Tab><Icon as={FaBuilding} mr={2} />Dados Gerais</Tab>
              <Tab><Icon as={FaBoxOpen} mr={2} />Insumos</Tab>
              <Tab><Icon as={FaFileInvoiceDollar} mr={2} />Compras</Tab>
            </TabList>

            <TabPanels>
              {/* Tab de Dados Gerais */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                  <Box>
                    <Heading size="sm" mb={3}>Dados Cadastrais</Heading>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                      <Box>
                        <Text fontWeight="medium">Razão Social:</Text>
                        <Text>{fornecedor.razaoSocial}</Text>
                      </Box>

                      <Box>
                        <Text fontWeight="medium">Nome Fantasia:</Text>
                        <Text>{fornecedor.nomeFantasia || '-'}</Text>
                      </Box>

                      <Box>
                        <Text fontWeight="medium">CNPJ:</Text>
                        <Text>{fornecedor.cnpj ? formatCNPJ(fornecedor.cnpj) : '-'}</Text>
                      </Box>

                      <Box>
                        <Text fontWeight="medium">Inscrição Estadual:</Text>
                        <Text>{fornecedor.inscricaoEstadual || '-'}</Text>
                      </Box>

                      <Box>
                        <Text fontWeight="medium">Status:</Text>
                        <Flex align="center">
                          <Icon
                            as={fornecedor.status ? FaCheck : FaTimes}
                            color={fornecedor.status ? 'green.500' : 'red.500'}
                            mr={2}
                          />
                          <Text>{fornecedor.status ? 'Ativo' : 'Inativo'}</Text>
                        </Flex>
                      </Box>
                    </SimpleGrid>

                    <Heading size="sm" mb={3}>Informações de Contato</Heading>

                    <VStack align="start" spacing={2} mb={4}>
                      {fornecedor.telefone && (
                        <HStack>
                          <Icon as={FaPhone} color="blue.500" />
                          <Text>{fornecedor.telefone}</Text>
                        </HStack>
                      )}

                      {fornecedor.email && (
                        <HStack>
                          <Icon as={FaEnvelope} color="blue.500" />
                          <Text>{fornecedor.email}</Text>
                        </HStack>
                      )}

                      {fornecedor.endereco && (
                        <HStack alignItems="flex-start">
                          <Icon as={FaMapMarkerAlt} color="blue.500" mt={1} />
                          <Text>{fornecedor.endereco}</Text>
                        </HStack>
                      )}

                      {fornecedor.contato && (
                        <HStack>
                          <Icon as={FaUser} color="blue.500" />
                          <Text>Contato: {fornecedor.contato}</Text>
                        </HStack>
                      )}
                    </VStack>
                  </Box>

                  <Box>
                    <Heading size="sm" mb={3}>Resumo de Relacionamento</Heading>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                      <Card bg={sectionBg} variant="outline">
                        <CardBody>
                          <VStack align="start">
                            <HStack>
                              <Icon as={FaBoxOpen} boxSize={5} color="blue.500" />
                              <Heading size="sm">Insumos</Heading>
                            </HStack>
                            <Text fontSize="2xl" fontWeight="bold">
                              {fornecedor._count?.insumos || 0}
                            </Text>
                            <Text fontSize="sm">
                              Insumos associados a este fornecedor
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={sectionBg} variant="outline">
                        <CardBody>
                          <VStack align="start">
                            <HStack>
                              <Icon as={FaFileInvoiceDollar} boxSize={5} color="green.500" />
                              <Heading size="sm">Compras</Heading>
                            </HStack>
                            <Text fontSize="2xl" fontWeight="bold">
                              {fornecedor._count?.compras || 0}
                            </Text>
                            <Text fontSize="sm">
                              Compras realizadas com este fornecedor
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>

                    {fornecedor.observacoes && (
                      <Box mb={4}>
                        <Heading size="sm" mb={3}>Observações</Heading>
                        <Box bg={sectionBg} p={4} borderRadius="md">
                          <Text>{fornecedor.observacoes}</Text>
                        </Box>
                      </Box>
                    )}

                    <Divider my={4} />

                    <Box>
                      <Text fontWeight="medium" mb={1}>Criado em:</Text>
                      <Text>{formatDate(fornecedor.criadoEm)}</Text>
                    </Box>

                    <Box mt={2}>
                      <Text fontWeight="medium" mb={1}>Última atualização:</Text>
                      <Text>{formatDate(fornecedor.atualizadoEm)}</Text>
                    </Box>
                  </Box>
                </SimpleGrid>
              </TabPanel>

              {/* Tab de Insumos */}
              <TabPanel>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="sm">Insumos deste Fornecedor</Heading>
                  <Button
                    as={Link}
                    href={`insumos/new?fornecedorId=${fornecedor.id}`}
                    leftIcon={<FaPlus />}
                    colorScheme="blue"
                    size="sm"
                  >
                    Cadastrar Insumo
                  </Button>
                </Flex>

                {insumos.length === 0 ? (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text>Este fornecedor não possui insumos cadastrados.</Text>
                      <Button
                        as={Link}
                        href={`insumos/new?fornecedorId=${fornecedor.id}`}
                        size="sm"
                        colorScheme="blue"
                        variant="link"
                        mt={1}
                      >
                        Cadastrar um novo insumo
                      </Button>
                    </Box>
                  </Alert>
                ) : (
                  <>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Código</Th>
                          <Th>Nome</Th>
                          <Th isNumeric>Estoque Atual</Th>
                          <Th isNumeric>Preço de Custo</Th>
                          <Th>Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {insumos.map((insumo) => (
                          <Tr key={insumo.id}>
                            <Td fontFamily="mono">{insumo.codigo}</Td>
                            <Td fontWeight="medium">{insumo.nome}</Td>
                            <Td isNumeric>
                              {insumo.estoqueAtual.toFixed(2)} {insumo.unidadeMedida?.simbolo || ''}
                            </Td>
                            <Td isNumeric>{formatCurrency(insumo.precoCusto)}</Td>
                            <Td>
                              <Button
                                as={Link}
                                href={`insumos/${insumo.id}`}
                                size="sm"
                                leftIcon={<FaEye />}
                                colorScheme="teal"
                                variant="link"
                              >
                                Detalhes
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>

                    {insumos.length < fornecedor._count?.insumos && (
                      <Flex justify="center" mt={4}>
                        <Button
                          as={Link}
                          href={`insumos?fornecedorId=${fornecedor.id}`}
                          variant="outline"
                          size="sm"
                          rightIcon={<FaArrowLeft />}
                        >
                          Ver Todos os Insumos
                        </Button>
                      </Flex>
                    )}
                  </>
                )}
              </TabPanel>

              {/* Tab de Compras */}
              <TabPanel>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="sm">Compras deste Fornecedor</Heading>
                  <Button
                    as={Link}
                    href={`compras/new?fornecedorId=${fornecedor.id}`}
                    leftIcon={<FaPlus />}
                    colorScheme="blue"
                    size="sm"
                  >
                    Nova Compra
                  </Button>
                </Flex>

                {compras.length === 0 ? (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text>Não há compras registradas para este fornecedor.</Text>
                      <Button
                        as={Link}
                        href={`compras/new?fornecedorId=${fornecedor.id}`}
                        size="sm"
                        colorScheme="blue"
                        variant="link"
                        mt={1}
                      >
                        Registrar uma nova compra
                      </Button>
                    </Box>
                  </Alert>
                ) : (
                  <>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Código</Th>
                          <Th>Data</Th>
                          <Th isNumeric>Valor Total</Th>
                          <Th>Status</Th>
                          <Th>Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {compras.map((compra) => (
                          <Tr key={compra.id}>
                            <Td fontFamily="mono">{compra.codigo}</Td>
                            <Td>{formatDate(compra.dataCompra)}</Td>
                            <Td isNumeric>{formatCurrency(compra.valorTotal)}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  compra.status === 'FINALIZADA' ? 'green' :
                                    compra.status === 'PENDENTE' ? 'orange' :
                                      compra.status === 'CANCELADA' ? 'red' : 'gray'
                                }
                              >
                                {compra.status}
                              </Badge>
                            </Td>
                            <Td>
                              <Button
                                as={Link}
                                href={`compras/${compra.id}`}
                                size="sm"
                                leftIcon={<FaEye />}
                                colorScheme="teal"
                                variant="link"
                              >
                                Detalhes
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>

                    {compras.length < fornecedor._count?.compras && (
                      <Flex justify="center" mt={4}>
                        <Button
                          as={Link}
                          href={`compras?fornecedorId=${fornecedor.id}`}
                          variant="outline"
                          size="sm"
                          rightIcon={<FaArrowLeft />}
                        >
                          Ver Todas as Compras
                        </Button>
                      </Flex>
                    )}
                  </>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      {/* Modais */}
      <FornecedorFormModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        fornecedor={fornecedor}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
        title="Excluir Fornecedor"
        message={`Tem certeza que deseja excluir o fornecedor "${fornecedor.razaoSocial}"? Esta ação não poderá ser desfeita.`}
      />
    </Box>
  );
}
