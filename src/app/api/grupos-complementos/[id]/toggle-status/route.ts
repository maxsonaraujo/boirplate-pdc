import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// PATCH - Alternar status do grupo de complementos
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

    // Buscar o grupo
    const grupo = await db.grupoComplemento.findUnique({
      where: { id }
    })

    if (!grupo) {
      return NextResponse.json(
        { message: 'Grupo de complementos não encontrado' },
        { status: 404 }
      )
    }

    // Alternar o status
    const novoStatus = !grupo.status

    // Atualizar o grupo
    const grupoAtualizado = await db.grupoComplemento.update({
      where: { id },
      data: { status: novoStatus }
    })

    return NextResponse.json({
      message: `Grupo de complementos ${novoStatus ? 'ativado' : 'desativado'} com sucesso`,
      status: novoStatus
    })
  } catch (error) {
    console.error('Erro ao alternar status do grupo de complementos:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
