'use client'

import {
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  BoxProps,
  Divider,
  Heading,
  Button,
  useToast,
  Stack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import {
  FaHome,
  FaClipboardList,
  FaUsers,
  FaUtensils,
  FaWineGlassAlt,
  FaCashRegister,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaUsersCog,
  FaBoxes,
  FaTags,
  FaLayerGroup,
  FaList,
  FaPrint,
  FaRuler,
  FaPizzaSlice,
  FaMoneyBillWave,
  FaDatabase,
  FaTag,
  FaPlus,
  FaWarehouse,
  FaClock,
  FaMotorcycle,
  FaMapMarkerAlt,
  FaCity,
  FaPuzzlePiece,
  FaStore
} from 'react-icons/fa'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useModules } from '@/hooks/useModules'

interface SidebarProps extends BoxProps {
  onClose: () => void
}

interface LinkItemProps {
  name: string
  icon: any
  path: string
  children?: Array<LinkItemProps>
  module?: string // Adicionar o campo module para identificar a qual módulo o item pertence
}

// Definindo o módulo ao qual cada item pertence
const LinkItems: Array<LinkItemProps> = [
  { name: 'Início', icon: FaHome, path: '/desk' },
  {
    name: 'Delivery',
    icon: FaMotorcycle,
    path: '#',
    module: 'delivery',
    children: [
      // { name: 'Dashboard', icon: FaChartLine, path: '/desk/delivery/dashboard' },
      { name: 'Pedidos', icon: FaClipboardList, path: '/desk/delivery' },
      { name: 'Cupons de Desconto', icon: FaTag, path: '/desk/delivery/cupons' },
      { name: 'Lojas', icon: FaStore, path: '/desk/delivery/lojas' },
      { name: 'Cidades Disponíveis', icon: FaCity, path: '/desk/delivery/cidades' },
      { name: 'Gerenciar Bairros', icon: FaMapMarkerAlt, path: '/desk/delivery/bairros' },
      { name: 'Horários', icon: FaClock, path: '/desk/delivery/horarios' },
      { name: 'Métodos de Pagamento', icon: FaMoneyBillWave, path: '/desk/delivery/config/payment-methods' },
      { name: 'Configurações', icon: FaCog, path: '/desk/delivery/config' },
    ]
  },
  { name: 'Comandas', icon: FaClipboardList, path: '/desk/comandas', module: 'comandas' },
  { name: 'Clientes', icon: FaUsers, path: '/desk/clientes', module: 'clientes' },
  {
    name: 'Cadastros',
    icon: FaBoxes,
    path: '#',
    module: 'cadastros',
    children: [
      { name: 'Categorias', icon: FaTags, path: '/desk/cadastros/categorias' },
      { name: 'Produtos', icon: FaUtensils, path: '/desk/cadastros/produtos' },
      { name: 'Locais de Produção', icon: FaPrint, path: '/desk/cadastros/locais-producao' },
      { name: 'Unidades de Medida', icon: FaRuler, path: '/desk/cadastros/unidades-medida' },
      { name: 'Complementos', icon: FaPizzaSlice, path: '/desk/cadastros/complementos' },
      { name: 'Grupos de Complementos', icon: FaLayerGroup, path: '/desk/cadastros/grupos-complementos' },
    ]
  },
  {
    name: 'Estoque',
    icon: FaWarehouse,
    path: '#',
    module: 'estoque',
    children: [
      { name: 'Dashboard', icon: FaChartLine, path: '/desk/estoque' },
      { name: 'Insumos', icon: FaBoxes, path: '/desk/estoque/insumos' },
      { name: 'Fornecedores', icon: FaUsers, path: '/desk/estoque/fornecedores' },
      { name: 'Compras', icon: FaMoneyBillWave, path: '/desk/estoque/compras' },
      { name: 'Movimentações', icon: FaList, path: '/desk/estoque/movimentacoes' },
      { name: 'Inventário', icon: FaClipboardList, path: '/desk/estoque/inventarios' },
    ]
  },
  { name: 'Cardápio', icon: FaUtensils, path: '/desk/cardapio', module: 'cardapio' },
  { name: 'Bar', icon: FaWineGlassAlt, path: '/desk/bar', module: 'bar' },
  { name: 'Caixa', icon: FaCashRegister, path: '/desk/caixa', module: 'caixa' },
  { name: 'Relatórios', icon: FaChartLine, path: '/desk/relatorios', module: 'relatorios' },
  { name: 'Gerenciar Usuários', icon: FaUsersCog, path: '/desk/usuarios' },
  {
    name: 'Configurações',
    icon: FaCog,
    path: '#',
    children: [
      { name: 'Gerais', icon: FaCog, path: '/desk/configuracoes/gerais' },
      { name: 'Horários/Funcionamento', icon: FaClock, path: '/desk/configuracoes/horario-funcionamento' },
      // { name: 'Impostos', icon: FaMoneyBillWave, path: '/desk/configuracoes/impostos' },
      // { name: 'Módulos', icon: FaPuzzlePiece, path: '/desk/configuracoes/modulos' },
      // { name: 'Módulos por Tenant', icon: FaStore, path: '/desk/configuracoes/tenants-modulos' },
    ]
  },
]

