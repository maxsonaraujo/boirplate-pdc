import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter histórico de um pedido
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
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

    // Obter ID do pedido
    const pedidoId = parseInt(routeParams.id);
    if (isNaN(pedidoId)) {
      return NextResponse.json(
        { message: 'ID de pedido inválido' },
        { status: 400 }
      );
    }

    // Verificar se o pedido existe e pertence ao tenant
    const pedido = await db.pedido.findFirst({
      where: {
        id: pedidoId,
        tenantId
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Buscar histórico do pedido
    const historico = await db.historicoPedido.findMany({
      where: {
        pedidoId
      },
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        data: 'desc'
      }
    });

    // Buscar notificações relacionadas ao pedido
    const notificacoes = await db.notificacaoPedido.findMany({
      where: {
        pedidoId
      },
      orderBy: {
        dataEnvio: 'desc'
      }
    });

    // Combinar histórico e notificações em um único array ordenado por data
    const historicoCompleto = [
      ...historico.map(item => ({
        ...item,
        tipo: 'HISTORICO'
      })),
      ...notificacoes.map(item => ({
        id: item.id,
        data: item.dataEnvio,
        status: pedido.status,
        mensagem: item.mensagem,
        tipo: item.tipo
      }))
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return NextResponse.json({ historico: historicoCompleto });
  } catch (error) {
    console.error('Erro ao buscar histórico do pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
