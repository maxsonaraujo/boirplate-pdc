'use client'
import { Box, Center, Heading, Stack, Text, Icon } from '@chakra-ui/react'
import Image from 'next/image'
import { FaUtensils, FaWineGlassAlt, FaClipboardList } from 'react-icons/fa'

export function LogoForm() {
    return (
        <Box 
            height={'100%'} 
            flex={1} 
            borderRightRadius={'xl'} 
            display={['none', 'none', 'unset']}
            bgImage="url('/img/restaurant-bg.jpg')"
            bgSize="cover"
            bgPosition="center"
            position="relative"
            overflow="hidden"
        >
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(0, 0, 0, 0.7)"
                backdropFilter="blur(3px)"
            />
            
            <Center height={'100%'} position="relative" zIndex={1}>
                <Stack align={'center'} spacing={6}>
                    <Box 
                        p={4} 
                        bg="teal.500" 
                        rounded="full" 
                        boxShadow="0 0 20px rgba(0, 255, 255, 0.3)"
                    >
                        <Icon as={FaUtensils} w={10} h={10} color="white" />
                    </Box>
                    
                    <Heading color={'white'} size="2xl" fontWeight="bold">
                        Degusflow
                    </Heading>
                    
                    <Text color={'white'} fontSize="lg" textAlign="center" maxW="80%" fontWeight="medium">
                        Sistema completo para gerenciamento de restaurantes
                    </Text>
                    
                    <Stack direction="row" spacing={6} mt={6}>
                        <Box textAlign="center">
                            <Icon as={FaClipboardList} w={8} h={8} color="teal.300" mb={2} />
                            <Text color="white" fontWeight="medium">Comandas</Text>
                        </Box>
                        
                        <Box textAlign="center">
                            <Icon as={FaWineGlassAlt} w={8} h={8} color="teal.300" mb={2} />
                            <Text color="white" fontWeight="medium">Cardápios</Text>
                        </Box>
                    </Stack>
                    
                    <Text fontWeight={'medium'} mt={10} color={'teal.200'}>Desenvolvido por MiWTeaM</Text>
                </Stack>
            </Center>
        </Box>
    )
}
