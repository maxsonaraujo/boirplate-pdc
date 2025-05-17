'use client'

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
  Input,
  Textarea,
  Switch,
  VStack,
  useToast,
  FormErrorMessage,
  HStack,
  Spinner,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import { FaSave } from 'react-icons/fa';

interface UnidadeMedidaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidade?: {
    id: number;
    nome: string;
    simbolo: string;
    descricao?: string;
    status: boolean;
  } | null;
  onSuccess?: () => void;
}

export function UnidadeMedidaFormModal({ 
  isOpen, 
  onClose, 
  unidade = null, 
  onSuccess 
}: UnidadeMedidaFormModalProps) {
  const toast = useToast();
  const isEditing = Boolean(unidade?.id);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    simbolo: '',
    descricao: '',
    status: true
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inicializar formulário ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      if (unidade) {
        setFormData({
          nome: unidade.nome || '',
          simbolo: unidade.simbolo || '',
          descricao: unidade.descricao || '',
          status: unidade.status
        });
      } else {
        // Valores padrão para nova unidade
        setFormData({
          nome: '',
          simbolo: '',
          descricao: '',
          status: true
        });
      }
      setErrors({});
    }
  }, [isOpen, unidade]);
  
  // Manipuladores de mudanças de campo
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro ao editar campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.checked
    }));
  };
  
  // Validação de formulário
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.simbolo.trim()) {
      newErrors.simbolo = 'Símbolo é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submissão do formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const url = isEditing 
        ? `/api/unidades-medida/${unidade.id}` 
        : '/api/unidades-medida';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar unidade de medida');
      }
      
      toast({
        title: 'Sucesso',
        description: `Unidade de medida ${isEditing ? 'atualizada' : 'criada'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Chamar callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} unidade de medida`,
        status: 'error',
        duration: 3000,
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
        <ModalHeader>
          {isEditing ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired isInvalid={!!errors.nome}>
              <FormLabel>Nome</FormLabel>
              <Input
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Nome da unidade (ex: Quilo, Litro)"
              />
              {errors.nome && (
                <FormErrorMessage>{errors.nome}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.simbolo}>
              <FormLabel>Símbolo</FormLabel>
              <Input
                name="simbolo"
                value={formData.simbolo}
                onChange={handleInputChange}
                placeholder="Símbolo (ex: kg, L)"
                maxLength={10}
              />
              {errors.simbolo && (
                <FormErrorMessage>{errors.simbolo}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Descrição da unidade (opcional)"
                rows={3}
              />
            </FormControl>
            
            <FormControl>
              <HStack justify="space-between">
                <FormLabel htmlFor="status" mb="0">
                  Unidade Ativa
                </FormLabel>
                <Switch
                  id="status"
                  colorScheme="teal"
                  isChecked={formData.status}
                  onChange={handleSwitchChange}
                />
              </HStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose} isDisabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            colorScheme="teal" 
            leftIcon={<FaSave />} 
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Salvar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
