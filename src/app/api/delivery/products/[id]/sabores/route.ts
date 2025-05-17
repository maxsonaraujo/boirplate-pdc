import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';

// GET - Obter sabores disponíveis para um produto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const routeParams = await params;
    const produtoId = parseInt(await routeParams.id);

    if (isNaN(produtoId)) {
      return NextResponse.json(
        { error: 'ID de produto inválido' },
        { status: 400 }
      );
    }

    // Buscar produto para verificar se aceita sabores
    const produto = await db.produto.findUnique({
      where: { id: produtoId },
      select: {
        aceitaSabores: true,
        maxSabores: true,
        tipoCobranca: true,
        tenantId: true,
        precoVenda: true,
        exibirPrecoBase: true // Adicionar o campo de configuração
      }
    });

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    if (!produto.aceitaSabores) {
      return NextResponse.json(
        { error: 'Este produto não aceita múltiplos sabores' },
        { status: 400 }
      );
    }

    // Buscar sabores disponíveis para este produto
    // Prioridade 1: ProdutoSabor configurado explicitamente
    const saboresConfigurados = await db.produtoSabor.findMany({
      where: {
        produtoId,
        status: true
      },
      include: {
        sabor: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            precoVenda: true,
            imagem: true
          }
        }
      },
      orderBy: {
        ordem: 'asc'
      }
    });

    // Se não tiver sabores configurados explicitamente,
    // buscar produtos que podem ser usados como sabor
    // (mesma categoria, marcados como usados para sabor)
    if (saboresConfigurados.length === 0) {
      // Buscar categorias do produto principal
      const categoriasProduto = await db.categoriaProduto.findMany({
        where: { produtoId },
        select: { categoriaId: true }
      });

      const categoriaIds = categoriasProduto.map(cp => cp.categoriaId);

      // Buscar produtos da mesma categoria que podem ser usados como sabor
      const produtosSabor = await db.produto.findMany({
        where: {
          tenantId: produto.tenantId,
          status: true,
          usadoComoSabor: true as any,
          categorias: {
            some: {
              categoriaId: {
                in: categoriaIds
              }
            }
          },
          // Excluir o próprio produto da lista
          id: { not: produtoId }
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          precoVenda: true,
          imagem: true
        },
        orderBy: [
          { nome: 'asc' }
        ]
      });

      // Transformar produtos em formato compatível com o retorno esperado
      const saboresFormatados = produtosSabor.map(produto => ({
        saborId: produto.id,
        sabor: produto,
        precoAdicional: 0, // Se não houver configuração específica, preço adicional é zero
        ordem: 0 // Sem ordem específica
      }));

      return NextResponse.json({
        sabores: saboresFormatados,
        maxSabores: produto.maxSabores,
        tipoCobranca: produto.tipoCobranca,
        precoBase: produto.precoVenda,
        exibirPrecoBase: produto.exibirPrecoBase || false // Fornecer o valor padrão caso seja null
      });
    }

    return NextResponse.json({
      sabores: saboresConfigurados,
      maxSabores: produto.maxSabores,
      tipoCobranca: produto.tipoCobranca,
      precoBase: produto.precoVenda,
      exibirPrecoBase: produto.exibirPrecoBase || false // Fornecer o valor padrão caso seja null
    });
  } catch (error) {
    console.error('Erro ao buscar sabores do produto:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
