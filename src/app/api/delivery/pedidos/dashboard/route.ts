import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter estatísticas para o dashboard de delivery
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
    const periodo = searchParams.get('periodo') || '7'; // padrão: últimos 7 dias
    
    // Calcular datas de início e fim com base no período
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));
    
    // Filtro base para todos os pedidos do tenant no período
    const filtroBase = {
      tenantId,
      tipo: 'DELIVERY',
      dataPedido: {
        gte: dataInicio,
        lte: dataFim
      }
    };
    
    // 1. Total de pedidos no período
    const totalPedidos = await db.pedido.count({
      where: filtroBase
    });
    
    // 2. Total por status
    const totalPorStatus = await Promise.all([
      db.pedido.count({ where: { ...filtroBase, status: 'PENDING' } }),
      db.pedido.count({ where: { ...filtroBase, status: 'CONFIRMED' } }),
      db.pedido.count({ where: { ...filtroBase, status: 'PREPARING' } }),
      db.pedido.count({ where: { ...filtroBase, status: 'READY' } }),
      db.pedido.count({ where: { ...filtroBase, status: 'DELIVERED' } }),
      db.pedido.count({ where: { ...filtroBase, status: 'CANCELLED' } })
    ]);
    
    // 3. Valor total
    const resultado = await db.pedido.aggregate({
      where: filtroBase,
      _sum: {
        valorTotal: true
      },
      _avg: {
        valorTotal: true
      },
      _max: {
        valorTotal: true
      },
      _min: {
        valorTotal: true
      }
    });
    
    // 4. Pedidos por dia (para gráfico de tendência)
    const hoje = new Date();
    const pedidosPorDia = [];
    
    for (let i = 0; i < parseInt(periodo); i++) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() - i);
      
      // Definir início e fim do dia
      const inicioDia = new Date(dia.setHours(0, 0, 0, 0));
      const fimDia = new Date(dia.setHours(23, 59, 59, 999));
      
      const totalDoDia = await db.pedido.count({
        where: {
          tenantId,
          tipo: 'DELIVERY',
          dataPedido: {
            gte: inicioDia,
            lte: fimDia
          }
        }
      });
      
      const valorTotalDoDia = await db.pedido.aggregate({
        where: {
          tenantId,
          tipo: 'DELIVERY',
          dataPedido: {
            gte: inicioDia,
            lte: fimDia
          }
        },
        _sum: {
          valorTotal: true
        }
      });
      
      pedidosPorDia.push({
        data: inicioDia.toISOString().split('T')[0],
        total: totalDoDia,
        valor: valorTotalDoDia._sum.valorTotal || 0
      });
    }
    
    // 5. Top produtos mais vendidos
    const produtosMaisVendidos = await db.itemPedido.groupBy({
      by: ['produtoId'],
      where: {
        pedido: {
          tenantId,
          tipo: 'DELIVERY',
          dataPedido: {
            gte: dataInicio,
            lte: dataFim
          }
        }
      },
      _sum: {
        quantidade: true,
        valorTotal: true
      },
      orderBy: {
        _sum: {
          quantidade: 'desc'
        }
      },
      take: 5
    });
    
    // Buscar detalhes dos produtos
    const idsDosProdutos = produtosMaisVendidos.map(p => p.produtoId);
    const detalhesDosProdutos = await db.produto.findMany({
      where: {
        id: {
          in: idsDosProdutos
        }
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        precoVenda: true
      }
    });
    
    // Combinar dados
    const produtosDetalhados = produtosMaisVendidos.map(produto => {
      const detalhes = detalhesDosProdutos.find(p => p.id === produto.produtoId);
      return {
        id: produto.produtoId,
        nome: detalhes?.nome || 'Produto não encontrado',
        descricao: detalhes?.descricao || '',
        precoVenda: detalhes?.precoVenda || 0,
        quantidadeVendida: produto._sum.quantidade || 0,
        valorTotal: produto._sum.valorTotal || 0
      };
    });
    
    // Consolidar resposta
    return NextResponse.json({
      periodo: parseInt(periodo),
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: dataFim.toISOString().split('T')[0],
      totalPedidos,
      statusCount: {
        pendentes: totalPorStatus[0],
        confirmados: totalPorStatus[1],
        preparando: totalPorStatus[2],
        emEntrega: totalPorStatus[3],
        entregues: totalPorStatus[4],
        cancelados: totalPorStatus[5]
      },
      valorTotal: resultado._sum.valorTotal || 0,
      ticketMedio: resultado._avg.valorTotal || 0,
      maiorPedido: resultado._max.valorTotal || 0,
      menorPedido: resultado._min.valorTotal || 0,
      pedidosPorDia,
      produtosMaisVendidos: produtosDetalhados
    });
  } catch (error) {
    console.error('Erro ao gerar estatísticas do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
