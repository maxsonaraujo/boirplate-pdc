import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';

// GET - Listar todas as unidades de medida
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
    const status = searchParams.get('status') === 'true' ? true : 
                  searchParams.get('status') === 'false' ? false : undefined;

    // Construir o where clause para filtros
    let whereClause: any = {
      tenantId
    };

    if (search) {
      whereClause.OR = [
        { nome: { contains: search } },
        { simbolo: { contains: search } },
        { descricao: { contains: search } }
      ];
    }

    if (status !== undefined) {
      whereClause.status = status;
    }

    // Buscar unidades de medida do tenant
    const unidadesMedida = await db.unidadeMedida.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            produtos: true,
            ingredientes: true
          }
        }
      },
      orderBy: { nome: 'asc' }
    });

    return NextResponse.json({ unidadesMedida });
  } catch (error) {
    console.error('Erro ao buscar unidades de medida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova unidade de medida
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

    if (!data.simbolo) {
      return NextResponse.json(
        { error: 'Símbolo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma unidade com o mesmo símbolo
    // Note: símbolo é unique global, podemos ajustar para ser unique por tenant
    // mas precisaria alterar o schema do Prisma
    const unidadeExistente = await db.unidadeMedida.findFirst({
      where: {
        simbolo: data.simbolo
      }
    });

    if (unidadeExistente) {
      return NextResponse.json(
        { error: 'Já existe uma unidade com este símbolo' },
        { status: 400 }
      );
    }

    // Adicionar tenantId aos dados
    const unidadeData = await addTenantId({
      nome: data.nome,
      simbolo: data.simbolo,
      descricao: data.descricao,
      status: data.status !== undefined ? data.status : true
    }, tenantId);

    // Criar unidade de medida
    const unidadeMedida = await db.unidadeMedida.create({
      data: unidadeData
    });

    return NextResponse.json({ 
      message: 'Unidade de medida criada com sucesso',
      unidadeMedida 
    });
  } catch (error) {
    console.error('Erro ao criar unidade de medida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
