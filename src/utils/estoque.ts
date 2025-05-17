// Função de integração para baixar insumos para produção

import { db } from '@/db/connector';
import { addTenantId } from '@/utils/tenant';

/**
 * Processa o consumo de insumos para uma produção
 * @param producaoId ID da produção
 * @param itens Itens a serem consumidos
 * @param responsavelId ID do responsável
 * @param tenantId ID do tenant
 */
export async function processarConsumoInsumos(
  producaoId: number, 
  itens: {insumoId: number, quantidade: number}[],
  responsavelId: number | undefined,
  tenantId: number
) {
  return await db.$transaction(async (tx) => {
    for (const item of itens) {
      // Buscar insumo
      const insumo = await tx.insumo.findUnique({
        where: { id: item.insumoId }
      });
      
      if (!insumo) {
        throw new Error(`Insumo com ID ${item.insumoId} não encontrado`);
      }
      
      // Verificar se há estoque suficiente
      if (insumo.estoqueAtual < item.quantidade) {
        throw new Error(`Estoque insuficiente para o insumo ${insumo.nome}`);
      }
      
      // Atualizar estoque
      await tx.insumo.update({
        where: { id: insumo.id },
        data: {
          estoqueAtual: insumo.estoqueAtual - item.quantidade
        }
      });
      
      // Registrar movimentação
      await tx.movimentacaoInsumo.create({
        data: await addTenantId({
          insumoId: insumo.id,
          quantidade: item.quantidade,
          tipoMovimentacao: 'PRODUCAO',
          documentoId: producaoId,
          documentoTipo: 'PRODUCAO',
          observacao: `Consumo para produção #${producaoId}`,
          responsavelId
        }, tenantId)
      });
    }
    
    return true;
  });
}
