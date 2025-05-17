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
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';

interface MovimentacaoInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo?: any;
  onSuccess?: () => void;
}

export function MovimentacaoInsumoModal({
  isOpen,
  onClose,
  insumo,
  onSuccess,
}: MovimentacaoInsumoModalProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    tipoMovimentacao: 'ENTRADA',
    quantidade: '1',
    observacao: '',
  });

  // Reset do formulário quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setFormData({
        tipoMovimentacao: 'ENTRADA',
        quantidade: '1',
        observacao: '',
      });
      setErrors({});
    }
  }, [isOpen, insumo]);
  
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
    
    if (!formData.tipoMovimentacao) {
      newErrors.tipoMovimentacao = 'O tipo de movimentação é obrigatório';
    }
    
    const quantidade = parseFloat(formData.quantidade);
    if (isNaN(quantidade) || quantidade <= 0) {
      newErrors.quantidade = 'A quantidade deve ser maior que zero';
    }
    
    // Verificar se tem estoque suficiente para saídas
    if ((formData.tipoMovimentacao === 'SAIDA' || 
         formData.tipoMovimentacao === 'PRODUCAO' || 
         formData.tipoMovimentacao === 'DESCARTE') && 
        insumo && quantidade > insumo.estoqueAtual) {
      newErrors.quantidade = `Estoque insuficiente. Disponível: ${insumo.estoqueAtual}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !insumo) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/estoque/movimentacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insumoId: insumo.id,
          tipoMovimentacao: formData.tipoMovimentacao,
          quantidade: parseFloat(formData.quantidade),
          observacao: formData.observacao,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar movimentação');
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
  
  if (!insumo) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Movimentação de Estoque</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Text fontWeight="bold">Insumo:</Text>
                <Text>{insumo?.nome}</Text>
              </HStack>
              
              <HStack>
                <Text fontWeight="bold">Estoque Atual:</Text>
                <Badge colorScheme={insumo?.estoqueAtual <= 0 ? 'red' : 'green'}>
                  {insumo?.estoqueAtual} {insumo?.unidadeMedida?.simbolo}
                </Badge>
              </HStack>
              
              <FormControl isRequired isInvalid={!!errors.tipoMovimentacao}>
                <FormLabel>Tipo de Movimentação</FormLabel>
                <Select
                  name="tipoMovimentacao"
                  value={formData.tipoMovimentacao}
                  onChange={handleChange}
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                  <option value="PRODUCAO">Produção</option>
                  <option value="DESCARTE">Descarte</option>
                  <option value="AJUSTE">Ajuste de Estoque</option>
                </Select>
                {errors.tipoMovimentacao && (
                  <FormErrorMessage>{errors.tipoMovimentacao}</FormErrorMessage>
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
