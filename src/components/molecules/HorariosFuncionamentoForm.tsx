'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  Input,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Divider,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Flex,
  Skeleton
} from '@chakra-ui/react';
import { TimeIcon, CheckIcon, NotAllowedIcon } from '@chakra-ui/icons';

interface HorarioItem {
  id?: number;
  diaSemana: number;
  aberto: boolean;
  horaAbertura: string;
  horaFechamento: string;
  intervaloInicio?: string | null;
  intervaloFim?: string | null;
}

export default function HorariosFuncionamentoForm() {
  const [horarios, setHorarios] = useState<HorarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const diasSemana = [
    { id: 1, nome: 'Segunda-feira' },
    { id: 2, nome: 'Terça-feira' },
    { id: 3, nome: 'Quarta-feira' },
    { id: 4, nome: 'Quinta-feira' },
    { id: 5, nome: 'Sexta-feira' },
    { id: 6, nome: 'Sábado' },
    { id: 0, nome: 'Domingo' }
  ];

  useEffect(() => {
    fetchHorarios();
  }, []);

  const fetchHorarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenant/horarios');
      const data = await response.json();

      if (response.ok) {
        // Organizar horários por dia da semana
        const diasOrdenados = [1, 2, 3, 4, 5, 6, 0]; // Seg, Ter, Qua, Qui, Sex, Sab, Dom
        const horariosPorDia = diasOrdenados.map(dia => {
          const horario = data.horarios.find((h: HorarioItem) => h.diaSemana === dia);
          if (horario) return horario;
          
          // Criar item padrão se não existe
          return {
            diaSemana: dia,
            aberto: false,
            horaAbertura: '08:00',
            horaFechamento: '18:00'
          };
        });
        
        setHorarios(horariosPorDia);
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao carregar horários',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os horários de funcionamento',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAberto = (index: number) => {
    const novosHorarios = [...horarios];
    novosHorarios[index].aberto = !novosHorarios[index].aberto;
    setHorarios(novosHorarios);
  };

  const handleHoraChange = (index: number, field: string, value: string) => {
    const novosHorarios = [...horarios];
    novosHorarios[index][field] = value;
    setHorarios(novosHorarios);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validação básica
      for (const horario of horarios) {
        if (horario.aberto) {
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          
          if (!timeRegex.test(horario.horaAbertura) || !timeRegex.test(horario.horaFechamento)) {
            toast({
              title: 'Erro de validação',
              description: `Formato de hora inválido para ${diasSemana.find(d => d.id === horario.diaSemana)?.nome}. Use HH:MM (ex: 08:30)`,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          
          // Validar intervalo se fornecido
          if (horario.intervaloInicio && !timeRegex.test(horario.intervaloInicio)) {
            toast({
              title: 'Erro de validação',
              description: `Formato de hora inválido para intervalo`,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          
          if (horario.intervaloFim && !timeRegex.test(horario.intervaloFim)) {
            toast({
              title: 'Erro de validação',
              description: `Formato de hora inválido para intervalo`,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
        }
      }
      
      const response = await fetch('/api/tenant/horarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ horarios }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Horários de funcionamento atualizados',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchHorarios(); // Recarregar dados atualizados
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao salvar horários',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os horários de funcionamento',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton height="30px" width="250px" />
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} height="60px" width="100%" />
            ))}
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Horários de Funcionamento</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {horarios.map((horario, index) => {
            const dia = diasSemana.find(d => d.id === horario.diaSemana);
            return (
              <Box key={index} 
                borderWidth="1px" 
                borderRadius="md" 
                p={4}
                borderColor={horario.aberto ? 'green.200' : 'gray.200'}
                bg={horario.aberto ? 'green.50' : 'gray.50'}
              >
                <Grid templateColumns="1fr 2fr 2fr" gap={4}>
                  <GridItem colSpan={1}>
                    <Flex align="center" height="100%">
                      <FormControl display="flex" alignItems="center">
                        <Switch 
                          id={`aberto-${index}`} 
                          isChecked={horario.aberto} 
                          onChange={() => handleToggleAberto(index)}
                          colorScheme="green"
                          mr={2}
                        />
                        <FormLabel htmlFor={`aberto-${index}`} mb="0" fontWeight="bold">
                          {dia?.nome}
                        </FormLabel>
                      </FormControl>
                    </Flex>
                  </GridItem>
                  
                  <GridItem colSpan={{ base: 3, md: 2 }} display={horario.aberto ? 'block' : 'none'}>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                      <GridItem>
                        <FormControl size="sm">
                          <FormLabel fontSize="xs">Abre às</FormLabel>
                          <Input
                            placeholder="08:00"
                            value={horario.horaAbertura}
                            onChange={(e) => handleHoraChange(index, 'horaAbertura', e.target.value)}
                            size="sm"
                            isDisabled={!horario.aberto}
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl size="sm">
                          <FormLabel fontSize="xs">Fecha às</FormLabel>
                          <Input
                            placeholder="18:00"
                            value={horario.horaFechamento}
                            onChange={(e) => handleHoraChange(index, 'horaFechamento', e.target.value)}
                            size="sm"
                            isDisabled={!horario.aberto}
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl size="sm">
                          <FormLabel fontSize="xs">Pausa (início)</FormLabel>
                          <Input
                            placeholder="12:00"
                            value={horario.intervaloInicio || ''}
                            onChange={(e) => handleHoraChange(index, 'intervaloInicio', e.target.value)}
                            size="sm"
                            isDisabled={!horario.aberto}
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl size="sm">
                          <FormLabel fontSize="xs">Pausa (fim)</FormLabel>
                          <Input
                            placeholder="13:00"
                            value={horario.intervaloFim || ''}
                            onChange={(e) => handleHoraChange(index, 'intervaloFim', e.target.value)}
                            size="sm"
                            isDisabled={!horario.aberto}
                          />
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </GridItem>
                </Grid>
                
                {!horario.aberto && (
                  <Text color="gray.500" mt={2} fontSize="sm">
                    <NotAllowedIcon mr={1} />
                    Fechado neste dia
                  </Text>
                )}
              </Box>
            );
          })}
          
          <Button 
            colorScheme="teal" 
            onClick={handleSave} 
            isLoading={saving}
            leftIcon={<CheckIcon />}
            alignSelf="flex-end"
          >
            Salvar Horários
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
}
