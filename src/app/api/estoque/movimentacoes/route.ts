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
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const insumoId = searchParams.get('insumoId') ? 
      parseInt(searchParams.get('insumoId') as string) : null;
    const tipo = searchParams.get('tipo') || '';
    const sort = searchParams.get('sort') || 'criadoEm';
    const order = searchParams.get('order') || 'desc';
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';

    // Construir o where clause para filtros
    let whereClause: any = { tenantId };

    if (search) {
      whereClause.OR = [
        { observacao: { contains: search } },
        { insumo: { nome: { contains: search } } },
        { insumo: { codigo: { contains: search } } },
        { responsavel: { name: { contains: search } } }
      ];
    }

    if (insumoId) {
      whereClause.insumoId = insumoId;
    }

    if (tipo) {
      whereClause.tipoMovimentacao = tipo;
    }

    // Filtro de data
    if (dataInicio || dataFim) {
      whereClause.criadoEm = {};
      
      if (dataInicio) {
        whereClause.criadoEm.gte = new Date(dataInicio);
      }
      
      if (dataFim) {
        // Adicionar um dia para incluir todo o dia final
        const fimDate = new Date(dataFim);
        fimDate.setDate(fimDate.getDate() + 1);
        whereClause.criadoEm.lt = fimDate;
      }
    }

    // Consulta para contagem total
    const totalCount = await db.movimentacaoInsumo.count({ where: whereClause });

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Ordenação
    const orderByClause: any = {};
    orderByClause[sort] = order.toLowerCase();

    // Consulta principal com paginação
    const movimentacoes = await db.movimentacaoInsumo.findMany({
      where: whereClause,
      include: {
        insumo: {
          select: {
            id: true,
            nome: true,
            codigo: true,
            unidadeMedida: {
              select: {
                simbolo: true
              }
            }
          }
        },
        responsavel: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit
    });

    // Calcular resumo de entradas e saídas
    const totalEntradas = await db.movimentacaoInsumo.count({
      where: {
        ...whereClause,
        tipoMovimentacao: 'ENTRADA'
      }
    });

    const totalSaidas = await db.movimentacaoInsumo.count({
      where: {
        ...whereClause,
        OR: [
          { tipoMovimentacao: 'SAIDA' },
          { tipoMovimentacao: 'PRODUCAO' },
          { tipoMovimentacao: 'DESCARTE' }
        ]
      }
    });

    return NextResponse.json({
      movimentacoes,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      resumo: {
        totalEntradas,
        totalSaidas
      }
    });
  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
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
    if (!data.insumoId) {
      return NextResponse.json(
        { message: 'Insumo é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!data.tipoMovimentacao) {
      return NextResponse.json(
        { message: 'Tipo de movimentação é obrigatório' },
        { status: 400 }
      );
    }
    
    if (data.quantidade <= 0) {
      return NextResponse.json(
        { message: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Verificar se o insumo existe
    const insumo = await db.insumo.findFirst({
      where: {
        id: parseInt(data.insumoId),
        tenantId
      }
    });

    if (!insumo) {
      return NextResponse.json(
        { message: 'Insumo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar estoque disponível para saídas
    if (['SAIDA', 'PRODUCAO', 'DESCARTE'].includes(data.tipoMovimentacao)) {
      if (insumo.estoqueAtual < data.quantidade) {
        return NextResponse.json(
          { message: 'Estoque insuficiente para esta operação' },
          { status: 400 }
        );
      }
    }

    // Iniciar transação
    const resultado = await db.$transaction(async (tx) => {
      // 1. Registrar a movimentação
      const movimentacao = await tx.movimentacaoInsumo.create({
        data: await addTenantId({
          insumoId: parseInt(data.insumoId),
          tipoMovimentacao: data.tipoMovimentacao,
          quantidade: parseFloat(data.quantidade),
          observacao: data.observacao,
          documentoId: data.documentoId ? parseInt(data.documentoId) : undefined,
          documentoTipo: data.documentoTipo,
          responsavelId: authCheck.user?.id
        }, tenantId)
      });

      // 2. Atualizar o estoque do insumo
      let novoEstoque = insumo.estoqueAtual;
      
      switch (data.tipoMovimentacao) {
        case 'ENTRADA':
          novoEstoque += parseFloat(data.quantidade);
          break;
        case 'SAIDA':
        case 'PRODUCAO':
        case 'DESCARTE':
          novoEstoque -= parseFloat(data.quantidade);
          break;
        case 'AJUSTE':
          // Para ajustes, o valor pode ser positivo ou negativo
          novoEstoque = parseFloat(data.estoqueAjustado) || novoEstoque;
          break;
      }

      await tx.insumo.update({
        where: { id: insumo.id },
        data: { estoqueAtual: novoEstoque }
      });

      return movimentacao;
    });

    return NextResponse.json({
      message: 'Movimentação registrada com sucesso',
      movimentacao: resultado
    });
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
