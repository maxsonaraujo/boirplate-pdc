import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';

// GET /api/tenants/[id]/modules - Listar módulos de um tenant específico
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

    // Verificar se é administrador para acessar módulos de outros tenants
    if ((await params).id !== authCheck.user?.tenantId?.toString() && authCheck.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Acesso negado. Permissão de administrador necessária.' },
        { status: 403 }
      );
    }

    const tenantId = parseInt((await params).id);

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'ID do tenant inválido' },
        { status: 400 }
      );
    }

    // Verificar se o tenant existe
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Obter módulos associados ao tenant
    const tenantModules = await db.tenantsOnModules.findMany({
      where: { tenantId },
      include: {
        module: true
      }
    });

    // Retornar os módulos no formato esperado pelo cliente
    const modules = tenantModules.map(tm => ({
      id: tm.module.id,
      name: tm.module.name,
      slug: tm.module.slug,
      description: tm.module.description || null,
      isActive: tm.module.isActive
    }));

    return NextResponse.json({
      modules,
      count: modules.length
    });

  } catch (error) {
    console.error(`[TENANT_MODULES_GET]`, error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT /api/tenants/[id]/modules - Atualizar módulos de um tenant
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

    // Verificar se é administrador
    if (authCheck.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem atualizar módulos de tenants' },
        { status: 403 }
      );
    }

    const tenantId = parseInt((await params).id);

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'ID do tenant inválido' },
        { status: 400 }
      );
    }

    // Obter os dados da requisição
    const data = await request.json();
    const { moduleIds } = data;

    if (!Array.isArray(moduleIds)) {
      return NextResponse.json(
        { error: 'Lista de IDs de módulos inválida' },
        { status: 400 }
      );
    }

    // Verificar se o tenant existe
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se todos os módulos existem
    const moduleIdsAsNumbers = moduleIds.map(id => Number(id));
    const validModules = await db.module.findMany({
      where: {
        id: { in: moduleIdsAsNumbers },
        isActive: true
      },
      select: { id: true }
    });

    const validModuleIds = validModules.map(m => m.id);

    // Primeiro, remover todas as associações existentes
    await db.tenantsOnModules.deleteMany({
      where: { tenantId }
    });

    // Depois, criar novas associações para os módulos selecionados
    if (validModuleIds.length > 0) {
      await db.$transaction(
        validModuleIds.map(moduleId =>
          db.tenantsOnModules.create({
            data: {
              tenantId,
              moduleId,
              isActive: true
            }
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Módulos do tenant atualizados com sucesso',
      updatedModules: validModuleIds.length
    });

  } catch (error) {
    console.error(`[TENANT_MODULES_PUT]`, error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;