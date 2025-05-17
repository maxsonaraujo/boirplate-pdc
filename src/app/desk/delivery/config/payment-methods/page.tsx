'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Badge,
  Spinner,
  Flex,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Switch,
  useDisclosure,
  useColorModeValue,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Icon,
  IconButton,
  VStack,
  Tooltip,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaMoneyBillWave, FaCreditCard, FaRegMoneyBillAlt } from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';

interface PaymentMethod {
  id: number;
  code: string;
  name: string;
  active: boolean;
  acceptsChange: boolean;
}

export default function PaymentMethodsPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  
  // Estados
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  
  // Estado para formulário de método
  const [methodForm, setMethodForm] = useState({
    name: '',
    code: '',
    active: true,
    acceptsChange: false
  });
  
  // Estado para erros de formulário
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Modais
  const { 
    isOpen: isMethodModalOpen, 
    onOpen: onMethodModalOpen, 
    onClose: onMethodModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  
  // Buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar métodos de pagamento
        const methodsResponse = await fetch('/api/delivery/payment-methods');
        const methodsData = await methodsResponse.json();
        setMethods(methodsData.methods || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os métodos de pagamento',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Resetar formulário
  const resetForm = () => {
    setMethodForm({
      name: '',
      code: '',
      active: true,
      acceptsChange: false
    });
    setErrors({});
  };
  
  // Abrir modal para adicionar novo método
  const handleAddMethod = () => {
    resetForm();
    setSelectedMethod(null);
    onMethodModalOpen();
  };
  
  // Abrir modal para editar método existente
  const handleEditMethod = (method: PaymentMethod) => {
    setMethodForm({
      name: method.name,
      code: method.code,
      active: method.active,
      acceptsChange: method.acceptsChange
    });
    setSelectedMethod(method);
    onMethodModalOpen();
  };
  
  // Handler para mudanças no formulário
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement> | 
    { target: { name: string, value: any } }
  ) => {
    const { name, value } = e.target;
    setMethodForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro quando o campo for editado
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validação de formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!methodForm.name.trim()) {
      newErrors.name = 'Nome do método é obrigatório';
    }
    
    if (!selectedMethod && !methodForm.code.trim()) {
      newErrors.code = 'Código do método é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Salvar método (criar ou atualizar)
  const handleSaveMethod = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const isUpdate = !!selectedMethod;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate 
        ? `/api/delivery/payment-methods/${selectedMethod.id}` 
        : '/api/delivery/payment-methods';
      
      const requestData = isUpdate 
        ? { name: methodForm.name, active: methodForm.active, acceptsChange: methodForm.acceptsChange }
        : methodForm;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar método de pagamento');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Sucesso',
        description: `Método de pagamento ${isUpdate ? 'atualizado' : 'adicionado'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar lista de métodos
      if (isUpdate) {
        setMethods(prev => prev.map(m => m.id === selectedMethod.id ? data.method : m));
      } else {
        setMethods(prev => [...prev, data.method]);
      }
      
      onMethodModalClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar método de pagamento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handler para toggle de ativação/desativação
  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const response = await fetch(`/api/delivery/payment-methods/${method.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !method.active
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar método de pagamento');
      }
      
      const data = await response.json();
      
      // Atualizar status na lista
      setMethods(prev => 
        prev.map(m => m.id === method.id ? data.method : m)
      );
      
      toast({
        title: 'Sucesso',
        description: `Método de pagamento ${data.method.active ? 'ativado' : 'desativado'} com sucesso`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar método de pagamento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Preparar para excluir método
  const handleDeleteClick = (method: PaymentMethod) => {
    setSelectedMethod(method);
    onDeleteOpen();
  };
  
  // Confirmar exclusão de método
  const handleConfirmDelete = async () => {
    if (!selectedMethod) return;
    
    try {
      const response = await fetch(`/api/delivery/payment-methods/${selectedMethod.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir método de pagamento');
      }
      
      const data = await response.json();
      
      // Se for um método padrão, apenas atualizamos o status na lista
      if (data.method) {
        setMethods(prev => 
          prev.map(m => m.id === selectedMethod.id ? data.method : m)
        );
      } else {
        // Se não for padrão, removemos da lista
        setMethods(prev => 
          prev.filter(m => m.id !== selectedMethod.id)
        );
      }
      
      toast({
        title: 'Sucesso',
        description: data.message || 'Método de pagamento removido com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onDeleteClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir método de pagamento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Renderizar ícone apropriado para o método de pagamento
  const renderMethodIcon = (code: string) => {
    switch (code) {
      case 'credit_card':
        return <Icon as={FaCreditCard} color="blue.500" />;
      case 'money':
        return <Icon as={FaRegMoneyBillAlt} color="green.500" />;
      case 'pix':
        return <Icon as={FaMoneyBillWave} color="purple.500" />;
      default:
        return <Icon as={FaMoneyBillWave} color="gray.500" />;
    }
  };
  
  // Verificar se o método é padrão
  const isDefaultMethod = (code: string) => {
    return ['credit_card', 'money', 'pix'].includes(code);
  };
  
  return (
    <Box p={5}>
      <HStack mb={6} justify="space-between">
        <Heading size="lg">
          {tenant ? `Métodos de Pagamento - ${tenant.nome}` : 'Métodos de Pagamento'}
        </Heading>
        
        <Button 
          leftIcon={<FaPlus />} 
          colorScheme="teal"
          onClick={handleAddMethod}
        >
          Novo Método
        </Button>
      </HStack>
      
      <Card bg={bgCard} boxShadow="md">
        <CardHeader>
          <HStack>
            <Icon as={FaMoneyBillWave} color="teal.500" />
            <Text fontWeight="bold">Métodos de Pagamento Disponíveis</Text>
          </HStack>
        </CardHeader>
        
        <CardBody>
          {isLoading ? (
            <Flex justify="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : methods.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={8}>
              <Icon as={FaMoneyBillWave} boxSize={12} color="gray.300" mb={4} />
              <Text color="gray.500" fontSize="lg" mb={4}>
                Nenhum método de pagamento configurado
              </Text>
              <Button 
                leftIcon={<FaPlus />} 
                colorScheme="teal"
                onClick={handleAddMethod}
              >
                Adicionar Método
              </Button>
            </Flex>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th width="50px"></Th>
                  <Th>Nome</Th>
                  <Th>Código</Th>
                  <Th>Aceita Troco</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {methods.map((method) => (
                  <Tr key={method.id}>
                    <Td>{renderMethodIcon(method.code)}</Td>
                    <Td fontWeight="medium">{method.name}</Td>
                    <Td><code>{method.code}</code></Td>
                    <Td>
                      <Badge colorScheme={method.acceptsChange ? "green" : "gray"}>
                        {method.acceptsChange ? "Sim" : "Não"}
                      </Badge>
                    </Td>
                    <Td>
                      <Switch
                        isChecked={method.active}
                        onChange={() => handleToggleActive(method)}
                        colorScheme="teal"
                      />
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Editar método"
                          icon={<FaEdit />}
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleEditMethod(method)}
                        />
                        
                        <Tooltip 
                          label={isDefaultMethod(method.code) ? 
                            "Métodos padrão não podem ser excluídos, apenas desativados" : 
                            "Excluir método"}
                        >
                          <IconButton
                            aria-label="Excluir método"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteClick(method)}
                            isDisabled={isDefaultMethod(method.code)}
                            opacity={isDefaultMethod(method.code) ? 0.6 : 1}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
      
      {/* Modal para adicionar/editar método */}
      <Modal isOpen={isMethodModalOpen} onClose={onMethodModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedMethod ? 'Editar Método de Pagamento' : 'Novo Método de Pagamento'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel>Nome do Método</FormLabel>
                <Input
                  name="name"
                  value={methodForm.name}
                  onChange={handleFormChange}
                  placeholder="Ex: Cartão de Crédito"
                />
                {errors.name && (
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                )}
              </FormControl>
              
              {!selectedMethod && (
                <FormControl isRequired isInvalid={!!errors.code}>
                  <FormLabel>Código do Método</FormLabel>
                  <Input
                    name="code"
                    value={methodForm.code}
                    onChange={handleFormChange}
                    placeholder="Ex: credit_card"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Use um código único para identificar este método. Exemplo: "credit_card", "pix", "boleto"
                  </Text>
                  {errors.code && (
                    <FormErrorMessage>{errors.code}</FormErrorMessage>
                  )}
                </FormControl>
              )}
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Método Ativo</FormLabel>
                <Switch
                  name="active"
                  isChecked={methodForm.active}
                  onChange={(e) => handleFormChange({
                    target: {
                      name: 'active',
                      value: e.target.checked
                    }
                  })}
                  colorScheme="teal"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Aceita Troco</FormLabel>
                <Switch
                  name="acceptsChange"
                  isChecked={methodForm.acceptsChange}
                  onChange={(e) => handleFormChange({
                    target: {
                      name: 'acceptsChange',
                      value: e.target.checked
                    }
                  })}
                  colorScheme="teal"
                />
                <Text fontSize="xs" color="gray.500" ml={2}>
                  (Ative para métodos como Dinheiro)
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onMethodModalClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="teal" 
              leftIcon={<FaSave />}
              onClick={handleSaveMethod}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Confirmação de exclusão */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={undefined}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {isDefaultMethod(selectedMethod?.code || '') ? 
                'Desativar Método de Pagamento' : 
                'Excluir Método de Pagamento'
              }
            </AlertDialogHeader>

            <AlertDialogBody>
              {isDefaultMethod(selectedMethod?.code || '') ? (
                <>
                  Os métodos de pagamento padrão não podem ser excluídos, apenas desativados.
                  Deseja desativar o método <strong>{selectedMethod?.name}</strong>?
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir o método <strong>{selectedMethod?.name}</strong>?
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleConfirmDelete} 
                ml={3}
              >
                {isDefaultMethod(selectedMethod?.code || '') ? 'Desativar' : 'Excluir'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
