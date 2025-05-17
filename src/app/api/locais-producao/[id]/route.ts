import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'

// GET - Obter um local de produção específico
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

    // Buscar o local de produção
    const localProducao = await db.localProducao.findUnique({
      where: { id },
      include: {
        categorias: {
          select: {
            id: true,
            nome: true
          }
        },
        produtos: {
          select: {
            id: true,
            nome: true,
            codigo: true
          }
        }
      }
    })

    if (!localProducao) {
      return NextResponse.json(
        { message: 'Local de produção não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ localProducao })
  } catch (error) {
    console.error('Erro ao buscar local de produção:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PUT - Atualizar um local de produção
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
        { message: 'Nome do local de produção é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o local de produção existe
    const localExistente = await db.localProducao.findUnique({
      where: { id }
    })

    if (!localExistente) {
      return NextResponse.json(
        { message: 'Local de produção não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar o local de produção
    const localAtualizado = await db.localProducao.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        status: data.status !== undefined ? data.status : localExistente.status,
        impressora: data.impressora
      }
    })

    return NextResponse.json({
      message: 'Local de produção atualizado com sucesso',
      localProducao: localAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar local de produção:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// DELETE - Excluir um local de produção
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

    // Verificar se o local de produção existe
    const local = await db.localProducao.findUnique({
      where: { id },
      include: {
        categorias: true,
        produtos: true
      }
    })

    if (!local) {
      return NextResponse.json(
        { message: 'Local de produção não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o local tem categorias associadas
    if (local.categorias.length > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir um local de produção que possui categorias associadas' },
        { status: 400 }
      )
    }

    // Verificar se o local tem produtos associados
    if (local.produtos.length > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir um local de produção que possui produtos associados' },
        { status: 400 }
      )
    }

    // Excluir o local de produção
    await db.localProducao.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Local de produção excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir local de produção:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
