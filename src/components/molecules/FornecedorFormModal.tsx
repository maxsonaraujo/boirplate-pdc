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
  VStack,
  Textarea,
  useToast,
  SimpleGrid,
  HStack,
  Switch,
  FormErrorMessage,
  Box,
  Divider,
  Text,
} from '@chakra-ui/react';
import { FaSave, FaTimes } from 'react-icons/fa';

// Interface para o tipo Fornecedor
interface Fornecedor {
  id?: number;
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  telefone: string;
  email: string;
  endereco: string;
  contato: string;
  observacoes: string;
  status: boolean;
}

interface FornecedorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedor: Fornecedor | null;
  onSuccess: () => void;
}

export function FornecedorFormModal({ isOpen, onClose, fornecedor, onSuccess }: FornecedorFormModalProps) {
  // Estado inicial do formulário
  const initialState: Fornecedor = {
    codigo: '',
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    telefone: '',
    email: '',
    endereco: '',
    contato: '',
    observacoes: '',
    status: true,
  };

  // Estados
  const [formData, setFormData] = useState<Fornecedor>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  // Atualizar dados do formulário quando o fornecedor muda
  useEffect(() => {
    if (fornecedor) {
      setFormData(fornecedor);
    } else {
      setFormData(initialState);
    }
  }, [fornecedor, isOpen]);

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
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código é obrigatório';
    }

    if (!formData.razaoSocial.trim()) {
      newErrors.razaoSocial = 'Razão Social é obrigatória';
    }

    // CNPJ não é obrigatório, mas se preenchido deve ter um formato válido
    if (formData.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/.test(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido';
    }

    // Email não é obrigatório, mas se preenchido deve ser válido
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para submissão do formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = fornecedor?.id 
        ? `/api/fornecedores/${fornecedor.id}` 
        : '/api/fornecedores';
      
      const method = fornecedor?.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar fornecedor');
      }
      
      toast({
        title: 'Sucesso',
        description: fornecedor?.id 
          ? 'Fornecedor atualizado com sucesso' 
          : 'Fornecedor criado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o fornecedor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatação de CNPJ ao digitar
  const formatCNPJ = (value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '');
    
    // Aplica a máscara
    if (numericValue.length <= 14) {
      let formattedValue = numericValue;
      
      if (numericValue.length > 2) {
        formattedValue = numericValue.replace(/^(\d{2})/, '$1.');
      }
      
      if (numericValue.length > 5) {
        formattedValue = formattedValue.replace(/^(\d{2}\.)(\d{3})/, '$1$2.');
      }
      
      if (numericValue.length > 8) {
        formattedValue = formattedValue.replace(/^(\d{2}\.\d{3}\.)(\d{3})/, '$1$2/');
      }
      
      if (numericValue.length > 12) {
        formattedValue = formattedValue.replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})/, '$1-');
      }
      
      return formattedValue;
    }
    
    return value;
  };

  // Handler para o campo de CNPJ com formatação
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCNPJ(e.target.value);
    setFormData((prev) => ({
      ...prev,
      cnpj: formattedValue,
    }));
    
    // Limpar erro do campo quando ele é alterado
    if (errors.cnpj) {
      setErrors((prev) => ({
        ...prev,
        cnpj: '',
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {fornecedor?.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired isInvalid={!!errors.codigo}>
                <FormLabel>Código</FormLabel>
                <Input
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  placeholder="Ex: FORN001"
                />
                <FormErrorMessage>{errors.codigo}</FormErrorMessage>
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
            </SimpleGrid>

            <FormControl isRequired isInvalid={!!errors.razaoSocial}>
              <FormLabel>Razão Social</FormLabel>
              <Input
                name="razaoSocial"
                value={formData.razaoSocial}
                onChange={handleChange}
                placeholder="Razão Social"
              />
              <FormErrorMessage>{errors.razaoSocial}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Nome Fantasia</FormLabel>
              <Input
                name="nomeFantasia"
                value={formData.nomeFantasia}
                onChange={handleChange}
                placeholder="Nome Fantasia"
              />
            </FormControl>

            <Divider />
            
            <Box>
              <Text fontWeight="medium" mb={2}>Informações Fiscais</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.cnpj}>
                  <FormLabel>CNPJ</FormLabel>
                  <Input
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                  />
                  <FormErrorMessage>{errors.cnpj}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Inscrição Estadual</FormLabel>
                  <Input
                    name="inscricaoEstadual"
                    value={formData.inscricaoEstadual}
                    onChange={handleChange}
                    placeholder="Inscrição Estadual"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="medium" mb={2}>Informações de Contato</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Telefone</FormLabel>
                  <Input
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                  />
                </FormControl>

                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@exemplo.com"
                    type="email"
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <FormControl mt={4}>
                <FormLabel>Endereço</FormLabel>
                <Input
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  placeholder="Endereço completo"
                />
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Contato (Nome)</FormLabel>
                <Input
                  name="contato"
                  value={formData.contato}
                  onChange={handleChange}
                  placeholder="Nome da pessoa de contato"
                />
              </FormControl>
            </Box>

            <FormControl>
              <FormLabel>Observações</FormLabel>
              <Textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                placeholder="Observações adicionais sobre o fornecedor"
                rows={3}
              />
            </FormControl>
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
