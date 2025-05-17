import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tenantId = parseInt(searchParams.get('tenantId') || '0');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'ID do tenant é obrigatório' },
        { status: 400 }
      );
    }

    // Obter configurações de horário do tenant
    const horarios = await db.horarioFuncionamento.findMany({
      where: {
        tenantId
      },
      orderBy: {
        diaSemana: 'asc'
      }
    });

    // Verificar status atual (aberto/fechado)
    const agora = new Date();
    const diaSemana = agora.getDay(); // 0 (Domingo) até 6 (Sábado)
    
    const horarioHoje = horarios.find(h => h.diaSemana === diaSemana);
    
    let aberto = false;
    let mensagem = 'Estabelecimento fechado';
    let horaAbertura = null;
    let proximaAbertura = null;
    
    if (horarioHoje && horarioHoje.aberto) {
      // Verificar se está dentro do horário de funcionamento
      const [horaAbreH, horaAbreM] = horarioHoje.horaAbertura.split(':').map(Number);
      const [horaFechaH, horaFechaM] = horarioHoje.horaFechamento.split(':').map(Number);
      
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      
      // Converter para minutos para facilitar comparação
      const abreMinutos = horaAbreH * 60 + horaAbreM;
      const fechaMinutos = horaFechaH * 60 + horaFechaM;
      const agoraMinutos = horaAtual * 60 + minutoAtual;
      
      if (agoraMinutos >= abreMinutos && agoraMinutos < fechaMinutos) {
        // Verificar se está em intervalo (almoço/jantar)
        if (horarioHoje.intervaloInicio && horarioHoje.intervaloFim) {
          const [intervaloInicioH, intervaloInicioM] = horarioHoje.intervaloInicio.split(':').map(Number);
          const [intervaloFimH, intervaloFimM] = horarioHoje.intervaloFim.split(':').map(Number);
          
          const intervaloInicioMinutos = intervaloInicioH * 60 + intervaloInicioM;
          const intervaloFimMinutos = intervaloFimH * 60 + intervaloFimM;
          
          if (agoraMinutos >= intervaloInicioMinutos && agoraMinutos < intervaloFimMinutos) {
            aberto = false;
            mensagem = 'Estabelecimento em intervalo';
            proximaAbertura = horarioHoje.intervaloFim;
          } else {
            aberto = true;
            mensagem = 'Estabelecimento aberto';
          }
        } else {
          aberto = true;
          mensagem = 'Estabelecimento aberto';
        }
      } else {
        // Está fora do horário de funcionamento hoje
        aberto = false;
        mensagem = 'Estabelecimento fechado';
        
        if (agoraMinutos < abreMinutos) {
          // Vai abrir mais tarde hoje
          proximaAbertura = horarioHoje.horaAbertura;
        } else {
          // Procurar próximo dia aberto
          let proximoDia = (diaSemana + 1) % 7;
          let diasVerificados = 0;
          
          while (diasVerificados < 7) {
            const proximoHorario = horarios.find(h => h.diaSemana === proximoDia);
            if (proximoHorario && proximoHorario.aberto) {
              proximaAbertura = `${proximoHorario.horaAbertura} (${obterNomeDia(proximoDia)})`;
              break;
            }
            proximoDia = (proximoDia + 1) % 7;
            diasVerificados++;
          }
        }
      }
    }

    return NextResponse.json({
      aberto,
      mensagem,
      proximaAbertura,
      horarios
    });
  } catch (error) {
    console.error('Erro ao verificar status de funcionamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

function obterNomeDia(diaSemana: number): string {
  const dias = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  return dias[diaSemana];
}

export const dynamic = 'force-dynamic';
