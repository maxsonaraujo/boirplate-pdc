import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  Box,
  Text,
  useToast,
  Flex,
  Badge,
  Divider,
  FormErrorMessage,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useState, useRef } from 'react';
import { formatCurrency } from '@/utils/format';

const TIPOS_MOVIMENTACAO = [
  { value: 'ENTRADA', label: 'Entrada de Estoque', color: 'green' },
  { value: 'SAIDA', label: 'Saída de Estoque', color: 'red' },
  { value: 'PRODUCAO', label: 'Saída para Produção', color: 'blue' },
  { value: 'DESCARTE', label: 'Descarte', color: 'orange' },
  { value: 'AJUSTE', label: 'Ajuste de Inventário', color: 'purple' },
];

interface MovimentacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: any;
  onSuccess: () => void;
}

export function MovimentacaoModal({ isOpen, onClose, insumo, onSuccess }: MovimentacaoModalProps) {
  const [tipoMovimentacao, setTipoMovimentacao] = useState('ENTRADA');
  const [quantidade, setQuantidade] = useState(0);
  const [observacao, setObservacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const toast = useToast();
  const cancelRef = useRef(null);

  // Reseta o formulário quando o modal é aberto ou o insumo muda
  const resetForm = () => {
    setTipoMovimentacao('ENTRADA');
    setQuantidade(0);
    setObservacao('');
    setErrors({});
  };

  // Efeito para resetar o formulário quando o modal é aberto
  if (!isOpen) {
    resetForm();
  }

  const handleSubmit = async () => {
    // Validações básicas
    const newErrors: any = {};
    
    if (quantidade <= 0) {
      newErrors.quantidade = 'Quantidade deve ser maior que zero';
    }

    // Para saídas, verificar se há estoque suficiente
    if (
      ['SAIDA', 'PRODUCAO', 'DESCARTE'].includes(tipoMovimentacao) && 
      quantidade > insumo?.estoqueAtual
    ) {
      newErrors.quantidade = 'Quantidade maior que o estoque disponível';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Abrir confirmação para tipos específicos
    if (['DESCARTE', 'AJUSTE'].includes(tipoMovimentacao)) {
      setIsConfirmOpen(true);
      return;
    }

    // Se não precisar de confirmação especial, continuar com o registro
    await registrarMovimentacao();
  };

  const registrarMovimentacao = async () => {
    try {
      setIsSubmitting(true);
      
      const data = {
        insumoId: insumo.id,
        tipoMovimentacao,
        quantidade,
        observacao,
      };
      
      const response = await fetch('/api/estoque/movimentacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao processar a solicitação',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  // Determinar a cor baseada no tipo de movimentação
  const getTipoColor = (tipo: string) => {
    const tipoConfig = TIPOS_MOVIMENTACAO.find(t => t.value === tipo);
    return tipoConfig?.color || 'gray';
  };

  // Se não tem insumo selecionado, não mostra o modal
  if (!insumo && isOpen) {
    return null;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Movimentação de Estoque</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {insumo && (
              <>
                <Flex justify="space-between" align="center" mb={4}>
                  <HStack>
                    <Text fontWeight="bold">{insumo.nome}</Text>
                    <Badge colorScheme="blue">{insumo.codigo}</Badge>
                  </HStack>
                  <Badge colorScheme="green" p={1} fontSize="md">
                    Estoque: {insumo.estoqueAtual.toFixed(2)} {insumo.unidadeMedida?.simbolo || ''}
                  </Badge>
                </Flex>
                
                <Divider mb={4} />
                
                <FormControl mb={4} isRequired isInvalid={!!errors.tipoMovimentacao}>
                  <FormLabel>Tipo de Movimentação</FormLabel>
                  <Select 
                    value={tipoMovimentacao} 
                    onChange={(e) => setTipoMovimentacao(e.target.value)}
                  >
                    {TIPOS_MOVIMENTACAO.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </Select>
                  <FormHelperText>
                    Selecione o tipo de movimentação que deseja registrar
                  </FormHelperText>
                  {errors.tipoMovimentacao && (
                    <FormErrorMessage>{errors.tipoMovimentacao}</FormErrorMessage>
                  )}
                </FormControl>
                
                <FormControl mb={4} isRequired isInvalid={!!errors.quantidade}>
                  <FormLabel>Quantidade</FormLabel>
                  <NumberInput 
                    min={0.01} 
                    step={0.01}
                    value={quantidade} 
                    onChange={(valueStr) => setQuantidade(parseFloat(valueStr) || 0)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    {tipoMovimentacao === 'AJUSTE' 
                      ? 'Informe o valor final do estoque após o ajuste' 
                      : `Informe a quantidade em ${insumo.unidadeMedida?.nome || 'unidades'}`}
                  </FormHelperText>
                  {errors.quantidade && (
                    <FormErrorMessage>{errors.quantidade}</FormErrorMessage>
                  )}
                </FormControl>
                
                <FormControl mb={4}>
                  <FormLabel>Observação</FormLabel>
                  <Textarea 
                    value={observacao} 
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Opcional: Informe detalhes sobre esta movimentação"
                  />
                </FormControl>

                {/* Sumário da movimentação */}
                <Box 
                  p={3} 
                  bg="gray.50" 
                  borderRadius="md" 
                  borderLeft="4px" 
                  borderColor={`${getTipoColor(tipoMovimentacao)}.500`}
                >
                  <Text fontSize="sm" fontWeight="bold" mb={1}>
                    Sumário da movimentação
                  </Text>
                  
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm">Estoque atual:</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {insumo.estoqueAtual.toFixed(2)} {insumo.unidadeMedida?.simbolo}
                    </Text>
                  </HStack>
                  
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm">
                      {tipoMovimentacao === 'AJUSTE' 
                        ? 'Novo estoque:' 
                        : `${tipoMovimentacao === 'ENTRADA' ? 'Entrada' : 'Saída'} de:`}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {quantidade.toFixed(2)} {insumo.unidadeMedida?.simbolo}
                    </Text>
                  </HStack>
                  
                  <Divider my={2} />
                  
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="bold">Estoque resultante:</Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {tipoMovimentacao === 'AJUSTE'
                        ? quantidade.toFixed(2)
                        : tipoMovimentacao === 'ENTRADA'
                          ? (insumo.estoqueAtual + quantidade).toFixed(2)
                          : (insumo.estoqueAtual - quantidade).toFixed(2)
                      } {insumo.unidadeMedida?.simbolo}
                    </Text>
                  </HStack>
                </Box>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme={getTipoColor(tipoMovimentacao)}
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Registrar Movimentação
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Diálogo de confirmação para movimentações que precisam de verificação extra */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar {tipoMovimentacao === 'DESCARTE' ? 'Descarte' : 'Ajuste'}
            </AlertDialogHeader>

            <AlertDialogBody>
              {tipoMovimentacao === 'DESCARTE' ? (
                <Text>
                  Você está prestes a registrar um descarte de {quantidade.toFixed(2)} {insumo?.unidadeMedida?.simbolo} 
                  de <strong>{insumo?.nome}</strong>. Esta operação não pode ser desfeita.
                </Text>
              ) : (
                <Text>
                  Você está prestes a ajustar o estoque de <strong>{insumo?.nome}</strong> para {quantidade.toFixed(2)} {insumo?.unidadeMedida?.simbolo}. 
                  Esta operação não pode ser desfeita e vai substituir o valor atual.
                </Text>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button 
                colorScheme={tipoMovimentacao === 'DESCARTE' ? 'red' : 'purple'} 
                onClick={registrarMovimentacao} 
                ml={3}
                isLoading={isSubmitting}
              >
                Confirmar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
