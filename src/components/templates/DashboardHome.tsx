'use client'

import {
  Box,
  Flex,
  Grid,
  Heading,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
  Badge,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  chakra,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider
} from '@chakra-ui/react'
import {
  FaUsers,
  FaUtensils,
  FaMoneyBillWave,
  FaClipboardList,
  FaArrowUp,
  FaArrowDown,
  FaExternalLinkAlt,
  FaUsersCog
} from 'react-icons/fa'
import Link from 'next/link'

export function DashboardHome() {
  // Cores de fundo para estatísticas
  const statBg = useColorModeValue('white', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.200')
  const headingColor = useColorModeValue('gray.700', 'white')
  
  return (
    <Box>
      <Heading as="h1" size="lg" mb={6} color={headingColor}>
        Painel de Controle
      </Heading>
      
      {/* Estatísticas principais */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard
          title="Comandas Abertas"
          value="12"
          icon={FaClipboardList}
          color="teal"
          change={{ value: "+33%", isIncrease: true }}
        />
        <StatCard
          title="Clientes Hoje"
          value="48"
          icon={FaUsers}
          color="blue"
          change={{ value: "+12%", isIncrease: true }}
        />
        <StatCard
          title="Pratos Vendidos"
          value="156"
          icon={FaUtensils}
          color="orange"
          change={{ value: "+8%", isIncrease: true }}
        />
        <StatCard
          title="Faturamento Diário"
          value="R$ 3.450"
          icon={FaMoneyBillWave}
          color="green"
          change={{ value: "-5%", isIncrease: false }}
        />
      </SimpleGrid>
      
      {/* Conteúdo principal em duas colunas */}
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
        {/* Coluna da esquerda */}
        <Box>
          {/* Comandas ativas */}
          <Card mb={6} bg={statBg} shadow="md" borderRadius="lg">
            <CardHeader pb={0}>
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md" color={headingColor}>
                  Comandas Ativas
                </Heading>
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="teal"
                  rightIcon={<FaExternalLinkAlt />}
                >
                  Ver todas
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Nº</Th>
                    <Th>Mesa</Th>
                    <Th>Cliente</Th>
                    <Th>Valor</Th>
                    <Th>Status</Th>
                    <Th>Tempo</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {[
                    { id: '001', mesa: '05', cliente: 'João Silva', valor: 'R$ 125,90', status: 'Aberta', tempo: '23 min' },
                    { id: '002', mesa: '08', cliente: 'Maria Santos', valor: 'R$ 78,50', status: 'Preparando', tempo: '15 min' },
                    { id: '003', mesa: '12', cliente: 'Carlos Ferreira', valor: 'R$ 210,00', status: 'Servindo', tempo: '45 min' },
                    { id: '004', mesa: '03', cliente: 'Ana Costa', valor: 'R$ 95,30', status: 'Aberta', tempo: '10 min' },
                    { id: '005', mesa: '07', cliente: 'Paulo Oliveira', valor: 'R$ 156,00', status: 'Aberta', tempo: '32 min' },
                  ].map((comanda) => (
                    <Tr key={comanda.id}>
                      <Td fontWeight="medium">#{comanda.id}</Td>
                      <Td>{comanda.mesa}</Td>
                      <Td>{comanda.cliente}</Td>
                      <Td>{comanda.valor}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            comanda.status === 'Aberta'
                              ? 'blue'
                              : comanda.status === 'Preparando'
                              ? 'yellow'
                              : 'green'
                          }
                        >
                          {comanda.status}
                        </Badge>
                      </Td>
                      <Td>{comanda.tempo}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
          
          {/* Itens mais vendidos */}
          <Card bg={statBg} shadow="md" borderRadius="lg">
            <CardHeader pb={0}>
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md" color={headingColor}>
                  Itens Mais Vendidos
                </Heading>
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="teal"
                  rightIcon={<FaExternalLinkAlt />}
                >
                  Relatório completo
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Item</Th>
                    <Th>Categoria</Th>
                    <Th isNumeric>Qtd.</Th>
                    <Th isNumeric>Valor</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {[
                    { nome: 'Picanha na Brasa', categoria: 'Carnes', qtd: 32, valor: 'R$ 1.280,00' },
                    { nome: 'Caipirinha', categoria: 'Bebidas', qtd: 28, valor: 'R$ 420,00' },
                    { nome: 'Filé à Parmegiana', categoria: 'Carnes', qtd: 24, valor: 'R$ 960,00' },
                    { nome: 'Chopp', categoria: 'Bebidas', qtd: 45, valor: 'R$ 675,00' },
                    { nome: 'Pudim de Leite', categoria: 'Sobremesas', qtd: 18, valor: 'R$ 270,00' },
                  ].map((item, i) => (
                    <Tr key={i}>
                      <Td fontWeight="medium">{item.nome}</Td>
                      <Td>{item.categoria}</Td>
                      <Td isNumeric>{item.qtd}</Td>
                      <Td isNumeric>{item.valor}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </Box>
        
        {/* Coluna da direita */}
        <Box>
          {/* Atalhos rápidos */}
          <Card mb={6} bg={statBg} shadow="md" borderRadius="lg">
            <CardHeader>
              <Heading size="md" color={headingColor}>
                Ações Rápidas
              </Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={2} spacing={4}>
                <Button colorScheme="teal" size="md">
                  Nova Comanda
                </Button>
                <Button colorScheme="blue" size="md">
                  Novo Cliente
                </Button>
                <Button colorScheme="orange" size="md">
                  Fechar Mesa
                </Button>
                <Button 
                  as={Link}
                  href="/desk/usuarios"
                  colorScheme="purple" 
                  size="md"
                  leftIcon={<FaUsersCog />}
                >
                  Usuários
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>
          
          {/* Atividades recentes */}
          <Card bg={statBg} shadow="md" borderRadius="lg">
            <CardHeader>
              <Heading size="md" color={headingColor}>
                Atividades Recentes
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {[
                  { texto: 'Mesa 7 fechada por Carlos', tempo: '5 min atrás', tipo: 'fechamento' },
                  { texto: 'Novo pedido na Mesa 3', tempo: '12 min atrás', tipo: 'pedido' },
                  { texto: 'Pagamento recebido (R$ 184,50)', tempo: '25 min atrás', tipo: 'pagamento' },
                  { texto: 'Reserva para Oliveira (20h)', tempo: '1 hora atrás', tipo: 'reserva' },
                  { texto: 'Mesa 9 aberta para Santos', tempo: '1 hora atrás', tipo: 'abertura' },
                ].map((atividade, i) => (
                  <Box key={i}>
                    <Flex justify="space-between" align="start">
                      <HStack spacing={3} align="start">
                        <ActivityIcon tipo={atividade.tipo} />
                        <Box>
                          <Text fontSize="sm" fontWeight="medium">{atividade.texto}</Text>
                          <Text fontSize="xs" color="gray.500">{atividade.tempo}</Text>
                        </Box>
                      </HStack>
                    </Flex>
                    {i < 4 && <Divider mt={3} />}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </Grid>
    </Box>
  )
}

// Componente para cartões de estatísticas
function StatCard({ title, value, icon, color, change }) {
  const statBg = useColorModeValue('white', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.200')
  
  return (
    <Stat
      px={4}
      py={5}
      bg={statBg}
      shadow="md"
      rounded="lg"
      position="relative"
      overflow="hidden"
    >
      <Flex justifyContent="space-between">
        <Box pl={2}>
          <StatLabel fontWeight="medium" isTruncated color={textColor}>
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold">
            {value}
          </StatNumber>
          {change && (
            <HStack mt={2} spacing={1}>
              <Icon
                as={change.isIncrease ? FaArrowUp : FaArrowDown}
                color={change.isIncrease ? 'green.500' : 'red.500'}
                w={3}
                h={3}
              />
              <Text fontSize="xs" color={change.isIncrease ? 'green.500' : 'red.500'}>
                {change.value}
              </Text>
            </HStack>
          )}
        </Box>
        <Box
          my="auto"
          color={`${color}.300`}
          alignContent="center"
        >
          <Icon as={icon} w={8} h={8} />
        </Box>
      </Flex>
      <Box
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        width="25%"
        bg={`${color}.50`}
        opacity={0.3}
        zIndex={0}
        display={{ base: 'none', md: 'block' }}
      />
    </Stat>
  )
}

// Componente para ícones de atividade
function ActivityIcon({ tipo }) {
  const getIconData = () => {
    switch (tipo) {
      case 'pedido':
        return { icon: FaClipboardList, color: 'blue.400', bg: 'blue.100' }
      case 'pagamento':
        return { icon: FaMoneyBillWave, color: 'green.400', bg: 'green.100' }
      case 'fechamento':
        return { icon: FaClipboardList, color: 'red.400', bg: 'red.100' }
      case 'abertura':
        return { icon: FaClipboardList, color: 'teal.400', bg: 'teal.100' }
      case 'reserva':
        return { icon: FaUsers, color: 'purple.400', bg: 'purple.100' }
      default:
        return { icon: FaClipboardList, color: 'gray.400', bg: 'gray.100' }
    }
  }

  const { icon, color, bg } = getIconData()

  return (
    <Flex
      w={8}
      h={8}
      align="center"
      justify="center"
      rounded="full"
      bg={useColorModeValue(bg, 'whiteAlpha.200')}
    >
      <Icon as={icon} color={useColorModeValue(color, 'whiteAlpha.800')} />
    </Flex>
  )
}

// Componente para stack vertical
function VStack(props) {
  return <Flex direction="column" {...props} />
}
