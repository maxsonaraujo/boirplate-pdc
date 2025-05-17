import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { hash } from 'bcrypt'
import { getTenantIdFromHeaders } from '@/utils/tenant'

// POST - Registrar novo usuário
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = 'WAITER' } = await request.json()

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Obter tenant ID
    const tenantId = await getTenantIdFromHeaders();
    
    if (!tenantId && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { message: 'Tenant não identificado' },
        { status: 400 }
      )
    }

    // Verificar se já existe um usuário com este email neste tenant
    const existingUser = await db.user.findFirst({
      where: {
        email,
        tenantId: tenantId || undefined
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Já existe um usuário com este email neste tenant' },
        { status: 409 }
      )
    }

    // Hash da senha
    const hashedPassword = await hash(password, 10)

    // Criar usuário
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        tenantId: tenantId || undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({ 
      message: 'Usuário criado com sucesso',
      user
    })
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
