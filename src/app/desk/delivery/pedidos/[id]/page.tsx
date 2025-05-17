'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
  VStack,
  Select,
  Textarea,
  useColorModeValue,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaPrint, 
  FaCheck, 
  FaTimes, 
  FaMotorcycle,
  FaUser, 
  FaMapMarkerAlt, 
  FaShoppingBag, 
  FaCreditCard,
  FaEllipsisV,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { PedidoStatus, statusConfig } from '@/constants/pedidoStatus';
import { PedidoStatusBadge } from '@/components/delivery/PedidoStatusBadge';
import { PedidoStatusStepper } from '@/components/delivery/PedidoStatusStepper';

export default function PedidoDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const pedidoId = parseInt(params.id);
  console.log('Pedido ID:', pedidoId);
  
  const bgCard = useColorModeValue('white', 'gray.800');
  
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [novoStatus, setNovoStatus] = useState<string>('');
  const [observacaoStatus, setObservacaoStatus] = useState('');
  
  // Buscar detalhes do pedido
  useEffect(() => {
    const fetchPedidoDetails = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/delivery/pedidos/${pedidoId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar detalhes do pedido');
        }
        
        const data = await response.json();
        setPedido(data.pedido);
        
        // Definir status inicial
        setNovoStatus(data.pedido.status);
      } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os detalhes do pedido',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (!isNaN(pedidoId)) {
      fetchPedidoDetails();
    }
  }, [pedidoId, toast]);
  
  // Atualizar status do pedido
  const handleUpdateStatus = async () => {
    if (!novoStatus || novoStatus === pedido.status) {
      toast({
        title: 'Atenção',
        description: 'Selecione um status diferente do atual para atualizar',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setUpdateLoading(true);
      
      const response = await fetch(`/api/delivery/orders/${pedidoId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
          observacao: observacaoStatus || `Status atualizado para ${novoStatus}`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar status do pedido');
      }
      
      const data = await response.json();
      setPedido(data.pedido);
      
      toast({
        title: 'Status atualizado',
        description: `O pedido foi atualizado para ${statusConfig[novoStatus as PedidoStatus]?.label || novoStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Limpar campos após atualização
      setObservacaoStatus('');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do pedido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Formatar valor em moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  if (loading) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  if (!pedido) {
    return (
      <Box p={5}>
        <Button
          leftIcon={<FaArrowLeft />}
          onClick={() => router.back()}
          mb={6}
        >
          Voltar
        </Button>
        
        <Card>
          <CardBody>
            <Text textAlign="center" py={10}>
              Pedido não encontrado ou você não tem permissão para acessá-lo.
            </Text>
          </CardBody>
        </Card>
      </Box>
    );
  }
  
  return (
    <Box p={5}>
      <HStack justify="space-between" mb={6}>
        <Button
          leftIcon={<FaArrowLeft />}
          onClick={() => router.push('/desk/delivery/pedidos')}
        >
          Voltar
        </Button>
        
        <HStack>
          <Button
            leftIcon={<FaPrint />}
            colorScheme="blue"
          >
            Imprimir
          </Button>
          
          <Menu>
            <MenuButton as={Button} rightIcon={<FaEllipsisV />}>
              Ações
            </MenuButton>
            <MenuList>
              <MenuItem 
                icon={<FaCheck />}
                isDisabled={pedido.status === PedidoStatus.COMPLETED}
                onClick={() => {
                  setNovoStatus(PedidoStatus.COMPLETED);
                  setObservacaoStatus('Pedido entregue com sucesso');
                  handleUpdateStatus();
                }}
              >
                Marcar como entregue
              </MenuItem>
              
              <MenuItem 
                icon={<FaTimes />}
                isDisabled={[PedidoStatus.COMPLETED, PedidoStatus.CANCELLED].includes(pedido.status as PedidoStatus)}
                color="red.500"
                onClick={() => {
                  setNovoStatus(PedidoStatus.CANCELLED);
                  setObservacaoStatus('Pedido cancelado');
                  handleUpdateStatus();
                }}
              >
                Cancelar pedido
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </HStack>
      
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Coluna 1 - Detalhes do pedido */}
        <Box gridColumn={{ lg: 'span 2' }}>
          <Card bg={bgCard} mb={6}>
            <CardHeader bg="gray.50">
              <HStack justify="space-between">
                <Heading size="md">
                  Pedido #{pedido.numero}
                </Heading>
                <PedidoStatusBadge status={pedido.status} />
              </HStack>
            </CardHeader>
            
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <Box>
                  <Text fontWeight="bold" mb={1}>Data do pedido:</Text>
                  <Text>{new Date(pedido.dataPedido).toLocaleString('pt-BR')}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={1}>Tipo de pedido:</Text>
                  <Badge colorScheme={pedido.tipo === 'DELIVERY' ? 'blue' : 'green'} fontSize="md" px={2} py={1}>
                    {pedido.tipo === 'DELIVERY' ? 'Entrega' : 'Retirada'}
                  </Badge>
                </Box>
              </SimpleGrid>
              
              <Divider my={4} />
              
              <Heading size="sm" mb={3} display="flex" alignItems="center">
                <Icon as={FaShoppingBag} mr={2} />
                Itens do pedido
              </Heading>
              
              <VStack align="start" spacing={3} mb={4}>
                {pedido.itens?.map((item: any) => (
                  <HStack key={item.id} justify="space-between" w="100%">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">
                        {item.quantidade}x {item.nome}
                      </Text>
                      {item.observacoes && (
                        <Text fontSize="sm" color="gray.600">
                          Obs: {item.observacoes}
                        </Text>
                      )}
                    </VStack>
                    <Text fontWeight="bold">{formatCurrency(item.valorTotal)}</Text>
                  </HStack>
                ))}
              </VStack>
              
              <Divider my={4} />
              
              <Flex justify="space-between" mb={2}>
                <Text>Subtotal:</Text>
                <Text>{formatCurrency(pedido.valorItens)}</Text>
              </Flex>
              
              {pedido.tipo === 'DELIVERY' && (
                <Flex justify="space-between" mb={2}>
                  <Text>Taxa de entrega:</Text>
                  <Text>{formatCurrency(pedido.taxaEntrega)}</Text>
                </Flex>
              )}
              
              {/* Exibir informações do cupom de desconto se houver */}
              {pedido.cupons && pedido.cupons.length > 0 && pedido.cupons[0] && (
                <Flex justify="space-between" mb={2}>
                  <HStack>
                    <Text>Desconto:</Text>
                    <Badge colorScheme="green" ml={1}>
                      Cupom {pedido.cupons[0].cupom?.codigo || ''}
                    </Badge>
                  </HStack>
                  <Text color="green.500">- {formatCurrency(pedido.cupons[0].valorDesconto)}</Text>
                </Flex>
              )}
              
              <Flex justify="space-between" fontWeight="bold" fontSize="lg">
                <Text>Total:</Text>
                <Text color="teal.500">{formatCurrency(pedido.valorTotal)}</Text>
              </Flex>
            </CardBody>
          </Card>
          
          {/* Histórico do pedido */}
          <Card bg={bgCard}>
            <CardHeader bg="gray.50">
              <Heading size="md">Histórico do pedido</Heading>
            </CardHeader>
            
            <CardBody>
              {pedido.historico?.length > 0 ? (
                <VStack align="stretch" spacing={4}>
                  {pedido.historico.map((item: any) => (
                    <Card key={item.id} variant="outline" size="sm">
                      <CardBody>
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <PedidoStatusBadge status={item.statusNovo} />
                            {item.statusAnterior && (
                              <Text fontSize="sm" color="gray.500">
                                (anterior: {item.statusAnterior})
                              </Text>
                            )}
                          </HStack>
                          <Text fontSize="sm">
                            {new Date(item.data).toLocaleString('pt-BR')}
                          </Text>
                        </HStack>
                        
                        {item.observacao && (
                          <Text mt={2} fontSize="sm">
                            {item.observacao}
                          </Text>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500">Nenhum histórico disponível</Text>
              )}
            </CardBody>
          </Card>
        </Box>
        
        {/* Coluna 2 - Informações do cliente e atualização de status */}
        <Box>
          {/* Informações do cliente */}
          <Card bg={bgCard} mb={6}>
            <CardHeader bg="gray.50">
              <Heading size="md" display="flex" alignItems="center">
                <Icon as={FaUser} mr={2} />
                Informações do cliente
              </Heading>
            </CardHeader>
            
            <CardBody>
              <VStack align="start" spacing={3}>
                <Box w="100%">
                  <Text fontWeight="bold" mb={1}>Nome:</Text>
                  <Text>{pedido.cliente?.nome}</Text>
                </Box>
                
                <Box w="100%">
                  <Text fontWeight="bold" mb={1}>Telefone:</Text>
                  <Text>{pedido.cliente?.telefone}</Text>
                </Box>
                
                {pedido.cliente?.email && (
                  <Box w="100%">
                    <Text fontWeight="bold" mb={1}>E-mail:</Text>
                    <Text>{pedido.cliente?.email}</Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
          
          {/* Endereço de entrega (apenas para delivery) */}
          {pedido.tipo === 'DELIVERY' && pedido.enderecoEntrega && (
            <Card bg={bgCard} mb={6}>
              <CardHeader bg="gray.50">
                <Heading size="md" display="flex" alignItems="center">
                  <Icon as={FaMapMarkerAlt} mr={2} />
                  Endereço de entrega
                </Heading>
              </CardHeader>
              
              <CardBody>
                <VStack align="start" spacing={3}>
                  <Text>
                    {pedido.enderecoEntrega.rua}, {pedido.enderecoEntrega.numero}
                    {pedido.enderecoEntrega.complemento && `, ${pedido.enderecoEntrega.complemento}`}
                  </Text>
                  
                  <Text>
                    {pedido.enderecoEntrega.bairro}, {pedido.enderecoEntrega.cidade}
                  </Text>
                  
                  {pedido.enderecoEntrega.referencia && (
                    <Text>
                      <Text as="span" fontWeight="bold">Referência:</Text> {pedido.enderecoEntrega.referencia}
                    </Text>
                  )}
                  
                  {pedido.areaEntrega && (
                    <Box w="100%">
                      <Text fontWeight="bold" mb={1}>Área de entrega:</Text>
                      <Text>{pedido.areaEntrega.nome}</Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}
          
          {/* Informações de pagamento */}
          <Card bg={bgCard} mb={6}>
            <CardHeader bg="gray.50">
              <Heading size="md" display="flex" alignItems="center">
                <Icon as={FaCreditCard} mr={2} />
                Pagamento
              </Heading>
            </CardHeader>
            
            <CardBody>
              <VStack align="start" spacing={3}>
                <Box w="100%">
                  <Text fontWeight="bold" mb={1}>Forma de pagamento:</Text>
                  <Text>{pedido.formaPagamento}</Text>
                </Box>
                
                {pedido.troco && (
                  <Box w="100%">
                    <Text fontWeight="bold" mb={1}>Troco para:</Text>
                    <Text>{formatCurrency(pedido.troco)}</Text>
                  </Box>
                )}
                
                {pedido.observacoes && (
                  <Box w="100%">
                    <Text fontWeight="bold" mb={1}>Observações:</Text>
                    <Text>{pedido.observacoes}</Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
          
          {/* Atualizar status */}
          <Card bg={bgCard}>
            <CardHeader bg="gray.50">
              <Heading size="md">Atualizar status</Heading>
            </CardHeader>
            
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <PedidoStatusStepper 
                  status={pedido.status} 
                  size="sm"
                />
                
                <Divider />
                
                <FormControl>
                  <FormLabel>Novo status</FormLabel>
                  <Select
                    value={novoStatus}
                    onChange={(e) => setNovoStatus(e.target.value)}
                    placeholder="Selecione o novo status"
                  >
                    {Object.values(PedidoStatus).map((status) => (
                      <option key={status} value={status} disabled={status === pedido.status}>
                        {statusConfig[status]?.label || status}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <Textarea
                    value={observacaoStatus}
                    onChange={(e) => setObservacaoStatus(e.target.value)}
                    placeholder="Adicione uma observação para esta mudança de status"
                    rows={3}
                  />
                </FormControl>
                
                <Button
                  colorScheme="teal"
                  isLoading={updateLoading}
                  onClick={handleUpdateStatus}
                  isDisabled={novoStatus === pedido.status}
                >
                  Atualizar status
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
