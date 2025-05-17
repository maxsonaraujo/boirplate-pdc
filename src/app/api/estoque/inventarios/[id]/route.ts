import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';

// GET - Obter detalhes de um inventário específico
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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID inválido' },
        { status: 400 }
      );
    }

    // Obter o inventário
    const inventario = await db.inventarioEstoque.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        itens: {
          include: {
            insumo: {
              include: {
                unidadeMedida: true
              }
            },
            lote: true
          }
        }
      }
    });

    if (!inventario) {
      return NextResponse.json(
        { message: 'Inventário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ inventario });
  } catch (error) {
    console.error('Erro ao obter detalhes do inventário:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um inventário
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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se o inventário existe
    const inventarioExistente = await db.inventarioEstoque.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!inventarioExistente) {
      return NextResponse.json(
        { message: 'Inventário não encontrado' },
        { status: 404 }
      );
    }

    // Validar status antes de permitir edição
    if (inventarioExistente.status === 'CONCLUIDO' || inventarioExistente.status === 'CANCELADO') {
      return NextResponse.json(
        { message: 'Não é possível editar um inventário concluído ou cancelado' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Preparar dados para atualização
    const inventarioData: any = {};

    if (data.codigo !== undefined) inventarioData.codigo = data.codigo;
    if (data.dataInicio !== undefined) inventarioData.dataInicio = new Date(data.dataInicio);
    if (data.dataFim !== undefined) {
      inventarioData.dataFim = data.dataFim ? new Date(data.dataFim) : null;
    }
    if (data.status !== undefined) inventarioData.status = data.status;
    if (data.observacoes !== undefined) inventarioData.observacoes = data.observacoes;

    // Atualizar o inventário
    const inventario = await db.inventarioEstoque.update({
      where: {
        id
      },
      data: inventarioData,
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Inventário atualizado com sucesso',
      inventario
    });
  } catch (error) {
    console.error('Erro ao atualizar inventário:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um inventário
export async function DELETE(
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
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se o inventário existe
    const inventario = await db.inventarioEstoque.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!inventario) {
      return NextResponse.json(
        { message: 'Inventário não encontrado' },
        { status: 404 }
      );
    }

    // Não permitir exclusão se o inventário estiver concluído
    if (inventario.status === 'CONCLUIDO') {
      return NextResponse.json(
        { message: 'Não é possível excluir um inventário concluído' },
        { status: 400 }
      );
    }

    // Excluir todos os itens do inventário primeiro
    await db.itemInventario.deleteMany({
      where: {
        inventarioId: id
      }
    });

    // Excluir o inventário
    await db.inventarioEstoque.delete({
      where: {
        id
      }
    });

    return NextResponse.json({
      message: 'Inventário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir inventário:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
