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
    const requestParams = await params;
    // Verificar autenticação
    const token = (await cookies()).get('token');
    const authCheck = await checkAuthAndPermissions(token);
    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      );
    }

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const produtoId = parseInt(requestParams.id);

    // Buscar o produto
    const produto = await db.produto.findFirst({
      where: {
        id: produtoId,
        tenantId
      },
      include: {
        unidadeMedida: true
      }
    });

    if (!produto) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Criar um novo insumo baseado nos dados do produto
    const insumoData = {
      codigo: `INS-${produto.codigo}`,
      nome: produto.nome,
      descricao: produto.descricao,
      precoCusto: produto.precoCompra || 0,
      estoqueMinimo: 0,
      estoqueAtual: 0,
      unidadeMedidaId: produto.unidadeMedidaId,
      status: true
    };

    // Criar o insumo
    const novoInsumo = await db.insumo.create({
      data: await addTenantId(insumoData, tenantId)
    });

    // Atualizar o produto para vincular ao novo insumo
    const produtoAtualizado = await db.produto.update({
      where: {
        id: produtoId
      },
      data: {
        insumoVinculadoId: novoInsumo.id,
        controlaEstoque: true // Garantir que o controle de estoque esteja ativado
      }
    });

    return NextResponse.json({
      message: 'Insumo criado e vinculado ao produto com sucesso',
      produto: produtoAtualizado,
      insumo: novoInsumo
    });
  } catch (error) {
    console.error('Erro ao criar insumo a partir do produto:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
