import { useState } from 'react';
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
  Textarea,
  useToast,
  Switch,
  HStack,
  Text,
  FormErrorMessage,
} from '@chakra-ui/react';
import { FaSave, FaTimes } from 'react-icons/fa';

interface CategoriaInsumoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (categoria: any) => void;
}

export function CategoriaInsumoFormModal({
  isOpen,
  onClose,
  onSuccess,
}: CategoriaInsumoFormModalProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    status: true,
  });
  const [errors, setErrors] = useState<any>({});

  // Handler para mudanças nos campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpar erro do campo quando ele é alterado
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handler para o toggle de status
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.checked,
    }));
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome da categoria é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para submissão do formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/estoque/categorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao salvar categoria');
      }

      const data = await response.json();
      
      // Chamar callback de sucesso com a nova categoria
      if (onSuccess && data.categoria) {
        onSuccess(data.categoria);
      }
      
      // Resetar o formulário
      setFormData({
        nome: '',
        descricao: '',
        status: true,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar a categoria',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Nova Categoria de Insumo</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <FormControl isRequired isInvalid={!!errors.nome} mb={4}>
            <FormLabel>Nome da Categoria</FormLabel>
            <Input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: Bebidas, Carnes, Embalagens..."
            />
            {errors.nome && <FormErrorMessage>{errors.nome}</FormErrorMessage>}
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Descrição</FormLabel>
            <Textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Descrição opcional da categoria"
              rows={3}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Status</FormLabel>
            <HStack>
              <Switch
                isChecked={formData.status}
                onChange={handleStatusChange}
                colorScheme="green"
                size="lg"
              />
              <Text>{formData.status ? 'Ativo' : 'Inativo'}</Text>
            </HStack>
          </FormControl>
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
            colorScheme="teal"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<FaSave />}
          >
            Salvar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
