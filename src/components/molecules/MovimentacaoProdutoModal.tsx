import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  FormErrorMessage,
  Textarea,
  useToast,
  VStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  Box,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';

interface MovimentacaoProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto?: any;
  onSuccess?: () => void;
}

export function MovimentacaoProdutoModal({
  isOpen,
  onClose,
  produto,
  onSuccess,
}: MovimentacaoProdutoModalProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    tipo: 'ENTRADA',
    quantidade: '1',
    observacao: '',
  });

  // Reset do formulário quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setFormData({
        tipo: 'ENTRADA',
        quantidade: '1',
        observacao: '',
      });
      setErrors({});
    }
  }, [isOpen, produto]);
  
  // Handler para alteração dos campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
  
  // Handler para campos numéricos
  const handleNumberChange = (name: string, value: string) => {
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
    
    if (!formData.tipo) {
      newErrors.tipo = 'O tipo de movimentação é obrigatório';
    }
    
    const quantidade = parseFloat(formData.quantidade);
    if (isNaN(quantidade) || quantidade <= 0) {
      newErrors.quantidade = 'A quantidade deve ser maior que zero';
    }
    
    // Verificar se tem estoque suficiente para saídas
    if (formData.tipo === 'SAIDA' && produto && quantidade > produto.estoqueAtual) {
      newErrors.quantidade = `Estoque insuficiente. Disponível: ${produto.estoqueAtual}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !produto) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/estoque/produtos/movimentar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produtoId: produto.id,
          tipo: formData.tipo,
          quantidade: parseFloat(formData.quantidade),
          observacao: formData.observacao,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar movimentação');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Movimentação registrada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao registrar a movimentação',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!produto) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Movimentação de Estoque - Produto</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Text fontWeight="bold">Produto:</Text>
                <Text>{produto?.nome}</Text>
              </HStack>
              
              <HStack>
                <Text fontWeight="bold">Estoque Atual:</Text>
                <Badge colorScheme={produto?.estoqueAtual <= 0 ? 'red' : 'green'}>
                  {produto?.estoqueAtual} {produto?.unidadeMedida?.simbolo || 'un.'}
                </Badge>
              </HStack>
              
              {produto.insumoVinculadoId && (
                <Alert status="info" size="sm">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Este produto está vinculado a um insumo.</Text>
                    <Text fontSize="sm">
                      Ao movimentar o estoque deste produto, o insumo vinculado também será atualizado 
                      automaticamente na proporção de {produto.qtdInsumoConsumida || 1} unidade(s) por produto.
                    </Text>
                  </Box>
                </Alert>
              )}
              
              <FormControl isRequired isInvalid={!!errors.tipo}>
                <FormLabel>Tipo de Movimentação</FormLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                  <option value="AJUSTE">Ajuste de Estoque</option>
                </Select>
                {errors.tipo && (
                  <FormErrorMessage>{errors.tipo}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors.quantidade}>
                <FormLabel>Quantidade</FormLabel>
                <NumberInput
                  min={0.01}
                  step={0.1}
                  precision={2}
                  value={formData.quantidade}
                  onChange={(value) => handleNumberChange('quantidade', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                {errors.quantidade && (
                  <FormErrorMessage>{errors.quantidade}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl>
                <FormLabel>Observação</FormLabel>
                <Textarea
                  name="observacao"
                  value={formData.observacao}
                  onChange={handleChange}
                  placeholder="Observação da movimentação"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit" 
              isLoading={isSubmitting}
            >
              Confirmar
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
