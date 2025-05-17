'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Flex,
  Spinner,
  Text,
  Badge,
  Button,
  Input,
  Select,
  Stack,
  HStack,
  VStack,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardHeader,
  CardBody,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useToast,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Divider,
  IconButton,
  Alert,
  AlertIcon,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  FormControl,
  FormLabel,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FaShoppingBag,
  FaChevronDown,
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaMotorcycle,
  FaUtensils,
  FaCalendarAlt,
  FaFilter,
  FaBell,
  FaMoneyBillWave,
  FaSortAmountDown,
  FaSortAmountUp,
  FaSort,
  FaHistory,
  FaComment,
  FaPrint,
  FaExternalLinkAlt,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock,
} from 'react-icons/fa';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';
import { useTenant } from '@/hooks/useTenant';
import Link from 'next/link';
import { PedidoStatus } from '@/constants/pedidoStatus';

// Tipos
interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
}

interface EnderecoEntrega {
  id: number;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cep?: string;
  referencia?: string;
}

interface ItemPedido {
  id: number;
  produtoId: number;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  observacoes?: string;
  opcoes?: any;
}
interface Pedido {
  id: number;
  numero: string;
  tipo: 'DELIVERY' | 'PICKUP' | 'BALCAO' | 'MESA';
  status: string;
  dataPedido: string;
  dataAtualizacao?: string;
  cliente: Cliente;
  enderecoEntrega?: EnderecoEntrega;
  itens: ItemPedido[];
  valorItens: number;
  taxaEntrega: number;
  valorTotal: number;
  formaPagamento: string;
  troco?: number;
  observacoes?: string;
  areaEntrega?: {
    nome: string;
  };
  cupons?: {
    cupom?: {
      codigo: string;
    };
    valorDesconto: number;
  }[];
}

