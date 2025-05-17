import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter grupos de complementos associados a um produto
export async function GET(
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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter o ID do produto - IMPORTANTE: await params.id
    const produtoId = parseInt((await params).id);

    if (isNaN(produtoId)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }

    // Verificar se o produto existe e pertence ao tenant
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

    // Buscar grupos de complementos associados ao produto
    const gruposProduto = await db.grupoProduto.findMany({
      where: {
        produtoId
      },
      include: {
        grupoComplemento: {
          include: {
            complementos: {
              include: {
                complemento: true
              }
            }
          }
        }
      },
      orderBy: {
        ordem: 'asc'
      }
    });

    return NextResponse.json({ gruposProduto });
  } catch (error) {
    console.error('Erro ao buscar grupos de complementos do produto:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação: ' + error.message },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT - Atualizar grupos de complementos associados a um produto
export async function PUT(
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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter o ID do produto - IMPORTANTE: await params.id
    const produtoId = parseInt((await params).id);

    if (isNaN(produtoId)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }

    // Verificar se o produto existe e pertence ao tenant
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

    // Obter dados do corpo da requisição
    const data = await request.json();
    const { grupos } = data;

    if (!grupos || !Array.isArray(grupos)) {
      return NextResponse.json(
        { message: 'Dados inválidos. Esperado um array de grupos.' },
        { status: 400 }
      );
    }

    // Remover todos os grupos existentes
    await db.grupoProduto.deleteMany({
      where: {
        produtoId
      }
    });

    // Adicionar novos grupos
    if (grupos.length > 0) {
      for (const grupo of grupos) {
        await db.grupoProduto.create({
          data: {
            produtoId,
            grupoComplementoId: grupo.grupoId,
            ordem: grupo.ordem || 1,
            obrigatorio: grupo.obrigatorio || false,
            minSelecao: grupo.minSelecao,
            maxSelecao: grupo.maxSelecao
          }
        });
      }
    }

    return NextResponse.json({
      message: 'Grupos de complementos atualizados com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar grupos de complementos:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação: ' + error.message },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
