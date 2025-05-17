import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';

// GET - Listar todos os complementos
export async function GET(request: NextRequest) {
  try {
    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Parâmetros de consulta
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const grupoId = searchParams.get('grupoId') ? parseInt(searchParams.get('grupoId') as string) : null;
    const status = searchParams.get('status') === 'true' ? true : 
                  searchParams.get('status') === 'false' ? false : undefined;

    // Construir o where clause para filtros
    let whereClause: any = {
      tenantId
    };

    if (search) {
      whereClause.OR = [
        { nome: { contains: search } },
        { descricao: { contains: search } }
      ];
    }

    if (grupoId) {
      whereClause.grupoId = grupoId;
    }

    if (status !== undefined) {
      whereClause.status = status;
    }

    // Buscar complementos do tenant
    const complementos = await db.complemento.findMany({
      where: whereClause,
      include: {
        grupo: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: { nome: 'asc' }
    });

    return NextResponse.json({ complementos });
  } catch (error) {
    console.error('Erro ao buscar complementos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect()
  }
}

// POST - Criar um novo complemento
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Validações
    if (!data.nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe um complemento com o mesmo nome neste tenant
    const complementoExistente = await db.complemento.findFirst({
      where: {
        nome: data.nome,
        tenantId
      }
    });

    if (complementoExistente) {
      return NextResponse.json(
        { error: 'Já existe um complemento com este nome' },
        { status: 400 }
      );
    }

    // Adicionar tenantId aos dados
    const complementoData = await addTenantId({
      nome: data.nome,
      descricao: data.descricao,
      precoAdicional: data.precoAdicional ? parseFloat(data.precoAdicional) : 0,
      grupoId: data.grupoId ? parseInt(data.grupoId) : null,
      status: data.status !== undefined ? data.status : true
    }, tenantId);

    // Criar complemento
    const complemento = await db.complemento.create({
      data: complementoData
    });

    return NextResponse.json({ 
      message: 'Complemento criado com sucesso',
      complemento 
    });
  } catch (error) {
    console.error('Erro ao criar complemento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
