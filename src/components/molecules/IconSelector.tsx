'use client'

import { 
  Box, 
  Button, 
  Grid, 
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  useColorModeValue,
  HStack,
  Text
} from '@chakra-ui/react'
import { useState } from 'react'
import * as FaIcons from 'react-icons/fa'
import * as BiIcons from 'react-icons/bi'
import * as GiIcons from 'react-icons/gi'

// Lista de ícones disponíveis
const iconsList = {
  // Ícones de comida/restaurante
  FaUtensils: FaIcons.FaUtensils,
  GiMeat: GiIcons.GiMeat,
  FaGlassMartiniAlt: FaIcons.FaGlassMartiniAlt,
  FaCocktail: FaIcons.FaCocktail,
  FaPizzaSlice: FaIcons.FaPizzaSlice,
  FaHamburger: FaIcons.FaHamburger,
  FaCoffee: FaIcons.FaCoffee,
  FaWineGlassAlt: FaIcons.FaWineGlassAlt,
  FaBeer: FaIcons.FaBeer,
  FaIceCream: FaIcons.FaIceCream,
  FaCheese: FaIcons.FaCheese,
  FaFish: FaIcons.FaFish,
  FaCarrot: FaIcons.FaCarrot,
  FaAppleAlt: FaIcons.FaAppleAlt,
  FaEgg: FaIcons.FaEgg,
  FaBreadSlice: FaIcons.FaBreadSlice,
  FaLeaf: FaIcons.FaLeaf,
  GiNoodles: GiIcons.GiNoodles,
  GiSteak: GiIcons.GiSteak,
  GiChickenLeg: GiIcons.GiChickenLeg,
  GiCupcake: GiIcons.GiCupcake,
  GiFrenchFries: GiIcons.GiFrenchFries,
  GiSushis: GiIcons.GiSushis,
  GiTaco: GiIcons.GiTacos,
  GiBacon: GiIcons.GiBacon,
  GiSausage: GiIcons.GiSausage,
  GiMeatCleaver: GiIcons.GiMeatCleaver,
  GiSteakKnife: GiIcons.GiSteak,
  GiDrumstick: GiIcons.GiDrum,
  FaGlassWhiskey: FaIcons.FaGlassWhiskey,
  GiSandwich: GiIcons.GiSandwich,
  // Ícones gerais
  FaTag: FaIcons.FaTag,
  FaTags: FaIcons.FaTags,
  FaStar: FaIcons.FaStar,
  FaHeart: FaIcons.FaHeart,
  FaThumbsUp: FaIcons.FaThumbsUp,
  FaFireAlt: FaIcons.FaFireAlt,
  FaBolt: FaIcons.FaBolt,
  FaGift: FaIcons.FaGift,
  FaMedal: FaIcons.FaMedal,
  FaTrophy: FaIcons.FaTrophy,

}

interface IconSelectorProps {
  selectedIcon: string
  onChange: (iconName: string) => void
}

export function IconSelector({ selectedIcon, onChange }: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleSelectIcon = (iconName) => {
    onChange(iconName)
    setIsOpen(false)
  }
  
  // Obter o componente de ícone selecionado
  const SelectedIconComponent = iconsList[selectedIcon] || FaIcons.FaUtensils
  
  return (
    <Box>
      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom"
        autoFocus={false}
      >
        <PopoverTrigger>
          <Button 
            onClick={() => setIsOpen(!isOpen)}
            w="full"
            justifyContent="space-between"
            bg={useColorModeValue('gray.100', 'whiteAlpha.100')}
            _hover={{ bg: useColorModeValue('gray.200', 'whiteAlpha.200') }}
            h="40px"
          >
            <HStack>
              <Icon as={SelectedIconComponent} boxSize="1.2em" />
              <Text>{selectedIcon}</Text>
            </HStack>
          </Button>
        </PopoverTrigger>
        <PopoverContent w="300px">
          <PopoverArrow />
          <PopoverBody maxH="250px" overflowY="auto" p={4}>
            <Grid templateColumns="repeat(5, 1fr)" gap={2}>
              {Object.entries(iconsList).map(([name, IconComponent]) => (
                <Box
                  key={name}
                  p={2}
                  borderRadius="md"
                  cursor="pointer"
                  bg={name === selectedIcon ? useColorModeValue('teal.100', 'teal.800') : 'transparent'}
                  color={name === selectedIcon ? 'teal.500' : undefined}
                  textAlign="center"
                  transition="all 0.2s"
                  _hover={{
                    bg: useColorModeValue('gray.100', 'whiteAlpha.100'),
                    transform: 'scale(1.1)',
                  }}
                  onClick={() => handleSelectIcon(name)}
                >
                  <Icon as={IconComponent} boxSize="1.5em" />
                </Box>
              ))}
            </Grid>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  )
}
