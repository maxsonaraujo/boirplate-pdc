import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter métodos de pagamento
export async function GET(request: NextRequest) {
  try {

    let targetTenantId = await getTenantIdFromHeaders();
    if (!targetTenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Verificar se existem métodos de pagamento para o tenant
    const existingMethods = await db.metodoPagamento.count({
      where: { tenantId: targetTenantId }
    });

    // Se não existirem métodos, criar os padrões
    if (existingMethods === 0) {
      await db.metodoPagamento.createMany({
        data: [
          {
            tenantId: targetTenantId,
            code: 'credit_card',
            name: 'Cartão de Crédito/Débito',
            active: true,
            acceptsChange: false
          },
          {
            tenantId: targetTenantId,
            code: 'money',
            name: 'Dinheiro',
            active: true,
            acceptsChange: true
          },
          {
            tenantId: targetTenantId,
            code: 'pix',
            name: 'PIX',
            active: true,
            acceptsChange: false
          }
        ]
      });
    }

    // Buscar métodos de pagamento
    const paymentMethods = await db.metodoPagamento.findMany({
      where: {
        tenantId: targetTenantId,
        active: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json({ methods: paymentMethods });
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// POST - Adicionar novo método de pagamento
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
    const { code, name, active = true, acceptsChange = false } = data;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Código e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o método já existe para este tenant
    const existingMethod = await db.metodoPagamento.findFirst({
      where: {
        tenantId,
        code
      }
    });

    if (existingMethod) {
      return NextResponse.json(
        { error: 'Já existe um método de pagamento com este código' },
        { status: 400 }
      );
    }

    // Criar novo método de pagamento
    const newMethod = await db.metodoPagamento.create({
      data: {
        tenantId,
        code,
        name,
        active,
        acceptsChange
      }
    });

    return NextResponse.json({
      message: 'Método de pagamento adicionado com sucesso',
      method: newMethod
    });
  } catch (error) {
    console.error('Erro ao adicionar método de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
