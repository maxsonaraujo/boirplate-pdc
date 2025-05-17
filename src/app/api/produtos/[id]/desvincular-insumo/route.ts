import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
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

    const produtoId = parseInt(routeParams.id);

    // Verificar se o produto existe
    const produto = await db.produto.findFirst({
      where: {
        id: produtoId,
        tenantId
      }
    });

    if (!produto) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o produto realmente tem um insumo vinculado
    if (!produto.insumoVinculadoId) {
      return NextResponse.json(
        { message: 'Este produto não possui insumo vinculado' },
        { status: 400 }
      );
    }

    // Desvincular o insumo do produto
    const produtoAtualizado = await db.produto.update({
      where: {
        id: produtoId
      },
      data: {
        insumoVinculadoId: null
      }
    });

    return NextResponse.json({
      message: 'Insumo desvinculado do produto com sucesso',
      produto: produtoAtualizado
    });
  } catch (error) {
    console.error('Erro ao desvincular insumo do produto:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
