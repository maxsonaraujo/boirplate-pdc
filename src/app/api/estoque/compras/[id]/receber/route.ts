import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token');
    const authCheck = await checkAuthAndPermissions(token);
    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      );
    }
    
    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const id = parseInt((await params).id);
    const data = await request.json();

    // Validar dados
    if (!Array.isArray(data.itens) || data.itens.length === 0) {
      return NextResponse.json(
        { message: 'Itens são obrigatórios para recebimento' },
        { status: 400 }
      );
    }

    // Buscar compra
    const compra = await db.compra.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        itens: true
      }
    });

    if (!compra) {
      return NextResponse.json(
        { message: 'Compra não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a compra pode ser recebida (não deve estar finalizada ou cancelada)
    if (compra.status === 'FINALIZADA' || compra.status === 'CANCELADA') {
      return NextResponse.json(
        { message: `Não é possível receber uma compra ${compra.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Mapear itens existentes para verificação - usando compraId_insumoId como identificador
    const itensExistentes = new Map(compra.itens.map(item => [item.insumoId, item]));

    // Verificar se todos os itens pertencem à compra
    for (const item of data.itens) {
      const insumoId = parseInt(item.id);
      if (!itensExistentes.has(insumoId)) {
        return NextResponse.json(
          { message: `Item para o insumo ID ${insumoId} não pertence a esta compra` },
          { status: 400 }
        );
      }
    }

    // Processar o recebimento em uma transação
    const resultado = await db.$transaction(async (tx) => {
      // Processar cada item primeiro para determinar se todos estarão completos após o recebimento
      const itensAtualizados = new Map();
      
      for (const item of data.itens) {
        const insumoId = parseInt(item.id);
        const itemExistente = itensExistentes.get(insumoId);
        
        if (!itemExistente) continue;  // Segurança extra
        
        // Calcular a nova quantidade recebida
        const quantidadeAnterior = itemExistente.quantidadeRecebida || 0;
        const quantidadeNova = parseFloat(item.quantidadeRecebida) || 0;
        const quantidadeRecebidaTotal = quantidadeNova; // Valor absoluto, não incremental
        
        // Determinar o status do item
        const statusItem = quantidadeRecebidaTotal >= itemExistente.quantidade ? 
          'FINALIZADO' : (quantidadeRecebidaTotal > 0 ? 'PARCIAL' : 'PENDENTE');
          
        itensAtualizados.set(insumoId, {
          quantidadeAnterior,
          quantidadeRecebidaTotal,
          quantidadeIncremento: quantidadeRecebidaTotal - quantidadeAnterior,
          statusItem,
          isCompleto: quantidadeRecebidaTotal >= itemExistente.quantidade
        });
      }
      
      // Verificar se todos os itens da compra estarão completos após esta atualização
      let todosCompletos = true;
      
      for (const [id, item] of itensExistentes) {
        if (itensAtualizados.has(id)) {
          // Se este item está sendo atualizado, verificar se estará completo
          if (!itensAtualizados.get(id).isCompleto) {
            todosCompletos = false;
            break;
          }
        } else {
          // Se este item não está sendo atualizado, verificar o status atual
          const quantidadeRecebida = item.quantidadeRecebida || 0;
          if (quantidadeRecebida < item.quantidade) {
            todosCompletos = false;
            break;
          }
        }
      }
      
      // 1. Atualizar a data de entrega e status da compra
      const novoStatus = todosCompletos ? 'FINALIZADA' : 'PARCIAL';
      
      const compraAtualizada = await tx.compra.update({
        where: { id },
        data: {
          dataEntrega: new Date(),
          status: novoStatus,
          notaFiscal: data.numeroNota || compra.notaFiscal // Alterado numeroNota para notaFiscal conforme definido no schema
        }
      });

      // 2. Processar cada item com as informações já calculadas
      for (const item of data.itens) {
        const insumoId = parseInt(item.id);
        
        if (!itensAtualizados.has(insumoId)) continue;
        
        const itemInfo = itensAtualizados.get(insumoId);
        const itemExistente = itensExistentes.get(insumoId);
        
        // Atualizar o item
        await tx.itemCompra.update({
          where: {
            compraId_insumoId: {
              compraId: compra.id,
              insumoId: itemExistente.insumoId
            }
          },
          data: {
            quantidadeRecebida: itemInfo.quantidadeRecebidaTotal,
            quantidadePendente: Math.max(0, itemExistente.quantidade - itemInfo.quantidadeRecebidaTotal)
          }
        });

        // 3. Se houver quantidade incrementada, atualizar estoque e registrar movimentação
        if (itemInfo.quantidadeIncremento > 0) {
          // Buscar insumo
          const insumo = await tx.insumo.findUnique({
            where: { id: itemExistente.insumoId }
          });

          if (!insumo) {
            throw new Error(`Insumo com ID ${itemExistente.insumoId} não encontrado`);
          }

          // Atualizar preço de custo (média ponderada)
          const estoqueAnterior = insumo.estoqueAtual;
          const novoEstoque = estoqueAnterior + itemInfo.quantidadeIncremento;
          
          // Convertendo Decimal para number para cálculos
          const precoCustoAtual = typeof insumo.precoCusto === 'object' ? 
            parseFloat(insumo.precoCusto.toString()) : 
            insumo.precoCusto;
            
          // Extraindo o valor numérico do preço unitário do item (pode ser Decimal)
          const valorUnitarioItem = typeof itemExistente.precoUnitario === 'object' ?
            parseFloat(itemExistente.precoUnitario.toString()) :
            itemExistente.precoUnitario;
          
          // Só atualiza o preço se tiver estoque anterior ou quantidade recebida > 0
          let novoPrecoCusto = precoCustoAtual;
          
          if (novoEstoque > 0) {
            // Cálculo do preço médio ponderado
            novoPrecoCusto = (
              (estoqueAnterior * precoCustoAtual) + 
              (itemInfo.quantidadeIncremento * valorUnitarioItem)
            ) / novoEstoque;
            
            // Garantir precisão de 2 casas decimais sem arredondamentos inesperados
            novoPrecoCusto = Math.round(novoPrecoCusto * 100) / 100;
          }

          // Atualizar insumo - o Prisma fará conversão de number para Decimal automaticamente
          await tx.insumo.update({
            where: { id: insumo.id },
            data: {
              estoqueAtual: novoEstoque,
              precoCusto: novoPrecoCusto
            }
          });

          // Registrar movimentação de estoque
          await tx.movimentacaoInsumo.create({
            data: await addTenantId({
              insumoId: insumo.id,
              quantidade: itemInfo.quantidadeIncremento,
              tipoMovimentacao: 'ENTRADA',
              documentoId: compra.id.toString(), // Convertendo para string para compatibilidade com o modelo
              documentoTipo: 'COMPRA',
              observacao: `Entrada por recebimento da compra ${compra.codigo}`,
              responsavelId: authCheck.user?.id
            }, tenantId)
          });
        }
      }

      return compraAtualizada;
    });

    return NextResponse.json({
      message: 'Recebimento processado com sucesso',
      compra: resultado
    });
  } catch (error) {
    console.error('Erro ao processar recebimento:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
