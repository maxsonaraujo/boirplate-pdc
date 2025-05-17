import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter detalhes de um bairro específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    const bairroId = parseInt(routeParams.id);
    
    if (isNaN(bairroId)) {
      return NextResponse.json(
        { error: 'ID de bairro inválido' },
        { status: 400 }
      );
    }
    
    // Buscar bairro com informações relacionadas
    const bairro = await db.bairro.findUnique({
      where: { id: bairroId },
      include: {
        cidade: true,
        grupoBairro: true
      }
    });
    
    if (!bairro) {
      return NextResponse.json(
        { error: 'Bairro não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ bairro });
  } catch (error) {
    console.error('Erro ao buscar bairro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT - Atualizar um bairro
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const routeParams = await params;
    const bairroId = parseInt(routeParams.id);
    
    if (isNaN(bairroId)) {
      return NextResponse.json(
        { error: 'ID de bairro inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se o bairro existe e pertence ao tenant
    const bairroExistente = await db.bairro.findFirst({
      where: {
        id: bairroId,
        tenantId
      }
    });
    
    if (!bairroExistente) {
      return NextResponse.json(
        { error: 'Bairro não encontrado ou não pertence ao tenant' },
        { status: 404 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    const {
      nome,
      grupoBairroId,
      valorEntregaPersonalizado,
      tempoEstimadoPersonalizado,
      ativo
    } = data;
    
    // Validar campo obrigatório
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome do bairro é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe outro bairro com o mesmo nome na mesma cidade
    if (nome !== bairroExistente.nome) {
      const bairroMesmoNomeExistente = await db.bairro.findFirst({
        where: {
          cidadeId: bairroExistente.cidadeId,
          nome: {
            contains: nome
          },
          id: { not: bairroId },
          tenantId
        }
      });
      
      // Verificação manual case-insensitive
      if (bairroMesmoNomeExistente && 
          bairroMesmoNomeExistente.nome.toLowerCase() === nome.toLowerCase()) {
        return NextResponse.json(
          { error: 'Já existe outro bairro com este nome na mesma cidade' },
          { status: 400 }
        );
      }
    }
    
    // Atualizar bairro
    const bairroAtualizado = await db.bairro.update({
      where: { id: bairroId },
      data: {
        nome,
        grupoBairroId: grupoBairroId === '' ? null : grupoBairroId,
        valorEntregaPersonalizado: valorEntregaPersonalizado === '' ? null : valorEntregaPersonalizado,
        tempoEstimadoPersonalizado: tempoEstimadoPersonalizado === '' ? null : tempoEstimadoPersonalizado,
        ativo: ativo !== undefined ? ativo : bairroExistente.ativo
      },
      include: {
        cidade: true,
        grupoBairro: true
      }
    });
    
    return NextResponse.json({
      message: 'Bairro atualizado com sucesso',
      bairro: bairroAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar bairro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// DELETE - Excluir um bairro
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const routeParams = await params;
    const bairroId = parseInt(routeParams.id);
    
    if (isNaN(bairroId)) {
      return NextResponse.json(
        { error: 'ID de bairro inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se o bairro existe e pertence ao tenant
    const bairroExistente = await db.bairro.findFirst({
      where: {
        id: bairroId,
        tenantId
      }
    });
    
    if (!bairroExistente) {
      return NextResponse.json(
        { error: 'Bairro não encontrado ou não pertence ao tenant' },
        { status: 404 }
      );
    }
    
    // Verificar se há pedidos usando este bairro
    // Na implementação real, você pode querer verificar se existem pedidos associados
    // e possivelmente impedir a exclusão em vez de apenas desativar
    
    // Excluir bairro
    await db.bairro.delete({
      where: { id: bairroId }
    });
    
    return NextResponse.json({
      message: 'Bairro removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir bairro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
