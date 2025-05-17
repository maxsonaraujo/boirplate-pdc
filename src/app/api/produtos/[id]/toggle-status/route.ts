import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// PATCH - Alternar o status de um produto (ativar/desativar)
export async function PATCH(
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

    const id = parseInt(routeParams.id)

    // Buscar o produto
    const produto = await db.produto.findUnique({
      where: { id }
    })

    if (!produto) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Alternar o status
    const novoStatus = !produto.status

    // Atualizar o produto
    const produtoAtualizado = await db.produto.update({
      where: { id },
      data: { status: novoStatus }
    })

    return NextResponse.json({
      message: `Produto ${novoStatus ? 'ativado' : 'desativado'} com sucesso`,
      status: novoStatus
    })
  } catch (error) {
    console.error('Erro ao alternar status do produto:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
