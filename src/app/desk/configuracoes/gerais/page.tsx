'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Button,
  Switch,
  useToast,
  VStack,
  HStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Flex,
  Spinner,
  FormErrorMessage,
  Image,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { FaSave, FaStore, FaPalette, FaGlobe, FaImage } from 'react-icons/fa';
import { TenantConfigForm } from '@/components/admin/TenantConfigForm';

export default function ConfiguracoesGeraisPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tenant/config');
        const data = await response.json();

        if (response.ok) {
          setTenant(data.tenant);
        } else {
          toast({
            title: 'Erro',
            description: data.message || 'Erro ao carregar configurações',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar dados do tenant:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, [toast]);

  const handleSaveTenantConfig = async (updatedData: any) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/tenant/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (response.ok) {
        setTenant(data.tenant);
        toast({
          title: 'Sucesso',
          description: 'Configurações atualizadas com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao salvar configurações',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
      <Container maxW="container.xl" py={6}>

        
        <Heading mb={2}>Configurações Gerais</Heading>
        <Text mb={6} color="gray.600">
          Configure as informações básicas do seu estabelecimento, incluindo cores, logotipo e domínio.
        </Text>
        
        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" color="teal.500" />
          </Flex>
        ) : (
          <TenantConfigForm 
            tenant={tenant} 
            onSave={handleSaveTenantConfig} 
            isSaving={saving} 
          />
        )}
      </Container>
  );
}
