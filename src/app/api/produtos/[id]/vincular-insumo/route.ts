import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const requestParams = await params;
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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const produtoId = parseInt(requestParams.id);
    const { insumoId } = await request.json();

    if (!insumoId) {
      return NextResponse.json(
        { message: 'ID do insumo não fornecido' },
        { status: 400 }
      );
    }

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

    // Verificar se o insumo existe
    const insumo = await db.insumo.findFirst({
      where: {
        id: insumoId,
        tenantId
      }
    });

    if (!insumo) {
      return NextResponse.json(
        { message: 'Insumo não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o produto para vincular ao insumo
    const produtoAtualizado = await db.produto.update({
      where: {
        id: produtoId
      },
      data: {
        insumoVinculadoId: insumoId,
        controlaEstoque: true, // Garantir que o controle de estoque esteja ativado
      }
    });

    return NextResponse.json({
      message: 'Produto vinculado ao insumo com sucesso',
      produto: produtoAtualizado
    });
  } catch (error) {
    console.error('Erro ao vincular produto ao insumo:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
