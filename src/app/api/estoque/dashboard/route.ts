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

    // Datas para filtros
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    // 1. Resumo geral do estoque
    const totalInsumos = await db.insumo.count({
      where: {
        tenantId,
        status: true
      }
    });

    const insumosComEstoque = await db.insumo.count({
      where: {
        tenantId,
        status: true,
        estoqueAtual: { gt: 0 }
      }
    });

    // Cálculo do valor total em estoque
    const valorTotalQuery = await db.insumo.findMany({
      where: {
        tenantId,
        status: true
      },
      select: {
        estoqueAtual: true,
        precoCusto: true
      }
    });

    const valorTotalEstoque = valorTotalQuery.reduce(
      (total, insumo) => total + (insumo.estoqueAtual * Number(insumo.precoCusto)),
      0
    );

    // 2. Insumos abaixo do estoque mínimo
    const insumosAbaixoMinimo = await db.insumo.findMany({
      where: {
        tenantId,
        status: true,
        estoqueMinimo: { gt: 0 }, // Certifique-se de que há um valor mínimo definido
        estoqueAtual: { lt: db.insumo.fields.estoqueMinimo }
      },
      include: {
        categoriaInsumo: {
          select: { nome: true }
        },
        unidadeMedida: {
          select: { nome: true, simbolo: true }
        }
      },
      orderBy: [
        {
          estoqueAtual: 'asc'
        }
      ]
    });

    // 3. Compras recentes
    const comprasRecentes = await db.compra.findMany({
      where: {
        tenantId,
        dataCompra: { gte: trintaDiasAtras }
      },
      include: {
        fornecedor: {
          select: { razaoSocial: true, nomeFantasia: true }
        }
      },
      orderBy: { dataCompra: 'desc' },
      take: 10
    });

    // Total de compras e valor dos últimos 30 dias
    const totalComprasUltimos30Dias = await db.compra.count({
      where: {
        tenantId,
        dataCompra: { gte: trintaDiasAtras }
      }
    });

    const valorComprasQuery = await db.compra.findMany({
      where: {
        tenantId,
        dataCompra: { gte: trintaDiasAtras }
      },
      select: { valorTotal: true }
    });

    const valorComprasUltimos30Dias = valorComprasQuery.reduce(
      (total, compra) => total + Number(compra.valorTotal || 0),
      0
    );

    // 4. Movimentações recentes
    const movimentacoesRecentes = await db.movimentacaoInsumo.findMany({
      where: {
        tenantId,
        criadoEm: { gte: trintaDiasAtras }
      },
      include: {
        insumo: {
          select: {
            id: true, // Adicionar ID para o link de navegação
            nome: true,
            unidadeMedida: {
              select: { simbolo: true }
            }
          }
        },
        responsavel: {
          select: { name: true }
        }
      },
      orderBy: { criadoEm: 'desc' },
      take: 10
    });

    // 5. Estatísticas por categoria
    const categorias = await db.categoriaInsumo.findMany({
      where: {
        tenantId,
        status: true
      },
      include: {
        _count: {
          select: { insumos: true }
        },
        insumos: {
          where: {
            status: true
          },
          select: {
            estoqueAtual: true,
            precoCusto: true
          }
        }
      }
    });

    const estoquePorCategoria = categorias.map(categoria => {
      // Calcular o valor total de estoque por categoria
      const valorEstoque = categoria.insumos.reduce(
        (total, insumo) => total + (insumo.estoqueAtual * Number(insumo.precoCusto)),
        0
      );

      return {
        id: categoria.id,
        nome: categoria.nome,
        quantidadeInsumos: categoria._count?.insumos || 0,
        valorEstoque
      };
    }).sort((a, b) => b.valorEstoque - a.valorEstoque);

    return NextResponse.json({
      resumo: {
        totalInsumos,
        insumosComEstoque,
        valorTotalEstoque,
        totalComprasUltimos30Dias,
        valorComprasUltimos30Dias
      },
      insumosAbaixoMinimo,
      comprasRecentes,
      movimentacoesRecentes,
      estoquePorCategoria
    });
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
