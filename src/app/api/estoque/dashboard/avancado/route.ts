import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

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

    // Datas para análise
    const hoje = new Date();
    const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioDoMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const inicioDoAno = new Date(hoje.getFullYear(), 0, 1);
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
    
    // 1. Estatísticas de Movimentação de Estoque
    const movimentacoes = await db.movimentacaoInsumo.findMany({
      where: {
        tenantId,
        criadoEm: {
          gte: inicioDoAno
        }
      },
      include: {
        insumo: {
          select: { 
            id: true, 
            nome: true, 
            precoCusto: true,
            unidadeMedida: {
              select: { simbolo: true }
            }
          }
        }
      }
    });

    // Calcular movimentações por mês
    const movimentacoesPorMes = Array(12).fill(0).map(() => ({ 
      entradas: 0, 
      saidas: 0,
      valor: 0,
      quantidade: 0
    }));

    for (const mov of movimentacoes) {
      const mes = new Date(mov.criadoEm).getMonth();
      const valor = Number(mov.insumo?.precoCusto || 0) * mov.quantidade;
      
      movimentacoesPorMes[mes].quantidade += mov.quantidade;
      movimentacoesPorMes[mes].valor += valor;
      
      if (mov.tipoMovimentacao === 'ENTRADA') {
        movimentacoesPorMes[mes].entradas += mov.quantidade;
      } else {
        movimentacoesPorMes[mes].saidas += mov.quantidade;
      }
    }
    
    // 2. Análise de Compras por Mês
    const compras = await db.compra.findMany({
      where: {
        tenantId,
        dataCompra: {
          gte: inicioDoAno
        },
        status: {
          in: ['FINALIZADA', 'PARCIAL']
        }
      },
      include: {
        itens: true
      }
    });
    
    const comprasPorMes = Array(12).fill(0).map(() => ({ 
      total: 0, 
      quantidade: 0,
      numero: 0
    }));
    
    for (const compra of compras) {
      if (!compra.dataCompra) continue;
      
      const mes = new Date(compra.dataCompra).getMonth();
      comprasPorMes[mes].total += Number(compra.valorTotal || 0);
      comprasPorMes[mes].numero += 1;
      
      for (const item of compra.itens) {
        comprasPorMes[mes].quantidade += item.quantidadeRecebida || 0;
      }
    }
    
    // 3. Top Insumos com Maior Giro
    const topInsumosPorGiro = await db.insumo.findMany({
      where: {
        tenantId,
        status: true
      },
      include: {
        movimentacoes: {
          where: {
            criadoEm: {
              gte: mesPassado
            },
            tipoMovimentacao: {
              in: ['SAIDA', 'PRODUCAO', 'DESCARTE']
            }
          }
        },
        unidadeMedida: {
          select: { simbolo: true }
        },
        categoriaInsumo: {
          select: { nome: true }
        }
      },
      orderBy: {
        movimentacoes: {
          _count: 'desc'
        }
      },
      take: 10
    });
    
    const insumosPorGiro = topInsumosPorGiro.map(insumo => {
      const totalSaida = insumo.movimentacoes.reduce(
        (total, mov) => total + mov.quantidade, 0
      );
      
      return {
        id: insumo.id,
        nome: insumo.nome,
        categoria: insumo.categoriaInsumo?.nome,
        unidadeMedida: insumo.unidadeMedida?.simbolo,
        estoqueAtual: insumo.estoqueAtual,
        totalSaida,
        precoCusto: insumo.precoCusto,
        valorMovimentado: totalSaida * Number(insumo.precoCusto)
      };
    }).sort((a, b) => b.totalSaida - a.totalSaida);
    
    // 4. Top Insumos com Menor Giro
    const insumosBaixoGiro = await db.insumo.findMany({
      where: {
        tenantId,
        status: true,
        estoqueAtual: { gt: 0 }
      },
      include: {
        movimentacoes: {
          where: {
            criadoEm: {
              gte: mesPassado
            },
            tipoMovimentacao: {
              in: ['SAIDA', 'PRODUCAO', 'DESCARTE']
            }
          }
        },
        unidadeMedida: {
          select: { simbolo: true }
        },
        categoriaInsumo: {
          select: { nome: true }
        }
      },
      take: 50
    });
    
    const insumosSemMovimentacao = insumosBaixoGiro
      .map(insumo => {
        const totalSaida = insumo.movimentacoes.reduce(
          (total, mov) => total + mov.quantidade, 0
        );
        
        return {
          id: insumo.id,
          nome: insumo.nome,
          categoria: insumo.categoriaInsumo?.nome,
          unidadeMedida: insumo.unidadeMedida?.simbolo,
          estoqueAtual: insumo.estoqueAtual,
          totalSaida,
          diasSemMovimentacao: totalSaida === 0 ? 30 : 0,
          valorEstoque: insumo.estoqueAtual * Number(insumo.precoCusto)
        };
      })
      .filter(insumo => insumo.totalSaida === 0)
      .sort((a, b) => b.valorEstoque - a.valorEstoque)
      .slice(0, 10);
    
    // 5. Valor de Estoque por Categoria
    const categorias = await db.categoriaInsumo.findMany({
      where: {
        tenantId,
        status: true
      },
      include: {
        insumos: {
          where: { status: true },
          select: {
            estoqueAtual: true,
            precoCusto: true
          }
        }
      }
    });
    
    const valorPorCategoria = categorias.map(cat => {
      const valor = cat.insumos.reduce(
        (total, insumo) => total + (insumo.estoqueAtual * Number(insumo.precoCusto)), 
        0
      );
      
      return {
        id: cat.id,
        nome: cat.nome,
        quantidadeInsumos: cat.insumos.length,
        valorEstoque: valor
      };
    }).sort((a, b) => b.valorEstoque - a.valorEstoque);
    
    // 6. Consolidar Dados do Mês Atual e Anterior
    const mesAtual = {
      entradas: movimentacoesPorMes[hoje.getMonth()].entradas,
      saidas: movimentacoesPorMes[hoje.getMonth()].saidas,
      valorMovimentado: movimentacoesPorMes[hoje.getMonth()].valor,
      compras: comprasPorMes[hoje.getMonth()].numero,
      valorCompras: comprasPorMes[hoje.getMonth()].total
    };
    
    const mesAnterior = {
      entradas: movimentacoesPorMes[hoje.getMonth() - 1 < 0 ? 11 : hoje.getMonth() - 1].entradas,
      saidas: movimentacoesPorMes[hoje.getMonth() - 1 < 0 ? 11 : hoje.getMonth() - 1].saidas,
      valorMovimentado: movimentacoesPorMes[hoje.getMonth() - 1 < 0 ? 11 : hoje.getMonth() - 1].valor,
      compras: comprasPorMes[hoje.getMonth() - 1 < 0 ? 11 : hoje.getMonth() - 1].numero,
      valorCompras: comprasPorMes[hoje.getMonth() - 1 < 0 ? 11 : hoje.getMonth() - 1].total
    };
    
    // 7. Inventários Recentes
    const inventariosRecentes = await db.inventarioEstoque.findMany({
      where: {
        tenantId
      },
      orderBy: {
        dataFim: 'desc'
      },
      take: 5,
      include: {
        responsavel: {
          select: { name: true }
        },
        _count: {
          select: { itens: true }
        }
      }
    });

    return NextResponse.json({
      movimentacoesPorMes,
      comprasPorMes,
      insumosPorGiro,
      insumosSemMovimentacao,
      valorPorCategoria,
      mesAtual,
      mesAnterior,
      inventariosRecentes
    });
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard avançado:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
