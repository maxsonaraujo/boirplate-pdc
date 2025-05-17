import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// PATCH - Alternar status do complemento (ativo/inativo)
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

    // Buscar o complemento
    const complemento = await db.complemento.findUnique({
      where: { id }
    })

    if (!complemento) {
      return NextResponse.json(
        { message: 'Complemento não encontrado' },
        { status: 404 }
      )
    }

    // Alternar o status
    const novoStatus = !complemento.status

    // Atualizar o complemento
    const complementoAtualizado = await db.complemento.update({
      where: { id },
      data: { status: novoStatus }
    })

    return NextResponse.json({
      message: `Complemento ${novoStatus ? 'ativado' : 'desativado'} com sucesso`,
      status: novoStatus
    })
  } catch (error) {
    console.error('Erro ao alternar status do complemento:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
