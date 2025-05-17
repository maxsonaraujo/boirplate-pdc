'use client'

import {
  Box,
  Flex,
  Text,
  IconButton,
  useColorModeValue,
  HStack,
  Badge,
  Icon,
} from '@chakra-ui/react'
import { FaGripVertical, FaEdit, FaTrash } from 'react-icons/fa'
import { useDrag, useDrop } from 'react-dnd'
import { useRef } from 'react'

// Tipo do item arrastável
const CATEGORIA_ITEM = 'categoria'

export function DraggableCategoria({ categoria, index, moveCategoria, onDragStart, onDragEnd, onEdit, onDelete }) {
  // Referência para o elemento DOM atual
  const ref = useRef<any>(null)

  // Configuração de drag (arrastar) - API atualizada para o React DnD v14+
  const [{ isDragging }, dragRef, dragPreview] = useDrag({
    type: CATEGORIA_ITEM,
    item: () => {
      // Chamar onDragStart antes de começar o arrasto
      onDragStart && onDragStart()
      return { id: categoria.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // if (monitor.didDrop()) {
      onDragEnd && onDragEnd()
      // }
    },
  })

  // Configuração de drop (soltar)
  const [, dropRef] = useDrop({
    accept: CATEGORIA_ITEM,
    hover: (item: any, monitor) => {
      if (!ref.current) {
        return
      }

      const dragIndex = item.index
      const hoverIndex = index

      // Não substituir itens com eles mesmos
      if (dragIndex === hoverIndex) {
        return
      }

      // Determinar se está movendo para cima ou para baixo
      const hoverBoundingRect = ref?.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor?.getClientOffset() as any;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top

      // Apenas realizar a movimentação quando o cursor passar do meio do item
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Mover a categoria na lista
      moveCategoria(dragIndex, hoverIndex)

      // Atualizar o índice do item arrastado
      item.index = hoverIndex
    },
  })

  // Combinar as refs de drag e drop
  const connectRef = (node) => {
    ref.current = node
    dragRef(node)
    dropRef(node)
  }

  // Estilos para o item
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  return (
    <Box
      ref={dragPreview as any}
      opacity={isDragging ? 0.5 : 1}
      transform={isDragging ? 'scale(0.98)' : 'scale(1)'}
      transition="all 0.2s"
      data-handler-id={categoria.id}
      pointerEvents={isDragging ? 'none' : 'auto'}
    >
      <Flex
        ref={connectRef}
        p={3}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        justify="space-between"
        align="center"
        _hover={{ bg: hoverBg }}
        cursor="grab"
        userSelect="none"
        boxShadow={isDragging ? 'md' : 'none'}
      >
        <HStack>
          <Icon as={FaGripVertical} color="gray.400" boxSize={4} cursor="grab" />

          <Box w={3} h={3} bg={categoria.cor || 'gray.400'} borderRadius="full" />

          <Text fontWeight="medium">
            {categoria.nome}
          </Text>

          {!categoria.status && (
            <Badge colorScheme="red" ml={2}>
              Inativa
            </Badge>
          )}
        </HStack>

        <HStack>
          <Text fontSize="xs" color="gray.500" mr={2}>
            Ordem: {categoria.ordemExibicao || '-'}
          </Text>

          <IconButton
            icon={<FaEdit />}
            aria-label="Editar categoria"
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(categoria)
            }}
          />

          <IconButton
            icon={<FaTrash />}
            aria-label="Excluir categoria"
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(categoria)
            }}
          />
        </HStack>
      </Flex>
    </Box>
  )
}
