import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { db } from '@/db/connector'

type TokenData = {
  id: number
  email: string
  name: string
  role: string
  tenantId?: number | null
  exp: number
}

// Verificar token de autenticação e permissões
export async function checkAuthAndPermissions(token: any, requiredRole?: string) {

  const cookieStore = await cookies();
  if (!token || !token.value) {
    // Remover tokens existentes, caso haja algum inválido
    cookieStore.delete('degusflow-session')
    cookieStore.delete('refresh-token')
    cookieStore.delete('token')

    return {
      error: 'Não autenticado',
      status: 401
    }
  }

  try {
    let decoded: TokenData = null;

    try {
      decoded = jwt.verify(
        token.value,
        process.env.JWT_SECRET || 'noKey'
      ) as TokenData
    } catch (error) {
      cookieStore.delete('degusflow-session')
      cookieStore.delete('refresh-token')
      cookieStore.delete('token')
    }

    // Verificar se o token está expirado
    const currentTime = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < currentTime) {
      // Remover tokens expirados
      cookieStore.delete('degusflow-session')
      cookieStore.delete('refresh-token')
      cookieStore.delete('token')

      return {
        error: 'Sessão expirada',
        status: 401
      }
    }

    // Se um role específico é requerido, verificar se o usuário tem permissão
    if (requiredRole && decoded.role !== requiredRole && decoded.role !== 'ADMIN') {
      return {
        error: 'Permissão negada',
        status: 403
      }
    }

    // Verificar se o usuário ainda existe no banco de dados e está ativo
    const user = await db.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: decoded.tenantId || undefined,
        active: true
      }
    })

    if (!user) {
      cookieStore.delete('degusflow-session')
      cookieStore.delete('refresh-token')

      return {
        error: 'Usuário não encontrado ou inativo',
        status: 404
      }
    }

    // Sucesso - usuário autenticado e com permissão
    return {
      tokenData: decoded,
      user
    }
  } catch (error) {
    console.error('Erro na verificação do token:', error)

    // Remover tokens inválidos
    cookieStore.delete('degusflow-session')
    cookieStore.delete('refresh-token')
    cookieStore.delete('token')

    return {
      error: 'Token inválido',
      status: 401
    }
  }
}

// Middleware para verificar autenticação em API routes
export async function withAuth(
  req: Request,
  handler: () => Promise<NextResponse>,
  requiredRole?: string
) {
  const token = (await cookies()).get('degusflow-session')
  const authCheck = await checkAuthAndPermissions(token, requiredRole)

  if (authCheck.error) {
    return NextResponse.json(
      { message: authCheck.error },
      { status: authCheck.status }
    )
  }

  return handler()
}

// Verificar se o usuário tem uma determinada função
export function hasRole(user: TokenData, requiredRole: string): boolean {
  if (!user || !user.role) return false

  // Se o usuário for ADMIN, tem acesso a tudo
  if (user.role === 'ADMIN') return true

  // Verificar a função específica
  return user.role === requiredRole
}

// Verificar se o usuário tem qualquer uma das funções especificadas
export function hasAnyRole(user: TokenData, requiredRoles: string[]): boolean {
  if (!user || !user.role) return false

  // Se o usuário for ADMIN, tem acesso a tudo
  if (user.role === 'ADMIN') return true

  // Verificar se a função do usuário está na lista de funções permitidas
  return requiredRoles.includes(user.role)
}

// Extrair dados do token
export function getTokenData(token: string): TokenData | null {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'noKey'
    ) as TokenData
  } catch (error) {
    console.error('Erro ao extrair dados do token:', error)
    return null
  }
}
