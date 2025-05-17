import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'
import { getTenantIdFromHeaders } from '@/utils/tenant'

// GET - Listar produtos com paginação, ordenação e filtros
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')
    const authCheck = await checkAuthAndPermissions(token)
    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      )
    }

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Parâmetros de consulta
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') || 'nome'
    const order = searchParams.get('order') || 'asc'
    const search = searchParams.get('search') || ''
    const categoriaId = searchParams.get('categoriaId') ? parseInt(searchParams.get('categoriaId') as string) : null
    const status = searchParams.get('status') ? searchParams.get('status') === 'true' : undefined
    const precoMin = searchParams.get('precoMin') ? parseFloat(searchParams.get('precoMin') as string) : null
    const precoMax = searchParams.get('precoMax') ? parseFloat(searchParams.get('precoMax') as string) : null
    const localProducaoId = searchParams.get('localProducaoId') ? parseInt(searchParams.get('localProducaoId') as string) : null
    const unidadeMedidaId = searchParams.get('unidadeMedidaId') ? parseInt(searchParams.get('unidadeMedidaId') as string) : null
    const geraComanda = searchParams.get('geraComanda') ? searchParams.get('geraComanda') === 'true' : undefined

    // Construir o where clause para filtros
    const whereClause: any = {
      tenantId
    }

    // Filtro de status
    if (status !== undefined) {
      whereClause.status = status
    }

    // Filtro de preço
    if (precoMin !== null || precoMax !== null) {
      whereClause.precoVenda = {}
      if (precoMin !== null) whereClause.precoVenda.gte = precoMin
      if (precoMax !== null) whereClause.precoVenda.lte = precoMax
    }

    // Filtro de local de produção
    if (localProducaoId !== null) {
      whereClause.localProducaoId = localProducaoId
    }

    // Filtro de unidade de medida
    if (unidadeMedidaId !== null) {
      whereClause.unidadeMedidaId = unidadeMedidaId
    }

    // Filtro de gera comanda
    if (geraComanda !== undefined) {
      whereClause.geraComanda = geraComanda
    }

    // Filtro de busca textual
    if (search) {
      whereClause.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filtro por categoria
    const categoriaProdutoFilter = categoriaId ? {
      some: {
        categoriaId: categoriaId
      }
    } : undefined

    // Consulta para contagem total
    const totalCount = await db.produto.count({
      where: {
        ...whereClause,
        categorias: categoriaProdutoFilter
      }
    })

    // Calcular skip para paginação
    const skip = (page - 1) * limit

    // Ordenação
    const orderByClause: any = {}
    orderByClause[sort] = order.toLowerCase()

    // Consulta principal com paginação
    const produtos = await db.produto.findMany({
      where: {
        ...whereClause,
        categorias: categoriaProdutoFilter
      },
      include: {
        categorias: {
          include: {
            categoria: true
          }
        },
        unidadeMedida: true,
        localProducao: true
      },
      orderBy: orderByClause,
      skip,
      take: limit
    })

    return NextResponse.json({
      produtos,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    })
  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// POST - Criar um novo produto
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')
    const authCheck = await checkAuthAndPermissions(token)
    const tenantId = await getTenantIdFromHeaders();


    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      )
    }

    const data = await request.json()

    // Validações básicas
    if (!data.nome) {
      return NextResponse.json(
        { message: 'Nome do produto é obrigatório' },
        { status: 400 }
      )
    }

    if (!data.codigo) {
      return NextResponse.json(
        { message: 'Código do produto é obrigatório' },
        { status: 400 }
      )
    }

    // if (data.precoVenda <= 0) {
    //   return NextResponse.json(
    //     { message: 'Preço de venda deve ser maior que zero' },
    //     { status: 400 }
    //   )
    // }

    // Verificar se o código já está em uso
    const codigoEmUso = await db.produto.findFirst({
      where: {
        codigo: data.codigo
      }
    })

    if (codigoEmUso) {
      return NextResponse.json(
        { message: 'Este código já está sendo usado por outro produto' },
        { status: 400 }
      )
    }

    // Criar produto com transação - aumentando o timeout para 30 segundos
    const produtoCriado = await db.$transaction(async (tx) => {
      // 1. Criar produto básico
      const produto = await tx.produto.create({
        data: {
          nome: data.nome,
          codigo: data.codigo,
          descricao: data.descricao,
          precoVenda: parseFloat(data.precoVenda),
          precoCompra: data.precoCompra || null,
          imagem: data.imagem,
          status: data.status,
          tempoPreparo: data.tempoPreparo,
          geraComanda: data.geraComanda,
          localProducaoId: data.localProducaoId ? parseInt(data.localProducaoId) : null,
          controlaEstoque: data.controlaEstoque,
          baixaAutomatica: data.baixaAutomatica,
          insumoVinculadoId: data.insumoVinculadoId ? parseInt(data.insumoVinculadoId) : null,
          qtdInsumoConsumida: data.qtdInsumoConsumida || 1,
          unidadeMedidaId: data.unidadeMedidaId ? parseInt(data.unidadeMedidaId) : null,
          aceitaSabores: data.aceitaSabores !== undefined ? data.aceitaSabores : false,
          maxSabores: data.maxSabores || 1,
          tipoCobranca: data.tipoCobranca || 'mais_caro',
          tenantId: tenantId
        }
      })

      // 2. Adicionar categorias se existirem
      if (data.categorias && Array.isArray(data.categorias) && data.categorias.length > 0) {
        const categoriasPromises = data.categorias.map((categoriaId) =>
          tx.categoriaProduto.create({
            data: {
              produtoId: produto.id,
              categoriaId: parseInt(categoriaId),
              isPrincipal: data.categoriaPrincipalId === parseInt(categoriaId)
            }
          })
        );

        await Promise.all(categoriasPromises);
      }

      // 3. Adicionar complementos se existirem
      if (data.complementos && Array.isArray(data.complementos) && data.complementos.length > 0) {
        const complementosPromises = data.complementos.map((complementoId) =>
          tx.complementoProduto.create({
            data: {
              produtoId: produto.id,
              complementoId: parseInt(complementoId)
            }
          })
        );

        await Promise.all(complementosPromises);
      }

      // 4. Adicionar ficha técnica se existir
      if (data.fichaTecnica) {
        const fichaTecnica = await tx.fichaTecnica.create({
          data: {
            produtoId: produto.id,
            rendimento: data.fichaTecnica.rendimento || 1,
            modoPreparo: data.fichaTecnica.modoPreparo || ''
          }
        })

        // 5. Adicionar ingredientes se existirem
        if (data.fichaTecnica.ingredientes && Array.isArray(data.fichaTecnica.ingredientes) && data.fichaTecnica.ingredientes.length > 0) {
          const ingredientesPromises = data.fichaTecnica.ingredientes.map((ingrediente) =>
            tx.ingrediente.create({
              data: {
                fichaTecnicaId: fichaTecnica.id,
                nome: ingrediente.nome,
                quantidade: ingrediente.quantidade,
                unidadeMedidaId: ingrediente.unidadeMedidaId ? parseInt(ingrediente.unidadeMedidaId) : null,
                custo: ingrediente.custo || 0
              }
            })
          );

          await Promise.all(ingredientesPromises);
        }
      }

      return produto
    }, {
      timeout: 30000 // Aumentar o timeout para 30 segundos (30000ms)
    })

    return NextResponse.json({
      message: 'Produto criado com sucesso',
      produto: produtoCriado
    })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação: ' + error.message },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// Atualização em lote (por exemplo, para atualizar a ordem)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')
    const authCheck = await checkAuthAndPermissions(token)

    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      )
    }

    // Esta rota seria usada para atualizações em lote ou operações especiais
    // Por exemplo, atualizar ordens de exibição ou status de múltiplos produtos

    return NextResponse.json({
      message: 'Operação em lote não implementada'
    }, { status: 501 })
  } catch (error) {
    console.error('Erro na operação em lote:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
