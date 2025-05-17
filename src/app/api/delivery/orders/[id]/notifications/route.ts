import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter notificações relacionadas a um pedido
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const routeParams = await params;
  try {
    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter ID do pedido
    const orderId = parseInt(routeParams.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID de pedido inválido' },
        { status: 400 }
      );
    }

    // Verificar se o pedido existe
    const pedido = await db.pedido.findFirst({
      where: {
        id: orderId,
        tenantId
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Buscar o histórico do pedido
    const historico = await db.historicoPedido.findMany({
      where: {
        pedidoId: orderId
      },
      orderBy: {
        data: 'desc'
      },
      include: {
        usuario: {
          select: {
            name: true
          }
        }
      }
    });

    // Transformar em notificações formatadas
    const notificacoes = historico.map(item => ({
      id: item.id,
      message: getNotificationMessage(item.statusNovo),
      timestamp: item.data,
      status: item.statusNovo,
      userName: item.usuario?.name || null
    }));

    return NextResponse.json({ notifications: notificacoes });
  } catch (error) {
    console.error('Erro ao buscar notificações do pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// POST - Enviar uma nova notificação para o cliente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const routeParams = await params;
    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter ID do pedido
    const orderId = parseInt(routeParams.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID de pedido inválido' },
        { status: 400 }
      );
    }

    // Buscar o pedido
    const pedido = await db.pedido.findFirst({
      where: {
        id: orderId,
        tenantId
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Obter dados do corpo da solicitação
    const { message, tipo } = await request.json();

    if (!message) {
      return NextResponse.json(
        { message: 'Mensagem da notificação é obrigatória' },
        { status: 400 }
      );
    }

    // Criar uma nova notificação personalizada
    const notificacao = await db.notificacaoPedido.create({
      data: {
        pedidoId: orderId,
        mensagem: message,
        tipo: tipo || 'INFO',
        lida: false,
        dataEnvio: new Date()
      }
    });

    // Aqui poderia ser implementado o envio por SMS ou push notification

    return NextResponse.json({
      message: 'Notificação enviada com sucesso',
      notification: {
        id: notificacao.id,
        message: notificacao.mensagem,
        timestamp: notificacao.dataEnvio
      }
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// Função auxiliar para gerar mensagens amigáveis com base no status
function getNotificationMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Seu pedido foi recebido e está aguardando confirmação.';
    case 'confirmed':
      return 'Boa notícia! Seu pedido foi confirmado pelo restaurante.';
    case 'preparing':
      return 'Seu pedido está sendo preparado na cozinha.';
    case 'delivery':
      return 'O entregador saiu para entregar seu pedido.';
    case 'delivered':
      return 'Seu pedido foi entregue. Bom apetite!';
    case 'cancelled':
      return 'Infelizmente seu pedido foi cancelado.';
    default:
      return 'Atualização no status do seu pedido.';
  }
}

export const dynamic = 'force-dynamic';
