import { useState, useEffect, useCallback } from 'react';
import { useTenant } from './useTenant';

export interface Module {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}

export function useModules() {
  const { tenant } = useTenant();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar os módulos disponíveis para o tenant atual
  const fetchModules = useCallback(async () => {
    if (!tenant?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenants/${tenant.id}/modules`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar módulos');
      }
      
      const data = await response.json();
      setModules(data.modules || []);
    } catch (err: any) {
      console.error('Erro ao carregar módulos:', err);
      setError(err.message || 'Erro ao carregar módulos');
      // Definir pelo menos um conjunto padrão mínimo (módulos básicos)
      setModules([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Verificar se o tenant tem acesso a um módulo específico
  const hasModule = useCallback((moduleSlug: string): boolean => {
    if (isLoading) return false;
    
    // Se não houver módulos definidos, assumimos alguns módulos básicos
    // para evitar problemas na interface (isso é temporário/fallback)
    if (modules.length === 0) {
      const basicModules = ['cadastros']; // Módulos básicos mínimos
      return basicModules.includes(moduleSlug);
    }
    
    return modules.some(module => module.slug === moduleSlug && module.isActive);
  }, [modules, isLoading]);

  return {
    modules,
    hasModule,
    isLoading,
    error,
    refreshModules: fetchModules
  };
}