import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter horários de funcionamento do tenant
export async function GET(request: NextRequest) {
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

    // Buscar horários de funcionamento
    const horarios = await db.horarioFuncionamento.findMany({
      where: {
        tenantId
      },
      orderBy: {
        diaSemana: 'asc'
      }
    });

    // Se não encontrou registros, cria os padrões para todos os dias da semana
    if (horarios.length === 0) {
      const diasSemana = [0, 1, 2, 3, 4, 5, 6]; // 0: Domingo, 1: Segunda, ..., 6: Sábado
      const horariosDefault = [];

      // Cria horários padrões
      for (const dia of diasSemana) {
        const novoHorario = await db.horarioFuncionamento.create({
          data: {
            tenantId,
            diaSemana: dia,
            aberto: dia !== 0, // Fechado aos domingos por padrão
            horaAbertura: '08:00',
            horaFechamento: '18:00'
          }
        });
        horariosDefault.push(novoHorario);
      }

      return NextResponse.json({ horarios: horariosDefault });
    }

    return NextResponse.json({ horarios });
  } catch (error) {
    console.error('Erro ao buscar horários de funcionamento:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT - Atualizar horários de funcionamento
export async function PUT(request: NextRequest) {
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

    // Apenas administradores podem alterar horários
    if (authCheck.tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores podem alterar horários.' },
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

    // Obter dados do corpo da requisição
    const { horarios } = await request.json();

    if (!Array.isArray(horarios)) {
      return NextResponse.json(
        { error: 'Formato inválido. Esperado um array de horários.' },
        { status: 400 }
      );
    }

    // Atualizar cada horário individualmente
    const horariosAtualizados = [];

    for (const horario of horarios) {
      // Validações básicas
      if (!Number.isInteger(horario.diaSemana) || horario.diaSemana < 0 || horario.diaSemana > 6) {
        return NextResponse.json(
          { error: `Dia da semana inválido: ${horario.diaSemana}` },
          { status: 400 }
        );
      }

      // Validação de formato de hora (HH:MM)
      if (horario.aberto) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(horario.horaAbertura) || !timeRegex.test(horario.horaFechamento)) {
          return NextResponse.json(
            { error: `Formato de hora inválido. Use HH:MM (ex: 08:30)` },
            { status: 400 }
          );
        }
      }

      // Atualizar ou criar o registro
      const horarioAtualizado = await db.horarioFuncionamento.upsert({
        where: {
          id: horario.id || -1
        },
        update: {
          aberto: horario.aberto,
          horaAbertura: horario.horaAbertura,
          horaFechamento: horario.horaFechamento,
          intervaloInicio: horario.intervaloInicio,
          intervaloFim: horario.intervaloFim
        },
        create: {
          tenantId,
          diaSemana: horario.diaSemana,
          aberto: horario.aberto,
          horaAbertura: horario.horaAbertura,
          horaFechamento: horario.horaFechamento,
          intervaloInicio: horario.intervaloInicio,
          intervaloFim: horario.intervaloFim
        }
      });

      horariosAtualizados.push(horarioAtualizado);
    }

    return NextResponse.json({
      message: 'Horários de funcionamento atualizados com sucesso',
      horarios: horariosAtualizados
    });
  } catch (error) {
    console.error('Erro ao atualizar horários de funcionamento:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
