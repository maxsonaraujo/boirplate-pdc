import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// GET - Obter um grupo de complementos específico
export async function GET(
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

    const id = parseInt(routeParams.id)

    // Buscar o grupo de complementos
    const grupoComplemento = await db.grupoComplemento.findUnique({
      where: { id },
      include: {
        complementos: {
          include: {
            complemento: true
          },
          orderBy: {
            ordem: 'asc'
          }
        },
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

    if (!grupoComplemento) {
      return NextResponse.json(
        { message: 'Grupo de complementos não encontrado' },
        { status: 404 }
      )
    }

    // Adicionar contagens para verificação de relacionamentos
    const relacionamentos = {
      totalProdutos: await db.grupoProduto.count({
        where: {
          grupoComplementoId: id
        }
      }),
      totalComplementos: await db.grupoComplementoItem.count({
        where: {
          grupoComplementoId: id
        }
      })
    }

    return NextResponse.json({
      grupoComplemento,
      relacionamentos
    })
  } catch (error) {
    console.error('Erro ao buscar grupo de complementos:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PUT - Atualizar um grupo de complementos
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
        { message: 'Nome do grupo de complementos é obrigatório' },
        { status: 400 }
      )
    }

    if (data.minSelecao < 0) {
      return NextResponse.json(
        { message: 'Seleção mínima não pode ser negativa' },
        { status: 400 }
      )
    }

    if (data.maxSelecao < data.minSelecao) {
      return NextResponse.json(
        { message: 'Seleção máxima deve ser maior ou igual à mínima' },
        { status: 400 }
      )
    }

    // Verificar se o grupo existe
    const grupoExistente = await db.grupoComplemento.findUnique({
      where: { id }
    })

    if (!grupoExistente) {
      return NextResponse.json(
        { message: 'Grupo de complementos não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar o grupo de complementos com transação
    const grupoAtualizado = await db.$transaction(async (tx) => {
      // Atualizar o grupo básico
      const grupo = await tx.grupoComplemento.update({
        where: { id },
        data: {
          nome: data.nome,
          descricao: data.descricao,
          minSelecao: data.minSelecao,
          maxSelecao: data.maxSelecao,
          status: data.status
        }
      })

      // Se complementos foram enviados, atualizar a relação
      if (data.complementos && Array.isArray(data.complementos)) {
        // Remover todas as relações existentes
        await tx.grupoComplementoItem.deleteMany({
          where: { grupoComplementoId: id }
        })

        // Adicionar as novas relações
        for (let i = 0; i < data.complementos.length; i++) {
          const complementoId = data.complementos[i]
          await tx.grupoComplementoItem.create({
            data: {
              grupoComplementoId: id,
              complementoId: parseInt(complementoId),
              ordem: i + 1
            }
          })
        }
      }

      return grupo
    })

    return NextResponse.json({
      message: 'Grupo de complementos atualizado com sucesso',
      grupoComplemento: grupoAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar grupo de complementos:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// DELETE - Excluir um grupo de complementos
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

    // Verificar se o grupo existe
    const grupo = await db.grupoComplemento.findUnique({
      where: { id }
    })

    if (!grupo) {
      return NextResponse.json(
        { message: 'Grupo de complementos não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há produtos utilizando este grupo
    const produtosComEsteGrupo = await db.grupoProduto.count({
      where: { grupoComplementoId: id }
    })

    if (produtosComEsteGrupo > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir um grupo que está sendo utilizado por produtos' },
        { status: 400 }
      )
    }

    // Excluir o grupo de complementos com transação
    await db.$transaction(async (tx) => {
      // Primeiro remover todos os itens associados ao grupo
      await tx.grupoComplementoItem.deleteMany({
        where: { grupoComplementoId: id }
      })

      // Então remover o grupo
      await tx.grupoComplemento.delete({
        where: { id }
      })
    })

    return NextResponse.json({
      message: 'Grupo de complementos excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir grupo de complementos:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PATCH - Alternar status do grupo
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

    // Verificar se o grupo existe
    const grupo = await db.grupoComplemento.findUnique({
      where: { id }
    })

    if (!grupo) {
      return NextResponse.json(
        { message: 'Grupo de complementos não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar o status do grupo
    const grupoAtualizado = await db.grupoComplemento.update({
      where: { id },
      data: { status: data.status }
    })

    return NextResponse.json({
      message: `Grupo de complementos ${data.status ? 'ativado' : 'desativado'} com sucesso`,
      grupoComplemento: grupoAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar status do grupo de complementos:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
