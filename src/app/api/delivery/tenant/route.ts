import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter informações do tenant pelo slug
export async function GET(request: NextRequest) {
  try {

    const idTenant = await getTenantIdFromHeaders()


    // Buscar o tenant pelo slug
    const tenant = await db.tenant.findUnique({
      where: { id: idTenant },
      select: {
        id: true,
        nome: true,
        slug: true,
        logotipo: true,
        corPrimaria: true,
        corSecundaria: true,
        dominio: true
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Erro ao buscar informações do tenant:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
