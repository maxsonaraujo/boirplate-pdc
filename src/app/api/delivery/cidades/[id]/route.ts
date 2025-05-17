import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter detalhes de uma cidade específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    const cidadeId = parseInt(routeParams.id);
    
    if (isNaN(cidadeId)) {
      return NextResponse.json(
        { error: 'ID de cidade inválido' },
        { status: 400 }
      );
    }

    // Buscar cidade com contagem de bairros
    const cidade = await db.cidadeEntrega.findUnique({
      where: { id: cidadeId },
      include: {
        _count: {
          select: {
            bairros: true
          }
        }
      }
    });

    if (!cidade) {
      return NextResponse.json(
        { error: 'Cidade não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ cidade });
  } catch (error) {
    console.error('Erro ao buscar cidade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT - Atualizar cidade
export async function PUT(
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

    // Obter ID da cidade
    const cidadeId = parseInt(routeParams.id);
    if (isNaN(cidadeId)) {
      return NextResponse.json(
        { message: 'ID de cidade inválido' },
        { status: 400 }
      );
    }

    // Verificar se a cidade existe e pertence ao tenant
    const cidade = await db.cidadeEntrega.findFirst({
      where: {
        id: cidadeId,
        tenantId
      }
    });

    if (!cidade) {
      return NextResponse.json(
        { message: 'Cidade não encontrada' },
        { status: 404 }
      );
    }

    // Obter dados da requisição
    const data = await request.json();
    const { nome, estado, valorEntrega, tempoEstimado, ativo } = data;

    // Atualizar cidade
    const cidadeAtualizada = await db.cidadeEntrega.update({
      where: { id: cidadeId },
      data: {
        nome: nome || cidade.nome,
        estado: estado || cidade.estado,
        valorEntrega: valorEntrega !== undefined ? valorEntrega : cidade.valorEntrega,
        tempoEstimado: tempoEstimado !== undefined ? tempoEstimado : cidade.tempoEstimado,
        ativo: ativo !== undefined ? ativo : cidade.ativo
      }
    });

    return NextResponse.json({
      message: 'Cidade atualizada com sucesso',
      cidade: cidadeAtualizada
    });
  } catch (error) {
    console.error('Erro ao atualizar cidade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// DELETE - Remover cidade
export async function DELETE(
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

    // Obter ID da cidade
    const cidadeId = parseInt(routeParams.id);
    if (isNaN(cidadeId)) {
      return NextResponse.json(
        { message: 'ID de cidade inválido' },
        { status: 400 }
      );
    }

    // Verificar se a cidade existe e pertence ao tenant
    const cidade = await db.cidadeEntrega.findFirst({
      where: {
        id: cidadeId,
        tenantId
      }
    });

    if (!cidade) {
      return NextResponse.json(
        { message: 'Cidade não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se há bairros cadastrados para esta cidade
    const bairrosCount = await db.bairro.count({
      where: {
        cidadeId
      }
    });

    if (bairrosCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir a cidade pois há bairros cadastrados.' },
        { status: 400 }
      );
    }

    // Verificar se há áreas de entrega usando esta cidade
    const areasRelacionadas = await db.areaEntregaCidade.count({
      where: {
        cidadeId
      }
    });

    if (areasRelacionadas > 0) {
      // Ao invés de impedir a exclusão, vamos apenas desativar a cidade
      const cidadeDesativada = await db.cidadeEntrega.update({
        where: { id: cidadeId },
        data: {
          ativo: false
        }
      });

      return NextResponse.json({
        message: 'Cidade desativada pois está sendo usada em áreas de entrega',
        cidade: cidadeDesativada
      });
    }

    // Remover cidade
    await db.cidadeEntrega.delete({
      where: { id: cidadeId }
    });

    return NextResponse.json({
      message: 'Cidade removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover cidade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
