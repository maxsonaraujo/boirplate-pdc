import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// POST - Enviar notificação para um pedido
export async function POST(
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

    // Obter dados do corpo da requisição
    const requestData = await request.json();
    const { message, tipo = 'INFO' } = requestData;

    if (!message) {
      return NextResponse.json(
        { message: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    // Validar tipo da notificação
    const tiposValidos = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { message: 'Tipo de notificação inválido' },
        { status: 400 }
      );
    }

    // Criar notificação
    const notificacao = await db.notificacaoPedido.create({
      data: {
        pedidoId,
        mensagem: message,
        tipo,
        lida: false,
        dataEnvio: new Date()
      }
    });

    // Registrar no histórico do pedido
    await db.historicoPedido.create({
      data: {
        pedidoId,
        statusAnterior: pedido.status,
        statusNovo: pedido.status,
        observacao: `Notificação enviada: ${message}`,
        data: new Date(),
        usuarioId: authCheck.user?.id || null
      }
    });

    // Aqui poderia adicionar lógica para enviar notificação por Push, SMS, etc.

    return NextResponse.json({
      message: 'Notificação enviada com sucesso',
      notificacao: {
        id: notificacao.id,
        mensagem: notificacao.mensagem,
        tipo: notificacao.tipo,
        dataEnvio: notificacao.dataEnvio
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

// GET - Obter notificações de um pedido
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params;
    // Obter ID do pedido
    const pedidoId = parseInt(routeParams.id);
    if (isNaN(pedidoId)) {
      return NextResponse.json(
        { message: 'ID de pedido inválido' },
        { status: 400 }
      );
    }

    // Buscar notificações do pedido
    const notificacoes = await db.notificacaoPedido.findMany({
      where: {
        pedidoId
      },
      orderBy: {
        dataEnvio: 'desc'
      }
    });

    return NextResponse.json({ notificacoes });
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

export const dynamic = 'force-dynamic';
