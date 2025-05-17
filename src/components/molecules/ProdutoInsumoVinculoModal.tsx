import { useState, useEffect } from 'react';
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
  Select,
  VStack,
  useToast,
  Text,
  Box,
  HStack,
  Badge,
  Divider,
  RadioGroup,
  Radio,
  Stack,
  FormHelperText,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FaSave, FaTimes, FaSync, FaPlus } from 'react-icons/fa';

interface InsumoBasico {
  id: number;
  codigo: string;
  nome: string;
  estoqueAtual: number;
  unidadeMedida?: {
    id: number;
    nome: string;
    simbolo: string;
  };
}

interface Produto {
  id: number;
  codigo: string;
  nome: string;
  controlaEstoque: boolean;
  insumoVinculadoId?: number;
}

interface ProdutoInsumoVinculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  onSuccess: () => void;
}

export function ProdutoInsumoVinculoModal({
  isOpen,
  onClose,
  produto,
  onSuccess,
}: ProdutoInsumoVinculoModalProps) {
  const [insumos, setInsumos] = useState<InsumoBasico[]>([]);
  const [selectedInsumoId, setSelectedInsumoId] = useState<number | null>(null);
  const [vinculoMode, setVinculoMode] = useState<'existente' | 'novo'>('existente');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const toast = useToast();

  // Carregar insumos existentes
  useEffect(() => {
    const fetchInsumos = async () => {
      if (!isOpen || !produto) return;
      
      setIsFetching(true);
      try {
        const response = await fetch('/api/estoque/insumos?status=true&limit=100');
        if (response.ok) {
          const data = await response.json();
          setInsumos(data.insumos);
          
          // Se produto já tem insumo vinculado, selecioná-lo
          if (produto.insumoVinculadoId) {
            setSelectedInsumoId(produto.insumoVinculadoId);
            setVinculoMode('existente');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar insumos:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchInsumos();
  }, [isOpen, produto]);

  const handleSave = async () => {
    if (!produto) return;
    
    setIsLoading(true);
    try {
      if (vinculoMode === 'existente' && !selectedInsumoId) {
        throw new Error('Selecione um insumo para vincular');
      }
      
      // Se for criar um novo insumo a partir do produto
      if (vinculoMode === 'novo') {
        // Chamar API para criar um novo insumo com base no produto
        const response = await fetch(`/api/produtos/${produto.id}/criar-insumo`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro ao criar insumo a partir do produto');
        }
        
        toast({
          title: 'Sucesso',
          description: 'Novo insumo criado e vinculado ao produto',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Vincular produto a um insumo existente
        const response = await fetch(`/api/produtos/${produto.id}/vincular-insumo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insumoId: selectedInsumoId,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro ao vincular produto ao insumo');
        }
        
        toast({
          title: 'Sucesso',
          description: 'Produto vinculado ao insumo com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDesvincular = async () => {
    if (!produto) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/produtos/${produto.id}/desvincular-insumo`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao desvincular insumo do produto');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Insumo desvinculado do produto com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!produto) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Vincular Produto a Insumo</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box p={3} borderWidth="1px" borderRadius="md">
              <Text fontWeight="bold">{produto.nome}</Text>
              <HStack mt={1}>
                <Badge colorScheme="blue">{produto.codigo}</Badge>
                <Badge colorScheme={produto.controlaEstoque ? "green" : "gray"}>
                  {produto.controlaEstoque ? "Controla Estoque" : "Sem Controle de Estoque"}
                </Badge>
              </HStack>
            </Box>
            
            {produto.insumoVinculadoId && (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text>Este produto já está vinculado a um insumo.</Text>
                  <Button 
                    size="sm" 
                    colorScheme="red" 
                    variant="link" 
                    mt={1}
                    leftIcon={<FaTimes />}
                    onClick={handleDesvincular}
                    isLoading={isLoading}
                  >
                    Desvincular insumo
                  </Button>
                </Box>
              </Alert>
            )}
            
            <Divider />
            
            <RadioGroup onChange={(val) => setVinculoMode(val as 'existente' | 'novo')} value={vinculoMode}>
              <Stack direction="column">
                <Radio value="existente">Vincular a um insumo existente</Radio>
                <Radio value="novo">Criar um novo insumo a partir deste produto</Radio>
              </Stack>
            </RadioGroup>
            
            {vinculoMode === 'existente' ? (
              <FormControl>
                <FormLabel>Selecione o insumo:</FormLabel>
                <Select 
                  placeholder="Selecione um insumo..."
                  value={selectedInsumoId?.toString() || ""}
                  onChange={(e) => setSelectedInsumoId(parseInt(e.target.value) || null)}
                  isDisabled={isFetching}
                >
                  {insumos.map((insumo) => (
                    <option key={insumo.id} value={insumo.id}>
                      {insumo.codigo} - {insumo.nome} ({insumo.estoqueAtual} {insumo.unidadeMedida?.simbolo})
                    </option>
                  ))}
                </Select>
                <FormHelperText>
                  O estoque do produto será sincronizado com o insumo selecionado.
                </FormHelperText>
              </FormControl>
            ) : (
              <Box>
                <Text mb={2}>Um novo insumo será criado com as seguintes características:</Text>
                <VStack align="start" spacing={2} ml={4}>
                  <Text>• Código: {produto.codigo}</Text>
                  <Text>• Nome: {produto.nome}</Text>
                  <Text>• Estoque inicial: 0</Text>
                </VStack>
                <FormHelperText mt={2}>
                  Você poderá editar os detalhes do insumo após a criação.
                </FormHelperText>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="outline" 
            mr={3} 
            onClick={onClose}
            leftIcon={<FaTimes />}
          >
            Cancelar
          </Button>
          
          <Button 
            colorScheme="blue" 
            onClick={handleSave}
            isLoading={isLoading}
            leftIcon={vinculoMode === 'existente' ? <FaSync /> : <FaPlus />}
          >
            {vinculoMode === 'existente' ? 'Vincular' : 'Criar e Vincular'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
