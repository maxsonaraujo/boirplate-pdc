import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter produto específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Obter ID do produto dos parâmetros da URL
    const id = parseInt((await params).id);

    // Buscar o produto com todas as informações necessárias
    const produto = await db.produto.findUnique({
      where: { id },
      include: {
        unidadeMedida: true,
        fichaTecnica: {
          include: {
            ingredientes: true
          }
        },
        categorias: {
          include: {
            categoria: true
          }
        },
        complementos: {
          include: {
            complemento: true
          }
        },
        // Incluir sabores disponíveis se o produto aceitar múltiplos sabores
        saboresDisponiveis: {
          include: {
            sabor: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                precoVenda: true,
                status: true,
                imagem: true
              }
            }
          },
          orderBy: {
            ordem: 'asc'
          }
        }
      }
    });

    if (!produto) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ produto });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT - Atualizar produto existente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const requestParameters = await params;

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter ID do produto dos parâmetros da URL
    const id = parseInt(await requestParameters.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const produtoExistente = await db.produto.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!produtoExistente) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Obter dados do corpo da requisição
    const data = await request.json();

    // Filtrar os campos que podem ser atualizados diretamente
    // e tratar os campos de relação corretamente
    const produtoData: any = {
      nome: data.nome,
      codigo: data.codigo,
      descricao: data.descricao,
      precoVenda: parseFloat(data.precoVenda),
      precoCompra: data.precoCompra ? parseFloat(data.precoCompra) : null,
      imagem: data.imagem,
      status: data.status,
      tempoPreparo: data.tempoPreparo,
      geraComanda: data.geraComanda,
      controlaEstoque: data.controlaEstoque,
      baixaAutomatica: data.baixaAutomatica,
      aceitaSabores: data.aceitaSabores || false,
      maxSabores: data.maxSabores || 1,
      tipoCobranca: data.tipoCobranca || 'mais_caro',
      qtdInsumoConsumida: data.qtdInsumoConsumida || 1,
    };

    // Tratar campos de relacionamento corretamente
    if (data.unidadeMedidaId) {
      produtoData.unidadeMedida = {
        connect: { id: parseInt(data.unidadeMedidaId) }
      };
    }

    if (data.localProducaoId) {
      produtoData.localProducao = {
        connect: { id: parseInt(data.localProducaoId) }
      };
    } else if (data.localProducaoId === null) {
      produtoData.localProducao = {
        disconnect: true
      };
    }

    if (data.insumoVinculadoId) {
      produtoData.insumoVinculado = {
        connect: { id: parseInt(data.insumoVinculadoId) }
      };
    } else if (data.insumoVinculadoId === null) {
      produtoData.insumoVinculado = {
        disconnect: true
      };
    }

    // Atualizar o produto
    const produtoAtualizado = await db.produto.update({
      where: { id },
      data: produtoData
    });

    // Atualizar categorias e complementos em operações separadas
    // (não dentro de uma transação que pode falhar)
    if (data.categorias && Array.isArray(data.categorias)) {
      // 1. Remover associações atuais
      await db.categoriaProduto.deleteMany({
        where: { produtoId: id }
      });

      // 2. Criar novas associações
      if (data.categorias.length > 0) {
        for (const categoriaId of data.categorias) {
          await db.categoriaProduto.create({
            data: {
              produtoId: id,
              categoriaId: parseInt(categoriaId),
              isPrincipal: data.categoriaPrincipalId === parseInt(categoriaId)
            }
          });
        }
      }
    }

    // Atualizar os complementos se fornecidos
    if (data.complementos && Array.isArray(data.complementos)) {
      // 1. Remover associações atuais
      await db.complementoProduto.deleteMany({
        where: { produtoId: id }
      });

      // 2. Criar novas associações
      if (data.complementos.length > 0) {
        for (const complementoId of data.complementos) {
          await db.complementoProduto.create({
            data: {
              produtoId: id,
              complementoId: parseInt(complementoId)
            }
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Produto atualizado com sucesso',
      produto: produtoAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { message: `Erro ao processar a solicitação: ${error.message}` },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// DELETE - Excluir produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação

    const routeParams = await params;
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

    // Obter ID do produto dos parâmetros da URL
    const id = parseInt(await routeParams.id);

    // Verificar se o produto existe
    const produto = await db.produto.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!produto) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Excluir o produto com transação para remover também todas as relações
    await db.$transaction(async (tx) => {
      // Remover todas as categorias relacionadas
      await tx.categoriaProduto.deleteMany({
        where: { produtoId: id }
      });

      // Remover todos os complementos relacionados
      await tx.complementoProduto.deleteMany({
        where: { produtoId: id }
      });

      // Remover sabores relacionados
      await tx.produtoSabor.deleteMany({
        where: { produtoId: id }
      });

      // Remover associações com grupos de complementos
      await tx.grupoProduto.deleteMany({
        where: { produtoId: id }
      });

      // Remover ficha técnica e ingredientes se existirem
      const fichaTecnica = await tx.fichaTecnica.findFirst({
        where: { produtoId: id }
      });

      if (fichaTecnica) {
        // Remover ingredientes
        await tx.ingrediente.deleteMany({
          where: { fichaTecnicaId: fichaTecnica.id }
        });

        // Remover ficha técnica
        await tx.fichaTecnica.delete({
          where: { id: fichaTecnica.id }
        });
      }

      // Por fim, excluir o produto
      await tx.produto.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      message: 'Produto excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
