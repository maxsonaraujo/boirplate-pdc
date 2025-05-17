'use client'

import {
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorMode,
  useColorModeValue,
  Avatar,
  Divider,
  MenuDivider,
  Badge,
  Icon,
  Tooltip,
  Skeleton,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  Button,
  List,
  ListItem,
  Spinner,
  useDisclosure
} from '@chakra-ui/react'
import { FaBars, FaMoon, FaSun, FaBell, FaUser, FaCog, FaSignOutAlt, FaCheck, FaTrash, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import { useToast } from '@chakra-ui/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface TopNavProps {
  onOpen: () => void
}

interface Notification {
  id: number
  titulo: string
  mensagem: string
  tipo: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  icone?: string
  lida: boolean
  url?: string
  dataEnvio: string
}

export function TopNav({ onOpen }: TopNavProps) {
  const { colorMode, toggleColorMode } = useColorMode()
  const router = useRouter()
  const toast = useToast()
  const [userData, setUserData] = useState({ name: '', role: '' })
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para notificações
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  
  // Controle para o popover de notificações
  const { isOpen: isNotificationsOpen, onOpen: onNotificationsOpen, onClose: onNotificationsClose } = useDisclosure()

  // Buscar dados do usuário para exibir no menu
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUserData({
              name: data.user.name,
              role: getRoleName(data.user.role)
            })
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserData()
  }, [])

  // Buscar notificações do usuário
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true)
      setNotificationError(null)
      
      const response = await fetch('/api/notifications?limit=5&onlyUnread=true')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar notificações')
      }
      
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      setNotificationError('Não foi possível carregar as notificações')
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  // Buscar notificações quando o componente montar
  useEffect(() => {
    fetchNotifications()
    
    // Definir intervalo para atualizar notificações a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    
    // Limpar intervalo quando componente desmontar
    return () => clearInterval(interval)
  }, [])
  
  // Marcar notificação como lida
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lida: true })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar notificação')
      }
      
      // Atualizar estado local de notificações
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId ? { ...notification, lida: true } : notification
        )
      )
      
      // Atualizar contador de não lidas
      setUnreadCount(prevCount => Math.max(0, prevCount - 1))
      
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a notificação',
        status: 'error',
        duration: 2000,
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
      
      // Remover notificação do estado local
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      )
      
      // Se a notificação excluída não estava lida, atualizar contador
      const wasUnread = notifications.find(n => n.id === notificationId)?.lida === false
      if (wasUnread) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1))
      }
      
      toast({
        title: 'Sucesso',
        description: 'Notificação excluída',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a notificação',
        status: 'error',
        duration: 2000,
      })
    }
  }
  
  // Marcar todas as notificações como lidas
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar notificações')
      }
      
      // Atualizar estado local de notificações
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, lida: true }))
      )
      
      // Atualizar contador para zero
      setUnreadCount(0)
      
      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as notificações',
        status: 'error',
        duration: 2000,
      })
    }
  }
  
  // Abrir link da notificação
  const handleOpenNotification = (notification: Notification) => {
    // Marcar como lida se não estiver
    if (!notification.lida) {
      handleMarkAsRead(notification.id)
    }
    
    // Redirecionar se tiver URL
    if (notification.url) {
      router.push(notification.url)
      onNotificationsClose()
    }
  }

  // Helper para obter o nome da função baseado no role
  const getRoleName = (role) => {
    const roles = {
      ADMIN: 'Administrador',
      MANAGER: 'Gerente',
      CASHIER: 'Caixa',
      WAITER: 'Garçom',
    }
    return roles[role] || role
  }
  
  // Helper para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Se for hoje, mostrar apenas hora
    if (date.toDateString() === today.toDateString()) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Se for ontem, mostrar "Ontem"
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Caso contrário, mostrar data completa
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Helper para obter ícone baseado no tipo
  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'WARNING':
        return <Icon as={FaExclamationTriangle} color="orange.500" boxSize={5} />
      case 'ERROR':
        return <Icon as={FaExclamationTriangle} color="red.500" boxSize={5} />
      case 'SUCCESS':
        return <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
      case 'INFO':
      default:
        return <Icon as={FaInfoCircle} color="blue.500" boxSize={5} />
    }
  }

  const handleLogout = async () => {
    try {
      // Chamada para API que vai apagar o cookie no servidor
      await fetch('/api/logout', { method: 'POST' })
      
      toast({
        title: 'Sessão encerrada',
        description: 'Você foi desconectado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast({
        title: 'Erro ao sair',
        description: 'Não foi possível encerrar sua sessão.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Flex
      px={4}
      height="16"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.800')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      position="sticky"
      top="0"
      zIndex="1"
      shadow="sm"
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="abrir menu"
        icon={<FaBars />}
      />

      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="xl"
        fontWeight="bold"
        color="teal.500"
      >
        Degusflow
      </Text>

      <HStack spacing={3}>
        <Box position="relative">
          <Popover
            isOpen={isNotificationsOpen}
            onOpen={onNotificationsOpen}
            onClose={onNotificationsClose}
            placement="bottom-end"
            closeOnBlur={true}
          >
            <PopoverTrigger>
              <Box>
                <Tooltip label="Notificações" hasArrow>
                  <IconButton
                    size="md"
                    variant="ghost"
                    aria-label="notificações"
                    icon={<FaBell />}
                    color={useColorModeValue('gray.500', 'gray.400')}
                  />
                </Tooltip>
                {unreadCount > 0 && (
                  <Badge
                    position="absolute"
                    top="-6px"
                    right="-6px"
                    colorScheme="red"
                    borderRadius="full"
                    fontSize="xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Box>
            </PopoverTrigger>
            <PopoverContent width="320px" maxH="500px" overflowY="auto">
              <PopoverHeader
                fontWeight="bold"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                borderBottomWidth="1px"
                py={2}
              >
                <Text>Notificações</Text>
                {unreadCount > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    leftIcon={<FaCheck />}
                    onClick={handleMarkAllAsRead}
                  >
                    Marcar todas como lidas
                  </Button>
                )}
              </PopoverHeader>
              <PopoverBody p={0}>
                {isLoadingNotifications ? (
                  <Flex justify="center" p={4}>
                    <Spinner size="sm" />
                  </Flex>
                ) : notificationError ? (
                  <Box p={4} textAlign="center" color="red.500">
                    {notificationError}
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box p={4} textAlign="center" color="gray.500">
                    Não há notificações novas
                  </Box>
                ) : (
                  <List>
                    {notifications.map((notification) => (
                      <ListItem
                        key={notification.id}
                        p={3}
                        borderBottomWidth="1px"
                        borderColor={useColorModeValue('gray.200', 'gray.700')}
                        bg={notification.lida ? 'transparent' : useColorModeValue('gray.50', 'gray.700')}
                        _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                        cursor={notification.url ? 'pointer' : 'default'}
                        onClick={() => {
                          if (notification.url) {
                            handleOpenNotification(notification)
                          }
                        }}
                      >
                        <Flex>
                          <Box mr={3} mt={1}>
                            {getNotificationIcon(notification.tipo)}
                          </Box>
                          <Box flex="1">
                            <Text fontWeight={notification.lida ? 'normal' : 'bold'} fontSize="sm">
                              {notification.titulo}
                            </Text>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {formatDate(notification.dataEnvio)}
                            </Text>
                            <Text fontSize="sm" mt={1} noOfLines={2}>
                              {notification.mensagem}
                            </Text>
                          </Box>
                          <VStack spacing={1} ml={2}>
                            {!notification.lida && (
                              <IconButton
                                aria-label="Marcar como lida"
                                icon={<FaCheck />}
                                size="xs"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                              />
                            )}
                            <IconButton
                              aria-label="Excluir notificação"
                              icon={<FaTrash />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteNotification(notification.id)
                              }}
                            />
                          </VStack>
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                )}
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="center" borderTopWidth="1px" p={2}>
                <Link href="/desk/notifications" passHref>
                  <Button size="sm" variant="link" onClick={onNotificationsClose}>
                    Ver todas as notificações
                  </Button>
                </Link>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </Box>
        
        <Tooltip label={colorMode === 'light' ? 'Modo escuro' : 'Modo claro'} hasArrow>
          <IconButton
            size="md"
            variant="ghost"
            aria-label="alternar tema"
            onClick={toggleColorMode}
            icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
            color={useColorModeValue('gray.500', 'gray.400')}
          />
        </Tooltip>

        <Menu>
          <MenuButton
            py={2}
            transition="all 0.3s"
            _focus={{ boxShadow: 'none' }}
          >
            <HStack spacing={3}>
              <Avatar
                size="sm"
                name={userData.name || 'Usuário'}
                src="https://bit.ly/broken-link"
                bg="teal.500"
              />
              <Box display={{ base: 'none', md: 'block' }} minW="120px">
                {isLoading ? (
                  <VStack spacing={1} align="start">
                    <Skeleton height="14px" width="80px" />
                    <Skeleton height="12px" width="60px" />
                  </VStack>
                ) : (
                  <VStack spacing={0} align="start">
                    <Text 
                      fontSize="sm" 
                      fontWeight="medium" 
                      lineHeight="shorter" 
                      isTruncated
                    >
                      {userData.name || 'Usuário'}
                    </Text>
                    <Text 
                      fontSize="xs" 
                      color="gray.500" 
                      lineHeight="shorter" 
                      mt={1}
                    >
                      {userData.role || 'Carregando...'}
                    </Text>
                  </VStack>
                )}
              </Box>
            </HStack>
          </MenuButton>
          <MenuList
            bg={useColorModeValue('white', 'gray.800')}
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            shadow="lg"
          >
            <MenuItem 
              icon={<Icon as={FaUser} />}
              as={Link}
              href="/desk/perfil"
            >
              Meu Perfil
            </MenuItem>
            <MenuItem icon={<Icon as={FaCog} />}>Configurações</MenuItem>
            <MenuDivider />
            <MenuItem icon={<Icon as={FaSignOutAlt} color="red.400" />} onClick={handleLogout}>
              Sair
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  )
}
