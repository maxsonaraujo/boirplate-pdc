import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter detalhes de um método de pagamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    const methodId = parseInt(routeParams.id);
    
    if (isNaN(methodId)) {
      return NextResponse.json(
        { error: 'ID do método inválido' },
        { status: 400 }
      );
    }
    
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
    
    // Buscar método de pagamento
    const method = await db.metodoPagamento.findFirst({
      where: {
        id: methodId,
        tenantId
      }
    });
    
    if (!method) {
      return NextResponse.json(
        { error: 'Método de pagamento não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ method });
  } catch (error) {
    console.error('Erro ao buscar método de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT - Atualizar método de pagamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    const methodId = parseInt(routeParams.id);
    
    if (isNaN(methodId)) {
      return NextResponse.json(
        { error: 'ID do método inválido' },
        { status: 400 }
      );
    }
    
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
    
    // Verificar se o método existe e pertence ao tenant
    const existingMethod = await db.metodoPagamento.findFirst({
      where: {
        id: methodId,
        tenantId
      }
    });
    
    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Método de pagamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Obter dados da requisição
    const data = await request.json();
    const { name, active, acceptsChange } = data;
    
    // Atualizar método de pagamento
    const updatedMethod = await db.metodoPagamento.update({
      where: { id: methodId },
      data: {
        name: name || existingMethod.name,
        active: active !== undefined ? active : existingMethod.active,
        acceptsChange: acceptsChange !== undefined ? acceptsChange : existingMethod.acceptsChange
      }
    });
    
    return NextResponse.json({
      message: 'Método de pagamento atualizado com sucesso',
      method: updatedMethod
    });
  } catch (error) {
    console.error('Erro ao atualizar método de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// DELETE - Excluir método de pagamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    const methodId = parseInt(routeParams.id);
    
    if (isNaN(methodId)) {
      return NextResponse.json(
        { error: 'ID do método inválido' },
        { status: 400 }
      );
    }
    
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
    
    // Verificar se o método existe e pertence ao tenant
    const existingMethod = await db.metodoPagamento.findFirst({
      where: {
        id: methodId,
        tenantId
      }
    });
    
    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Método de pagamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Se for um dos métodos padrão, apenas desativar em vez de excluir
    if (['credit_card', 'money', 'pix'].includes(existingMethod.code)) {
      const updatedMethod = await db.metodoPagamento.update({
        where: { id: methodId },
        data: { active: false }
      });
      
      return NextResponse.json({
        message: 'Método de pagamento padrão desativado',
        method: updatedMethod
      });
    }
    
    // Excluir método de pagamento
    await db.metodoPagamento.delete({
      where: { id: methodId }
    });
    
    return NextResponse.json({
      message: 'Método de pagamento excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir método de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
