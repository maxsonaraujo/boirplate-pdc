'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useToast,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  FormControl,
  FormLabel
} from '@chakra-ui/react'
import { FaCheck, FaCheckCircle, FaEllipsisV, FaExclamationTriangle, FaFilter, FaInfoCircle, FaSearch, FaTrash } from 'react-icons/fa'

interface Notification {
  id: number
  titulo: string
  mensagem: string
  tipo: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  icone?: string
  lida: boolean
  url?: string
  dataEnvio: string
  dataLeitura?: string
}

export default function NotificationsPage() {
  const toast = useToast()
  const bgCard = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Estados para dados e filtros
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNotifications, setTotalNotifications] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroLida, setFiltroLida] = useState('')
  const [filtroBusca, setFiltroBusca] = useState('')
  const [itensPorPagina, setItensPorPagina] = useState(10)

  // Buscar notificações com filtros
  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      
      // Construir query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itensPorPagina.toString(),
      })
      
      if (filtroTipo) params.append('tipo', filtroTipo)
      if (filtroLida === 'lida') params.append('onlyRead', 'true')
      if (filtroLida === 'nao-lida') params.append('onlyUnread', 'true')
      if (filtroBusca) params.append('search', filtroBusca)

      const response = await fetch(`/api/notifications?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Falha ao obter notificações')
      }
      
      const data = await response.json()
      
      setNotifications(data.notifications || [])
      setTotalNotifications(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notificações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Carregar notificações quando os filtros mudarem
  useEffect(() => {
    fetchNotifications()
  }, [currentPage, itensPorPagina, filtroTipo, filtroLida])
  
  // Aplicar filtro de busca manualmente
  const handleSearch = () => {
    setCurrentPage(1) // Voltar para primeira página ao buscar
    fetchNotifications()
  }
  
  // Helper para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Helper para obter ícone baseado no tipo
  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'WARNING':
        return <Icon as={FaExclamationTriangle} color="orange.500" />
      case 'ERROR':
        return <Icon as={FaExclamationTriangle} color="red.500" />
      case 'SUCCESS':
        return <Icon as={FaCheckCircle} color="green.500" />
      case 'INFO':
      default:
        return <Icon as={FaInfoCircle} color="blue.500" />
    }
  }
  
  // Helper para obter cor do badge baseado no tipo
  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case 'WARNING':
        return 'orange'
      case 'ERROR':
        return 'red'
      case 'SUCCESS':
        return 'green'
      case 'INFO':
      default:
        return 'blue'
    }
  }
  
  // Helper para obter label do tipo
  const getNotificationTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'WARNING':
        return 'Alerta'
      case 'ERROR':
        return 'Erro'
      case 'SUCCESS':
        return 'Sucesso'
      case 'INFO':
      default:
        return 'Informação'
    }
  }
  
  // Marcar notificação como lida/não lida
  const handleToggleRead = async (notificationId: number, isCurrentlyRead: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lida: !isCurrentlyRead })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar notificação')
      }
      
      // Atualizar estado local
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, lida: !isCurrentlyRead } 
            : notification
        )
      )
      
      // Atualizar contador de não lidas
      if (isCurrentlyRead) {
        setUnreadCount(prev => prev + 1)
      } else {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      toast({
        title: 'Sucesso',
        description: `Notificação marcada como ${!isCurrentlyRead ? 'lida' : 'não lida'}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a notificação',
        status: 'error',
        duration: 2000,
        isClosable: true,
      })
    }
  }
  
  // Excluir notificação
  const handleDeleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Erro ao excluir notificação')
      }
      
      // Atualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Atualizar contador de não lidas se necessário
      const wasUnread = notifications.find(n => n.id === notificationId)?.lida === false
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      // Atualizar total
      setTotalNotifications(prev => Math.max(0, prev - 1))
      
      toast({
        title: 'Sucesso',
        description: 'Notificação excluída com sucesso',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a notificação',
        status: 'error',
        duration: 2000,
        isClosable: true,
      })
    }
  }
  
  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar notificações')
      }
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })))
      
      // Atualizar contador
      setUnreadCount(0)
      
      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as notificações',
        status: 'error',
        duration: 2000,
        isClosable: true,
      })
    }
  }
  
  // Limpar filtros
  const handleClearFilters = () => {
    setFiltroTipo('')
    setFiltroLida('')
    setFiltroBusca('')
    setCurrentPage(1)
  }

  return (
    <Container maxW="container.xl" py={6}>
      <Heading size="lg" mb={6}>Central de Notificações</Heading>
      
      {/* Cards de estatísticas */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        <Card bg={bgCard}>
          <CardBody>
            <Stack spacing={2}>
              <Text fontSize="lg" fontWeight="bold">Total de notificações</Text>
              <Text fontSize="3xl">{totalNotifications}</Text>
            </Stack>
          </CardBody>
        </Card>
        
        <Card bg={bgCard}>
          <CardBody>
            <Stack spacing={2}>
              <Text fontSize="lg" fontWeight="bold">Notificações não lidas</Text>
              <Text fontSize="3xl">{unreadCount}</Text>
              
              {unreadCount > 0 && (
                <Button 
                  leftIcon={<FaCheck />} 
                  colorScheme="blue" 
                  size="sm"
                  mt={2}
                  w="max-content"
                  onClick={handleMarkAllAsRead}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Filtros */}
      <Card mb={6} bg={bgCard}>
        <CardHeader pb={0}>
          <HStack>
            <Icon as={FaFilter} />
            <Text fontWeight="bold">Filtros</Text>
          </HStack>
        </CardHeader>
        
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <FormControl>
              <FormLabel>Tipo</FormLabel>
              <Select 
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                placeholder="Todos os tipos"
              >
                <option value="INFO">Informação</option>
                <option value="WARNING">Alerta</option>
                <option value="ERROR">Erro</option>
                <option value="SUCCESS">Sucesso</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select 
                value={filtroLida}
                onChange={(e) => setFiltroLida(e.target.value)}
                placeholder="Todas"
              >
                <option value="lida">Lidas</option>
                <option value="nao-lida">Não lidas</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Buscar</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder="Título, mensagem..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch()
                  }}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>Itens por página</FormLabel>
              <Select 
                value={itensPorPagina}
                onChange={(e) => setItensPorPagina(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Select>
            </FormControl>
          </SimpleGrid>
          
          <HStack justify="flex-end" mt={4} spacing={3}>
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
            >
              Limpar filtros
            </Button>
            <Button 
              colorScheme="blue" 
              leftIcon={<FaSearch />} 
              onClick={handleSearch}
            >
              Buscar
            </Button>
          </HStack>
        </CardBody>
      </Card>
      
      {/* Tabela de notificações */}
      <Card bg={bgCard}>
        <CardBody>
          {isLoading ? (
            <Flex justify="center" align="center" py={8}>
              <Spinner size="xl" />
            </Flex>
          ) : notifications.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">
                Nenhuma notificação encontrada com os filtros selecionados
              </Text>
            </Box>
          ) : (
            <>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th width="10%">Tipo</Th>
                      <Th width="25%">Título</Th>
                      <Th width="35%">Mensagem</Th>
                      <Th width="15%">Data</Th>
                      <Th width="5%">Status</Th>
                      <Th width="10%">Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {notifications.map((notification) => (
                      <Tr 
                        key={notification.id} 
                        bg={notification.lida ? 'transparent' : useColorModeValue('gray.50', 'gray.700')}
                      >
                        <Td>
                          <Badge colorScheme={getNotificationColor(notification.tipo)}>
                            {getNotificationTypeLabel(notification.tipo)}
                          </Badge>
                        </Td>
                        <Td fontWeight={notification.lida ? 'normal' : 'bold'}>
                          <HStack>
                            {getNotificationIcon(notification.tipo)}
                            <Text>{notification.titulo}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text noOfLines={2}>{notification.mensagem}</Text>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm">{formatDate(notification.dataEnvio)}</Text>
                            {notification.lida && notification.dataLeitura && (
                              <Text fontSize="xs" color="gray.500">
                                Lida: {formatDate(notification.dataLeitura)}
                              </Text>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={notification.lida ? 'green' : 'orange'}>
                            {notification.lida ? 'Lida' : 'Não lida'}
                          </Badge>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              aria-label="Opções"
                              icon={<FaEllipsisV />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem 
                                icon={<FaCheck />}
                                onClick={() => handleToggleRead(notification.id, notification.lida)}
                              >
                                {notification.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                              </MenuItem>
                              {notification.url && (
                                <MenuItem 
                                  icon={<Icon as={FaInfoCircle} />}
                                  as="a"
                                  href={notification.url}
                                >
                                  Ver detalhes
                                </MenuItem>
                              )}
                              <Divider />
                              <MenuItem 
                                icon={<FaTrash />}
                                color="red.500"
                                onClick={() => handleDeleteNotification(notification.id)}
                              >
                                Excluir
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              
              {/* Paginação */}
              {totalPages > 1 && (
                <Flex justify="center" mt={4}>
                  <HStack>
                    <Button
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      isDisabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => (
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ))
                      .map((page, index, array) => {
                        // Adicionar elipses quando há lacunas na sequência
                        if (index > 0 && page - array[index - 1] > 1) {
                          return (
                            <React.Fragment key={`ellipsis-${page}`}>
                              <Text>...</Text>
                              <Button
                                size="sm"
                                colorScheme={currentPage === page ? 'blue' : 'gray'}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        }
                        return (
                          <Button
                            key={page}
                            size="sm"
                            colorScheme={currentPage === page ? 'blue' : 'gray'}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        )
                      })
                    }
                    
                    <Button
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      isDisabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </HStack>
                </Flex>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </Container>
  )
}

const VStack = (props) => {
  return <Stack direction="column" {...props} />
}