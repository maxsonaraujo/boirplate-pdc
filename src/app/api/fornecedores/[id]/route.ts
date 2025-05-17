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

    // Buscar fornecedor
    const fornecedor = await db.fornecedor.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        _count: {
          select: {
            insumos: true,
            compras: true,
            lotes: true
          }
        }
      }
    });

    if (!fornecedor) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    // Buscar insumos relacionados
    const insumos = await db.insumo.findMany({
      where: {
        fornecedorPrincipalId: id,
        tenantId
      },
      select: {
        id: true,
        nome: true,
        codigo: true,
        precoCusto: true,
        estoqueAtual: true,
        unidadeMedida: {
          select: {
            simbolo: true
          }
        }
      },
      take: 5
    });

    // Buscar compras recentes
    const compras = await db.compra.findMany({
      where: {
        fornecedorId: id,
        tenantId
      },
      select: {
        id: true,
        codigo: true,
        dataCompra: true,
        valorTotal: true,
        status: true
      },
      orderBy: {
        dataCompra: 'desc'
      },
      take: 5
    });

    return NextResponse.json({
      fornecedor,
      insumos,
      compras
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
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
    if (!data.razaoSocial) {
      return NextResponse.json(
        { message: 'Razão social é obrigatória' },
        { status: 400 }
      );
    }

    if (!data.codigo) {
      return NextResponse.json(
        { message: 'Código do fornecedor é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o fornecedor existe e pertence ao tenant
    const fornecedorExistente = await db.fornecedor.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!fornecedorExistente) {
      return NextResponse.json(
        { message: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o código já está em uso por outro fornecedor
    if (data.codigo !== fornecedorExistente.codigo) {
      const codigoEmUso = await db.fornecedor.findFirst({
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
          { message: 'Este código já está sendo usado por outro fornecedor' },
          { status: 400 }
        );
      }
    }

    // Verificar se o CNPJ já está em uso por outro fornecedor (se fornecido e alterado)
    if (data.cnpj && data.cnpj !== fornecedorExistente.cnpj) {
      const cnpjEmUso = await db.fornecedor.findFirst({
        where: {
          cnpj: data.cnpj,
          tenantId,
          id: {
            not: id
          }
        }
      });

      if (cnpjEmUso) {
        return NextResponse.json(
          { message: 'Este CNPJ já está cadastrado para outro fornecedor' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const fornecedorData = {
      codigo: data.codigo,
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      cnpj: data.cnpj,
      inscricaoEstadual: data.inscricaoEstadual,
      telefone: data.telefone,
      email: data.email,
      endereco: data.endereco,
      contato: data.contato,
      observacoes: data.observacoes,
      status: data.status !== undefined ? data.status : true
    };

    // Atualizar fornecedor
    const fornecedorAtualizado = await db.fornecedor.update({
      where: { id },
      data: fornecedorData
    });

    return NextResponse.json({
      message: 'Fornecedor atualizado com sucesso',
      fornecedor: fornecedorAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
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

    // Verificar se o fornecedor existe e pertence ao tenant
    const fornecedor = await db.fornecedor.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        _count: {
          select: {
            insumos: true,
            compras: true,
            lotes: true
          }
        }
      }
    });

    if (!fornecedor) {
      return NextResponse.json(
        { message: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o fornecedor possui dependências
    if (fornecedor._count.insumos > 0 || fornecedor._count.compras > 0 || fornecedor._count.lotes > 0) {
      return NextResponse.json(
        { message: 'Este fornecedor possui insumos, compras ou lotes associados e não pode ser excluído' },
        { status: 400 }
      );
    }

    // Excluir fornecedor
    await db.fornecedor.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Fornecedor excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
