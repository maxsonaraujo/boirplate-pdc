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
    const status = searchParams.get('status') === 'true' ? true : 
      searchParams.get('status') === 'false' ? false : undefined;
    const sort = searchParams.get('sort') || 'razaoSocial';
    const order = searchParams.get('order') || 'asc';

    // Construir o where clause para filtros
    let whereClause: any = { tenantId };

    if (search) {
      whereClause.OR = [
        { razaoSocial: { contains: search } },
        { nomeFantasia: { contains: search } },
        { codigo: { contains: search } },
        { cnpj: { contains: search } },
        { contato: { contains: search } },
      ];
    }

    if (status !== undefined) {
      whereClause.status = status;
    }

    // Consulta para contagem total
    const totalCount = await db.fornecedor.count({ where: whereClause });

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Ordenação
    const orderByClause: any = {};
    orderByClause[sort] = order.toLowerCase();

    // Consulta principal com paginação
    const fornecedores = await db.fornecedor.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            insumos: true,
            compras: true,
            lotes: true
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit
    });

    return NextResponse.json({
      fornecedores,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
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
    if (!data.razaoSocial) {
      return NextResponse.json(
        { message: 'Razão social é obrigatória' },
        { status: 400 }
      );
    }

    if (!data.codigo) {
      return NextResponse.json(
        { message: 'Código do fornecedor é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o código já está em uso
    const codigoEmUso = await db.fornecedor.findFirst({
      where: {
        codigo: data.codigo,
        tenantId
      }
    });

    if (codigoEmUso) {
      return NextResponse.json(
        { message: 'Este código já está sendo usado por outro fornecedor' },
        { status: 400 }
      );
    }

    // Verificar se o CNPJ já está em uso (se fornecido)
    if (data.cnpj) {
      const cnpjEmUso = await db.fornecedor.findFirst({
        where: {
          cnpj: data.cnpj,
          tenantId
        }
      });

      if (cnpjEmUso) {
        return NextResponse.json(
          { message: 'Este CNPJ já está cadastrado para outro fornecedor' },
          { status: 400 }
        );
      }
    }

    // Adicionar tenant ID aos dados
    const fornecedorData = await addTenantId({
      codigo: data.codigo,
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      cnpj: data.cnpj,
      inscricaoEstadual: data.inscricaoEstadual,
      telefone: data.telefone,
      email: data.email,
      endereco: data.endereco,
      contato: data.contato,
      observacoes: data.observacoes,
      status: data.status !== undefined ? data.status : true
    }, tenantId);

    // Criar fornecedor
    const fornecedor = await db.fornecedor.create({
      data: fornecedorData
    });

    return NextResponse.json({
      message: 'Fornecedor criado com sucesso',
      fornecedor
    });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
