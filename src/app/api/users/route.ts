import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { revalidatePath } from 'next/cache'
import { hash } from 'bcrypt'

// Função auxiliar para verificar autenticação e permissões
async function checkAuthAndPermissions(token) {
  if (!token) {
    return { error: 'Não autorizado', status: 401 }
  }

  try {
    // Decodificar o token JWT
    const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET || 'SecretSigaCallKey')
    console.log("decoded", decoded)
    // Buscar o usuário atualizado no banco de dados para verificar permissões atuais
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        active: true
      }
    })

    // Verificar se o usuário existe e está ativo
    if (!user || !user.active) {
      return { error: 'Usuário inativo ou não encontrado', status: 403 }
    }

    // Verificar se o usuário tem permissão adequada
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return { error: 'Acesso negado. Permissão insuficiente.', status: 403 }
    }

    return { userId: user.id, role: user.role }
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error)
    return { error: 'Token inválido', status: 401 }
  }
}

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')
    console.log("token",token)
    const authCheck = await checkAuthAndPermissions(token)

    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      )
    }

    // Buscar todos os usuários
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

// POST - Criar um novo usuário
export async function POST(request: NextRequest) {
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

    const { name, email, password, role, active } = await request.json()

    // Validações básicas
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Dados incompletos. Nome, email, senha e função são obrigatórios.' },
        { status: 400 }
      )
    }

    // Verificar se o e-mail já está em uso
    const existingUser = await db.user.findFirst({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este e-mail já está em uso' },
        { status: 400 }
      )
    }

    // Verificar se usuário não-admin está tentando criar um admin
    if (role === 'ADMIN' && authCheck.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Apenas administradores podem criar outros administradores' },
        { status: 403 }
      )
    }

    // Criar hash da senha
    const hashedPassword = await hash(password, 10);

    // Criar o usuário
    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        active: active !== undefined ? active : true
      },
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

    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      user: newUser
    })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export async function DELETE(req: NextRequest) {
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

    const params = req.nextUrl.searchParams;
    const id: any = parseInt(params.get("id") ?? "0");

    // Verificar se o usuário existe
    const existingUser = await db.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se não-admin está tentando excluir um admin
    if (existingUser.role === 'ADMIN' && authCheck.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Apenas administradores podem excluir outros administradores' },
        { status: 403 }
      )
    }

    // Verificar se está tentando excluir a si mesmo
    if (existingUser.id === authCheck.userId) {
      return NextResponse.json(
        { message: 'Não é possível excluir sua própria conta' },
        { status: 400 }
      )
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({
      message: "Usuário excluído com sucesso!"
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export async function PATCH(req: NextRequest) {
  revalidatePath(req.nextUrl.basePath)
  const data = await req.json();
  // await db.exec("insert into items ('name','description','img') values('"+req.nextUrl.searchParams.get("id")+"','teste','teste.img')")

  // Perform a database query to retrieve all items from the "items" table

  const novaData: any = {
    id: parseInt(data.id),
    email: data.email,
    name: data.name,
    displayName: data.displayName,
    roleId: parseInt(data.roleId),
    assignedNewChatClients: data.assignedNewChatClients ?? true,
    concurrencyLimit: Number(data.concurrencyLimit) ?? 10,
  }


  if (data.password) {
    novaData['password'] = createHash('sha256').update(data.password).digest('hex')
  }


  await db.user.update({
    data: novaData, where: { id: novaData.id }
  }).catch((err) => {
    console.error("caiu aqui", err);

    return new Response(JSON.stringify({ message: "Falha ao cadastrar o usuário;" }), {
      headers: { "Content-Type": "application/json", 'Cache-Control': 'no-store' },
      status: 400,
    });
  }).finally(async () => {
    await db.$disconnect();
  })

  // const items = await db.user.findMany();

  // Return the items as a JSON response with status 200
  return new Response(JSON.stringify({ message: "Usuário atualizado com sucesso!" }), {
    headers: { "Content-Type": "application/json", 'Cache-Control': 'no-store' },
    status: 200,
  });
}

export async function PUT(req: NextRequest) {
  revalidatePath(req.nextUrl.basePath)
  const data = await req.json();

  const response = await db.user.update({ data: { active: data.status }, where: { id: data.id } }).then(() => {
    return new Response(JSON.stringify({ message: "Status alterado!" }), {
      headers: { "Content-Type": "application/json", 'Cache-Control': 'no-store' },
      status: 200,
    });
  }).catch(() => {
    return new Response(JSON.stringify({ message: "Falha ao alterar status do usuário;" }), {
      headers: { "Content-Type": "application/json", 'Cache-Control': 'no-store' },
      status: 400,
    });
  }).finally(async () => {
    await db.$disconnect();
  })

  return response;

}


export const dynamic = 'force-dynamic'