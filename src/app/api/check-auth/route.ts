import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { db } from '@/db/connector'

export async function GET() {
  try {
    // Obter o armazenamento de cookies
    const cookieStore = await cookies()

    // Verificar se o token existe
    const token = cookieStore.get('token')

    if (!token) {
      cookieStore.delete('degusflow-session')
      cookieStore.delete('refresh-token')
      cookieStore.delete('token')
      return NextResponse.json({ authenticated: false })
    }

    try {
      // Decodificar o token
      let decoded: any = null;

      try {
        decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'noKey')
      } catch (error) {
        cookieStore.delete('degusflow-session')
        cookieStore.delete('refresh-token')
        cookieStore.delete('token')
      }
      // Buscar o usuário atualizado no banco de dados
      const user = await db.user.findFirst({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true
        }
      })

      // Verificar se o usuário existe e está ativo
      if (!user || !user.active) {
        return NextResponse.json({ authenticated: false })
      }

      // O usuário está autenticado
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    } catch (jwtError) {
      console.error('Erro ao verificar JWT:', jwtError)
      return NextResponse.json({ authenticated: false })
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return NextResponse.json(
      { authenticated: false, message: 'Erro ao verificar autenticação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
