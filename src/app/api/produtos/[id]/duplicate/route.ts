import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// POST - Duplicar um produto existente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const id = parseInt((await params).id)

    // Buscar o produto com todos os relacionamentos
    const produtoOriginal = await db.produto.findUnique({
      where: { id },
      include: {
        ProdutoCategoria: true, // Usando o nome correto do relacionamento conforme o schema
        fichaTecnica: {
          include: {
            ingredientes: true
          }
        },
        ProdutoComplemento: true, // Usando o nome correto do relacionamento conforme o schema
        Variacao: true // Usando o nome correto do relacionamento conforme o schema
      }
    })

    if (!produtoOriginal) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Gerar um novo código único
    const novoCodigo = `${produtoOriginal.codigo}-COPIA`

    // Criar o produto duplicado com transação
    const produtoDuplicado = await db.$transaction(async (tx) => {
      // Criar o produto base
      const novoProduto = await tx.produto.create({
        data: {
          tenantId: produtoOriginal.tenantId,
          codigo: novoCodigo,
          nome: `${produtoOriginal.nome} (Cópia)`,
          descricao: produtoOriginal.descricao,
          precoVenda: produtoOriginal.precoVenda,
          imagem: produtoOriginal.imagem,
          status: true, // Sempre criar como ativo
          unidadeMedidaId: produtoOriginal.unidadeMedidaId,
          tempoPreparo: produtoOriginal.tempoPreparo,
          geraComanda: produtoOriginal.geraComanda,
          localProducaoId: produtoOriginal.localProducaoId,
          controlaEstoque: produtoOriginal.controlaEstoque,
          baixaAutomatica: produtoOriginal.baixaAutomatica,
          estoqueAtual: 0, // Novo produto começa com estoque zerado
          insumoVinculadoId: produtoOriginal.insumoVinculadoId,
          qtdInsumoConsumida: produtoOriginal.qtdInsumoConsumida,
          aceitaSabores: produtoOriginal.aceitaSabores,
          maxSabores: produtoOriginal.maxSabores,
          tipoCobranca: produtoOriginal.tipoCobranca,
          exibirPrecoBase: produtoOriginal.exibirPrecoBase
        }
      })

      // Duplicar as relações de categorias
      if (produtoOriginal.ProdutoCategoria && produtoOriginal.ProdutoCategoria.length > 0) {
        const categoriasPromises = produtoOriginal.ProdutoCategoria.map(cat => 
          tx.categoriaProduto.create({
            data: {
              produtoId: novoProduto.id,
              categoriaId: cat.categoriaId
            }
          })
        )

        await Promise.all(categoriasPromises)
      }

      // Duplicar a ficha técnica
      if (produtoOriginal.fichaTecnica) {
        const novaFichaTecnica = await tx.fichaTecnica.create({
          data: {
            produtoId: novoProduto.id,
            rendimento: produtoOriginal.fichaTecnica.rendimento,
            modoPreparo: produtoOriginal.fichaTecnica.modoPreparo,
            tenantId: produtoOriginal.tenantId
          }
        })

        // Duplicar ingredientes
        if (produtoOriginal.fichaTecnica.ingredientes.length > 0) {
          const ingredientesPromises = produtoOriginal.fichaTecnica.ingredientes.map(ing => 
            tx.ingrediente.create({
              data: {
                fichaTecnicaId: novaFichaTecnica.id,
                nome: ing.nome,
                quantidade: ing.quantidade,
                unidadeMedidaId: ing.unidadeMedidaId,
                custo: ing.custo,
                tenantId: produtoOriginal.tenantId
              }
            })
          )

          await Promise.all(ingredientesPromises)
        }
      }

      // Duplicar complementos
      if (produtoOriginal.ProdutoComplemento && produtoOriginal.ProdutoComplemento.length > 0) {
        const complementosPromises = produtoOriginal.ProdutoComplemento.map(comp => 
          tx.complementoProduto.create({
            data: {
              produtoId: novoProduto.id,
              complementoId: comp.complementoId
            }
          })
        )

        await Promise.all(complementosPromises)
      }

      // Duplicar variações
      if (produtoOriginal.Variacao && produtoOriginal.Variacao.length > 0) {
        const variacoesPromises = produtoOriginal.Variacao.map(var_ => 
          tx.variacao.create({
            data: {
              produtoId: novoProduto.id,
              nome: var_.nome,
              codigo: `${var_.codigo}-COPIA`,
              precoVenda: var_.precoVenda,
              status: true,
              tenantId: produtoOriginal.tenantId
            }
          })
        )

        await Promise.all(variacoesPromises)
      }

      return novoProduto
    })

    return NextResponse.json({
      message: 'Produto duplicado com sucesso',
      produto: produtoDuplicado
    })
  } catch (error) {
    console.error('Erro ao duplicar produto:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
