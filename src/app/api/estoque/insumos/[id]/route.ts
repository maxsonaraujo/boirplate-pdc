import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

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

    const id = parseInt((await params).id);

    // Buscar insumo
    const insumo = await db.insumo.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        categoriaInsumo: true,
        unidadeMedida: true,
        fornecedorPrincipal: true,
        _count: {
          select: {
            lotes: true,
            movimentacoes: true
          }
        }
      }
    });

    if (!insumo) {
      return NextResponse.json(
        { error: 'Insumo não encontrado' },
        { status: 404 }
      );
    }

    // Buscar últimas movimentações
    const ultimasMovimentacoes = await db.movimentacaoInsumo.findMany({
      where: {
        insumoId: id,
        tenantId
      },
      orderBy: {
        criadoEm: 'desc'
      },
      take: 5,
      include: {
        responsavel: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      insumo,
      ultimasMovimentacoes
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do insumo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

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

    const id = parseInt((await params).id);
    const data = await request.json();

    // Validações básicas
    if (!data.nome) {
      return NextResponse.json(
        { message: 'Nome do insumo é obrigatório' },
        { status: 400 }
      );
    }

    if (!data.codigo) {
      return NextResponse.json(
        { message: 'Código do insumo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o insumo existe e pertence ao tenant
    const insumoExistente = await db.insumo.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!insumoExistente) {
      return NextResponse.json(
        { message: 'Insumo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o código já está em uso por outro insumo
    if (data.codigo !== insumoExistente.codigo) {
      const codigoEmUso = await db.insumo.findFirst({
        where: {
          codigo: data.codigo,
          tenantId,
          id: {
            not: id
          }
        }
      });

      if (codigoEmUso) {
        return NextResponse.json(
          { message: 'Este código já está sendo usado por outro insumo' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const insumoData = {
      codigo: data.codigo,
      nome: data.nome,
      descricao: data.descricao,
      precoCusto: parseFloat(data.precoCusto || 0),
      estoqueMinimo: parseFloat(data.estoqueMinimo || 0),
      categoriaInsumoId: data.categoriaInsumoId ? parseInt(data.categoriaInsumoId) : null,
      unidadeMedidaId: data.unidadeMedidaId ? parseInt(data.unidadeMedidaId) : null,
      fornecedorPrincipalId: data.fornecedorPrincipalId ? parseInt(data.fornecedorPrincipalId) : null,
      localizacaoEstoque: data.localizacaoEstoque,
      diasValidade: data.diasValidade ? parseInt(data.diasValidade) : null,
      notificarVencimento: data.notificarVencimento !== undefined ? data.notificarVencimento : true,
      status: data.status !== undefined ? data.status : true
    };

    // Atualizar insumo
    const insumoAtualizado = await db.insumo.update({
      where: { id },
      data: insumoData
    });

    return NextResponse.json({
      message: 'Insumo atualizado com sucesso',
      insumo: insumoAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar insumo:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

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
    
    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const id = parseInt((await params).id);

    // Verificar se o insumo existe e pertence ao tenant
    const insumo = await db.insumo.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        _count: {
          select: {
            movimentacoes: true,
            lotes: true,
            ingredientes: true
          }
        }
      }
    });

    if (!insumo) {
      return NextResponse.json(
        { message: 'Insumo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o insumo possui dependências
    if (insumo._count.movimentacoes > 0 || insumo._count.lotes > 0 || insumo._count.ingredientes > 0) {
      return NextResponse.json(
        { message: 'Este insumo possui movimentações, lotes ou é usado em receitas e não pode ser excluído' },
        { status: 400 }
      );
    }

    // Excluir insumo
    await db.insumo.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Insumo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir insumo:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
