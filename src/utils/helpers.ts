// ... existing code ...

// Função para adicionar o tenantId aos dados
export function addTenantId(data: any, tenantId: number | null): any {
  // Se tenantId for null ou undefined, retornar os dados originais
  if (tenantId === null || tenantId === undefined) {
    return data;
  }

  // Garantir que tenantId seja um número
  const tenantIdNumber = Number(tenantId);
  
  // Verificar se tenantId é um número válido
  if (isNaN(tenantIdNumber)) {
    console.warn('addTenantId recebeu um tenantId inválido:', tenantId);
    return data;
  }

  // Retornar novo objeto com tenantId adicionado
  return {
    ...data,
    tenantId: tenantIdNumber
  };
}

// ... existing code ...
