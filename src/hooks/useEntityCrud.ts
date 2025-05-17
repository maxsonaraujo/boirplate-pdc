import { useState } from 'react';
import { useToast } from '@chakra-ui/react';

interface CrudOptions {
  entityName: string;
  fetchUrl: string;
  refreshCallback?: () => void;
  redirectCallback?: (id?: number) => void;
}

export function useEntityCrud({
  entityName,
  fetchUrl,
  refreshCallback,
  redirectCallback
}: CrudOptions) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Alterna o status de uma entidade (ativar/desativar)
   */
  const toggleEntityStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${fetchUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: !currentStatus,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao alterar status de ${entityName.toLowerCase()}`);
      }
      
      toast({
        title: 'Sucesso',
        description: `${entityName} ${!currentStatus ? 'ativado(a)' : 'desativado(a)'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (refreshCallback) refreshCallback();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Não foi possível alterar o status de ${entityName.toLowerCase()}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  /**
   * Exclui uma entidade
   */
  const deleteEntity = async (id: number) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${fetchUrl}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao excluir ${entityName.toLowerCase()}`);
      }
      
      toast({
        title: 'Sucesso',
        description: `${entityName} excluído(a) com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (refreshCallback) refreshCallback();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Não foi possível excluir ${entityName.toLowerCase()}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Salva uma entidade (criar ou atualizar)
   */
  const saveEntity = async (data: any, id?: number) => {
    setIsSubmitting(true);
    try {
      const url = id ? `${fetchUrl}/${id}` : fetchUrl;
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao salvar ${entityName.toLowerCase()}`);
      }
      
      const responseData = await response.json();
      
      toast({
        title: 'Sucesso',
        description: `${entityName} ${id ? 'atualizado(a)' : 'criado(a)'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (redirectCallback) redirectCallback(responseData.id);
      if (refreshCallback) refreshCallback();
      
      return responseData;
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Erro ao ${id ? 'atualizar' : 'criar'} ${entityName.toLowerCase()}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    toggleEntityStatus,
    deleteEntity,
    saveEntity,
    isSubmitting
  };
}
