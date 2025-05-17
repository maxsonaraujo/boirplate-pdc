import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Buscar notificações do usuário logado
export async function GET(request: NextRequest) {
  try {
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

      // Buscar parâmetros da consulta
      const { searchParams } = request.nextUrl;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const onlyUnread = searchParams.get('onlyUnread') === 'true';

      // Calcular skip para paginação
      const skip = (page - 1) * limit;

      // Construir condição de filtro
      const whereCondition: any = {
        tenantId,
        usuarioId: decoded.id,
      };

      // Filtrar apenas não lidas se necessário
      if (onlyUnread) {
        whereCondition.lida = false;
      }

      // Buscar notificações
      const [notifications, totalCount] = await Promise.all([
        db.notificacao.findMany({
          where: whereCondition,
          orderBy: {
            dataEnvio: 'desc'
          },
          skip,
          take: limit
        }),
        db.notificacao.count({
          where: whereCondition
        })
      ]);

      // Contar notificações não lidas
      const unreadCount = await db.notificacao.count({
        where: {
          tenantId,
          usuarioId: decoded.id,
          lida: false
        }
      });

      return NextResponse.json({
        notifications,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        },
        unreadCount
      });

    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// POST - Criar uma nova notificação (apenas para admins e gerentes)
export async function POST(request: NextRequest) {
  try {
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

      // Verificar se o usuário tem permissão (ADMIN ou MANAGER)
      if (decoded.role !== 'ADMIN' && decoded.role !== 'MANAGER') {
        return NextResponse.json(
          { message: 'Permissão negada' },
          { status: 403 }
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

      // Obter dados da solicitação
      const {
        titulo,
        mensagem,
        tipo = 'INFO',
        icone,
        url,
        referencia,
        usuarioId
      } = await request.json();

      // Validar dados obrigatórios
      if (!titulo || !mensagem) {
        return NextResponse.json(
          { message: 'Título e mensagem são obrigatórios' },
          { status: 400 }
        );
      }

      // Validar tipo
      const tiposValidos = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];
      if (!tiposValidos.includes(tipo)) {
        return NextResponse.json(
          { message: 'Tipo de notificação inválido' },
          { status: 400 }
        );
      }

      // Se usuarioId for fornecido, verificar se o usuário existe
      if (usuarioId) {
        const userExists = await db.user.findFirst({
          where: {
            id: usuarioId,
            tenantId
          }
        });

        if (!userExists) {
          return NextResponse.json(
            { message: 'Usuário não encontrado' },
            { status: 404 }
          );
        }
      }

      // Criar a notificação
      const notification = await db.notificacao.create({
        data: {
          tenantId,
          usuarioId,
          titulo,
          mensagem,
          tipo,
          icone,
          url,
          referencia,
          lida: false,
          dataEnvio: new Date()
        }
      });

      return NextResponse.json({
        message: 'Notificação criada com sucesso',
        notification
      });

    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';