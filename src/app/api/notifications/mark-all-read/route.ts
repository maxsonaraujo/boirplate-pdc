import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// POST - Marcar todas as notificações do usuário como lidas
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
      
      // Verificar se o usuário existe
      const user = await db.user.findUnique({
        where: { id: decoded.id }
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
      
      // Atualizar todas as notificações não lidas
      const result = await db.notificacao.updateMany({
        where: {
          tenantId,
          usuarioId: decoded.id,
          lida: false
        },
        data: {
          lida: true,
          dataLeitura: new Date()
        }
      });
      
      return NextResponse.json({
        message: `${result.count} notificações marcadas como lidas`,
        count: result.count
      });
      
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';