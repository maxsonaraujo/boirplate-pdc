'use client'
import {
  Box,
  Container,
  Flex,
  useColorMode,
  useColorModeValue,
  IconButton,
  Icon
} from '@chakra-ui/react'
import { FaMoon, FaSun, FaChartLine, FaChartBar, FaChartArea, FaChartPie } from 'react-icons/fa'
import { LoginCard } from '../organismes/LoginCard'
import { useEffect, useState } from 'react'

export function LoginPage() {
  const { colorMode, toggleColorMode } = useColorMode()
  const [mounted, setMounted] = useState(false)

  // Previne problemas de hidratação no SSR
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Box
      minH="100vh"
      w="100%"
      position="relative"
      overflow="hidden"
    >      {/* Imagem de fundo com overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundColor="#0a192f"
        backgroundSize="cover"
        backgroundPosition="center"
        zIndex={-10}
      />

      {/* Gradiente de sobreposição */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundImage={useColorModeValue(
          "linear-gradient(to bottom right, rgba(64, 150, 255, 0.15), rgba(10, 25, 47, 0.9))",
          "linear-gradient(to bottom right, rgba(64, 150, 255, 0.15), rgba(10, 25, 47, 0.9))"
        )}
        zIndex={-5}
      />      {/* Elementos decorativos */}
      <Box
        position="absolute"
        top="-10%"
        right="-5%"
        width="400px"
        height="400px"
        borderRadius="full"
        bg="blue.400"
        opacity="0.15"
        filter="blur(60px)"
        zIndex={-1}
      />

      <Box
        position="absolute"
        bottom="-15%"
        left="-10%"
        width="500px"
        height="500px"
        borderRadius="full"
        bg="cyan.500"
        opacity="0.1"
        filter="blur(80px)"
        zIndex={-1}
      />      {/* Botão de alternar tema */}
      {mounted && (
        <IconButton
          aria-label="Alternar tema"
          icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
          position="fixed"
          bottom="5"
          right="5"
          colorScheme={colorMode === 'light' ? 'blue' : 'yellow'}
          borderRadius="full"
          size="lg"
          onClick={toggleColorMode}
          zIndex="10"
        />
      )}

      {/* Elementos decorativos de gráficos */}
      <Box position="absolute" bottom="5%" left="10%" zIndex={-2} opacity={0.07}>
        <Icon as={FaChartLine} color="blue.300" w={28} h={28} />
      </Box>
      
      <Box position="absolute" top="15%" right="5%" zIndex={-2} opacity={0.07}>
        <Icon as={FaChartBar} color="cyan.300" w={20} h={20} />
      </Box>
      
      <Box position="absolute" bottom="20%" right="15%" zIndex={-2} opacity={0.07}>
        <Icon as={FaChartPie} color="blue.200" w={24} h={24} />
      </Box>
      
      <Box position="absolute" top="30%" left="15%" zIndex={-2} opacity={0.07}>
        <Icon as={FaChartArea} color="blue.400" w={20} h={20} />
      </Box>

      {/* Conteúdo principal */}
      <Container maxW="container.xl" p={0} h="100vh">
        <Flex h="100%" align="center" justify="center">
          <LoginCard />
        </Flex>
      </Container>
    </Box>
  )
}
