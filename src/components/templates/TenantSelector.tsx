'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Text,
  Avatar,
  HStack,
  Divider,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { FaBuilding, FaChevronDown } from 'react-icons/fa';
import { useTenant } from '@/hooks/useTenant';
import { useRouter } from 'next/navigation';

interface TenantOption {
  id: number;
  nome: string;
  slug: string;
  logotipo?: string;
}

export function TenantSelector() {
  const { tenant, setTenant } = useTenant();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const fetchTenants = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/tenants/available');
        if (response.ok) {
          const data = await response.json();
          setTenants(data.tenants);
        }
      } catch (error) {
        console.error('Erro ao carregar tenants disponíveis:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a lista de empresas',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [toast]);

  const handleChangeTenant = async (selectedTenant: TenantOption) => {
    try {
      // Opção 1: Redirecionamento baseado em slug
      router.push(`/${selectedTenant.slug}`);
      
      // Opção 2: Configuração via API (para interfaces admin)
      // const response = await fetch('/api/tenants/set-current', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ tenantId: selectedTenant.id }),
      // });
      
      // if (response.ok) {
      //   setTenant(selectedTenant);
      //   router.refresh();
      // }
    } catch (error) {
      console.error('Erro ao trocar de tenant:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível trocar de empresa',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!tenant) return null;

  return (
    <Box>
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<FaChevronDown />}
          leftIcon={
            tenant.logotipo ? (
              <Avatar size="xs" src={tenant.logotipo} />
            ) : (
              <FaBuilding />
            )
          }
          variant="outline"
          isLoading={isLoading}
        >
          <Text>{tenant.nome}</Text>
        </MenuButton>
        <MenuList>
          {tenants.map((item) => (
            <MenuItem 
              key={item.id}
              onClick={() => handleChangeTenant(item)}
              bgColor={tenant.id === item.id ? 'teal.50' : undefined}
            >
              <HStack>
                {item.logotipo ? (
                  <Avatar size="xs" src={item.logotipo} />
                ) : (
                  <FaBuilding />
                )}
                <Text>{item.nome}</Text>
              </HStack>
            </MenuItem>
          ))}
          <Divider my={2} />
          <MenuItem onClick={() => router.push('/admin/tenants')}>
            Gerenciar Empresas
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
