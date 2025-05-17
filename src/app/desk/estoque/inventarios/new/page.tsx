'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Stack,
  Textarea,
  useToast,
  Text,
  Icon,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { FaBoxOpen, FaSave, FaTimes } from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';

export default function NovoInventarioPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const router = useRouter();
  const bgCard = useColorModeValue('white', 'gray.800');
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    codigo: '',
    dataInicio: new Date().toISOString().split('T')[0],
    observacoes: '',
  });
  
  // Estado de erro e carregamento
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handler para alteração de inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Limpar erro quando o campo é alterado
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  // Validação do formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.codigo.trim()) {
      newErrors.codigo = 'O código do inventário é obrigatório';
    }
    
    if (!formData.dataInicio) {
      newErrors.dataInicio = 'A data de início é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handler para envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/estoque/inventarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: 'PENDENTE',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar inventário');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Sucesso',
        description: 'Inventário criado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirecionar para a página do inventário criado
      router.push(`/estoque/inventarios/${data.inventario.id}`);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o inventário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box p={5}>
      <Heading size="lg" mb={6}>
        <HStack>
          <Icon as={FaBoxOpen} />
          <Text>Novo Inventário de Estoque</Text>
        </HStack>
      </Heading>
      
      <form onSubmit={handleSubmit}>
        <Card bg={bgCard} mb={6} boxShadow="md">
          <CardHeader>
            <Heading size="md">Informações Básicas</Heading>
          </CardHeader>
          
          <CardBody>
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              <GridItem colSpan={{ base: 12, md: 6 }}>
                <FormControl isRequired isInvalid={!!errors.codigo}>
                  <FormLabel>Código do Inventário</FormLabel>
                  <Input
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleChange}
                    placeholder="Ex: INV-2023-001"
                  />
                  <FormErrorMessage>{errors.codigo}</FormErrorMessage>
                </FormControl>
              </GridItem>
              
              <GridItem colSpan={{ base: 12, md: 6 }}>
                <FormControl isRequired isInvalid={!!errors.dataInicio}>
                  <FormLabel>Data de Início</FormLabel>
                  <Input
                    type="date"
                    name="dataInicio"
                    value={formData.dataInicio}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.dataInicio}</FormErrorMessage>
                </FormControl>
              </GridItem>
              
              <GridItem colSpan={12}>
                <FormControl>
                  <FormLabel>Observações</FormLabel>
                  <Textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    placeholder="Observações sobre este inventário..."
                    rows={4}
                  />
                </FormControl>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>
        
        <Flex justify="flex-end" gap={4}>
          <Button
            leftIcon={<FaTimes />}
            onClick={() => router.back()}
            variant="outline"
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            colorScheme="blue"
            leftIcon={<FaSave />}
            isLoading={isSubmitting}
          >
            Salvar Inventário
          </Button>
        </Flex>
      </form>
    </Box>
  );
}
