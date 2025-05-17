import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';

export async function POST(request: NextRequest) {
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

    const data = await request.json();

    // Validações básicas
    if (!data.produtoId) {
      return NextResponse.json(
        { message: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!data.tipo) {
      return NextResponse.json(
        { message: 'Tipo de movimentação é obrigatório' },
        { status: 400 }
      );
    }
    
    if (data.quantidade <= 0) {
      return NextResponse.json(
        { message: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const produto = await db.produto.findFirst({
      where: {
        id: parseInt(data.produtoId),
        tenantId
      },
      include: {
        insumoVinculado: {
          include: {
            unidadeMedida: true
          }
        }
      }
    });

    if (!produto) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar estoque disponível para saídas
    if (data.tipo === 'SAIDA') {
      if (produto.estoqueAtual < data.quantidade) {
        return NextResponse.json(
          { message: 'Estoque de produto insuficiente para esta operação' },
          { status: 400 }
        );
      }
      
      // Verificar estoque do insumo vinculado, se aplicável
      if (produto.insumoVinculadoId && produto.baixaAutomatica) {
        const quantidadeInsumoNecessaria = data.quantidade * (produto.qtdInsumoConsumida || 1);
        
        if (produto.insumoVinculado.estoqueAtual < quantidadeInsumoNecessaria) {
          return NextResponse.json({
            message: `Estoque de insumo insuficiente. Necessário: ${quantidadeInsumoNecessaria} ${produto.insumoVinculado.unidadeMedida?.simbolo || 'unidades'}`,
            status: 400
          });
        }
      }
    }

    // Iniciar transação
    const resultado = await db.$transaction(async (tx) => {
      // 1. Atualizar estoque do produto
      const novoEstoqueProduto = produto.estoqueAtual + 
        (data.tipo === 'ENTRADA' ? parseFloat(data.quantidade) : -parseFloat(data.quantidade));
      
      await tx.produto.update({
        where: { id: produto.id },
        data: { estoqueAtual: novoEstoqueProduto }
      });
      
      // 2. Registrar movimentação do produto
      const movimentacao = await tx.movimentacaoEstoque.create({
        data: await addTenantId({
          produtoId: produto.id,
          quantidade: parseFloat(data.quantidade),
          tipo: data.tipo,
          observacao: data.observacao,
          documentoId: data.documentoId,
          documentoTipo: data.documentoTipo,
          usuarioId: authCheck.user?.id
        }, tenantId)
      });
      
      // 3. Se houver insumo vinculado e a baixa automática estiver ativada
      if (produto.insumoVinculadoId && produto.baixaAutomatica) {
        // Calcular quantidade de insumo
        const quantidadeInsumo = parseFloat(data.quantidade) * (produto.qtdInsumoConsumida || 1);
        
        // Atualizar estoque do insumo
        const novoEstoqueInsumo = produto.insumoVinculado.estoqueAtual + 
          (data.tipo === 'ENTRADA' ? quantidadeInsumo : -quantidadeInsumo);
        
        await tx.insumo.update({
          where: { id: produto.insumoVinculadoId },
          data: { estoqueAtual: novoEstoqueInsumo }
        });
        
        // Registrar movimentação do insumo
        await tx.movimentacaoInsumo.create({
          data: await addTenantId({
            insumoId: produto.insumoVinculadoId,
            quantidade: quantidadeInsumo,
            tipoMovimentacao: data.tipo,
            observacao: `${data.observacao || ''} (Via produto #${produto.codigo})`,
            documentoId: data.documentoId,
            documentoTipo: data.documentoTipo,
            responsavelId: authCheck.user?.id
          }, tenantId)
        });
      }
      
      return { movimentacao, novoEstoque: novoEstoqueProduto };
    });

    return NextResponse.json({
      message: 'Movimentação registrada com sucesso',
      movimentacao: resultado.movimentacao,
      estoqueAtual: resultado.novoEstoque
    });
  } catch (error) {
    console.error('Erro ao registrar movimentação de produto:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
