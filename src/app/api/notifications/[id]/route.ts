import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// PATCH - Atualizar uma notificação específica (ex: marcar como lida)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const notificationId = Number((await params).id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { message: 'ID de notificação inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticação
    const token = (await cookies()).get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    try {
      // Decodificar o token
      const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET || 'noKey');

      // Verificar se o usuário existe
      const user = await db.user.findUnique({
        where: { id: decoded.id ?? decoded.userId }
      });

      if (!user) {
        return NextResponse.json(
          { message: 'Usuário não encontrado' },
          { status: 404 }
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

      // Verificar se a notificação existe e pertence ao usuário
      const notification = await db.notificacao.findFirst({
        where: {
          id: notificationId,
          tenantId,
          usuarioId: decoded.id
        }
      });

      if (!notification) {
        return NextResponse.json(
          { message: 'Notificação não encontrada' },
          { status: 404 }
        );
      }

      // Obter dados da solicitação
      const { lida } = await request.json();

      // Atualizar notificação
      const updatedNotification = await db.notificacao.update({
        where: { id: notificationId },
        data: {
          lida,
          dataLeitura: lida ? new Date() : null
        }
      });

      return NextResponse.json({
        message: lida ? 'Notificação marcada como lida' : 'Notificação marcada como não lida',
        notification: updatedNotification
      });

    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// DELETE - Excluir uma notificação
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const notificationId = Number((await params).id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { message: 'ID de notificação inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticação
    const token = (await cookies()).get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    try {
      // Decodificar o token
      const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET || 'noKey');

      // Verificar se o usuário existe
      const user = await db.user.findUnique({
        where: { id: decoded.id ?? decoded.userId }
      });

      if (!user) {
        return NextResponse.json(
          { message: 'Usuário não encontrado' },
          { status: 404 }
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

      // Verificar se a notificação existe e pertence ao usuário ou usuário é admin
      const notification = await db.notificacao.findFirst({
        where: {
          id: notificationId,
          tenantId,
          ...(decoded.role !== 'ADMIN' && { usuarioId: decoded.id })
        }
      });

      if (!notification) {
        return NextResponse.json(
          { message: 'Notificação não encontrada ou você não tem permissão para excluí-la' },
          { status: 404 }
        );
      }

      // Excluir notificação
      await db.notificacao.delete({
        where: { id: notificationId }
      });

      return NextResponse.json({
        message: 'Notificação excluída com sucesso'
      });

    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';