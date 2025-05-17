import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { z } from "zod";

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const tenantId = Number(url.searchParams.get("tenantId"));

    if (!tenantId) {
      return NextResponse.json(
        { error: "ID do tenant não fornecido" }, 
        { status: 400 }
      );
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        modules: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant não encontrado" }, 
        { status: 404 }
      );
    }

    const modules = tenant.modules.map((tm) => ({
      id: tm.module.id,
      name: tm.module.name,
      slug: tm.module.slug,
      description: tm.module.description,
    }));

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("[MÓDULOS_TENANT_GET]", error);
    return NextResponse.json(
      { error: "Erro ao buscar módulos do tenant" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

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

    // Verificar permissões de administrador
    if (authCheck.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada. Apenas administradores podem associar módulos a tenants.' },
        { status: 403 }
      );
    }

    const bodySchema = z.object({
      tenantId: z.string(),
      moduleId: z.string(),
    });

    const body = await request.json();
    const { tenantId, moduleId } = bodySchema.parse(body);

    // Verificar se o relacionamento já existe
    const existingRelation = await db.tenantsOnModules.findUnique({
      where: {
        tenantId_moduleId: {
          tenantId: parseInt(tenantId),
          moduleId: parseInt(moduleId),
        },
      },
    });

    if (existingRelation) {
      return NextResponse.json(
        { error: "Este tenant já possui este módulo" },
        { status: 409 }
      );
    }

    await db.tenantsOnModules.create({
      data: {
        tenantId: parseInt(tenantId),
        moduleId: parseInt(moduleId),
      },
    });

    return NextResponse.json(
      { success: true, message: "Módulo associado ao tenant com sucesso" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[MÓDULOS_TENANT_POST]", error);
    return NextResponse.json(
      { error: "Erro ao adicionar módulo ao tenant" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
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
    
    // Verificar permissões de administrador
    if (authCheck.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada. Apenas administradores podem remover módulos de tenants.' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const moduleId = url.searchParams.get("moduleId");

    if (!tenantId || !moduleId) {
      return NextResponse.json(
        { error: "ID do tenant ou ID do módulo não fornecido" },
        { status: 400 }
      );
    }

    await db.tenantsOnModules.delete({
      where: {
        tenantId_moduleId: {
          tenantId: parseInt(tenantId),
          moduleId: parseInt(moduleId),
        },
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Módulo removido do tenant com sucesso" 
    });
  } catch (error) {
    console.error("[MÓDULOS_TENANT_DELETE]", error);
    return NextResponse.json(
      { error: "Erro ao remover módulo do tenant" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';