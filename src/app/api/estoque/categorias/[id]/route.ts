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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const id = parseInt((await params).id);

    // Buscar categoria
    const categoria = await db.categoriaInsumo.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        _count: {
          select: { insumos: true }
        }
      }
    });

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ categoria });
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
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
    
    // Obter o ID do tenant
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
        { message: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a categoria existe
    const categoriaExistente = await db.categoriaInsumo.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!categoriaExistente) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe outra categoria com o mesmo nome
    const nomeEmUso = await db.categoriaInsumo.findFirst({
      where: {
        nome: data.nome,
        id: { not: id },
        tenantId
      }
    });

    if (nomeEmUso) {
      return NextResponse.json(
        { message: 'Já existe uma categoria com este nome' },
        { status: 400 }
      );
    }

    // Atualizar categoria
    const categoria = await db.categoriaInsumo.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        status: data.status !== undefined ? data.status : true
      }
    });

    return NextResponse.json({
      message: 'Categoria atualizada com sucesso',
      categoria
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const data = await request.json();

    // Verificar se a categoria existe
    const categoria = await db.categoriaInsumo.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!categoria) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar apenas o status
    const categoriaAtualizada = await db.categoriaInsumo.update({
      where: { id },
      data: {
        status: data.status
      }
    });

    return NextResponse.json({
      message: `Categoria ${data.status ? 'ativada' : 'desativada'} com sucesso`,
      categoria: categoriaAtualizada
    });
  } catch (error) {
    console.error('Erro ao atualizar status da categoria:', error);
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
    
    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const id = parseInt((await params).id);

    // Verificar se a categoria existe
    const categoria = await db.categoriaInsumo.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        _count: {
          select: { insumos: true }
        }
      }
    });

    if (!categoria) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a categoria tem insumos associados
    if (categoria._count.insumos > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir uma categoria que possui insumos associados' },
        { status: 400 }
      );
    }

    // Excluir categoria
    await db.categoriaInsumo.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Categoria excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
