'use client'

import {
  Box,
  Drawer,
  DrawerContent,
  Flex,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react'
import { Sidebar } from '../organismes/Sidebar'
import { TopNav } from '../organismes/TopNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function DashboardLayout({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const bgColor = useColorModeValue("gray.50", "gray.900");

  useEffect(() => {
    setIsClient(true)

    // Verificação de autenticação - agora feita no lado do cliente
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/check-auth')
        const data = await response.json()

        if (!data.authenticated) {
          router.push('/')
        } else {
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        router.push('/')
      }
    }

    checkAuth()
  }, [router])

  // Não renderizar no servidor para evitar problemas de hidratação
  // ou se não estiver autenticado
  if (!isClient || !isAuthenticated) return null

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Sidebar para versão desktop */}
      <Sidebar
        display={{ base: 'none', md: 'flex' }}
        onClose={() => onClose}
      />

      {/* Drawer para versão mobile */}
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <Sidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Conteúdo principal */}
      <Box
        ml={{ base: 0, md: 80 }}
        transition=".3s ease"
      >
        <TopNav onOpen={onOpen} />

        <Box
          as="main"
          p={4}
          minH="calc(100vh - 64px)" // Ajusta altura considerando o TopNav
          bg={bgColor}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
