import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';
import { cookies } from 'next/headers';

// GET - Buscar um cupom específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de cupom inválido' },
        { status: 400 }
      );
    }

    // Buscar o cupom pelo ID
    const cupom = await db.cupom.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!cupom) {
      return NextResponse.json(
        { error: 'Cupom não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ cupom });
  } catch (error) {
    console.error('Erro ao buscar cupom:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT - Atualizar um cupom existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de cupom inválido' },
        { status: 400 }
      );
    }

    // Verificar se o cupom existe
    const cupomExistente = await db.cupom.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!cupomExistente) {
      return NextResponse.json(
        { error: 'Cupom não encontrado' },
        { status: 404 }
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

    // Verificar se já existe outro cupom com o mesmo código (exceto o próprio cupom sendo editado)
    if (data.codigo !== cupomExistente.codigo) {
      const codigoExistente = await db.cupom.findFirst({
        where: {
          codigo: data.codigo.toUpperCase(),
          tenantId,
          id: { not: id }
        }
      });

      if (codigoExistente) {
        return NextResponse.json(
          { error: 'Já existe outro cupom com este código' },
          { status: 409 }
        );
      }
    }

    // Atualizar o cupom no banco de dados
    const cupomAtualizado = await db.cupom.update({
      where: {
        id
      },
      data: {
        codigo: data.codigo.toUpperCase(),
        descricao: data.descricao,
        valorDesconto: parseFloat(data.valorDesconto),
        tipoDesconto: data.tipoDesconto,
        valorMinimo: data.valorMinimo !== undefined ? parseFloat(data.valorMinimo) : 0,
        validoAte: data.validoAte ? new Date(data.validoAte) : null,
        usoMaximo: data.usoMaximo !== null ? parseInt(data.usoMaximo) : null,
        ativo: data.ativo
      }
    });

    return NextResponse.json({ cupom: cupomAtualizado });
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// DELETE - Excluir um cupom
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de cupom inválido' },
        { status: 400 }
      );
    }

    // Verificar se o cupom existe e pertence ao tenant atual
    const cupomExistente = await db.cupom.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!cupomExistente) {
      return NextResponse.json(
        { error: 'Cupom não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o cupom já foi usado em pedidos
    const cupomUsado = await db.pedidoCupom.findFirst({
      where: {
        cupomId: id
      }
    });

    if (cupomUsado) {
      // Em vez de excluir, apenas desativar para manter histórico
      await db.cupom.update({
        where: { id },
        data: { ativo: false }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Cupom desativado pois já foi utilizado em pedidos.' 
      });
    }

    // Excluir o cupom
    await db.cupom.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Cupom excluído com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao excluir cupom:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';