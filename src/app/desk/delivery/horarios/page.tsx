'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Spinner,
  Flex,
  useToast,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Switch,
  useColorModeValue,
  Icon,
  Badge,
  SimpleGrid
} from '@chakra-ui/react';
import { FaSave, FaClock, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';

// Interface para horário de funcionamento
interface HorarioFuncionamento {
  id?: number;
  diaSemana: number;
  aberto: boolean;
  horaAbertura: string;
  horaFechamento: string;
  intervaloInicio?: string;
  intervaloFim?: string;
}

export default function HorariosFuncionamentoPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  
  // Estados
  const [horarios, setHorarios] = useState<HorarioFuncionamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Buscar horários de funcionamento
  const fetchHorarios = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/tenant/horarios');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar horários de funcionamento');
      }
      
      const data = await response.json();
      
      // Garantir que temos um horário para cada dia da semana
      const diasSemana = [0, 1, 2, 3, 4, 5, 6]; // 0 (Domingo) a 6 (Sábado)
      const horariosCompletos = [];
      
      for (const dia of diasSemana) {
        const horarioExistente = data.horarios.find((h: any) => h.diaSemana === dia);
        
        if (horarioExistente) {
          horariosCompletos.push(horarioExistente);
        } else {
          // Criar um horário padrão para dias que não têm configuração
          horariosCompletos.push({
            diaSemana: dia,
            aberto: dia !== 0, // Fechado aos domingos por padrão
            horaAbertura: '08:00',
            horaFechamento: '18:00'
          });
        }
      }
      
      // Ordenar por dia da semana
      horariosCompletos.sort((a, b) => a.diaSemana - b.diaSemana);
      
      setHorarios(horariosCompletos);
    } catch (error) {
      console.error('Erro ao buscar horários de funcionamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os horários de funcionamento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Carregar dados iniciais
  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);
  
  // Manipulador para começar a editar horários
  const handleStartEditing = () => {
    setIsEditing(true);
    setErrors({});
  };
  
  // Manipulador para cancelar edição
  const handleCancelEditing = () => {
    setIsEditing(false);
    setErrors({});
    fetchHorarios(); // Recarregar dados originais
  };
  
  // Manipulador para mudar horário de funcionamento
  const handleHorarioChange = (diaSemana: number, field: string, value: any) => {
    setHorarios(prev => 
      prev.map(horario => 
        horario.diaSemana === diaSemana 
          ? { ...horario, [field]: value } 
          : horario
      )
    );
    
    // Limpar erro se existir
    if (errors[`${diaSemana}_${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${diaSemana}_${field}`]: ''
      }));
    }
  };
  
  // Validar horários de funcionamento
  const validateHorarios = () => {
    const newErrors: Record<string, string> = {};
    
    horarios.forEach(horario => {
      if (horario.aberto) {
        // Verificar formato da hora
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        
        if (!timeRegex.test(horario.horaAbertura)) {
          newErrors[`${horario.diaSemana}_horaAbertura`] = 'Formato inválido. Use HH:MM (ex: 08:30)';
        }
        
        if (!timeRegex.test(horario.horaFechamento)) {
          newErrors[`${horario.diaSemana}_horaFechamento`] = 'Formato inválido. Use HH:MM (ex: 18:30)';
        }
        
        // Verificar intervalo se estiver preenchido
        if (horario.intervaloInicio && !timeRegex.test(horario.intervaloInicio)) {
          newErrors[`${horario.diaSemana}_intervaloInicio`] = 'Formato inválido. Use HH:MM (ex: 12:00)';
        }
        
        if (horario.intervaloFim && !timeRegex.test(horario.intervaloFim)) {
          newErrors[`${horario.diaSemana}_intervaloFim`] = 'Formato inválido. Use HH:MM (ex: 13:00)';
        }
        
        // Verificar se intervalo está consistente
        if (horario.intervaloInicio && !horario.intervaloFim) {
          newErrors[`${horario.diaSemana}_intervaloFim`] = 'É necessário informar o fim do intervalo';
        }
        
        if (!horario.intervaloInicio && horario.intervaloFim) {
          newErrors[`${horario.diaSemana}_intervaloInicio`] = 'É necessário informar o início do intervalo';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Salvar horários de funcionamento
  const handleSaveHorarios = async () => {
    if (!validateHorarios()) {
      toast({
        title: 'Erro',
        description: 'Verifique os erros nos horários de funcionamento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/tenant/horarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          horarios
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar horários de funcionamento');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Horários de funcionamento atualizados com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setIsEditing(false);
      fetchHorarios();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar horários de funcionamento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper para obter nome do dia da semana
  const getNomeDiaSemana = (dia: number): string => {
    const dias = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    return dias[dia];
  };
  
  return (
    <Box p={5}>
      <HStack mb={6} justify="space-between">
        <Heading size="lg">
          {tenant ? `Horários de Funcionamento - ${tenant.nome}` : 'Horários de Funcionamento'}
        </Heading>
        
        {!isEditing ? (
          <Button 
            leftIcon={<FaEdit />} 
            colorScheme="teal"
            onClick={handleStartEditing}
          >
            Editar Horários
          </Button>
        ) : (
          <HStack>
            <Button 
              leftIcon={<FaTimes />} 
              variant="outline"
              onClick={handleCancelEditing}
            >
              Cancelar
            </Button>
            <Button 
              leftIcon={<FaSave />} 
              colorScheme="teal"
              onClick={handleSaveHorarios}
              isLoading={isSaving}
              loadingText="Salvando..."
            >
              Salvar Horários
            </Button>
          </HStack>
        )}
      </HStack>
      
      <Card bg={bgCard} boxShadow="md">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={FaClock} color="teal.500" />
              <Text fontWeight="bold">Horários de Funcionamento do Delivery</Text>
            </HStack>
          </Flex>
        </CardHeader>
        
        <CardBody>
          {isLoading ? (
            <Flex justify="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : (
            <Box>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                {horarios.map((horario) => (
                  <Card 
                    key={horario.diaSemana} 
                    variant="outline" 
                    p={4}
                    bg={useColorModeValue(
                      horario.aberto ? 'white' : 'gray.50', 
                      horario.aberto ? 'gray.700' : 'gray.800'
                    )}
                    opacity={horario.aberto ? 1 : 0.8}
                  >
                    <Flex 
                      justify="space-between" 
                      align="center" 
                      mb={4}
                    >
                      <Heading size="md" color={horario.aberto ? 'inherit' : 'gray.500'}>
                        {getNomeDiaSemana(horario.diaSemana)}
                      </Heading>
                      <HStack>
                        <Badge colorScheme={horario.aberto ? 'green' : 'red'}>
                          {horario.aberto ? 'Aberto' : 'Fechado'}
                        </Badge>
                        {isEditing && (
                          <FormControl display="flex" alignItems="center" width="auto">
                            <Switch
                              isChecked={horario.aberto}
                              onChange={(e) => handleHorarioChange(
                                horario.diaSemana, 
                                'aberto', 
                                e.target.checked
                              )}
                              colorScheme="teal"
                              size="md"
                            />
                          </FormControl>
                        )}
                      </HStack>
                    </Flex>

                    {horario.aberto ? (
                      <Box>
                        <SimpleGrid columns={isEditing ? 1 : 2} spacing={4}>
                          {/* Horário de abertura */}
                          {isEditing ? (
                            <FormControl 
                              isInvalid={!!errors[`${horario.diaSemana}_horaAbertura`]}
                              mb={3}
                            >
                              <FormLabel>Horário de Abertura</FormLabel>
                              <Input
                                value={horario.horaAbertura}
                                onChange={(e) => handleHorarioChange(
                                  horario.diaSemana, 
                                  'horaAbertura', 
                                  e.target.value
                                )}
                                placeholder="08:00"
                              />
                              {errors[`${horario.diaSemana}_horaAbertura`] && (
                                <FormErrorMessage>
                                  {errors[`${horario.diaSemana}_horaAbertura`]}
                                </FormErrorMessage>
                              )}
                            </FormControl>
                          ) : (
                            <Box>
                              <Text fontWeight="medium">Abertura</Text>
                              <Text fontSize="lg">{horario.horaAbertura}</Text>
                            </Box>
                          )}

                          {/* Horário de fechamento */}
                          {isEditing ? (
                            <FormControl 
                              isInvalid={!!errors[`${horario.diaSemana}_horaFechamento`]}
                              mb={3}
                            >
                              <FormLabel>Horário de Fechamento</FormLabel>
                              <Input
                                value={horario.horaFechamento}
                                onChange={(e) => handleHorarioChange(
                                  horario.diaSemana, 
                                  'horaFechamento', 
                                  e.target.value
                                )}
                                placeholder="18:00"
                              />
                              {errors[`${horario.diaSemana}_horaFechamento`] && (
                                <FormErrorMessage>
                                  {errors[`${horario.diaSemana}_horaFechamento`]}
                                </FormErrorMessage>
                              )}
                            </FormControl>
                          ) : (
                            <Box>
                              <Text fontWeight="medium">Fechamento</Text>
                              <Text fontSize="lg">{horario.horaFechamento}</Text>
                            </Box>
                          )}
                        </SimpleGrid>

                        {/* Intervalo */}
                        {isEditing && (
                          <Box mt={4}>
                            <Text fontWeight="medium" mb={2}>Intervalo (opcional)</Text>
                            <SimpleGrid columns={2} spacing={4}>
                              <FormControl 
                                isInvalid={!!errors[`${horario.diaSemana}_intervaloInicio`]}
                              >
                                <FormLabel>Início do Intervalo</FormLabel>
                                <Input
                                  value={horario.intervaloInicio || ''}
                                  onChange={(e) => handleHorarioChange(
                                    horario.diaSemana, 
                                    'intervaloInicio', 
                                    e.target.value
                                  )}
                                  placeholder="12:00"
                                />
                                {errors[`${horario.diaSemana}_intervaloInicio`] && (
                                  <FormErrorMessage>
                                    {errors[`${horario.diaSemana}_intervaloInicio`]}
                                  </FormErrorMessage>
                                )}
                              </FormControl>

                              <FormControl 
                                isInvalid={!!errors[`${horario.diaSemana}_intervaloFim`]}
                              >
                                <FormLabel>Fim do Intervalo</FormLabel>
                                <Input
                                  value={horario.intervaloFim || ''}
                                  onChange={(e) => handleHorarioChange(
                                    horario.diaSemana, 
                                    'intervaloFim', 
                                    e.target.value
                                  )}
                                  placeholder="13:00"
                                />
                                {errors[`${horario.diaSemana}_intervaloFim`] && (
                                  <FormErrorMessage>
                                    {errors[`${horario.diaSemana}_intervaloFim`]}
                                  </FormErrorMessage>
                                )}
                              </FormControl>
                            </SimpleGrid>
                          </Box>
                        )}

                        {/* Mostrar intervalo se existir */}
                        {!isEditing && horario.intervaloInicio && horario.intervaloFim && (
                          <Box mt={4}>
                            <Text fontWeight="medium" color="orange.500">
                              Intervalo: {horario.intervaloInicio} às {horario.intervaloFim}
                            </Text>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <Text color="gray.500">
                          Estabelecimento fechado neste dia
                        </Text>
                      </Box>
                    )}
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}
