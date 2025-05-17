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
    const categoriaId = searchParams.get('categoriaId') ? 
      parseInt(searchParams.get('categoriaId') as string) : null;
    const status = searchParams.get('status') === 'true' ? true : 
      searchParams.get('status') === 'false' ? false : undefined;
    const estoqueMinimo = searchParams.get('estoqueMinimo') === 'true' ? true : undefined;
    const sort = searchParams.get('sort') || 'nome';
    const order = searchParams.get('order') || 'asc';

    // Construir o where clause para filtros
    let whereClause: any = { tenantId };

    if (search) {
      whereClause.OR = [
        { nome: { contains: search } },
        { codigo: { contains: search } },
        { descricao: { contains: search } }
      ];
    }

    if (categoriaId) {
      whereClause.categoriaInsumoId = categoriaId;
    }

    if (status !== undefined) {
      whereClause.status = status;
    }

    // Filtrar insumos com estoque abaixo do mínimo
    if (estoqueMinimo) {
      whereClause.estoqueAtual = { lt: db.insumo.fields.estoqueMinimo };
    }

    // Consulta para contagem total
    const totalCount = await db.insumo.count({ where: whereClause });

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Ordenação
    const orderByClause: any = {};
    orderByClause[sort] = order.toLowerCase();

    // Consulta principal com paginação
    const insumos = await db.insumo.findMany({
      where: whereClause,
      include: {
        categoriaInsumo: true,
        unidadeMedida: true,
        fornecedorPrincipal: {
          select: {
            id: true,
            nomeFantasia: true,
            razaoSocial: true
          }
        },
        _count: {
          select: {
            lotes: true,
            movimentacoes: true
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit
    });
    
    // Calcular valor total do estoque
    const valorTotalEstoque = insumos.reduce(
      (total, insumo) => total + (insumo.estoqueAtual * Number(insumo.precoCusto)),
       0
    );
    
    return NextResponse.json({
      insumos,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      valorTotalEstoque
    });
  } catch (error) {
    console.error('Erro ao listar insumos:', error);
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
    if (!data.nome) {
      return NextResponse.json(
        { message: 'Nome do insumo é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!data.codigo) {
      return NextResponse.json(
        { message: 'Código do insumo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o código já está em uso
    const codigoEmUso = await db.insumo.findFirst({
      where: {
        codigo: data.codigo,
        tenantId
      }
    });
    
    if (codigoEmUso) {
      return NextResponse.json(
        { message: 'Este código já está sendo usado por outro insumo' },
        { status: 400 }
      );
    }

    // Preparar dados para criação com tenant
    const insumoData = {
      codigo: data.codigo,
      nome: data.nome,
      descricao: data.descricao,
      precoCusto: parseFloat(data.precoCusto || 0),
      estoqueMinimo: parseFloat(data.estoqueMinimo || 0),
      estoqueAtual: parseFloat(data.estoqueInicial || 0),
      categoriaInsumoId: data.categoriaInsumoId ? parseInt(data.categoriaInsumoId) : null,
      unidadeMedidaId: data.unidadeMedidaId ? parseInt(data.unidadeMedidaId) : null,
      fornecedorPrincipalId: data.fornecedorPrincipalId ? parseInt(data.fornecedorPrincipalId) : null,
      localizacaoEstoque: data.localizacaoEstoque,
      diasValidade: data.diasValidade ? parseInt(data.diasValidade) : null,
      notificarVencimento: data.notificarVencimento !== undefined ? data.notificarVencimento : true,
      status: data.status !== undefined ? data.status : true
    };

    // Criar insumo
    const insumo = await db.insumo.create({
      data: await addTenantId(insumoData, tenantId),
      include: {
        categoriaInsumo: true,
        unidadeMedida: true,
        fornecedorPrincipal: true
      }
    });

    // Se o estoque inicial for maior que zero, criar uma movimentação de entrada
    if (parseFloat(data.estoqueInicial || 0) > 0) {
      await db.movimentacaoInsumo.create({
        data: await addTenantId({
          insumoId: insumo.id,
          tipoMovimentacao: 'ENTRADA',
          quantidade: parseFloat(data.estoqueInicial),
          observacao: 'Estoque inicial',
          responsavelId: authCheck.user?.id
        }, tenantId)
      });
    }

    return NextResponse.json({
      message: 'Insumo criado com sucesso',
      insumo
    });
  } catch (error) {
    console.error('Erro ao criar insumo:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
