import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';

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

    // Verificar se é administrador
    if (authCheck.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Acesso negado. Permissão de administrador necessária.' },
        { status: 403 }
      );
    }

    // Buscar todos os tenants
    const tenants = await db.tenant.findMany({
      select: {
        id: true,
        nome: true,
        slug: true,
        logotipo: true,
        dominio: true,
        ativo: true,
        corPrimaria: true,
        corSecundaria: true
      },
      orderBy: {
        nome: 'asc'
      }
    });

    return NextResponse.json({
      tenants,
      count: tenants.length
    });

  } catch (error) {
    console.error('Erro ao buscar tenants:', error);
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