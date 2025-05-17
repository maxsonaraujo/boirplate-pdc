import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// GET - Obter sabores disponíveis para um produto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const routeParams = await params;
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

    const produtoId = parseInt(routeParams.id)

    // Verificar se o produto existe
    const produto = await db.produto.findUnique({
      where: { id: produtoId }
    })

    if (!produto) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Buscar os sabores associados ao produto
    const sabores = await db.produtoSabor.findMany({
      where: { produtoId },
      include: {
        sabor: {
          select: {
            id: true,
            nome: true,
            codigo: true,
            precoVenda: true,
            status: true,
            imagem: true,
            categorias: {
              include: {
                categoria: true
              }
            }
          }
        }
      },
      orderBy: {
        ordem: 'asc'
      }
    })

    return NextResponse.json({
      produto: {
        id: produto.id,
        nome: produto.nome,
        aceitaSabores: produto.aceitaSabores,
        maxSabores: produto.maxSabores,
        tipoCobranca: produto.tipoCobranca
      },
      sabores
    })
  } catch (error) {
    console.error('Erro ao buscar sabores:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PUT - Atualizar sabores disponíveis para um produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    // Verificar autenticação
    const token = (await cookies()).get('token')
    const authCheck = await checkAuthAndPermissions(token)

    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      )
    }

    const produtoId = parseInt(routeParams.id)
    const data = await request.json()
    // Verificar se o produto existe
    const produto = await db.produto.findUnique({
      where: { id: produtoId }
    })

    if (!produto) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar configurações de múltiplos sabores do produto
    await db.produto.update({
      where: { id: produtoId },
      data: {
        exibirPrecoBase: data.exibirPrecoBase,
        aceitaSabores: data.aceitaSabores,
        maxSabores: data.maxSabores,
        tipoCobranca: data.tipoCobranca
      }
    })

    // Se foram enviados sabores, atualizar a relação
    if (data.sabores && Array.isArray(data.sabores)) {
      // Transação para garantir consistência
      await db.$transaction(async (tx) => {
        // Remover todos os sabores existentes
        await tx.produtoSabor.deleteMany({
          where: { produtoId }
        })

        // Adicionar os novos sabores
        for (let i = 0; i < data.sabores.length; i++) {
          const sabor = data.sabores[i]
          await tx.produtoSabor.create({
            data: {
              produtoId,
              saborId: parseInt(sabor.saborId),
              precoAdicional: parseFloat(sabor.precoAdicional) || 0,
              ordem: i + 1,
              status: sabor.status !== undefined ? sabor.status : true
            }
          })
        }
      })
    }

    return NextResponse.json({
      message: 'Configuração de sabores atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar sabores:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
