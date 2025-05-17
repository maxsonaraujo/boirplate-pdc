import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';
import { addTenantId } from '@/utils/helpers';

// POST - Vincular um produto a um insumo
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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { produtoId, insumoId, qtdInsumoConsumida = 1 } = data;

    if (!produtoId || !insumoId) {
      return NextResponse.json(
        { message: 'IDs de produto e insumo são obrigatórios' },
        { status: 400 }
      );
    }

    // Atualizar o produto para vincular ao insumo
    const produtoAtualizado = await db.produto.update({
      where: {
        id: parseInt(produtoId)
      },
      data: {
        insumoVinculadoId: parseInt(insumoId),
        qtdInsumoConsumida: qtdInsumoConsumida,
        controlaEstoque: true
      }
    });

    return NextResponse.json({
      message: 'Produto vinculado ao insumo com sucesso',
      produto: produtoAtualizado
    });
  } catch (error) {
    console.error('Erro ao vincular produto ao insumo:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação: ' + error.message },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