export function Sidebar({ onClose, ...rest }: SidebarProps) {
  const router = useRouter()
  const toast = useToast()
  const pathname = usePathname()
  const { hasModule, isLoading: isLoadingModules } = useModules()

  // Filtrar itens do menu com base nos módulos disponíveis
  const filteredLinkItems = LinkItems.filter(item => {
    // Se não tem moduleSlug, sempre mostrar (itens de sistema)
    if (!item.module) return true;
    
    // Se tem moduleSlug, verificar se o tenant tem acesso
    return hasModule(item.module);
  });

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
    <Box
      transition="0.3s ease"
      bg={useColorModeValue('white', 'gray.800')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 80 }}
      pos="fixed"
      h="full"
      display="flex"
      flexDirection="column"
      {...rest}
    >
      {/* Header with logo */}
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Flex alignItems="center">
          <Icon as={FaUtensils} color="teal.500" w={6} h={6} mr={2} />
          <Heading fontSize="xl" fontWeight="bold" color="teal.500">
            Degusflow
          </Heading>
        </Flex>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>

      <Divider borderColor={useColorModeValue('gray.200', 'gray.700')} />

      {/* Nav Items - Scrollable */}
      <Box
        flex="1"
        overflowY="auto"
        px={4}
        py={2}
      >
        <Stack spacing={1}>
          {isLoadingModules ? (
            // Mostrar indicador de carregamento ou nada 
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
              Carregando menu...
            </Text>
          ) : (
            filteredLinkItems.map((link) => (
              link.children ? (
                <AccordionNavItem
                  key={link.name}
                  item={link}
                  pathname={pathname}
                  hasModule={hasModule}
                />
              ) : (
                <NavItem
                  key={link.name}
                  icon={link.icon}
                  path={link.path}
                  isActive={(pathname.startsWith(link.path) && link.path !== "/desk") || pathname === link.path}
                >
                  {link.name}
                </NavItem>
              )
            ))
          )}
        </Stack>
      </Box>

      {/* Logout button - fixed at bottom */}
      <Box p={4} borderTop="1px" borderTopColor={useColorModeValue('gray.200', 'gray.700')}>
        <Button
          variant="ghost"
          colorScheme="red"
          leftIcon={<Icon as={FaSignOutAlt} />}
          justifyContent="flex-start"
          width="full"
          onClick={handleLogout}
        >
          Sair
        </Button>
      </Box>
    </Box>
  )
}

// Componente para itens do menu de navegação que possuem submenus
const AccordionNavItem = ({ item, pathname, hasModule }) => {
  const isActiveParent = item.children?.some(child => pathname === child.path) || false;
  const hoverBg = useColorModeValue('teal.50', 'teal.900');
  const hoverColor = useColorModeValue('teal.700', 'white');

  // Filtrar os filhos do menu com base nos módulos
  const filteredChildren = item.children?.filter(child => {
    if (!child.module) return true;
    return hasModule(child.module);
  });

  // Se não há filhos disponíveis após filtro, não mostrar o item pai
  if (filteredChildren?.length === 0) return null;

  return (
    <Accordion allowToggle defaultIndex={isActiveParent ? 0 : -1}>
      <AccordionItem border="none">
        <h2>
          <AccordionButton
            p={3}
            mx={2}
            borderRadius="md"
            _hover={{
              bg: hoverBg,
              color: hoverColor,
            }}
            _expanded={{
              bg: isActiveParent ? 'teal.50' : 'transparent',
              color: 'teal.500',
              fontWeight: 'bold'
            }}
            fontWeight={isActiveParent ? 'bold' : 'normal'}
            color={isActiveParent ? 'teal.500' : 'inherit'}
          >
            <Flex flex="1" align="center">
              <Icon mr={3} fontSize="16" as={item.icon} />
              <Text>{item.name}</Text>
            </Flex>
            <AccordionIcon />
          </AccordionButton>
        </h2>

        <AccordionPanel pb={2} pt={2} px={2}>
          <Stack spacing={1}>
            {filteredChildren?.map((child) => (
              <NavItem
                key={child.name}
                icon={child.icon}
                path={child.path}
                isActive={pathname === child.path}
                pl={6}
              >
                {child.name}
              </NavItem>
            ))}
          </Stack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

interface NavItemProps {
  icon: any
  path: string
  isActive?: boolean
  children: React.ReactNode
  pl?: number
}

const NavItem = ({ icon, path, children, isActive, pl = 2, ...rest }: NavItemProps) => {
  return (
    <Box
      as={Link}
      href={path}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="3"
        mx="2"
        pl={pl}
        borderRadius="md"
        role="group"
        cursor="pointer"
        bg={isActive ? 'teal.500' : 'transparent'}
        color={isActive ? 'white' : 'inherit'}
        _hover={{
          bg: useColorModeValue('teal.50', 'teal.900'),
          color: useColorModeValue('teal.700', 'white'),
        }}
        fontWeight={isActive ? 'bold' : 'normal'}
        {...rest}
      >
        <Icon
          mr="3"
          fontSize="16"
          as={icon}
        />
        {children}
      </Flex>
    </Box>
  )
}
