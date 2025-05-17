'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  Card,
  CardBody,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  Badge,
  useColorModeValue,
  Select,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Checkbox,
  CheckboxGroup
} from '@chakra-ui/react';
import {
  FaPuzzlePiece,
  FaStore,
  FaSave
} from 'react-icons/fa';
import { ChevronRightIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { Module } from '@/hooks/useModules';

interface Tenant {
  id: number;
  nome: string;
  slug: string;
  logotipo?: string | null;
}

interface TenantModule {
  moduleId: number;
  tenantId: number;
  module: Module;
}

export default function TenantsModulosPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [tenantModules, setTenantModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTenantModules, setIsLoadingTenantModules] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const toast = useToast();
  
  // Cores de UI
  const cardBg = useColorModeValue('white', 'gray.700');
  
  // Carregar tenants e módulos ao montar o componente
  useEffect(() => {
    Promise.all([
      fetchTenants(),
      fetchModules()
    ]).then(() => {
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);
  
  // Buscar a lista de tenants
  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants');
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }
      
      const data = await response.json();
      setTenants(data.tenants);
    } catch (error: any) {
      console.error('Erro ao carregar tenants:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os tenants',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Buscar a lista de módulos
  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules');
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filtrar apenas módulos ativos
      setAllModules(data.modules.filter((module: Module) => module.isActive));
    } catch (error: any) {
      console.error('Erro ao carregar módulos:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os módulos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Buscar os módulos do tenant selecionado
  const fetchTenantModules = async (tenantId: number) => {
    setIsLoadingTenantModules(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/modules`);
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }
      
      const data = await response.json();
      setTenantModules(data.modules || []);
      
      // Preparar a lista de IDs de módulos selecionados
      const moduleIds = data.modules.map((module: Module) => module.id.toString());
      setSelectedModules(moduleIds);
    } catch (error: any) {
      console.error('Erro ao carregar módulos do tenant:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os módulos do tenant',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingTenantModules(false);
    }
  };
  
  // Ao selecionar um tenant
  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tenantId = e.target.value;
    if (tenantId) {
      const tenant = tenants.find(t => t.id.toString() === tenantId) || null;
      setSelectedTenant(tenant);
      
      // Buscar módulos deste tenant
      if (tenant) {
        fetchTenantModules(tenant.id);
      }
    } else {
      setSelectedTenant(null);
      setTenantModules([]);
      setSelectedModules([]);
    }
  };
  
  // Alternar a seleção de um módulo
  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };
  
  // Selecionar todos os módulos
  const handleSelectAll = () => {
    if (selectedModules.length === allModules.length) {
      // Se todos já estão selecionados, desmarcar todos
      setSelectedModules([]);
    } else {
      // Caso contrário, selecionar todos
      setSelectedModules(allModules.map(module => module.id.toString()));
    }
  };
  
  // Salvar as alterações de módulos do tenant
  const handleSaveModules = async () => {
    if (!selectedTenant) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/tenants/${selectedTenant.id}/modules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleIds: selectedModules
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro: ${response.status}`);
      }
      
      toast({
        title: 'Sucesso',
        description: 'Módulos do tenant atualizados com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Atualizar a lista de módulos do tenant
      fetchTenantModules(selectedTenant.id);
    } catch (error: any) {
      console.error('Erro ao salvar módulos:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar os módulos do tenant',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Box p={4}>
      {/* Breadcrumbs */}
      <Breadcrumb mb={4} fontSize="sm" separator={<ChevronRightIcon color="gray.500" />}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/desk">
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/desk/configuracoes/gerais">
            Configurações
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Módulos por Tenant</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Heading size="lg" mb={1}>
        Gerenciamento de Módulos por Tenant
      </Heading>
      <Text color="gray.600" mb={6}>
        Configure quais módulos estão disponíveis para cada tenant do sistema.
      </Text>
      
      {isLoading ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" color="teal.500" />
        </Flex>
      ) : (
        <Grid templateColumns={{ base: "1fr", md: "300px 1fr" }} gap={6}>
          {/* Painel de Seleção */}
          <GridItem>
            <Card bg={cardBg} boxShadow="md" mb={6}>
              <CardBody>
                <FormControl mb={4}>
                  <FormLabel>Selecione o Tenant</FormLabel>
                  <Select 
                    placeholder="Selecione um tenant" 
                    onChange={handleTenantChange}
                    value={selectedTenant?.id?.toString() || ""}
                  >
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id.toString()}>
                        {tenant.nome}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedTenant && (
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Heading size="sm" mb={2}>Detalhes do Tenant</Heading>
                      <Text><strong>Nome:</strong> {selectedTenant.nome}</Text>
                      <Text><strong>Slug:</strong> {selectedTenant.slug}</Text>
                    </Box>
                    
                    <Button
                      leftIcon={<FaSave />}
                      colorScheme="teal"
                      onClick={handleSaveModules}
                      isLoading={isSaving}
                      loadingText="Salvando"
                      isDisabled={!selectedTenant}
                      w="full"
                    >
                      Salvar Alterações
                    </Button>
                  </VStack>
                )}
              </CardBody>
            </Card>
            
            {selectedTenant && (
              <Box p={4} bg="blue.50" borderRadius="md" boxShadow="sm">
                <Heading size="xs" color="blue.800" mb={2}>
                  Dica
                </Heading>
                <Text fontSize="sm" color="blue.800">
                  Os módulos controlam quais funcionalidades estarão disponíveis para este tenant. Apenas módulos ativos podem ser atribuídos.
                </Text>
              </Box>
            )}
          </GridItem>
          
          {/* Lista de Módulos */}
          <GridItem>
            {!selectedTenant ? (
              <Card bg={cardBg} boxShadow="md">
                <CardBody>
                  <Box textAlign="center" py={10}>
                    <FaStore size={40} style={{ margin: '0 auto', opacity: 0.4 }} />
                    <Text mt={4} fontSize="lg" color="gray.500">
                      Selecione um tenant para gerenciar seus módulos
                    </Text>
                  </Box>
                </CardBody>
              </Card>
            ) : isLoadingTenantModules ? (
              <Flex justify="center" py={10}>
                <Spinner size="lg" color="teal.500" />
              </Flex>
            ) : (
              <Card bg={cardBg} boxShadow="md">
                <CardBody>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">
                      Módulos Disponíveis 
                      <Badge ml={2} colorScheme="purple" borderRadius="full" px={2}>
                        {selectedModules.length} / {allModules.length}
                      </Badge>
                    </Heading>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleSelectAll}
                    >
                      {selectedModules.length === allModules.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </Button>
                  </Flex>
                  
                  {allModules.length === 0 ? (
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Nenhum módulo disponível</Text>
                        <Text>
                          Não há módulos ativos para serem atribuídos. 
                        </Text>
                        <Button 
                          as={Link} 
                          href="/desk/configuracoes/modulos"
                          size="sm"
                          mt={2}
                          colorScheme="blue"
                          variant="link"
                        >
                          Criar módulos
                        </Button>
                      </Box>
                    </Alert>
                  ) : (
                    <Box>
                      <CheckboxGroup colorScheme="teal" value={selectedModules}>
                        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={4}>
                          {allModules.map(module => (
                            <GridItem key={module.id}>
                              <Card variant="outline" size="sm" p={4} bg={selectedModules.includes(module.id.toString()) ? 'teal.50' : 'white'}>
                                <Flex justify="space-between" align="center">
                                  <Checkbox 
                                    value={module.id.toString()}
                                    onChange={() => handleModuleToggle(module.id.toString())}
                                    colorScheme="teal"
                                  >
                                    <Box>
                                      <Text fontWeight="medium">{module.name}</Text>
                                      <Text fontSize="xs" color="gray.500">{module.slug}</Text>
                                    </Box>
                                  </Checkbox>
                                </Flex>
                                {module.description && (
                                  <Text fontSize="sm" color="gray.600" mt={2} pl={6}>
                                    {module.description}
                                  </Text>
                                )}
                              </Card>
                            </GridItem>
                          ))}
                        </Grid>
                      </CheckboxGroup>
                    </Box>
                  )}
                </CardBody>
              </Card>
            )}
          </GridItem>
        </Grid>
      )}
    </Box>
  );
}