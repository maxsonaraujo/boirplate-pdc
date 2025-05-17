import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const slug = searchParams.get('slug');

    if (!domain && !slug) {
      return NextResponse.json(
        { error: 'Domínio ou slug é necessário para resolver o tenant' },
        { status: 400 }
      );
    }

    let tenant = null;

    if (domain) {
      tenant = await db.tenant.findFirst({
        where: {
          dominio: domain,
          ativo: true
        },
        select: {
          id: true,
          nome: true,
          slug: true
        }
      });
    } else if (slug) {
      tenant = await db.tenant.findFirst({
        where: {
          slug: slug,
          ativo: true
        },
        select: {
          id: true,
          nome: true,
          slug: true
        }
      });
    }

    if (!tenant) {
      // Em desenvolvimento, criar um tenant fictício para teste
      if (process.env.NODE_ENV === 'development' && (domain === 'localhost' || slug === 'dev')) {
        return NextResponse.json({
          tenant: {
            id: 1,
            nome: 'Desenvolvimento',
            slug: 'dev'
          }
        });
      }

      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Erro ao resolver tenant:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
