import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// PATCH - Alternar status da unidade de medida (ativo/inativo)
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

    // Buscar a unidade de medida
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
    if (unidadeMedida.status) {
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

    // Alternar o status
    const novoStatus = !unidadeMedida.status

    // Atualizar a unidade de medida
    const unidadeAtualizada = await db.unidadeMedida.update({
      where: { id },
      data: { status: novoStatus }
    })

    return NextResponse.json({
      message: `Unidade de medida ${novoStatus ? 'ativada' : 'desativada'} com sucesso`,
      status: novoStatus
    })
  } catch (error) {
    console.error('Erro ao alternar status da unidade de medida:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
