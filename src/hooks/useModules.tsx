'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTenant } from './useTenant';

export interface Module {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UseModulesReturn {
  modules: Module[];
  isLoading: boolean;
  error: string | null;
  hasModule: (moduleSlug: string) => boolean;
  addModuleToTenant: (moduleId: number) => Promise<void>;
  removeModuleFromTenant: (moduleId: number) => Promise<void>;
  refreshModules: () => Promise<void>;
}

export function useModules(): UseModulesReturn {
  const { tenant } = useTenant();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!tenant?.id) {
      setModules([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/modules`);
      if (!response.ok) {
        throw new Error('Falha ao carregar os módulos');
      }
      const data = await response.json();
      setModules(data.modules || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar módulos');
      console.error('Erro ao buscar módulos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Verificar se o tenant atual tem acesso a um módulo específico
  const hasModule = useCallback((moduleSlug: string): boolean => {
    // Se não houver tenant, não tem acesso a nenhum módulo
    if (!tenant) return false;
    
    // Verificar se o módulo está disponível para o tenant
    return modules.some(module => module.slug === moduleSlug && module.isActive);
  }, [modules, tenant]);

  // Adicionar um módulo ao tenant atual
  const addModuleToTenant = async (moduleId: number): Promise<void> => {
    if (!tenant?.id) {
      throw new Error('Nenhum tenant selecionado');
    }

    try {
      const response = await fetch(`/api/tenants/${tenant.id}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moduleId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao adicionar módulo');
      }

      // Atualizar a lista de módulos
      await fetchModules();
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar módulo');
      throw err;
    }
  };

  // Remover um módulo do tenant atual
  const removeModuleFromTenant = async (moduleId: number): Promise<void> => {
    if (!tenant?.id) {
      throw new Error('Nenhum tenant selecionado');
    }

    try {
      const response = await fetch(`/api/tenants/${tenant.id}/modules/${moduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao remover módulo');
      }

      // Atualizar a lista de módulos
      await fetchModules();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover módulo');
      throw err;
    }
  };

  return {
    modules,
    isLoading,
    error,
    hasModule,
    addModuleToTenant,
    removeModuleFromTenant,
    refreshModules: fetchModules,
  };
}

interface ModulesContextProps {
  modules: Module[];
  isLoading: boolean;
  hasModule: (moduleSlug: string) => boolean;
}

const ModulesContext = createContext<ModulesContextProps>({
  modules: [],
  isLoading: true,
  hasModule: () => false,
});

export const ModulesProvider = ({ children }: { children: ReactNode }) => {
  const { tenant } = useTenant();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      if (!tenant) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/tenants/${tenant.id}/modules`);
        
        if (response.ok) {
          const data = await response.json();
          setModules(data.modules || []);
        } else {
          console.error('Erro ao carregar módulos do tenant');
          
          // Em ambiente de desenvolvimento, configurar módulos padrão
          if (process.env.NODE_ENV === 'development') {
            console.warn('Usando módulos padrão para desenvolvimento');
            setModules([
              { id: 1, name: 'Delivery', slug: 'delivery', isActive: true, description: null },
              { id: 2, name: 'Estoque', slug: 'estoque', isActive: true, description: null },
              { id: 3, name: 'Cadastros', slug: 'cadastros', isActive: true, description: null },
              { id: 4, name: 'Comandas', slug: 'comandas', isActive: true, description: null },
              { id: 5, name: 'Cardápio', slug: 'cardapio', isActive: true, description: null },
              { id: 6, name: 'Bar', slug: 'bar', isActive: true, description: null },
              { id: 7, name: 'Caixa', slug: 'caixa', isActive: true, description: null },
              { id: 8, name: 'Relatórios', slug: 'relatorios', isActive: true, description: null },
            ]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar módulos:', error);
        
        // Em ambiente de desenvolvimento, usar módulos padrão
        if (process.env.NODE_ENV === 'development') {
          console.warn('Usando módulos padrão para desenvolvimento');
          setModules([
            { id: 1, name: 'Delivery', slug: 'delivery', isActive: true, description: null },
            { id: 2, name: 'Estoque', slug: 'estoque', isActive: true, description: null },
            { id: 3, name: 'Cadastros', slug: 'cadastros', isActive: true, description: null },
            { id: 4, name: 'Comandas', slug: 'comandas', isActive: true, description: null },
            { id: 5, name: 'Cardápio', slug: 'cardapio', isActive: true, description: null },
            { id: 6, name: 'Bar', slug: 'bar', isActive: true, description: null },
            { id: 7, name: 'Caixa', slug: 'caixa', isActive: true, description: null },
            { id: 8, name: 'Relatórios', slug: 'relatorios', isActive: true, description: null },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [tenant]);

  // Função utilitária para verificar se o tenant tem acesso a um módulo específico
  const hasModule = (moduleSlug: string): boolean => {
    if (!modules.length) return process.env.NODE_ENV === 'development';
    return modules.some(module => module.slug === moduleSlug && module.isActive);
  };

  return (
    <ModulesContext.Provider value={{ modules, isLoading, hasModule }}>
      {children}
    </ModulesContext.Provider>
  );
};

export const useModulesContext = () => useContext(ModulesContext);