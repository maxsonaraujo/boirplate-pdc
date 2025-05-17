// Adicione este trecho ao seu serviço de estoque

import { db } from "@/db/connector";

export async function movimentarEstoqueProduto(
  produtoId: number,
  quantidade: number,
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE',
  observacao: string = '',
  documentoId?: string,
  documentoTipo?: string
) {
  try {
    // Buscar o produto para verificar se tem insumo vinculado
    const produto = await db.produto.findUnique({
      where: { id: produtoId },
      include: { insumoVinculado: true }
    });
    
    if (!produto) {
      throw new Error('Produto não encontrado');
    }
    
    // Iniciar transação para garantir que ambas as operações sejam bem-sucedidas
    return await db.$transaction(async (prisma) => {
      // Atualizar estoque do produto
      const novoEstoqueProduto = produto.estoqueAtual + (tipo === 'ENTRADA' ? quantidade : -quantidade);
      
      await prisma.produto.update({
        where: { id: produtoId },
        data: { estoqueAtual: novoEstoqueProduto }
      });
      
      // Registrar movimentação do produto
      await prisma.movimentacaoEstoque.create({
        data: {
          produtoId,
          quantidade,
          tipo,
          observacao,
          documentoId,
          documentoTipo,
          // usuarioId: userId // Obtenha o ID do usuário do contexto de autenticação
        }
      });
      
      // Se houver insumo vinculado e a baixa automática estiver ativada
      if (produto.insumoVinculadoId && produto.baixaAutomatica) {
        // Calcular quantidade de insumo a ser consumida
        const quantidadeInsumo = quantidade * (produto.qtdInsumoConsumida || 1);
        
        const novoEstoqueInsumo = produto.insumoVinculado.estoqueAtual + 
          (tipo === 'ENTRADA' ? quantidadeInsumo : -quantidadeInsumo);
        
        await prisma.insumo.update({
          where: { id: produto.insumoVinculadoId },
          data: { estoqueAtual: novoEstoqueInsumo }
        });
        
        // Registrar movimentação do insumo
        await prisma.movimentacaoInsumo.create({
          data: {
            insumoId: produto.insumoVinculadoId,
            quantidade: quantidadeInsumo,
            tipoMovimentacao: tipo,
            observacao: `${observacao} (Movimentação automática via produto #${produto.codigo})`,
            documentoId,
            documentoTipo,
            // responsavelId: userId // Obtenha o ID do usuário do contexto de autenticação
          }
        });
      }
      
      return { success: true, estoqueAtual: novoEstoqueProduto };
    });
  } catch (error) {
    console.error('Erro ao movimentar estoque do produto:', error);
    throw error;
  }
}
