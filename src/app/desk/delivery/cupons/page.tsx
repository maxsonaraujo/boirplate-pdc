'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
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
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Badge,
  Flex,
  Text,
  Select,
  FormErrorMessage,
  TableContainer,
  Spinner,
  HStack,
  Card,
  CardHeader,
  CardBody,
  InputGroup,
  InputLeftAddon,
  Tooltip,
  Divider
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import { Controller, useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Interface para cupom
interface Cupom {
  id: number;
  codigo: string;
  descricao?: string;
  valorDesconto: number;
  tipoDesconto: 'VALOR' | 'PERCENTUAL';
  valorMinimo: number;
  validoAte?: Date | null;
  usoMaximo?: number | null;
  usoAtual: number;
  ativo: boolean;
  dataCriacao: Date;
}

export default function CuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCupom, setSelectedCupom] = useState<Cupom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<Cupom>();
  
  // Buscar cupons
  useEffect(() => {
    fetchCupons();
  }, []);
  
  const fetchCupons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/delivery/cupons');
      const data = await response.json();
      
      if (response.ok) {
        // Formatando datas
        const formattedCupons = data.cupons.map((cupom: any) => ({
          ...cupom,
          dataCriacao: new Date(cupom.dataCriacao),
          validoAte: cupom.validoAte ? new Date(cupom.validoAte) : null
        }));
        
        setCupons(formattedCupons);
      } else {
        throw new Error(data.error || 'Erro ao carregar cupons');
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      toast({
        title: 'Erro ao carregar cupons',
        description: 'Não foi possível carregar a lista de cupons.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para criar novo cupom
  const handleNewCupom = () => {
    setSelectedCupom(null);
    reset({
      codigo: '',
      descricao: '',
      valorDesconto: 0,
      tipoDesconto: 'VALOR',
      valorMinimo: 0,
      validoAte: null,
      usoMaximo: null,
      ativo: true
    });
    onOpen();
  };

  // Abrir modal para editar cupom
  const handleEditCupom = (cupom: Cupom) => {
    setSelectedCupom(cupom);
    reset({
      ...cupom,
      validoAte: cupom.validoAte ? new Date(cupom.validoAte) : null
    });
    onOpen();
  };

  // Abrir modal de confirmação para excluir cupom
  const handleDeleteClick = (cupom: Cupom) => {
    setSelectedCupom(cupom);
    onDeleteOpen();
  };

  // Salvar cupom (criar novo ou atualizar existente)
  const onSubmitCupom = async (data: any) => {
    try {
      const url = selectedCupom 
        ? `/api/delivery/cupons/${selectedCupom.id}` 
        : '/api/delivery/cupons';
      
      const method = selectedCupom ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        toast({
          title: selectedCupom ? 'Cupom atualizado' : 'Cupom criado',
          description: selectedCupom 
            ? `O cupom ${data.codigo} foi atualizado com sucesso.`
            : `O cupom ${data.codigo} foi criado com sucesso.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        onClose();
        fetchCupons();
      } else {
        throw new Error(responseData.error || 'Erro ao salvar cupom');
      }
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cupom.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Excluir cupom
  const handleDeleteCupom = async () => {
    if (!selectedCupom) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/delivery/cupons/${selectedCupom.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Cupom excluído',
          description: `O cupom ${selectedCupom.codigo} foi excluído com sucesso.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        onDeleteClose();
        fetchCupons();
      } else {
        throw new Error(data.error || 'Erro ao excluir cupom');
      }
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o cupom.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Formatar data para exibição
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Filtrar cupons baseado na busca
  const filteredCupons = cupons.filter(cupom => 
    cupom.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (cupom.descricao && cupom.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box p={5}>
      <Card mb={5} variant="outline">
        <CardHeader borderBottomWidth="1px" pb={2}>
          <Heading size="lg">Gerenciar Cupons de Desconto</Heading>
        </CardHeader>
        <CardBody>
          <Flex mb={4} justifyContent="space-between" alignItems="center" wrap="wrap" gap={2}>
            <Box width={{ base: "100%", md: "auto" }} mb={{ base: 2, md: 0 }}>
              <InputGroup maxWidth="350px">
                <InputLeftAddon children={<FaSearch />} />
                <Input
                  placeholder="Buscar cupom..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Box>
            <Button 
              leftIcon={<FaPlus />} 
              colorScheme="teal" 
              onClick={handleNewCupom}
              width={{ base: "100%", md: "auto" }}
            >
              Novo Cupom
            </Button>
          </Flex>

          {loading ? (
            <Flex justifyContent="center" alignItems="center" height="200px">
              <Spinner size="xl" />
            </Flex>
          ) : filteredCupons.length === 0 ? (
            <Box textAlign="center" py={10} borderWidth={1} borderRadius="md">
              <Text fontSize="lg">Nenhum cupom encontrado</Text>
              <Text fontSize="sm" color="gray.500">
                {searchTerm ? "Tente outra busca" : "Clique em 'Novo Cupom' para criar seu primeiro cupom"}
              </Text>
            </Box>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Código</Th>
                    <Th>Desconto</Th>
                    <Th>Valor Mínimo</Th>
                    <Th>Validade</Th>
                    <Th>Uso</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredCupons.map((cupom) => (
                    <Tr key={cupom.id}>
                      <Td fontWeight="bold">{cupom.codigo}</Td>
                      <Td>
                        {cupom.tipoDesconto === 'PERCENTUAL' 
                          ? `${cupom.valorDesconto}%` 
                          : `R$ ${cupom.valorDesconto.toFixed(2)}`
                        }
                      </Td>
                      <Td>
                        {cupom.valorMinimo > 0 
                          ? `R$ ${cupom.valorMinimo.toFixed(2)}`
                          : '-'
                        }
                      </Td>
                      <Td>{formatDate(cupom.validoAte)}</Td>
                      <Td>
                        {cupom.usoMaximo 
                          ? `${cupom.usoAtual}/${cupom.usoMaximo}` 
                          : cupom.usoAtual
                        }
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={cupom.ativo ? 'green' : 'red'}
                          variant="solid"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          {cupom.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Tooltip label="Editar cupom">
                            <IconButton
                              aria-label="Editar"
                              icon={<FaEdit />}
                              size="sm"
                              onClick={() => handleEditCupom(cupom)}
                              colorScheme="blue"
                            />
                          </Tooltip>
                          <Tooltip label="Excluir cupom">
                            <IconButton
                              aria-label="Excluir"
                              icon={<FaTrash />}
                              size="sm"
                              onClick={() => handleDeleteClick(cupom)}
                              colorScheme="red"
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Modal para criar/editar cupom */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmitCupom)}>
            <ModalHeader>
              {selectedCupom ? `Editar Cupom: ${selectedCupom.codigo}` : 'Novo Cupom'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isInvalid={!!errors.codigo} mb={4} isRequired>
                <FormLabel>Código do Cupom</FormLabel>
                <Input 
                  {...register('codigo', {
                    required: 'Este campo é obrigatório',
                    minLength: { value: 3, message: 'O código deve ter pelo menos 3 caracteres' },
                    pattern: {
                      value: /^[A-Za-z0-9]+$/,
                      message: 'Apenas letras e números são permitidos'
                    }
                  })} 
                  placeholder="Ex: BEMVINDO10"
                  onBlur={(e) => {
                    // Converter para maiúsculas ao perder o foco
                    setValue('codigo', e.target.value.toUpperCase());
                  }}
                />
                <FormErrorMessage>{errors.codigo?.message}</FormErrorMessage>
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Descrição</FormLabel>
                <Input 
                  {...register('descricao')}
                  placeholder="Ex: Cupom para novos clientes"
                />
              </FormControl>

              <FormControl isInvalid={!!errors.tipoDesconto} mb={4} isRequired>
                <FormLabel>Tipo de Desconto</FormLabel>
                <Select {...register('tipoDesconto', { required: 'Este campo é obrigatório' })}>
                  <option value="VALOR">Valor Fixo (R$)</option>
                  <option value="PERCENTUAL">Percentual (%)</option>
                </Select>
                <FormErrorMessage>{errors.tipoDesconto?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.valorDesconto} mb={4} isRequired>
                <FormLabel>Valor do Desconto</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    {...register('valorDesconto', {
                      required: 'Este campo é obrigatório',
                      min: { value: 0, message: 'O valor deve ser positivo' }
                    })}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.valorDesconto?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.valorMinimo} mb={4}>
                <FormLabel>Valor Mínimo de Compra</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    {...register('valorMinimo', {
                      min: { value: 0, message: 'O valor deve ser positivo' }
                    })}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.valorMinimo?.message}</FormErrorMessage>
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Data de Validade</FormLabel>
                <Controller
                  control={control}
                  name="validoAte"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="dd/MM/yyyy"
                      minDate={new Date()}
                      placeholderText="Selecione uma data"
                      isClearable
                      className="chakra-input css-1kp110w"
                    />
                  )}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.usoMaximo} mb={4}>
                <FormLabel>Limite de Uso</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    {...register('usoMaximo', {
                      min: { value: 0, message: 'O valor deve ser positivo' }
                    })}
                    placeholder="Em branco = sem limite"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.usoMaximo?.message}</FormErrorMessage>
              </FormControl>

              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel mb="0">Cupom Ativo?</FormLabel>
                <Switch
                  {...register('ativo')}
                  defaultChecked={selectedCupom?.ativo ?? true}
                  colorScheme="teal"
                />
              </FormControl>

              {selectedCupom && (
                <Box mt={4} p={3} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" color="gray.500">
                    Criado em: {formatDate(selectedCupom.dataCriacao)}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Utilizações: {selectedCupom.usoAtual}
                  </Text>
                </Box>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
              <Button 
                colorScheme="teal" 
                type="submit" 
                isLoading={isSubmitting}
              >
                Salvar
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal para confirmar exclusão de cupom */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Exclusão</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedCupom && (
              <>
                <Text>Você tem certeza que deseja excluir o cupom <strong>{selectedCupom.codigo}</strong>?</Text>
                <Text mt={2} fontSize="sm" color="red.500">Esta ação não pode ser desfeita.</Text>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>Cancelar</Button>
            <Button 
              colorScheme="red" 
              onClick={handleDeleteCupom}
              isLoading={isDeleting}
            >
              Excluir
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}