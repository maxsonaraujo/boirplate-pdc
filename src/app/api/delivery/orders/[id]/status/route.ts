import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';
import { PedidoStatus } from '@prisma/client';

// PUT - Atualizar o status de um pedido
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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter ID do pedido
    const orderId = parseInt((await params).id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID de pedido inválido' },
        { status: 400 }
      );
    }

    // Buscar o pedido atual
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

    // Obter o novo status do corpo da solicitação
    const { status } = await request.json();

    // Validar o status
    const statusValidos = ['pending', 'confirmed', 'preparing', 'delivery', 'delivered', 'cancelled'];
    if (!statusValidos.includes(status)) {
      return NextResponse.json(
        { message: 'Status inválido' },
        { status: 400 }
      );
    }

    // Atualizar o status do pedido
    const pedidoAtualizado = await db.pedido.update({
      where: { id: orderId },
      data: {
        status,
        dataAtualizacao: new Date()
      }
    });

    // Registrar a mudança de status no histórico
    await db.historicoPedido.create({
      data: {
        pedidoId: orderId,
        statusAnterior: pedido.status,
        statusNovo: status,
        observacao: `Status alterado de ${pedido.status} para ${status}`,
        data: new Date(),
        usuarioId: authCheck.tokenData?.id || null
      }
    });

    return NextResponse.json({
      message: 'Status do pedido atualizado com sucesso',
      pedido: {
        id: pedidoAtualizado.id,
        numero: pedidoAtualizado.numero,
        status: pedidoAtualizado.status
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PATCH - Atualizar o status de um pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação para atualização de status
    const token = (await cookies()).get('token');
    const authCheck = await checkAuthAndPermissions(token);
    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      );
    }

    const orderId = parseInt((await params).id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'ID do pedido inválido' },
        { status: 400 }
      );
    }

    // Obter dados da requisição
    const data = await request.json();
    const { status, observacao } = data;

    // Validar o status
    if (!Object.values(PedidoStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Buscar o pedido atual
    const pedido = await db.pedido.findUnique({
      where: { id: orderId }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar pedido
    const updatedOrder = await db.$transaction(async (tx) => {
      // Registrar histórico da alteração
      await tx.historicoPedido.create({
        data: {
          pedidoId: orderId,
          statusAnterior: pedido.status,
          statusNovo: status,
          observacao: observacao || `Status atualizado para ${status}`,
          data: new Date(),
          usuarioId: authCheck.tokenData?.id
        }
      });

      // Atualizar status do pedido
      const updated = await tx.pedido.update({
        where: { id: orderId },
        data: {
          status,
          dataAtualizacao: new Date()
        },
        include: {
          cliente: true,
          historico: {
            orderBy: {
              data: 'desc'
            },
            take: 5
          }
        }
      });

      return updated;
    });

    return NextResponse.json({
      message: 'Status do pedido atualizado com sucesso',
      pedido: updatedOrder
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