export default function DeliveryPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  // Estados dos dados
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historico, setHistorico] = useState<any[]>([]);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false);

  // Estados de filtro e paginação
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('7');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Estados para ordenação
  const [sortField, setSortField] = useState('dataPedido');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Estados para actions
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [notaOperador, setNotaOperador] = useState('');
  const [observacaoStatus, setObervacaoStatus] = useState('');

  // Estados para estatísticas
  const [estatisticas, setEstatisticas] = useState({
    totalPendentes: 0,
    totalConfirmados: 0,
    totalPreparando: 0,
    totalEntrega: 0,
    totalEntregues: 0,
    totalCancelados: 0,
    valorTotalPeriodo: 0,
    valorTotalFinalizados: 0, // Adicionada esta propriedade
    ticketMedio: 0,
  });

  // Disclosures para modais e drawers
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose
  } = useDisclosure();

  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose
  } = useDisclosure();

  // Buscar pedidos de acordo com os filtros
  const fetchPedidos = useCallback(async () => {
    try {
      setIsLoading(true);

      // Construir filtro de data baseado no período
      let dataInicio = '';
      let dataFim = '';

      if (periodoFilter) {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(periodoFilter));
        dataInicio = date.toISOString().split('T')[0];
        dataFim = new Date().toISOString().split('T')[0];
      }

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itensPorPagina.toString(),
        search: searchTerm,
        sort: sortField,
        order: sortOrder,
        status: statusFilter,
        dataInicio,
        dataFim,
      });

      const response = await fetch(`/api/delivery/pedidos?${queryParams}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar pedidos');
      }

      const data = await response.json();

      setPedidos(data.pedidos);
      setTotalPedidos(data.total);
      setTotalPages(data.totalPages);
      setEstatisticas({
        totalPendentes: data.estatisticas?.pendentes || 0,
        totalConfirmados: data.estatisticas?.confirmados || 0,
        totalPreparando: data.estatisticas?.preparando || 0,
        totalEntrega: data.estatisticas?.entrega || 0,
        totalEntregues: data.estatisticas?.entregues || 0,
        totalCancelados: data.estatisticas?.cancelados || 0,
        valorTotalPeriodo: data.estatisticas?.valorTotal || 0,
        valorTotalFinalizados: data.estatisticas?.valorTotalFinalizados || data.estatisticas?.valorEntregues || 0,
        ticketMedio: data.estatisticas?.ticketMedio || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    itensPorPagina,
    searchTerm,
    sortField,
    sortOrder,
    statusFilter,
    periodoFilter,
    toast
  ]);

  // Carregar pedidos quando os filtros mudarem
  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Buscar histórico de um pedido
  const fetchHistoricoPedido = async (pedidoId: number) => {
    if (!pedidoId) return;

    setIsLoadingHistorico(true);
    try {
      const response = await fetch(`/api/delivery/pedidos/${pedidoId}/historico`);

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico do pedido');
      }

      const data = await response.json();
      setHistorico(data.historico);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico do pedido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingHistorico(false);
    }
  };

  // Abrir detalhes do pedido
  const handleOpenDetails = (pedido: Pedido) => {
    setPedidoSelecionado(pedido);
    fetchHistoricoPedido(pedido.id);
    onDrawerOpen();
  };

  // Atualizar status do pedido
  const handleUpdateStatus = async (pedidoId: number, novoStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/delivery/pedidos/${pedidoId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
          observacao: observacaoStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar status');
      }

      toast({
        title: 'Sucesso',
        description: 'Status do pedido atualizado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Atualizar a lista de pedidos
      fetchPedidos();

      // Se o drawer estiver aberto, atualizar o pedido selecionado
      if (isDrawerOpen && pedidoSelecionado?.id === pedidoId) {
        const updatedPedido = { ...pedidoSelecionado, status: novoStatus };
        setPedidoSelecionado(updatedPedido);
        fetchHistoricoPedido(pedidoId);
      }

      // Fechar modal se estiver aberto
      onModalClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar status do pedido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingStatus(false);
      setNotaOperador('');
      setObervacaoStatus('');
    }
  };

  // Enviar notificação para o cliente
  const handleSendNotification = async (pedidoId: number, message: string) => {
    try {
      const response = await fetch(`/api/delivery/pedidos/${pedidoId}/notificacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, tipo: 'INFO' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar notificação');
      }

      toast({
        title: 'Sucesso',
        description: 'Notificação enviada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Atualizar histórico
      if (pedidoSelecionado?.id === pedidoId) {
        fetchHistoricoPedido(pedidoId);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar notificação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Preparar modal de mudança de status
  const prepareStatusChange = (pedido: Pedido, novoStatus: string) => {
    setPedidoSelecionado(pedido);
    setNotaOperador(novoStatus);
    setObervacaoStatus('');
    onModalOpen();
  };

  // Handler de ordenação
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Status do pedido formatado para exibição
  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      [PedidoStatus.PENDING]: { label: 'Pendente', color: 'orange' },
      [PedidoStatus.CONFIRMED]: { label: 'Confirmado', color: 'blue' },
      [PedidoStatus.PREPARING]: { label: 'Em preparo', color: 'purple' },
      [PedidoStatus.DELIVERING]: { label: 'Em entrega', color: 'teal' },
      [PedidoStatus.COMPLETED]: { label: 'Entregue', color: 'green' },
      [PedidoStatus.CANCELLED]: { label: 'Cancelado', color: 'red' },
    };

    return statusMap[status] || { label: status, color: 'gray' };
  };

  // Função para formatar forma de pagamento
  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'money': 'Dinheiro',
      'pix': 'PIX',
    };

    return methodMap[method] || method;
  };

  // Componente de cabeçalho de coluna ordenável
  const SortableHeader = ({ label, field }: { label: string; field: string }) => (
    <Th
      cursor="pointer"
      onClick={() => handleSort(field)}
      userSelect="none"
    >
      <HStack spacing={1}>
        <Text>{label}</Text>
        {sortField === field ? (
          <Icon as={sortOrder === 'asc' ? FaSortAmountUp : FaSortAmountDown} boxSize={3} />
        ) : (
          <Icon as={FaSort} boxSize={3} opacity={0.5} />
        )}
      </HStack>
    </Th>
  );


  console.log("pedidos", pedidos);

  // Componente para ações disponíveis de acordo com o status
  const StatusActions = ({ pedido }: { pedido: Pedido }) => {
    const availableActions = [];

    switch (pedido.status) {
      case PedidoStatus.PENDING:
        availableActions.push(
          <MenuItem
            key="confirm"
            icon={<FaCheckCircle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.CONFIRMED)}
          >
            Confirmar pedido
          </MenuItem>
        );
        availableActions.push(
          <MenuItem
            key="cancel"
            icon={<FaTimesCircle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.CANCELLED)}
            color="red.500"
          >
            Cancelar pedido
          </MenuItem>
        );
        break;

      case PedidoStatus.CONFIRMED:
        availableActions.push(
          <MenuItem
            key="prepare"
            icon={<FaUtensils />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.PREPARING)}
          >
            Iniciar preparo
          </MenuItem>
        );
        availableActions.push(
          <MenuItem
            key="cancel"
            icon={<FaTimesCircle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.CANCELLED)}
            color="red.500"
          >
            Cancelar pedido
          </MenuItem>
        );
        break;


      case PedidoStatus.PREPARING:
        availableActions.push(
          <MenuItem
            key="delivery"
            icon={<FaMotorcycle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.READY)}
          >
            Pronto para Retirada/Entrega
          </MenuItem>
        );
        availableActions.push(
          <MenuItem
            key="delivered"
            icon={<FaCheckCircle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.COMPLETED)}
          >
            Marcar como entregue
          </MenuItem>
        );
        availableActions.push(
          <MenuItem
            key="cancel"
            icon={<FaTimesCircle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.CANCELLED)}
            color="red.500"
          >
            Cancelar pedido
          </MenuItem>
        );
        break;


      case PedidoStatus.READY:
        availableActions.push(
          <MenuItem
            key="delivery"
            icon={<FaMotorcycle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.DELIVERING)}
          >
            Saiu para entrega
          </MenuItem>
        );
        availableActions.push(
          <MenuItem
            key="delivered"
            icon={<FaCheckCircle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.COMPLETED)}
          >
            Marcar como entregue
          </MenuItem>
        );
        availableActions.push(
          <MenuItem
            key="cancel"
            icon={<FaTimesCircle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.CANCELLED)}
            color="red.500"
          >
            Cancelar pedido
          </MenuItem>
        );
        break;

      case PedidoStatus.DELIVERING:
        availableActions.push(
          <MenuItem
            key="delivered"
            icon={<FaCheckCircle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.COMPLETED)}
          >
            Marcar como entregue
          </MenuItem>
        );
        availableActions.push(
          <MenuItem
            key="cancel"
            icon={<FaTimesCircle />}
            onClick={() => prepareStatusChange(pedido, PedidoStatus.CANCELLED)}
            color="red.500"
          >
            Cancelar pedido
          </MenuItem>
        );
        break;

      default:
        break;
    }

    // Adicionar ação de imprimir para todos os pedidos
    availableActions.push(
      <MenuItem
        key="print"
        icon={<FaPrint />}
        onClick={() => window.print()}
      >
        Imprimir pedido
      </MenuItem>
    );

    return (
      <Menu>
        <MenuButton as={Button} rightIcon={<FaChevronDown />} size="sm">
          Ações
        </MenuButton>
        <MenuList>
          <MenuItem
            icon={<FaEye />}
            onClick={() => handleOpenDetails(pedido)}
          >
            Ver detalhes
          </MenuItem>

          {availableActions.length > 0 && <Divider my={2} />}

          {availableActions}
        </MenuList>
      </Menu>
    );
  };

  return (
    <Box p={5}>
      <Heading size="lg" mb={6}>
        {tenant ? `Pedidos Delivery - ${tenant.nome}` : 'Gestão de Pedidos Delivery'}
      </Heading>

      {/* Cards de estatísticas */}
      <StatGroup mb={6} gap={4} flexWrap="wrap">
        <Stat
          bg={sectionBg}
          p={4}
          borderRadius="md"
          flex="1"
          minW={{ base: '100%', md: '180px' }}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box bg="orange.100" p={2} borderRadius="md">
              <Icon as={FaShoppingBag} boxSize={5} color="orange.500" />
            </Box>
            <Box>
              <StatLabel>Pedidos Pendentes</StatLabel>
              <StatNumber>{estatisticas.totalPendentes}</StatNumber>
              <StatHelpText>Aguardando confirmação</StatHelpText>
            </Box>
          </HStack>
        </Stat>

        <Stat
          bg={sectionBg}
          p={4}
          borderRadius="md"
          flex="1"
          minW={{ base: '100%', md: '180px' }}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box bg="blue.100" p={2} borderRadius="md">
              <Icon as={FaCheckCircle} boxSize={5} color="blue.500" />
            </Box>
            <Box>
              <StatLabel>Confirmados</StatLabel>
              <StatNumber>{estatisticas.totalConfirmados}</StatNumber>
              <StatHelpText>Pedidos confirmados</StatHelpText>
            </Box>
          </HStack>
        </Stat>

        <Stat
          bg={sectionBg}
          p={4}
          borderRadius="md"
          flex="1"
          minW={{ base: '100%', md: '180px' }}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box bg="purple.100" p={2} borderRadius="md">
              <Icon as={FaUtensils} boxSize={5} color="purple.500" />
            </Box>
            <Box>
              <StatLabel>Em Preparo</StatLabel>
              <StatNumber>{estatisticas.totalPreparando}</StatNumber>
              <StatHelpText>Na cozinha</StatHelpText>
            </Box>
          </HStack>
        </Stat>

        <Stat
          bg={sectionBg}
          p={4}
          borderRadius="md"
          flex="1"
          minW={{ base: '100%', md: '180px' }}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box bg="teal.100" p={2} borderRadius="md">
              <Icon as={FaMotorcycle} boxSize={5} color="teal.500" />
            </Box>
            <Box>
              <StatLabel>Em Entrega</StatLabel>
              <StatNumber>{estatisticas.totalEntrega}</StatNumber>
              <StatHelpText>A caminho do cliente</StatHelpText>
            </Box>
          </HStack>
        </Stat>

        <Stat
          bg={sectionBg}
          p={4}
          borderRadius="md"
          flex="1"
          minW={{ base: '100%', md: '180px' }}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box bg="green.100" p={2} borderRadius="md">
              <Icon as={FaMoneyBillWave} boxSize={5} color="green.500" />
            </Box>
            <Box>
              <StatLabel>Valor Total</StatLabel>
              <StatNumber>{formatCurrency(estatisticas.valorTotalPeriodo)}</StatNumber>
              <Tooltip label="Valor total de pedidos finalizados, excluindo cancelados">
                <StatHelpText display="flex" alignItems="center">
                  <Text>Pedidos finalizados: {formatCurrency(estatisticas.valorTotalFinalizados || 0)}</Text>
                </StatHelpText>
              </Tooltip>
            </Box>
          </HStack>
        </Stat>
      </StatGroup>

      {/* Filtros */}
      <Card bg={bgCard} mb={6} boxShadow="md">
        <CardHeader>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            {/* Barra de busca */}
            <GridItem colSpan={{ base: 12, md: 4 }}>
              <HStack>
                <Box position="relative" flex="1">
                  <Input
                    placeholder="Buscar pedido, cliente ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    pr="40px"
                  />
                  <Box position="absolute" right="10px" top="50%" transform="translateY(-50%)">
                    <FaSearch color="gray" />
                  </Box>
                </Box>
              </HStack>
            </GridItem>

            {/* Filtros */}
            <GridItem colSpan={{ base: 12, md: 8 }}>
              <HStack spacing={3} justifyContent={{ base: 'flex-start', md: 'flex-end' }} flexWrap="wrap" gap={2}>
                {/* Filtro de período */}
                <Select
                  width="auto"
                  minW="140px"
                  value={periodoFilter}
                  onChange={(e) => setPeriodoFilter(e.target.value)}
                  icon={<FaCalendarAlt />}
                >
                  <option value="1">Hoje</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </Select>

                {/* Filtro de status */}
                <Select
                  width="auto"
                  minW="150px"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  icon={<FaFilter />}
                >
                  <option value="">Todos os status</option>
                  <option value="pending">Pendentes</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="preparing">Em Preparo</option>
                  <option value="delivery">Em Entrega</option>
                  <option value="delivered">Entregues</option>
                  <option value="cancelled">Cancelados</option>
                </Select>

                {/* Pedidos por página */}
                <Select
                  width="auto"
                  minW="100px"
                  value={itensPorPagina}
                  onChange={(e) => setItensPorPagina(Number(e.target.value))}
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                </Select>
              </HStack>
            </GridItem>
          </Grid>
        </CardHeader>

        <CardBody>
          {isLoading ? (
            <Flex justify="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : pedidos.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <Stack>
                <Text>
                  Nenhum pedido encontrado com os filtros selecionados.
                </Text>
              </Stack>
            </Alert>
          ) : (
            <>
              <Tabs variant="enclosed" colorScheme="teal">
                <TabList>
                  <Tab>Todos os Pedidos</Tab>
                  <Tab isDisabled={statusFilter === ""}>Por Status</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel p={0} pt={4}>
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <SortableHeader label="Número" field="numero" />
                            <Th>Cliente</Th>
                            <SortableHeader label="Data" field="dataPedido" />
                            <Th>Status</Th>
                            <SortableHeader label="Total" field="valorTotal" />
                            <Th>Pagamento</Th>
                            <Th textAlign="center">Ações</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {pedidos.map((pedido) => (
                            <Tr key={pedido.id}>
                              <Td fontFamily="mono" fontWeight="semibold">{pedido.numero}</Td>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text noOfLines={1}>{pedido.cliente.nome}</Text>
                                  <Text fontSize="xs" color="gray.500">{pedido.cliente.telefone}</Text>
                                </VStack>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text>{formatDate(pedido.dataPedido)}</Text>
                                  <Text fontSize="xs" color="gray.500">{formatTime(pedido.dataPedido)}</Text>
                                </VStack>
                              </Td>
                              <Td>
                                <HStack>
                                  <Badge colorScheme={formatStatus(pedido.status).color}>
                                    {formatStatus(pedido.status).label}
                                  </Badge>
                                  {pedido.tipo !== 'DELIVERY' && (
                                    <Badge colorScheme="green" ml={1}>Retirada</Badge>
                                  )}
                                </HStack>
                              </Td>
                              <Td fontWeight="medium">
                                {formatCurrency(pedido.valorTotal)}
                                {pedido.cupons && pedido.cupons.length > 0 && (
                                  <Badge ml={2} colorScheme="green" fontSize="xs">
                                    Cupom
                                  </Badge>
                                )}
                              </Td>
                              <Td>
                                <Text noOfLines={1}>{formatPaymentMethod(pedido.formaPagamento)}</Text>
                                {pedido.troco && (
                                  <Text fontSize="xs" color="gray.500">
                                    Troco para: {formatCurrency(pedido.troco)}
                                  </Text>
                                )}
                              </Td>
                              <Td>
                                <StatusActions pedido={pedido} />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </TabPanel>

                  <TabPanel>
                    {statusFilter === "" ? (
                      <Box textAlign="center" py={8}>
                        <Icon as={FaFilter} boxSize={8} color="gray.400" mb={4} />
                        <Text fontSize="lg" fontWeight="medium">
                          Selecione um status específico no filtro acima para visualizar os pedidos agrupados
                        </Text>
                      </Box>
                    ) : (
                      <Box>
                        <Heading size="md" mb={4}>
                          Pedidos com status: <Badge colorScheme={formatStatus(statusFilter).color} fontSize="0.8em">{formatStatus(statusFilter).label}</Badge>
                        </Heading>
                        
                        {/* Cards dos pedidos agrupados por status */}
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                          {pedidos.map((pedido) => (
                            <Card key={pedido.id} boxShadow="md" borderWidth="1px" borderColor={borderColor}>
                              <CardHeader pb={2}>
                                <Flex justify="space-between" align="center">
                                  <HStack>
                                    <Icon as={FaShoppingBag} color="teal.500" />
                                    <Text fontWeight="bold" fontFamily="mono">#{pedido.numero}</Text>
                                  </HStack>
                                  <Badge colorScheme={formatStatus(pedido.status).color}>
                                    {formatStatus(pedido.status).label}
                                  </Badge>
                                </Flex>
                              </CardHeader>
                              
                              <CardBody pt={0}>
                                <VStack align="stretch" spacing={3}>
                                  <HStack>
                                    <Icon as={FaClock} color="gray.500" />
                                    <Text fontSize="sm">{formatDate(pedido.dataPedido)} às {formatTime(pedido.dataPedido)}</Text>
                                  </HStack>
                                  
                                  <HStack>
                                    <Icon as={FaMapMarkerAlt} color="gray.500" />
                                    <Box>
                                      <Text fontWeight="medium" noOfLines={1}>{pedido.cliente.nome}</Text>
                                      {pedido.enderecoEntrega && (
                                        <Text fontSize="sm" noOfLines={1} color="gray.600">
                                          {pedido.enderecoEntrega.bairro}, {pedido.enderecoEntrega.cidade || ''}
                                        </Text>
                                      )}
                                    </Box>
                                  </HStack>
                                  
                                  <Divider />
                                  
                                  <HStack justify="space-between">
                                    <Text fontWeight="medium">
                                      {pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}
                                    </Text>
                                    <Text fontWeight="bold">{formatCurrency(pedido.valorTotal)}</Text>
                                  </HStack>
                                  
                                  <Divider />
                                  
                                  <HStack justify="space-between">
                                    <Badge colorScheme={pedido.tipo === 'DELIVERY' ? 'teal' : 'purple'}>
                                      {pedido.tipo === 'DELIVERY' ? 'Entrega' : 'Retirada'}
                                    </Badge>
                                    <Text fontSize="sm">{formatPaymentMethod(pedido.formaPagamento)}</Text>
                                  </HStack>
                                  
                                  <Button 
                                    colorScheme="teal"
                                    size="sm"
                                    leftIcon={<FaEye />}
                                    onClick={() => handleOpenDetails(pedido)}
                                  >
                                    Ver detalhes
                                  </Button>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </SimpleGrid>
                        
                        {pedidos.length === 0 && (
                          <Box textAlign="center" py={8}>
                            <Icon as={FaShoppingBag} boxSize={8} color="gray.400" mb={4} />
                            <Text fontSize="lg">
                              Nenhum pedido com o status selecionado
                            </Text>
                          </Box>
                        )}
                      </Box>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>

              {/* Paginação */}
              <Flex justify="center" mt={4}>
                <HStack>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    isDisabled={currentPage === 1}
                  >
                    Anterior
                  </Button>

                  <Text>
                    Página {currentPage} de {totalPages || 1}
                  </Text>

                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(prev =>
                      Math.min(prev + 1, totalPages)
                    )}
                    isDisabled={currentPage >= totalPages}
                  >
                    Próxima
                  </Button>
                </HStack>
              </Flex>
            </>
          )}
        </CardBody>
      </Card>

      {/* Drawer de detalhes do pedido */}
      <Drawer
        isOpen={isDrawerOpen}
        placement="right"
        onClose={onDrawerClose}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {pedidoSelecionado && (
              <HStack>
                <FaShoppingBag />
                <Text>Detalhes do Pedido #{pedidoSelecionado.numero}</Text>
                <Badge colorScheme={formatStatus(pedidoSelecionado.status).color} ml={2}>
                  {formatStatus(pedidoSelecionado.status).label}
                </Badge>
              </HStack>
            )}
          </DrawerHeader>

          <DrawerBody>
            {pedidoSelecionado ? (
              <VStack spacing={6} align="stretch">
                {/* Informações do pedido */}
                <Box>
                  <Heading size="sm" mb={3}>Informações do Pedido</Heading>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box>
                      <Text fontWeight="bold">Data do Pedido:</Text>
                      <Text>{formatDate(pedidoSelecionado.dataPedido)} às {formatTime(pedidoSelecionado.dataPedido)}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Status:</Text>
                      <Badge colorScheme={formatStatus(pedidoSelecionado.status).color}>
                        {formatStatus(pedidoSelecionado.status).label}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Pagamento:</Text>
                      <Text>{formatPaymentMethod(pedidoSelecionado.formaPagamento)}</Text>
                      {pedidoSelecionado.troco && (
                        <Text fontSize="sm" color="gray.600">
                          Troco para: {formatCurrency(pedidoSelecionado.troco)}
                        </Text>
                      )}
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Área de Entrega:</Text>
                      <Text>{pedidoSelecionado.areaEntrega?.nome || 'Não especificada'}</Text>
                    </Box>
                  </Grid>
                </Box>

                <Divider />

                {/* Informações do cliente */}
                <Box>
                  <Flex justify="space-between" align="center" mb={3}>
                    <Heading size="sm">Informações do Cliente</Heading>
                    <HStack>
                      <Tooltip label="Ligar para o cliente">
                        <IconButton
                          aria-label="Ligar para o cliente"
                          icon={<FaPhoneAlt />}
                          size="sm"
                          colorScheme="green"
                          as="a"
                          href={`tel:${pedidoSelecionado.cliente.telefone}`}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>

                  <VStack align="start" spacing={2}>
                    <Text><strong>Nome:</strong> {pedidoSelecionado.cliente.nome}</Text>
                    <Text><strong>Telefone:</strong> {pedidoSelecionado.cliente.telefone}</Text>
                  </VStack>
                </Box>

                {pedidoSelecionado.enderecoEntrega && (
                  <>
                    <Divider />

                    {/* Endereço de entrega */}
                    <Box>
                      <Flex justify="space-between" align="center" mb={3}>
                        <Heading size="sm">Endereço de Entrega</Heading>
                        <Tooltip label="Abrir no mapa">
                          <IconButton
                            aria-label="Abrir no mapa"
                            icon={<FaMapMarkerAlt />}
                            size="sm"
                            colorScheme="blue"
                            as="a"
                            href={`https://maps.google.com/maps?q=${encodeURIComponent(
                              `${pedidoSelecionado.enderecoEntrega.rua}, ${pedidoSelecionado.enderecoEntrega.numero}, ${pedidoSelecionado.enderecoEntrega.bairro}, ${pedidoSelecionado.enderecoEntrega.cidade}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        </Tooltip>
                      </Flex>

                      <VStack align="start" spacing={2}>
                        <Text>
                          <strong>Endereço:</strong> {pedidoSelecionado.enderecoEntrega.rua}, {pedidoSelecionado.enderecoEntrega.numero}
                          {pedidoSelecionado.enderecoEntrega.complemento ? ` - ${pedidoSelecionado.enderecoEntrega.complemento}` : ''}
                        </Text>
                        <Text><strong>Bairro:</strong> {pedidoSelecionado.enderecoEntrega.bairro}</Text>
                        {pedidoSelecionado.enderecoEntrega.cidade && (
                          <Text><strong>Cidade:</strong> {pedidoSelecionado.enderecoEntrega.cidade}</Text>
                        )}
                        {pedidoSelecionado.enderecoEntrega.referencia && (
                          <Text><strong>Referência:</strong> {pedidoSelecionado.enderecoEntrega.referencia}</Text>
                        )}
                      </VStack>
                    </Box>
                  </>
                )}

                <Divider />

                {/* Itens do pedido */}
                <Box>
                  <Heading size="sm" mb={3}>Itens do Pedido</Heading>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th isNumeric>Qtd</Th>
                        <Th isNumeric>Preço</Th>
                        <Th isNumeric>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pedidoSelecionado.itens.map((item) => (
                        <Tr key={item.id}>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="semibold">{item.nome}</Text>
                              {item.observacoes && (
                                <Text fontSize="xs" color="gray.600" fontStyle="italic">
                                  {item.observacoes}
                                </Text>
                              )}
                              {item.opcoes && Object.keys(item.opcoes).length > 0 && (
                                <Box mt={1}>
                                  {/* Sabores */}
                                  {item.opcoes.sabores && item.opcoes.sabores.length > 0 && (
                                    <HStack flexWrap="wrap">
                                      {item.opcoes.sabores.map((sabor: any, i: number) => (
                                        <Badge key={i} colorScheme="purple" size="sm" mr={1} mb={1}>
                                          {sabor.nome}
                                        </Badge>
                                      ))}
                                    </HStack>
                                  )}

                                  {/* Complementos */}
                                  {item.opcoes.complementos && Object.keys(item.opcoes.complementos).length > 0 && (
                                    <VStack align="start" spacing={1} mt={1}>
                                      {Object.entries(item.opcoes.complementos).map(([grupoId, opcoes]: [string, any]) => (
                                        <Box key={grupoId}>
                                          {Array.isArray(opcoes) ? (
                                            opcoes.map((opcaoId: any, i: number) => (
                                              <Badge key={i} colorScheme="blue" size="sm" mr={1} mb={1}>
                                                Complemento {opcaoId}
                                              </Badge>
                                            ))
                                          ) : (
                                            <Badge colorScheme="blue" size="sm">
                                              Complemento {opcoes}
                                            </Badge>
                                          )}
                                        </Box>
                                      ))}
                                    </VStack>
                                  )}
                                </Box>
                              )}
                            </VStack>
                          </Td>
                          <Td isNumeric>{item.quantidade}</Td>
                          <Td isNumeric>{formatCurrency(item.valorUnitario)}</Td>
                          <Td isNumeric>{formatCurrency(item.valorTotal)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  {/* Sumário do pedido */}
                  <Box mt={4} p={3} bg="gray.50" borderRadius="md">
                    <HStack justify="space-between" mb={2}>
                      <Text>Subtotal:</Text>
                      <Text>{formatCurrency(pedidoSelecionado.valorItens)}</Text>
                    </HStack>
                    <HStack justify="space-between" mb={2}>
                      <Text>Taxa de entrega:</Text>
                      <Text>{formatCurrency(pedidoSelecionado.taxaEntrega)}</Text>
                    </HStack>

                    {/* Exibir descontos de cupom quando existirem */}
                    {pedidoSelecionado.cupons && pedidoSelecionado.cupons.length > 0 && pedidoSelecionado.cupons.map((cupomItem: any, index: number) => (
                      <HStack key={index} justify="space-between" mb={2}>
                        <HStack>
                          <Text>Desconto:</Text>
                          <Badge colorScheme="green" variant="solid">
                            {cupomItem.cupom?.codigo || 'Cupom aplicado'}
                          </Badge>
                        </HStack>
                        <Text color="green.500">-{formatCurrency(cupomItem.valorDesconto)}</Text>
                      </HStack>
                    ))}

                    <HStack justify="space-between" fontWeight="bold">
                      <Text>Total:</Text>
                      <Text>{formatCurrency(pedidoSelecionado.valorTotal)}</Text>
                    </HStack>
                  </Box>
                </Box>

                {pedidoSelecionado.observacoes && (
                  <>
                    <Divider />

                    {/* Observações */}
                    <Box>
                      <Heading size="sm" mb={3}>Observações</Heading>
                      <Text p={3} bg="gray.50" borderRadius="md">
                        {pedidoSelecionado.observacoes}
                      </Text>
                    </Box>
                  </>
                )}

                <Divider />

                {/* Histórico */}
                <Box>
                  <Heading size="sm" mb={3}>Histórico do Pedido</Heading>

                  {isLoadingHistorico ? (
                    <Spinner size="sm" />
                  ) : historico.length === 0 ? (
                    <Text color="gray.500">Nenhum histórico disponível</Text>
                  ) : (
                    <VStack align="stretch" spacing={3}>
                      {historico.map((item, index) => (
                        <Box
                          key={index}
                          p={3}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor={borderColor}
                        >
                          <Flex justify="space-between" mb={1}>
                            <HStack>
                              <Badge
                                colorScheme={formatStatus(item.status || item.statusNovo).color}
                              >
                                {formatStatus(item.status || item.statusNovo).label}
                              </Badge>
                              {item.tipo && (
                                <Badge colorScheme="blue">
                                  {item.tipo}
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.500">
                              {formatDate(item.data)} {formatTime(item.data)}
                            </Text>
                          </Flex>
                          <Text>{item.mensagem || item.observacao}</Text>
                          {item.usuario && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Por: {item.usuario.name}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              </VStack>
            ) : (
              <Flex justify="center" align="center" h="100%">
                <Spinner />
              </Flex>
            )}
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onDrawerClose}>
              Fechar
            </Button>

            {pedidoSelecionado && (pedidoSelecionado.status === PedidoStatus.PENDING ||
              pedidoSelecionado.status === PedidoStatus.CONFIRMED ||
              pedidoSelecionado.status === PedidoStatus.PREPARING ||
              pedidoSelecionado.status === PedidoStatus.DELIVERING) && (
                <Menu>
                  <MenuButton as={Button} rightIcon={<FaChevronDown />} colorScheme="teal">
                    Atualizar Status
                  </MenuButton>
                  <MenuList>
                    {pedidoSelecionado.status === PedidoStatus.PENDING && (
                      <>
                        <MenuItem
                          icon={<FaCheckCircle />}
                          onClick={() => prepareStatusChange(pedidoSelecionado, PedidoStatus.CONFIRMED)}
                        >
                          Confirmar pedido
                        </MenuItem>
                        <MenuItem
                          icon={<FaTimesCircle />}
                          onClick={() => prepareStatusChange(pedidoSelecionado, PedidoStatus.CANCELLED)}
                          color="red.500"
                        >
                          Cancelar pedido
                        </MenuItem>
                      </>
                    )}

                    {pedidoSelecionado.status === PedidoStatus.CONFIRMED && (
                      <>
                        <MenuItem
                          icon={<FaUtensils />}
                          onClick={() => prepareStatusChange(pedidoSelecionado, PedidoStatus.PREPARING)}
                        >
                          Iniciar preparo
                        </MenuItem>
                        <MenuItem
                          icon={<FaTimesCircle />}
                          onClick={() => prepareStatusChange(pedidoSelecionado, PedidoStatus.CANCELLED)}
                          color="red.500"
                        >
                          Cancelar pedido
                        </MenuItem>
                      </>
                    )}

                    {pedidoSelecionado.status === PedidoStatus.PREPARING && (
                      <>
                        <MenuItem
                          icon={<FaMotorcycle />}
                          onClick={() => prepareStatusChange(pedidoSelecionado, PedidoStatus.DELIVERING)}
                        >
                          Saiu para entrega
                        </MenuItem>
                        <MenuItem
                          icon={<FaCheckCircle />}
                          onClick={() => prepareStatusChange(pedidoSelecionado, PedidoStatus.COMPLETED)}
                        >
                          Marcar como entregue
                        </MenuItem>
                        <MenuItem
                          icon={<FaTimesCircle />}
                          onClick={() => prepareStatusChange(pedidoSelecionado, PedidoStatus.CANCELLED)}
                          color="red.500"
                        >
                          Cancelar pedido
                        </MenuItem>
                      </>
                    )}

                    {pedidoSelecionado.status === PedidoStatus.DELIVERING && (
                      <>
                        <MenuItem
                          icon={<FaCheckCircle />}
                          onClick={() => prepareStatusChange(pedidoSelecionado, PedidoStatus.COMPLETED)}
                        >
                          Marcar como entregue
                        </MenuItem>
                        <MenuItem
                          icon={<FaTimesCircle />}
                          onClick={() => prepareStatusChange(pedidoSelecionado, PedidoStatus.CANCELLED)}
                          color="red.500"
                        >
                          Cancelar pedido
                        </MenuItem>
                      </>
                    )}
                  </MenuList>
                </Menu>
              )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Modal de confirmação de mudança de status */}
      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {pedidoSelecionado && (
              <Text>
                Atualizar Status do Pedido #{pedidoSelecionado.numero}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert
                status={notaOperador === PedidoStatus.CANCELLED ? 'error' : 'info'}
                variant="subtle"
                borderRadius="md"
              >
                <AlertIcon />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold">
                    {pedidoSelecionado && (
                      <>
                        Você está alterando o status de <Badge colorScheme={formatStatus(pedidoSelecionado.status).color}>{formatStatus(pedidoSelecionado.status).label}</Badge> para{' '}
                        {notaOperador === PedidoStatus.CANCELLED ? (
                          <Badge colorScheme="red">Cancelado</Badge>
                        ) : (
                          <Badge colorScheme={formatStatus(notaOperador).color}>{formatStatus(notaOperador).label}</Badge>
                        )}
                      </>
                    )}
                  </Text>
                  <Text fontSize="sm">
                    {notaOperador === PedidoStatus.CANCELLED
                      ? 'O cliente será notificado sobre o cancelamento do pedido.'
                      : 'O cliente será notificado sobre a mudança de status do pedido.'}
                  </Text>
                </VStack>
              </Alert>

              <FormControl>
                <FormLabel>Observação (opcional)</FormLabel>
                <Textarea
                  placeholder={notaOperador === PedidoStatus.CANCELLED 
                    ? 'Informe o motivo do cancelamento...' 
                    : 'Adicione uma observação para o cliente...'}
                  value={observacaoStatus}
                  onChange={(e) => setObervacaoStatus(e.target.value)}
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              mr={3}
              onClick={onModalClose}
            >
              Cancelar
            </Button>
            <Button
              colorScheme={notaOperador === PedidoStatus.CANCELLED ? 'red' : 'teal'}
              onClick={() => pedidoSelecionado && handleUpdateStatus(pedidoSelecionado.id, notaOperador)}
              isLoading={isUpdatingStatus}
            >
              Confirmar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
