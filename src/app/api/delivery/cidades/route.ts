import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter cidades disponíveis para entrega por tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get('slug');
    const tenantId = searchParams.get('tenantId') ? 
      parseInt(searchParams.get('tenantId') || '0') : 
      null;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let whereClause: any = {};

    if (slug) {
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

      whereClause.tenantId = tenant.id;
    } else if (tenantId) {
      whereClause.tenantId = tenantId;
    } else {
      // Para requisições admin, obter o tenant do cookie
      const token = (await cookies()).get('token');
      if (token) {
        const authCheck = await checkAuthAndPermissions(token);
        if (authCheck.error) {
          return NextResponse.json(
            { message: authCheck.error },
            { status: authCheck.status }
          );
        }

        const adminTenantId = await getTenantIdFromHeaders();
        if (adminTenantId) {
          whereClause.tenantId = adminTenantId;
        }
      }

      if (!whereClause.tenantId) {
        return NextResponse.json(
          { error: 'Tenant não identificado' },
          { status: 400 }
        );
      }
    }

    // Adicionar filtro para apenas cidades ativas (se não foi solicitado incluir inativas)
    if (!includeInactive) {
      whereClause.ativo = true;
    }

    // Buscar cidades disponíveis
    const cidades = await db.cidadeEntrega.findMany({
      where: whereClause,
      select: {
        id: true,
        nome: true,
        estado: true,
        ativo: true,
        valorEntrega: true,
        tempoEstimado: true,
        _count: {
          select: {
            bairros: true
          }
        }
      },
      orderBy: [
        { estado: 'asc' },
        { nome: 'asc' }
      ]
    });

    return NextResponse.json({ cidades });
  } catch (error) {
    console.error('Erro ao buscar cidades disponíveis:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// POST - Adicionar cidade disponível (somente admin)
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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter dados da requisição
    const data = await request.json();
    const { nome, estado, valorEntrega = 0, tempoEstimado = '30-45', ativo = true } = data;

    if (!nome || !estado) {
      return NextResponse.json(
        { error: 'Nome e estado são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a cidade já existe
    const cidadeExistente = await db.cidadeEntrega.findFirst({
      where: {
        tenantId,
        nome,
        estado
      }
    });

    if (cidadeExistente) {
      return NextResponse.json(
        { error: 'Esta cidade já está cadastrada' },
        { status: 400 }
      );
    }

    // Criar nova cidade
    const novaCidade = await db.cidadeEntrega.create({
      data: {
        tenantId,
        nome,
        estado,
        valorEntrega,
        tempoEstimado,
        ativo
      }
    });

    return NextResponse.json({
      message: 'Cidade adicionada com sucesso',
      cidade: novaCidade
    });
  } catch (error) {
    console.error('Erro ao adicionar cidade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
