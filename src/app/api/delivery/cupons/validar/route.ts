import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { TipoDesconto } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { codigo, tenantId, valorCompra } = data;

    if (!codigo || !tenantId) {
      return NextResponse.json(
        { error: 'Código de cupom e tenant são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o cupom no banco de dados
    const cupom = await db.cupom.findFirst({
      where: {
        codigo: codigo.toUpperCase(),
        tenantId,
        ativo: true
      }
    });

    // Verificar se o cupom existe
    if (!cupom) {
      return NextResponse.json(
        { error: 'Cupom inválido ou não encontrado' },
        { status: 404 }
      );
    }

    // Verificar validade do cupom
    if (cupom.validoAte && new Date() > cupom.validoAte) {
      return NextResponse.json(
        { error: 'Este cupom já expirou' },
        { status: 400 }
      );
    }

    // Verificar limite de uso
    if (cupom.usoMaximo !== null && cupom.usoAtual >= cupom.usoMaximo) {
      return NextResponse.json(
        { error: 'Este cupom já atingiu o limite máximo de uso' },
        { status: 400 }
      );
    }

    // Verificar valor mínimo de compra
    if (valorCompra && cupom.valorMinimo > 0 && valorCompra < cupom.valorMinimo) {
      return NextResponse.json(
        { 
          error: `Este cupom requer um valor mínimo de compra de R$ ${cupom.valorMinimo.toFixed(2)}` 
        },
        { status: 400 }
      );
    }

    // Calcular valor do desconto
    let valorDesconto = 0;
    if (cupom.tipoDesconto === TipoDesconto.PERCENTUAL) {
      valorDesconto = (valorCompra * cupom.valorDesconto) / 100;
    } else {
      valorDesconto = Math.min(valorCompra, cupom.valorDesconto);
    }

    // Retornar os dados do cupom validado
    return NextResponse.json({
      message: 'Cupom válido',
      cupom: {
        id: cupom.id,
        codigo: cupom.codigo,
        descricao: cupom.descricao,
        tipoDesconto: cupom.tipoDesconto,
        valorDesconto: cupom.valorDesconto,
        valorDescontoCalculado: valorDesconto
      }
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';