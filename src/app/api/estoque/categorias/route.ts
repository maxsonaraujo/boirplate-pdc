import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Parâmetros de consulta
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    
    // Construir where clause
    let whereClause: any = { tenantId };
    
    if (search) {
      whereClause.OR = [
        { nome: { contains: search } },
        { descricao: { contains: search } }
      ];
    }
    
    if (status !== null && status !== undefined) {
      whereClause.status = status === 'true';
    }
    
    // Consulta no banco de dados
    const categorias = await db.categoriaInsumo.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: { insumos: true }
        }
      }
    });

    return NextResponse.json({ categorias });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    
    // Verificar se o tenantId é um número válido
    if (!tenantId || typeof tenantId !== 'number' || isNaN(tenantId)) {
      return NextResponse.json(
        { message: 'Tenant inválido ou não identificado' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Validar dados obrigatórios
    if (!data.nome || data.nome.trim() === '') {
      return NextResponse.json(
        { message: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma categoria com este nome
    const categoriaExistente = await db.categoriaInsumo.findFirst({
      where: {
        nome: data.nome,
        tenantId
      }
    });

    if (categoriaExistente) {
      return NextResponse.json(
        { message: 'Já existe uma categoria com este nome' },
        { status: 400 }
      );
    }

    // Preparar dados para criação sem usar helper, forçando o tipo correto
    const categoriaData = {
      nome: data.nome,
      descricao: data.descricao || '',
      status: data.status !== undefined ? data.status : true,
      tenantId: Number(tenantId) // Garantir que seja um número
    };

    // Criar a categoria
    const categoria = await db.categoriaInsumo.create({
      data: categoriaData
    });

    return NextResponse.json({
      message: 'Categoria criada com sucesso',
      categoria
    });
  } catch (error) {
    console.error('Erro ao criar categoria de insumo:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação: ' + error.message },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
