import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter bairros por cidade ou tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cidadeId = searchParams.get('cidadeId') ? 
      parseInt(searchParams.get('cidadeId') || '0') : 
      null;
    const tenantId = searchParams.get('tenantId') ? 
      parseInt(searchParams.get('tenantId') || '0') : 
      null;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    let whereClause: any = {};
    
    // Filtrar por cidade se especificado
    if (cidadeId) {
      whereClause.cidadeId = cidadeId;
    }
    
    // Filtrar por tenant
    if (tenantId) {
      whereClause.tenantId = tenantId;
    } else {
      // Para requisições admin, obter o tenant do cookie
      const token = (await cookies()).get('token');
      if (token) {
        const authCheck = await checkAuthAndPermissions(token);
        if (authCheck.error) {
          return NextResponse.json(
            { message: authCheck.error },
            { status: authCheck.status }
          );
        }
        
        const adminTenantId = await getTenantIdFromHeaders();
        if (adminTenantId) {
          whereClause.tenantId = adminTenantId;
        }
      }
    }
    
    // Se não houver nem cidadeId nem tenantId, retornar erro
    if (!whereClause.cidadeId && !whereClause.tenantId) {
      return NextResponse.json(
        { error: 'É necessário especificar cidadeId ou tenantId' },
        { status: 400 }
      );
    }
    
    // Adicionar filtro para apenas bairros ativos (se não foi solicitado incluir inativos)
    if (!includeInactive) {
      whereClause.ativo = true;
    }
    
    // Buscar bairros
    const bairros = await db.bairro.findMany({
      where: whereClause,
      include: {
        cidade: true,
        grupoBairro: true
      },
      orderBy: {
        nome: 'asc'
      }
    });
    
    return NextResponse.json({ bairros });
  } catch (error) {
    console.error('Erro ao buscar bairros:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// POST - Adicionar novo bairro (somente admin)
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
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }
    
    // Obter dados da requisição
    const data = await request.json();
    const { 
      nome, 
      cidadeId, 
      grupoBairroId = null, 
      valorEntregaPersonalizado = null, 
      tempoEstimadoPersonalizado = null, 
      ativo = true 
    } = data;
    
    if (!nome || !cidadeId) {
      return NextResponse.json(
        { error: 'Nome e ID da cidade são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se a cidade existe e pertence ao tenant
    const cidade = await db.cidadeEntrega.findFirst({
      where: {
        id: parseInt(cidadeId.toString()),
        tenantId
      }
    });
    
    if (!cidade) {
      return NextResponse.json(
        { error: 'Cidade não encontrada ou não pertence a este tenant' },
        { status: 404 }
      );
    }
    
    // Verificar se o bairro já existe
    const bairroExistente = await db.bairro.findFirst({
      where: {
        tenantId,
        cidadeId: cidade.id,
        nome: { 
          contains: nome,
          // Remover mode: 'insensitive' e usar toLowerCase() para comparações não sensíveis a caso
        }
      }
    });
    
    // Se encontramos um bairro com nome similar, verificamos exatamente
    if (bairroExistente && bairroExistente.nome.toLowerCase() === nome.toLowerCase()) {
      return NextResponse.json(
        { error: 'Este bairro já está cadastrado nesta cidade' },
        { status: 400 }
      );
    }
    
    // Processar o grupoBairroId se existir
    let grupoBairroIdFinal = null;
    if (grupoBairroId !== null && grupoBairroId !== '') {
      grupoBairroIdFinal = parseInt(grupoBairroId.toString());
    }
    
    // Criar novo bairro
    const novoBairro = await db.bairro.create({
      data: {
        tenantId,
        cidadeId: cidade.id,
        nome,
        grupoBairroId: grupoBairroIdFinal,
        valorEntregaPersonalizado,
        tempoEstimadoPersonalizado,
        ativo
      },
      include: {
        cidade: true,
        grupoBairro: true
      }
    });
    
    return NextResponse.json({
      message: 'Bairro adicionado com sucesso',
      bairro: novoBairro
    });
  } catch (error) {
    console.error('Erro ao adicionar bairro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
