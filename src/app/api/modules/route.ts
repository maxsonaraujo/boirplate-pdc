import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';

// GET - Listar todos os módulos do sistema
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token');
    const authCheck = await checkAuthAndPermissions(token);
    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      );
    }

    // Parâmetros opcionais
    const searchParams = request.nextUrl.searchParams;
    const isActiveOnly = searchParams.get('active') === 'true';

    // Construir a consulta
    const whereCondition: any = {};
    if (isActiveOnly) {
      whereCondition.isActive = true;
    }

    // Buscar módulos
    const modules = await db.module.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        _count: {
          select: {
            tenants: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ 
      modules,
      count: modules.length
    });
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// POST - Criar um novo módulo
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token');
    const authCheck = await checkAuthAndPermissions(token);
    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      );
    }

    // Verificar se é administrador
    if (authCheck.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar módulos' },
        { status: 403 }
      );
    }

    // Obter e validar os dados
    const data = await request.json();
    const { nome, slug, descricao, status } = data;

    // Validações básicas
    if (!nome || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe um módulo com o mesmo slug
    const existingModule = await db.module.findUnique({
      where: { slug }
    });

    if (existingModule) {
      return NextResponse.json(
        { error: 'Já existe um módulo com este slug' },
        { status: 409 }
      );
    }

    // Criar o novo módulo
    const newModule = await db.module.create({
      data: {
        name: nome,
        slug,
        description: descricao || null,
        isActive: status !== undefined ? status : true
      }
    });

    return NextResponse.json({
      module: {
        id: newModule.id,
        name: newModule.name,
        slug: newModule.slug,
        description: newModule.description,
        isActive: newModule.isActive
      },
      message: 'Módulo criado com sucesso'
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar módulo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;