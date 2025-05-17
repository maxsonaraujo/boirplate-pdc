import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { db } from '@/db/connector'
import { createHash } from 'crypto'

// GET - Obter dados do usuário logado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    try {
      // Decodificar o token
      const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET || 'noKey')

      // Buscar o usuário atualizado no banco de dados
      const user = await db.user.findFirst({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { message: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({ user })
    } catch (error) {
      console.error('Erro ao verificar token:', error)
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// PUT - Atualizar dados do usuário logado
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    try {
      // Decodificar o token
      const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET || 'SecretSigaCallKey')

      // Buscar o usuário no banco de dados
      const user = await db.user.findUnique({
        where: { id: decoded.id }
      })

      if (!user) {
        return NextResponse.json(
          { message: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      // Obter dados da solicitação
      const { name, currentPassword, newPassword } = await request.json()

      // Validar dados básicos
      if (!name) {
        return NextResponse.json(
          { message: 'Nome é obrigatório' },
          { status: 400 }
        )
      }

      // Validar senha atual se estiver tentando alterar a senha
      if (currentPassword && newPassword) {
        const currentPasswordHash = createHash('sha256').update(currentPassword).digest('hex')

        if (currentPasswordHash !== user.password) {
          return NextResponse.json(
            { message: 'Senha atual incorreta' },
            { status: 400 }
          )
        }

        if (newPassword.length < 6) {
          return NextResponse.json(
            { message: 'A nova senha deve ter pelo menos 6 caracteres' },
            { status: 400 }
          )
        }
      }

      // Preparar dados para atualização
      const updateData: any = {
        name,
        updatedAt: new Date()
      }

      // Atualizar senha se fornecida
      if (currentPassword && newPassword) {
        updateData.password = createHash('sha256').update(newPassword).digest('hex')
      }

      // Atualizar o usuário
      const updatedUser = await db.user.update({
        where: { id: decoded.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Gerar novo token com dados atualizados
      const tokenData = { ...updatedUser };
      const jwtSecret = process.env.JWT_SECRET || 'SecretSigaCallKey';
      const newToken = jwt.sign(tokenData, jwtSecret, { expiresIn: '72h' });

      // Atualizar o cookie
      const cookieStore = await cookies();
      cookieStore.set('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        // expire in 3 days
        maxAge: 3 * 24 * 60 * 60
      })

      return NextResponse.json({
        message: 'Perfil atualizado com sucesso',
        user: updatedUser
      })
    } catch (error) {
      console.error('Erro ao verificar token:', error)
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
