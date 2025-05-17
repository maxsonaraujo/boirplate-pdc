import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';


// GET - Obter detalhes de um pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderId = parseInt((await params).id);


    const tenantId = await getTenantIdFromHeaders();
    // Buscar tenant pelo slug
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Buscar detalhes do pedido
    const order = await db.pedido.findFirst({
      where: {
        id: orderId,
        tenantId: tenant.id
      },
      include: {
        cliente: true,
        enderecoEntrega: true,
        itens: { include: { produto: { select: { nome: true } } } },
        historico: {
          orderBy: {
            data: 'desc'
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Erro ao buscar detalhes do pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
