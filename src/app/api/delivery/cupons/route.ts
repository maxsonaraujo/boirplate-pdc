import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';
import { cookies } from 'next/headers';

// GET - Listar todos os cupons
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Buscar todos os cupons do tenant
    const cupons = await db.cupom.findMany({
      where: {
        tenantId
      },
      orderBy: {
        dataCriacao: 'desc'
      }
    });

    return NextResponse.json({ cupons });
  } catch (error) {
    console.error('Erro ao buscar cupons:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// POST - Criar um novo cupom
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter dados do corpo da requisição
    const data = await request.json();

    // Validar campos obrigatórios
    if (!data.codigo || !data.valorDesconto || !data.tipoDesconto) {
      return NextResponse.json(
        { error: 'Dados incompletos. Código, valor e tipo de desconto são obrigatórios.' },
        { status: 400 }
      );
    }

    // Verificar se já existe um cupom com o mesmo código para este tenant
    const cupomExistente = await db.cupom.findFirst({
      where: {
        codigo: data.codigo.toUpperCase(),
        tenantId
      }
    });

    if (cupomExistente) {
      return NextResponse.json(
        { error: 'Já existe um cupom com este código' },
        { status: 409 }
      );
    }

    // Criar o cupom no banco de dados
    const novoCupom = await db.cupom.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        descricao: data.descricao,
        valorDesconto: parseFloat(data.valorDesconto),
        tipoDesconto: data.tipoDesconto,
        valorMinimo: data.valorMinimo ? parseFloat(data.valorMinimo) : 0,
        validoAte: data.validoAte ? new Date(data.validoAte) : null,
        usoMaximo: data.usoMaximo ? parseInt(data.usoMaximo) : null,
        usoAtual: 0,
        ativo: data.ativo === undefined ? true : data.ativo,
        tenantId
      }
    });

    return NextResponse.json({ cupom: novoCupom }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';