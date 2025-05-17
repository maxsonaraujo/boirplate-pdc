import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { db } from '@/db/connector';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const headersList = await headers();

    const tenantId = cookieStore.get('x-tenant-id')?.value;
    console.log('Tenant ID:', tenantId);

    let tenant = null;

    // Se já temos um tenant ID, use-o diretamente
    if (tenantId) {
      tenant = await db.tenant.findUnique({
        where: {
          id: parseInt(tenantId),
          ativo: true
        },
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
    }
    // Se temos um domínio, tente resolver o tenant por ele

    else if (headersList.has('host')) {
      const tenantDomain = headersList.get('host');
      tenant = await db.tenant.findFirst({
        where: {
          dominio: tenantDomain,
          ativo: true
        },
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
    }


    if (!tenant) {
      // Se estamos em desenvolvimento, criar um tenant padrão para facilitar testes
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          tenant: {
            id: 1,
            nome: 'Desenvolvimento',
            slug: 'dev',
            logotipo: null,
            corPrimaria: '#38B2AC',
            corSecundaria: '#319795',
            dominio: 'localhost'
          }
        });
      }

      return NextResponse.json(
        { error: 'Tenant não encontrado ou inativo' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Erro ao buscar informações do tenant:', error);

    // Retornar tenant padrão em modo de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        tenant: {
          id: 1,
          nome: 'Desenvolvimento',
          slug: 'dev',
          logotipo: null,
          corPrimaria: '#38B2AC',
          corSecundaria: '#319795',
          dominio: 'localhost'
        }
      });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
