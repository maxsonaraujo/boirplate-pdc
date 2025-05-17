import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// POST - Importar um bairro individual de uma fonte pública
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
          contains: nome
        }
      }
    });
    
    // Verificação manual case-insensitive
    if (bairroExistente && bairroExistente.nome.toLowerCase() === nome.toLowerCase()) {
      return NextResponse.json(
        { error: 'Este bairro já está cadastrado nesta cidade' },
        { status: 400 }
      );
    }
    
    // Processar grupoBairroId
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
      message: 'Bairro importado com sucesso',
      bairro: novoBairro
    });
  } catch (error) {
    console.error('Erro ao importar bairro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
