import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// GET - Obter um complemento específico
export async function GET(
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

    // Buscar o complemento
    const complemento = await db.complemento.findUnique({
      where: { id },
      include: {
        produtos: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                status: true
              }
            }
          }
        }
      }
    })

    if (!complemento) {
      return NextResponse.json(
        { message: 'Complemento não encontrado' },
        { status: 404 }
      )
    }

    // Adicionar contagens para verificação de relacionamentos
    const relacionamentos = {
      totalProdutos: await db.complementoProduto.count({
        where: {
          complementoId: id
        }
      })
    }

    return NextResponse.json({
      complemento,
      relacionamentos
    })
  } catch (error) {
    console.error('Erro ao buscar complemento:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PUT - Atualizar um complemento
export async function PUT(
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
    const data = await request.json()

    // Validações básicas
    if (!data.nome) {
      return NextResponse.json(
        { message: 'Nome do complemento é obrigatório' },
        { status: 400 }
      )
    }

    if (data.precoAdicional === undefined || data.precoAdicional === null || isNaN(data.precoAdicional)) {
      return NextResponse.json(
        { message: 'Preço adicional do complemento é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o complemento existe
    const complementoExistente = await db.complemento.findUnique({
      where: { id }
    })

    if (!complementoExistente) {
      return NextResponse.json(
        { message: 'Complemento não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar o complemento
    const complementoAtualizado = await db.complemento.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        precoAdicional: parseFloat(data.precoAdicional),
        status: data.status
      }
    })

    return NextResponse.json({
      message: 'Complemento atualizado com sucesso',
      complemento: complementoAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar complemento:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// DELETE - Excluir um complemento
export async function DELETE(
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

    // Verificar se o complemento existe
    const complemento = await db.complemento.findUnique({
      where: { id }
    })

    if (!complemento) {
      return NextResponse.json(
        { message: 'Complemento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há produtos utilizando este complemento
    const produtosComEsteComplemento = await db.complementoProduto.count({
      where: { complementoId: id }
    })

    if (produtosComEsteComplemento > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir um complemento que está sendo utilizado por produtos' },
        { status: 400 }
      )
    }

    // Excluir o complemento
    await db.complemento.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Complemento excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir complemento:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PATCH - Alternar status do complemento (ativar/desativar)
export async function PATCH(
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
    const data = await request.json()

    // Verificar se o complemento existe
    const complemento = await db.complemento.findUnique({
      where: { id }
    })

    if (!complemento) {
      return NextResponse.json(
        { message: 'Complemento não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar o status do complemento
    const complementoAtualizado = await db.complemento.update({
      where: { id },
      data: { status: data.status }
    })

    return NextResponse.json({
      message: `Complemento ${data.status ? 'ativado' : 'desativado'} com sucesso`,
      complemento: complementoAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar status do complemento:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
