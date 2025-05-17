import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';

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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Parâmetros de consulta
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';
    const sort = searchParams.get('sort') || 'dataInicio';
    const order = searchParams.get('order') || 'desc';

    // Construir o where clause para filtros
    let whereClause: any = { tenantId };

    if (search) {
      whereClause.OR = [
        { codigo: { contains: search } },
        { observacoes: { contains: search } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    // Filtrar por data de início
    if (dataInicio) {
      whereClause.dataInicio = {
        gte: new Date(dataInicio),
      };
    }

    // Filtrar por data de fim
    if (dataFim) {
      whereClause.dataFim = {
        lte: new Date(dataFim),
      };
    }

    // Consulta para contagem total
    const totalCount = await db.inventarioEstoque.count({ where: whereClause });

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Ordenação
    const orderByClause: any = {};
    orderByClause[sort] = order.toLowerCase();

    // Consulta principal com paginação
    const inventarios = await db.inventarioEstoque.findMany({
      where: whereClause,
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            itens: true
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit
    });
    
    return NextResponse.json({
      inventarios,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Erro ao listar inventários:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Validações básicas
    if (!data.codigo) {
      return NextResponse.json(
        { message: 'Código do inventário é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!data.dataInicio) {
      return NextResponse.json(
        { message: 'Data de início é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se o código já está em uso
    const codigoEmUso = await db.inventarioEstoque.findFirst({
      where: {
        codigo: data.codigo,
        tenantId
      }
    });
    
    if (codigoEmUso) {
      return NextResponse.json(
        { message: 'Este código já está sendo usado por outro inventário' },
        { status: 400 }
      );
    }

    // Preparar dados para criação com tenant
    const inventarioData = {
      codigo: data.codigo,
      dataInicio: new Date(data.dataInicio),
      dataFim: data.dataFim ? new Date(data.dataFim) : null,
      status: data.status || 'PENDENTE',
      responsavelId: authCheck.user?.id,
      observacoes: data.observacoes
    };

    // Criar inventário
    const inventario = await db.inventarioEstoque.create({
      data: await addTenantId(inventarioData, tenantId),
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Inventário criado com sucesso',
      inventario
    });
  } catch (error) {
    console.error('Erro ao criar inventário:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
