import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { PedidoStatus } from '@prisma/client';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter lista de pedidos de delivery com paginação e filtros
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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter parâmetros da query
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';
    const sort = searchParams.get('sort') || 'dataPedido';
    const order = searchParams.get('order') || 'desc';
    const tipoParam = searchParams.get('tipo') || '';

    // Validar parâmetros
    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return NextResponse.json(
        { error: 'Parâmetros de paginação inválidos' },
        { status: 400 }
      );
    }

    // Construir o objeto de where para a consulta
    let whereCondition: any = {
      tenantId,
    };
    
    // Filtro por tipo (DELIVERY ou PICKUP) se especificado, senão inclui ambos
    if (tipoParam && ['DELIVERY', 'PICKUP', 'BALCAO', 'MESA'].includes(tipoParam)) {
      whereCondition.tipo = tipoParam;
    } else {
      // Incluir todos os tipos de pedido relacionados ao delivery/retirada
      whereCondition.OR = [
        { tipo: 'DELIVERY' },
        { tipo: 'PICKUP' },
        { tipo: 'BALCAO' },
      ];
    }

    // Filtro por status
    if (status) {
      // Converter string para o enum PedidoStatus
      const statusEnum = status.toUpperCase() as keyof typeof PedidoStatus;
      if (PedidoStatus[statusEnum]) {
        whereCondition.status = PedidoStatus[statusEnum];
      }
    }

    // Filtro por data
    if (dataInicio && dataFim) {
      whereCondition.dataPedido = {
        gte: new Date(dataInicio),
        lte: new Date(dataFim + 'T23:59:59'),
      };
    } else if (dataInicio) {
      whereCondition.dataPedido = {
        gte: new Date(dataInicio),
      };
    } else if (dataFim) {
      whereCondition.dataPedido = {
        lte: new Date(dataFim + 'T23:59:59'),
      };
    }

    // Filtro por termo de busca
    if (search) {
      whereCondition.OR = [
        { numero: { contains: search } },
        { cliente: { nome: { contains: search } } },
        { cliente: { telefone: { contains: search } } },
      ];
    }

    // Ordenação
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort) {
      orderBy[sort] = order === 'asc' ? 'asc' : 'desc';
    }

    // Cálculo de skip para paginação
    const skip = (page - 1) * limit;

    // Estatísticas agregadas para o período selecionado
    const estadoFilter = { ...whereCondition };
    delete estadoFilter.status; // Removendo o filtro de status para as estatísticas

    // Contar por status
    const countPendentes = await db.pedido.count({
      where: { ...estadoFilter, status: PedidoStatus.PENDING },
    });

    const countConfirmados = await db.pedido.count({
      where: { ...estadoFilter, status: PedidoStatus.CONFIRMED },
    });

    const countPreparando = await db.pedido.count({
      where: { ...estadoFilter, status: PedidoStatus.PREPARING },
    });

    const countEntrega = await db.pedido.count({
      where: { ...estadoFilter, status: PedidoStatus.DELIVERING },
    });

    const countEntregues = await db.pedido.count({
      where: { ...estadoFilter, status: PedidoStatus.DELIVERED },
    });

    const countCancelados = await db.pedido.count({
      where: { ...estadoFilter, status: PedidoStatus.CANCELLED },
    });

    // Soma total dos pedidos no período
    const sumResult = await db.pedido.aggregate({
      where: estadoFilter,
      _sum: {
        valorTotal: true,
      },
      _avg: {
        valorTotal: true,
      },
    });
    
    // Soma dos pedidos finalizados (entregues/completados) - excluindo cancelados
    const sumFinalizados = await db.pedido.aggregate({
      where: { 
        ...estadoFilter,
        status: { in: [PedidoStatus.DELIVERED, PedidoStatus.COMPLETED] }
      },
      _sum: {
        valorTotal: true,
      }
    });

    // Buscar pedidos com dados relacionados
    const [pedidos, total] = await Promise.all([
      db.pedido.findMany({
        where: whereCondition,
        include: {
          cliente: true,
          enderecoEntrega: true,
          areaEntrega: true,
          itens: {
            include: {
              produto: true,
            },
          },
          cupons: {
            include: {
              cupom: true
            }
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.pedido.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      pedidos,
      total,
      totalPages,
      currentPage: page,
      estatisticas: {
        pendentes: countPendentes,
        confirmados: countConfirmados,
        preparando: countPreparando,
        entrega: countEntrega,
        entregues: countEntregues,
        cancelados: countCancelados,
        valorTotal: sumResult._sum.valorTotal || 0,
        valorTotalFinalizados: sumFinalizados._sum.valorTotal || 0, // Adicionando o valor total dos pedidos finalizados
        ticketMedio: sumResult._avg.valorTotal || 0,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos de delivery:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
