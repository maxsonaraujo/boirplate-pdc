'use client'

import { Box, HStack, Input, useColorModeValue } from '@chakra-ui/react'
import { useState } from 'react'

// Lista de cores pré-definidas
const presetColors = [
  '#E53E3E', // red.500
  '#DD6B20', // orange.500
  '#D69E2E', // yellow.500
  '#38A169', // green.500
  '#319795', // teal.500
  '#3182CE', // blue.500
  '#6B46C1', // purple.500
  '#805AD5', // purple.400
  '#D53F8C', // pink.500
  '#718096', // gray.500
]

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [showInput, setShowInput] = useState(false)
  
  const handleColorClick = (newColor) => {
    onChange(newColor)
    setShowInput(false)
  }
  
  return (
    <Box>
      <HStack spacing={2} mb={2}>
        {presetColors.map((presetColor) => (
          <Box
            key={presetColor}
            w="24px"
            h="24px"
            borderRadius="md"
            bg={presetColor}
            cursor="pointer"
            onClick={() => handleColorClick(presetColor)}
            border="2px solid"
            borderColor={color === presetColor ? 'gray.300' : 'transparent'}
            _hover={{ transform: 'scale(1.1)' }}
            transition="all 0.2s"
          />
        ))}
        
        <Box
          w="24px"
          h="24px"
          borderRadius="md"
          border="1px dashed"
          borderColor={useColorModeValue('gray.300', 'gray.600')}
          cursor="pointer"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setShowInput(!showInput)}
          _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
        >
          +
        </Box>
      </HStack>
      
      {showInput && (
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          size="sm"
        />
      )}
      
      <Box
        mt={2}
        w="full"
        h="24px"
        borderRadius="md"
        bg={color}
        border="1px solid"
        borderColor={useColorModeValue('gray.300', 'gray.600')}
      />
    </Box>
  )
}
