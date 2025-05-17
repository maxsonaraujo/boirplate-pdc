import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// GET - Obter uma categoria específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestParams = (await params)
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

    const id = parseInt(requestParams.id)

    // Buscar a categoria
    const categoria = await db.categoria.findUnique({
      where: { id },
      include: {
        localProducao: true,
        categoriaPai: {
          select: {
            id: true,
            nome: true
          }
        },
        subCategorias: {
          select: {
            id: true,
            nome: true
          }
        },
        produtos: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                imagem: true
              }
            }
          }
        }
      }
    })

    if (!categoria) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ categoria })
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PUT - Atualizar uma categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const routeParameters = await params;
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

    const id = parseInt(routeParameters.id)
    const data = await request.json()

    // Validações básicas
    if (!data.nome) {
      return NextResponse.json(
        { message: 'Nome da categoria é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a categoria existe
    const categoriaExistente = await db.categoria.findUnique({
      where: { id }
    })

    if (!categoriaExistente) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Prevenir referência circular (categoria pai sendo sua própria filha)
    if (data.categoriaPaiId === id) {
      return NextResponse.json(
        { message: 'Uma categoria não pode ser pai de si mesma' },
        { status: 400 }
      )
    }

    // Atualizar a categoria
    const categoriaAtualizada = await db.categoria.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        status: data.status !== undefined ? data.status : categoriaExistente.status,
        ordemExibicao: data.ordemExibicao,
        geraComanda: data.geraComanda !== undefined ? data.geraComanda : categoriaExistente.geraComanda,
        localProducaoId: data.localProducaoId,
        categoriaPaiId: data.categoriaPaiId,
        cor: data.cor,
        icone: data.icone,
        visivelPdv: data.visivelPdv !== undefined ? data.visivelPdv : categoriaExistente.visivelPdv,
        visivelDelivery: data.visivelDelivery !== undefined ? data.visivelDelivery : categoriaExistente.visivelDelivery,
        tempoPreparoPadrao: data.tempoPreparoPadrao
      }
    })

    return NextResponse.json({
      message: 'Categoria atualizada com sucesso',
      categoria: categoriaAtualizada
    })
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// DELETE - Excluir uma categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const requestParams = await params;
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

    const id = parseInt(requestParams.id)

    // Verificar se a categoria existe
    const categoria = await db.categoria.findUnique({
      where: { id },
      include: {
        subCategorias: true,
        produtos: true
      }
    })

    if (!categoria) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a categoria tem subcategorias
    if (categoria.subCategorias.length > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir uma categoria que possui subcategorias' },
        { status: 400 }
      )
    }

    // Verificar se a categoria tem produtos associados
    if (categoria.produtos.length > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir uma categoria que possui produtos associados' },
        { status: 400 }
      )
    }

    // Excluir a categoria
    await db.categoria.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Categoria excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
