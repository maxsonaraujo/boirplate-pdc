import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Listar grupos de bairros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    // Verificar autenticação para área administrativa
    const token = (await cookies()).get('token');
    const isAdmin = token ? !(await checkAuthAndPermissions(token)).error : false;
    
    // Obter o ID do tenant
    let tenantId;
    
    if (isAdmin) {
      tenantId = await getTenantIdFromHeaders();
    } else {
      const slug = searchParams.get('slug');
      if (!slug) {
        return NextResponse.json(
          { error: 'É necessário fornecer o slug ou estar autenticado' },
          { status: 400 }
        );
      }
      
      // Buscar tenant pelo slug
      const tenant = await db.tenant.findUnique({
        where: { slug },
        select: { id: true }
      });
      
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant não encontrado' },
          { status: 404 }
        );
      }
      
      tenantId = tenant.id;
    }
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }
    
    // Construir condição where
    const whereCondition: any = { tenantId };
    
    if (!includeInactive) {
      whereCondition.ativo = true;
    }
    
    // Buscar grupos de bairros com contagem de bairros associados
    const grupos = await db.grupoBairro.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: { bairros: true }
        }
      },
      orderBy: { nome: 'asc' }
    });
    
    return NextResponse.json({ grupos });
  } catch (error) {
    console.error('Erro ao buscar grupos de bairros:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// POST - Criar novo grupo de bairros
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
    
    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    const {
      nome,
      descricao,
      valorEntrega,
      tempoEstimado,
      ativo = true
    } = data;
    
    // Validar campos obrigatórios
    if (!nome || valorEntrega === undefined) {
      return NextResponse.json(
        { error: 'Nome e valor de entrega são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe um grupo com mesmo nome
    const grupoExistente = await db.grupoBairro.findFirst({
      where: {
        tenantId,
        nome
      }
    });
    
    if (grupoExistente) {
      return NextResponse.json(
        { error: 'Já existe um grupo com este nome' },
        { status: 400 }
      );
    }
    
    // Criar novo grupo
    const novoGrupo = await db.grupoBairro.create({
      data: {
        tenantId,
        nome,
        descricao,
        valorEntrega,
        tempoEstimado,
        ativo
      }
    });
    
    return NextResponse.json({
      message: 'Grupo de bairros criado com sucesso',
      grupo: novoGrupo
    });
  } catch (error) {
    console.error('Erro ao criar grupo de bairros:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
