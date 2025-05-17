import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const telefone = searchParams.get('telefone');
    if (!telefone) {
      return NextResponse.json(
        { error: 'Telefone e slug são obrigatórios' },
        { status: 400 }
      );
    }

    const tenantId = await getTenantIdFromHeaders();
    
    // Remover caracteres não numéricos do telefone
    const telefoneLimpo = telefone.replace(/\D/g, '');
    
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
    
    // Buscar cliente pelo telefone
    const clientes = await db.cliente.findMany({
      where: {
        telefone: {
          contains: telefoneLimpo
        },
        tenantId: tenant.id
      },
      select: {
        id: true,
        nome: true,
        telefone: true
      }
    });
    
    const clienteIds = clientes.map(c => c.id);
    
    if (clienteIds.length === 0) {
      return NextResponse.json({ pedidos: [], clientes: [] });
    }
    
    // Data de 7 dias atrás
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 7);
    
    // Buscar pedidos destes clientes, ordenados pelo mais recente
    const pedidos = await db.pedido.findMany({
      where: {
        clienteId: { in: clienteIds },
        tenantId: tenant.id,
        dataPedido: {
          gte: dataLimite
        }
      },
      select: {
        id: true,
        numero: true,
        status: true,
        tipo: true,
        valorTotal: true,
        valorItens: true,
        taxaEntrega: true,
        dataPedido: true,
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true
          }
        },
        formaPagamento: true
      },
      orderBy: {
        dataPedido: 'desc'
      }
    });
    
    return NextResponse.json({ 
      pedidos,
      clientes
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos por telefone:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
