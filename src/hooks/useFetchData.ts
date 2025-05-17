import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

interface FetchDataOptions<T> {
  url: string;
  params?: Record<string, string>;
  transformResponse?: (data: any) => T[];
  errorMessage?: string;
  enabled?: boolean;
  deps?: any[];
}

export function useFetchData<T>({
  url,
  params = {},
  transformResponse,
  errorMessage = 'Erro ao carregar dados',
  enabled = true,
  deps = []
}: FetchDataOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Construir URL com parâmetros
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const queryString = queryParams.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Transformar a resposta se necessário
      const processedData = transformResponse ? transformResponse(result) : result;
      setData(processedData);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [url, JSON.stringify(params), enabled, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
