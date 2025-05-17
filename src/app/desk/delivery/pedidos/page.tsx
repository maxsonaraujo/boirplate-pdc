'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Text,
  Flex,
  Spinner,
  SimpleGrid,
  Select,
  Input,
  FormControl,
  FormLabel,
  IconButton,
  useToast,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
} from '@chakra-ui/react';
import { FaFilter, FaSearch, FaEllipsisV, FaEye, FaEdit, FaPrint, FaTruck, FaCheck, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { PedidoStatus } from '@/constants/pedidoStatus';
import { PedidoStatusBadge } from '@/components/delivery/PedidoStatusBadge';

// Componente para exibir estatísticas em cards
const StatCard = ({ label, value, helpText, color }: { label: string; value: string | number; helpText?: string; color?: string }) => {
  return (
    <Card>
      <CardBody>
        <Stat>
          <StatLabel>{label}</StatLabel>
          <StatNumber color={color}>{value}</StatNumber>
          {helpText && <StatHelpText>{helpText}</StatHelpText>}
        </Stat>
      </CardBody>
    </Card>
  );
};

export default function PedidosDeliveryPage() {
  const router = useRouter();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  
  // Estados
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    pendentes: 0,
    confirmados: 0,
    preparando: 0,
    entrega: 0,
    entregues: 0,
    cancelados: 0,
    valorTotal: 0,
    ticketMedio: 0
  });
  
  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    dataInicio: '',
    dataFim: '',
    search: ''
  });
  
  // Carregar pedidos
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setIsLoading(true);
        
        // Construir query params para filtros
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10'
        });
        
        if (filters.status) params.append('status', filters.status);
        if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
        if (filters.dataFim) params.append('dataFim', filters.dataFim);
        if (filters.search) params.append('search', filters.search);
        
        const response = await fetch(`/api/delivery/pedidos?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar pedidos');
        }
        
        const data = await response.json();
        setPedidos(data.pedidos);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        
        // Estatísticas
        setStats({
          pendentes: data.estatisticas.pendentes,
          confirmados: data.estatisticas.confirmados,
          preparando: data.estatisticas.preparando,
          entrega: data.estatisticas.entrega,
          entregues: data.estatisticas.entregues,
          cancelados: data.estatisticas.cancelados,
          valorTotal: data.estatisticas.valorTotal,
          ticketMedio: data.estatisticas.ticketMedio
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
    };
    
    fetchPedidos();
  }, [currentPage, filters, toast]);
  
  // Handlers para filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset da paginação ao filtrar
  };
  
  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({
      status: '',
      dataInicio: '',
      dataFim: '',
      search: ''
    });
    setCurrentPage(1);
  };
  
  // Atualizar status do pedido
  const handleUpdateStatus = async (pedidoId: number, novoStatus: PedidoStatus) => {
    try {
      const response = await fetch(`/api/delivery/orders/${pedidoId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: novoStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar status do pedido');
      }
      
      // Atualizar lista de pedidos
      setPedidos(prev => prev.map(p => {
        if (p.id === pedidoId) {
          return { ...p, status: novoStatus };
        }
        return p;
      }));
      
      toast({
        title: 'Status atualizado',
        description: `Pedido atualizado para ${novoStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do pedido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Renderizar ações baseadas no status atual
  const renderActions = (pedido: any) => {
    const status = pedido.status;
    
    return (
      <Menu>
        <MenuButton as={IconButton} icon={<FaEllipsisV />} variant="ghost" />
        <MenuList>
          <MenuItem icon={<FaEye />} onClick={() => router.push(`/desk/delivery/pedidos/${pedido.id}`)}>
            Ver detalhes
          </MenuItem>
          <MenuItem icon={<FaPrint />}>Imprimir</MenuItem>
          
          {status === PedidoStatus.PENDING && (
            <MenuItem 
              icon={<FaCheck />} 
              onClick={() => handleUpdateStatus(pedido.id, PedidoStatus.CONFIRMED)}
            >
              Confirmar pedido
            </MenuItem>
          )}
          
          {status === PedidoStatus.CONFIRMED && (
            <MenuItem 
              icon={<FaEdit />} 
              onClick={() => handleUpdateStatus(pedido.id, PedidoStatus.PREPARING)}
            >
              Iniciar preparo
            </MenuItem>
          )}
          
          {status === PedidoStatus.PREPARING && (
            <MenuItem 
              icon={<FaCheck />} 
              onClick={() => handleUpdateStatus(pedido.id, PedidoStatus.READY)}
            >
              Marcar como pronto
            </MenuItem>
          )}
          
          {status === PedidoStatus.READY && (
            <MenuItem 
              icon={<FaTruck />} 
              onClick={() => handleUpdateStatus(pedido.id, PedidoStatus.DELIVERING)}
            >
              Iniciar entrega
            </MenuItem>
          )}
          
          {status === PedidoStatus.DELIVERING && (
            <MenuItem 
              icon={<FaCheck />} 
              onClick={() => handleUpdateStatus(pedido.id, PedidoStatus.COMPLETED)}
            >
              Confirmar entrega
            </MenuItem>
          )}
          
          {(status === PedidoStatus.PENDING || status === PedidoStatus.CONFIRMED) && (
            <MenuItem 
              icon={<FaTimes />} 
              onClick={() => handleUpdateStatus(pedido.id, PedidoStatus.CANCELLED)}
              color="red.500"
            >
              Cancelar pedido
            </MenuItem>
          )}
        </MenuList>
      </Menu>
    );
  };
  
  return (
    <Box p={5}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Pedidos de Delivery</Heading>
      </HStack>
      
      {/* Estatísticas */}
      <SimpleGrid columns={{ base: 1, md: 3, lg: 6 }} spacing={4} mb={6}>
        <StatCard
          label="Pendentes"
          value={stats.pendentes}
          color="blue.500"
        />
        <StatCard
          label="Confirmados"
          value={stats.confirmados}
          color="teal.500"
        />
        <StatCard
          label="Em preparo"
          value={stats.preparando}
          color="orange.500"
        />
        <StatCard
          label="Em entrega"
          value={stats.entrega}
          color="purple.500"
        />
        <StatCard
          label="Entregues"
          value={stats.entregues}
          color="green.500"
        />
        <StatCard
          label="Cancelados"
          value={stats.cancelados}
          color="red.500"
        />
      </SimpleGrid>
      
      {/* Filtros */}
      <Card bg={bgCard} mb={6}>
        <CardHeader>
          <HStack>
            <FaFilter />
            <Text fontWeight="bold">Filtros</Text>
          </HStack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                placeholder="Todos"
              >
                {Object.values(PedidoStatus).map(status => (
                  <option key={status} value={status}>
                    {status === PedidoStatus.PENDING ? 'Pendentes' :
                     status === PedidoStatus.CONFIRMED ? 'Confirmados' :
                     status === PedidoStatus.PREPARING ? 'Em preparo' :
                     status === PedidoStatus.READY ? 'Prontos' :
                     status === PedidoStatus.DELIVERING ? 'Em entrega' :
                     status === PedidoStatus.COMPLETED ? 'Entregues' :
                     'Cancelados'}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Data inicial</FormLabel>
              <Input
                type="date"
                name="dataInicio"
                value={filters.dataInicio}
                onChange={handleFilterChange}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Data final</FormLabel>
              <Input
                type="date"
                name="dataFim"
                value={filters.dataFim}
                onChange={handleFilterChange}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Buscar</FormLabel>
              <Input
                name="search"
                placeholder="Número, cliente ou telefone"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </FormControl>
          </SimpleGrid>
          
          <HStack justify="flex-end" mt={4}>
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
            >
              Limpar filtros
            </Button>
            <Button 
              colorScheme="teal" 
              leftIcon={<FaSearch />}
            >
              Buscar
            </Button>
          </HStack>
        </CardBody>
      </Card>
      
      {/* Lista de pedidos */}
      <Card bg={bgCard}>
        <CardBody>
          {isLoading ? (
            <Flex justify="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : pedidos.length === 0 ? (
            <Text textAlign="center" color="gray.500" p={4}>
              Nenhum pedido encontrado com os filtros atuais.
            </Text>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Número</Th>
                    <Th>Data</Th>
                    <Th>Cliente</Th>
                    <Th>Telefone</Th>
                    <Th>Valor</Th>
                    <Th>Status</Th>
                    <Th>Tipo</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {pedidos.map((pedido) => (
                    <Tr key={pedido.id}>
                      <Td fontWeight="bold">{pedido.numero}</Td>
                      <Td>{new Date(pedido.dataPedido).toLocaleString('pt-BR')}</Td>
                      <Td>{pedido.cliente.nome}</Td>
                      <Td>{pedido.cliente.telefone}</Td>
                      <Td>
                        {formatCurrency(pedido.valorTotal)}
                        {pedido.cupons && pedido.cupons.length > 0 && (
                          <Badge ml={2} colorScheme="green" fontSize="xs">
                            Cupom
                          </Badge>
                        )}
                      </Td>
                      <Td>
                        <PedidoStatusBadge status={pedido.status} />
                      </Td>
                      <Td>
                        <Badge colorScheme={pedido.tipo === 'DELIVERY' ? 'blue' : 'green'}>
                          {pedido.tipo === 'DELIVERY' ? 'Entrega' : 'Retirada'}
                        </Badge>
                      </Td>
                      <Td>
                        {renderActions(pedido)}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
          
          {/* Paginação */}
          {totalPages > 1 && (
            <HStack justify="center" mt={6} spacing={2}>
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Anterior
              </Button>
              
              {/* Exibir números de página */}
              {[...Array(totalPages)].map((_, index) => (
                <Button
                  key={index}
                  variant={currentPage === index + 1 ? 'solid' : 'outline'}
                  colorScheme={currentPage === index + 1 ? 'teal' : undefined}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </Button>
              ))}
              
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Próxima
              </Button>
            </HStack>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}
