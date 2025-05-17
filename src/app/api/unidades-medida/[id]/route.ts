import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// GET - Obter uma unidade de medida específica
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

    // Buscar a unidade de medida
    const unidadeMedida = await db.unidadeMedida.findUnique({
      where: { id },
      include: {
        produtos: {
          select: {
            id: true,
            nome: true,
            codigo: true
          },
          take: 10
        },
        ingredientes: {
          select: {
            id: true,
            nome: true,
            fichaTecnicaId: true
          },
          take: 10
        }
      }
    })

    if (!unidadeMedida) {
      return NextResponse.json(
        { message: 'Unidade de medida não encontrada' },
        { status: 404 }
      )
    }

    // Adicionar contagens para verificação de relacionamentos
    const relacionamentos = {
      totalProdutos: await db.produto.count({
        where: { 
          unidadeMedidaId: id 
        }
      }),
      totalIngredientes: await db.ingrediente.count({
        where: { 
          unidadeMedidaId: id 
        }
      })
    }

    return NextResponse.json({ 
      unidadeMedida,
      relacionamentos
    })
  } catch (error) {
    console.error('Erro ao buscar unidade de medida:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PUT - Atualizar uma unidade de medida
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
        { message: 'Nome da unidade de medida é obrigatório' },
        { status: 400 }
      )
    }

    if (!data.simbolo) {
      return NextResponse.json(
        { message: 'Símbolo da unidade de medida é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a unidade de medida existe
    const unidadeExistente = await db.unidadeMedida.findUnique({
      where: { id }
    })

    if (!unidadeExistente) {
      return NextResponse.json(
        { message: 'Unidade de medida não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o símbolo já está em uso por outra unidade
    if (data.simbolo !== unidadeExistente.simbolo) {
      const simboloEmUso = await db.unidadeMedida.findFirst({
        where: {
          simbolo: data.simbolo,
          id: { not: id }
        }
      })

      if (simboloEmUso) {
        return NextResponse.json(
          { message: 'Já existe outra unidade de medida com este símbolo' },
          { status: 400 }
        )
      }
    }

    // Atualizar a unidade de medida
    const unidadeAtualizada = await db.unidadeMedida.update({
      where: { id },
      data: {
        nome: data.nome,
        simbolo: data.simbolo,
        descricao: data.descricao
      }
    })

    return NextResponse.json({
      message: 'Unidade de medida atualizada com sucesso',
      unidadeMedida: unidadeAtualizada
    })
  } catch (error) {
    console.error('Erro ao atualizar unidade de medida:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// DELETE - Excluir uma unidade de medida
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

    // Verificar se a unidade de medida existe
    const unidadeMedida = await db.unidadeMedida.findUnique({
      where: { id }
    })

    if (!unidadeMedida) {
      return NextResponse.json(
        { message: 'Unidade de medida não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se há produtos utilizando esta unidade de medida
    const produtosComEstaUnidade = await db.produto.count({
      where: {
        unidadeMedidaId: id
      }
    })

    if (produtosComEstaUnidade > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir uma unidade de medida que está sendo utilizada por produtos' },
        { status: 400 }
      )
    }

    // Verificar se há ingredientes utilizando esta unidade de medida
    const ingredientesComEstaUnidade = await db.ingrediente.count({
      where: { unidadeMedidaId: id }
    })

    if (ingredientesComEstaUnidade > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir uma unidade de medida que está sendo utilizada por ingredientes de fichas técnicas' },
        { status: 400 }
      )
    }

    // Excluir a unidade de medida
    await db.unidadeMedida.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Unidade de medida excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir unidade de medida:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PATCH - Alterar status da unidade de medida (ativar/desativar)
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

    // Verificar se a unidade de medida existe
    const unidadeMedida = await db.unidadeMedida.findUnique({
      where: { id }
    })

    if (!unidadeMedida) {
      return NextResponse.json(
        { message: 'Unidade de medida não encontrada' },
        { status: 404 }
      )
    }

    // Se estamos desativando a unidade, verificar se há produtos ativos usando-a
    if (data.status === false) {
      const produtosAtivosComEstaUnidade = await db.produto.count({
        where: {
          unidadeMedidaId: id,
          status: true
        }
      })

      if (produtosAtivosComEstaUnidade > 0) {
        return NextResponse.json(
          { 
            message: 'Não é possível desativar uma unidade de medida que está sendo utilizada por produtos ativos',
            produtosAtivos: produtosAtivosComEstaUnidade 
          },
          { status: 400 }
        )
      }
    }

    // Atualizar o status da unidade de medida
    const unidadeAtualizada = await db.unidadeMedida.update({
      where: { id },
      data: { status: data.status }
    })

    return NextResponse.json({
      message: `Unidade de medida ${data.status ? 'ativada' : 'desativada'} com sucesso`,
      unidadeMedida: unidadeAtualizada
    })
  } catch (error) {
    console.error('Erro ao atualizar status da unidade de medida:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
