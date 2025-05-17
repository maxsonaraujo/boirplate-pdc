import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';

// DELETE /api/tenants/[id]/modules/[moduleId] - Remover um módulo de um tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
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
    if (authCheck.user?.role !== 'ADMIN' && authCheck.user?.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Permissão negada. Apenas administradores ou gerentes podem remover módulos de tenants' },
        { status: 403 }
      );
    }

    const tenantId = parseInt((await params).id);
    const moduleId = parseInt((await params).moduleId);

    if (isNaN(tenantId) || isNaN(moduleId)) {
      return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });
    }

    // Verificar se a associação existe
    const tenantModule = await db.tenantsOnModules.findUnique({
      where: {
        tenantId_moduleId: {
          tenantId,
          moduleId,
        },
      },
    });

    if (!tenantModule) {
      return NextResponse.json({ error: 'Módulo não associado a este tenant' }, { status: 404 });
    }

    // Remover a associação
    await db.tenantsOnModules.delete({
      where: {
        tenantId_moduleId: {
          tenantId,
          moduleId,
        },
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Módulo removido do tenant com sucesso'
    });
  } catch (error) {
    console.error(`[TENANT_MODULE_DELETE]`, error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';