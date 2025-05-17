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

    // Buscar o pedido atual
    const pedido = await db.pedido.findFirst({
      where: {
        id: pedidoId,
        tenantId
      },
      include: {
        cliente: true
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Obter o novo status do corpo da solicitação
    const { status, observacao } = await request.json();

    // Validar o status
    if (!PedidoStatus[status]) {
      return NextResponse.json(
        { message: 'Status inválido' },
        { status: 400 }
      );
    }

    function getMensagem(status: string) {
      let mensagem = '';
      switch (status) {
        case PedidoStatus.CONFIRMED:
          mensagem = 'Seu pedido foi confirmado e em breve será preparado.';
          break;
        case PedidoStatus.PREPARING:
          mensagem = 'Seu pedido está sendo preparado na cozinha.';
          break;
        case PedidoStatus.DELIVERING:
          mensagem = 'Seu pedido saiu para entrega e logo chegará até você.';
          break;
        case PedidoStatus.DELIVERED:
          mensagem = 'Seu pedido foi entregue. Agradecemos a preferência!';
          break;
        case PedidoStatus.CANCELLED:
          mensagem = observacao ?
            `Seu pedido foi cancelado. Motivo: ${observacao}` :
            'Seu pedido foi cancelado.';
          break;
        default:
          mensagem = 'Seu pedido teve o status alterado.';
      }
      return mensagem;
    }

    // Função para obter o tipo de notificação baseado no status
    function getTipoNotificacao(status: string) {
      switch (status) {
        case PedidoStatus.CANCELLED:
          return 'ERROR';
        case PedidoStatus.DELIVERED:
          return 'SUCCESS';
        case PedidoStatus.PREPARING:
        case PedidoStatus.CONFIRMED:
          return 'INFO';
        case PedidoStatus.DELIVERING:
          return 'WARNING'; // Alerta para prestar atenção na entrega
        default:
          return 'INFO';
      }
    }

    // Iniciar transação para atualizar status e criar registros relacionados
    await db.$transaction(async (tx) => {
      // 1. Atualizar status do pedido
      await tx.pedido.update({
        where: {
          id: pedidoId
        },
        data: {
          status: status as PedidoStatus
        }
      });

      // 2. Adicionar ao histórico
      await tx.historicoPedido.create({
        data: {
          pedidoId,
          statusAnterior: pedido.status,
          statusNovo: status,
          observacao: observacao || `Status alterado para ${status}`,
          data: new Date(),
          usuarioId: authCheck.user?.id
        }
      });

      // 3. Criar notificação para o cliente (se implementado)
      await tx.notificacaoPedido.create({
        data: {
          pedidoId,
          mensagem: getMensagem(status),
          tipo: status === PedidoStatus.CANCELLED ? 'ERROR' : 'INFO',
          lida: false,
          dataEnvio: new Date()
        }
      });

      // 4. Criar notificações para equipe interna (administradores, gerentes e atendentes)
      // Título descritivo para a notificação interna
      const titulo = `Pedido #${pedido.numero} - ${PedidoStatus[status]}`;

      // Mensagem mais detalhada para a equipe
      let mensagemInterna = `Cliente: ${pedido.cliente.nome}, Telefone: ${pedido.cliente.telefone}`;
      if (observacao) {
        mensagemInterna += `. Observação: ${observacao}`;
      }

      // Determinar para quais funções devemos enviar notificações com base no novo status
      let roles: any[] = ['ADMIN', 'MANAGER']; // Sempre notificar administradores e gerentes

      // Buscar usuários ativos que precisam ser notificados
      const usuariosParaNotificar = await tx.user.findMany({
        where: {
          tenantId,
          role: {
            in: roles
          },
          active: true
        },
        select: {
          id: true
        }
      });

      // Criar notificação para cada usuário
      for (const usuario of usuariosParaNotificar) {
        // Não notificar o próprio usuário que fez a atualização de status
        if (usuario.id !== authCheck.user?.id) {
          await tx.notificacao.create({
            data: {
              tenantId,
              usuarioId: usuario.id,
              titulo,
              mensagem: mensagemInterna,
              tipo: getTipoNotificacao(status),
              icone: 'status-update',
              url: `/desk/delivery/pedidos/${pedidoId}`,
              referencia: `pedido-status-${pedidoId}`,
              lida: false,
              dataEnvio: new Date()
            }
          });
        }
      }
    });

    return NextResponse.json({
      message: 'Status atualizado com sucesso',
      status
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
