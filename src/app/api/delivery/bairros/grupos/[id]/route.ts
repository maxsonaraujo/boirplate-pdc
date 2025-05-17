import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter detalhes de um grupo de bairros
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    const grupoId = parseInt(routeParams.id);
    
    if (isNaN(grupoId)) {
      return NextResponse.json(
        { error: 'ID de grupo inválido' },
        { status: 400 }
      );
    }
    
    // Verificar autenticação
    const token = (await cookies()).get('token');
    const isAdmin = token ? !(await checkAuthAndPermissions(token)).error : false;
    
    // Obter o ID do tenant
    let tenantId;
    
    if (isAdmin) {
      tenantId = await getTenantIdFromHeaders();
    } else {
      const { searchParams } = request.nextUrl;
      const slug = searchParams.get('slug');
      
      if (!slug) {
        return NextResponse.json(
          { error: 'É necessário fornecer o slug ou estar autenticado' },
          { status: 400 }
        );
      }
      
      // Buscar tenant pelo slug
      const tenant = await db.tenant.findUnique({
        where: { slug },
        select: { id: true }
      });
      
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant não encontrado' },
          { status: 404 }
        );
      }
      
      tenantId = tenant.id;
    }
    
    // Buscar grupo de bairros
    const grupo = await db.grupoBairro.findFirst({
      where: {
        id: grupoId,
        tenantId
      },
      include: {
        _count: {
          select: { bairros: true }
        },
        bairros: {
          select: {
            id: true,
            nome: true,
            cidade: {
              select: {
                nome: true,
                estado: true
              }
            }
          },
          orderBy: {
            nome: 'asc'
          }
        }
      }
    });
    
    if (!grupo) {
      return NextResponse.json(
        { error: 'Grupo de bairros não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ grupo });
  } catch (error) {
    console.error('Erro ao buscar grupo de bairros:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT - Atualizar grupo de bairros
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    const grupoId = parseInt(routeParams.id);
    
    if (isNaN(grupoId)) {
      return NextResponse.json(
        { error: 'ID de grupo inválido' },
        { status: 400 }
      );
    }
    
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
    
    // Verificar se o grupo existe e pertence ao tenant
    const grupoExistente = await db.grupoBairro.findFirst({
      where: {
        id: grupoId,
        tenantId
      }
    });
    
    if (!grupoExistente) {
      return NextResponse.json(
        { error: 'Grupo de bairros não encontrado' },
        { status: 404 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    const {
      nome,
      descricao,
      valorEntrega,
      tempoEstimado,
      ativo
    } = data;
    
    // Validar campos obrigatórios
    if (!nome || valorEntrega === undefined) {
      return NextResponse.json(
        { error: 'Nome e valor de entrega são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe outro grupo com o mesmo nome
    if (nome !== grupoExistente.nome) {
      const outroGrupoMesmoNome = await db.grupoBairro.findFirst({
        where: {
          tenantId,
          nome,
          id: { not: grupoId }
        }
      });
      
      if (outroGrupoMesmoNome) {
        return NextResponse.json(
          { error: 'Já existe outro grupo com este nome' },
          { status: 400 }
        );
      }
    }
    
    // Atualizar grupo
    const grupoAtualizado = await db.grupoBairro.update({
      where: { id: grupoId },
      data: {
        nome,
        descricao,
        valorEntrega,
        tempoEstimado,
        ativo: ativo !== undefined ? ativo : grupoExistente.ativo
      }
    });
    
    return NextResponse.json({
      message: 'Grupo de bairros atualizado com sucesso',
      grupo: grupoAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar grupo de bairros:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// DELETE - Excluir grupo de bairros
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    const grupoId = parseInt(routeParams.id);
    
    if (isNaN(grupoId)) {
      return NextResponse.json(
        { error: 'ID de grupo inválido' },
        { status: 400 }
      );
    }
    
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
    
    // Verificar se o grupo existe e pertence ao tenant
    const grupoExistente = await db.grupoBairro.findFirst({
      where: {
        id: grupoId,
        tenantId
      },
      include: {
        _count: {
          select: { bairros: true }
        }
      }
    });
    
    if (!grupoExistente) {
      return NextResponse.json(
        { error: 'Grupo de bairros não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se há bairros associados
    if (grupoExistente._count.bairros > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um grupo que possui bairros associados' },
        { status: 400 }
      );
    }
    
    // Excluir grupo
    await db.grupoBairro.delete({
      where: { id: grupoId }
    });
    
    return NextResponse.json({
      message: 'Grupo de bairros excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir grupo de bairros:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
