'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Tenant {
  id: number;
  nome: string;
  slug: string;
  logotipo?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  dominio?: string;
}

interface TenantContextProps {
  tenant: Tenant | null;
  isLoading: boolean;
  setTenant: (tenant: Tenant | null) => void;
}

const TenantContext = createContext<TenantContextProps>({
  tenant: null,
  isLoading: true,
  setTenant: () => {},
});

// Tenant padrão para desenvolvimento
const DEV_TENANT: Tenant = {
  id: 1,
  nome: 'Desenvolvimento',
  slug: 'dev',
  corPrimaria: '#38B2AC',
  corSecundaria: '#319795',
  dominio: 'localhost'
};

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch('/api/tenant');
        
        if (response.ok) {
          const data = await response.json();
          setTenant(data.tenant);
        } else {
          // Em caso de erro e em ambiente de desenvolvimento, usar tenant padrão
          if (process.env.NODE_ENV === 'development') {
            console.warn('Usando tenant padrão para desenvolvimento');
            setTenant(DEV_TENANT);
          } else {
            // Se não é desenvolvimento e há erro, pode tentar novamente
            if (retryCount < 3) {
              setTimeout(() => {
                setRetryCount(prevCount => prevCount + 1);
              }, 2000); // Espera 2 segundos antes de tentar novamente
              return;
            }
            
            console.error('Não foi possível carregar as informações do tenant após várias tentativas');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar informações do tenant:', error);
        
        // Em caso de erro e em ambiente de desenvolvimento, usar tenant padrão
        if (process.env.NODE_ENV === 'development') {
          console.warn('Usando tenant padrão para desenvolvimento');
          setTenant(DEV_TENANT);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [retryCount]);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
