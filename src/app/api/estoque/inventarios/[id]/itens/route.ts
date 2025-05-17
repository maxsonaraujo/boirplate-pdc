import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';

// GET - Obter itens de um inventário
export async function GET(
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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const inventarioId = parseInt((await params).id);
    if (isNaN(inventarioId)) {
      return NextResponse.json(
        { message: 'ID de inventário inválido' },
        { status: 400 }
      );
    }

    // Verificar se o inventário existe
    const inventario = await db.inventarioEstoque.findFirst({
      where: {
        id: inventarioId,
        tenantId
      }
    });

    if (!inventario) {
      return NextResponse.json(
        { message: 'Inventário não encontrado' },
        { status: 404 }
      );
    }

    // Obter itens do inventário
    const itens = await db.itemInventario.findMany({
      where: {
        inventarioId
      },
      include: {
        insumo: {
          include: {
            unidadeMedida: true
          }
        },
        lote: true
      },
      orderBy: {
        insumo: {
          nome: 'asc'
        }
      }
    });

    return NextResponse.json({ itens });
  } catch (error) {
    console.error('Erro ao obter itens do inventário:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// POST - Adicionar itens ao inventário
export async function POST(
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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const inventarioId = parseInt((await params).id);
    if (isNaN(inventarioId)) {
      return NextResponse.json(
        { message: 'ID de inventário inválido' },
        { status: 400 }
      );
    }

    // Verificar se o inventário existe e se está em um estado que permite adicionar itens
    const inventario = await db.inventarioEstoque.findFirst({
      where: {
        id: inventarioId,
        tenantId
      }
    });

    if (!inventario) {
      return NextResponse.json(
        { message: 'Inventário não encontrado' },
        { status: 404 }
      );
    }

    if (inventario.status === 'CONCLUIDO' || inventario.status === 'CANCELADO') {
      return NextResponse.json(
        { message: 'Não é possível adicionar itens a um inventário concluído ou cancelado' },
        { status: 400 }
      );
    }

    const data = await request.json();
    
    // Verificar se o item já existe no inventário
    if (data.insumoId) {
      const itemExistente = await db.itemInventario.findFirst({
        where: {
          inventarioId,
          insumoId: data.insumoId,
          loteId: data.loteId || null
        }
      });

      if (itemExistente) {
        return NextResponse.json(
          { message: 'Este item já foi adicionado ao inventário' },
          { status: 400 }
        );
      }
    }

    // Obter a quantidade atual no sistema
    const insumo = await db.insumo.findUnique({
      where: {
        id: data.insumoId
      }
    });

    if (!insumo) {
      return NextResponse.json(
        { message: 'Insumo não encontrado' },
        { status: 404 }
      );
    }

    const quantidadeSistema = data.loteId 
      ? (await db.loteInsumo.findUnique({ 
          where: { id: data.loteId } 
        }))?.quantidadeAtual || 0
      : insumo.estoqueAtual;

    // Criar o item de inventário
    const itemInventario = await db.itemInventario.create({
      data: {
        inventarioId,
        insumoId: data.insumoId,
        loteId: data.loteId || null,
        quantidadeSistema,
        quantidadeFisica: data.quantidadeFisica || 0,
        diferenca: (data.quantidadeFisica || 0) - quantidadeSistema,
        justificativa: data.justificativa
      },
      include: {
        insumo: {
          include: {
            unidadeMedida: true
          }
        },
        lote: true
      }
    });

    return NextResponse.json({
      message: 'Item adicionado ao inventário com sucesso',
      item: itemInventario
    });
  } catch (error) {
    console.error('Erro ao adicionar item ao inventário:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar todos os itens de um inventário (processamento em lote)
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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const inventarioId = parseInt((await params).id);
    if (isNaN(inventarioId)) {
      return NextResponse.json(
        { message: 'ID de inventário inválido' },
        { status: 400 }
      );
    }

    // Verificar se o inventário existe
    const inventario = await db.inventarioEstoque.findFirst({
      where: {
        id: inventarioId,
        tenantId
      }
    });

    if (!inventario) {
      return NextResponse.json(
        { message: 'Inventário não encontrado' },
        { status: 404 }
      );
    }

    if (inventario.status === 'CONCLUIDO' || inventario.status === 'CANCELADO') {
      return NextResponse.json(
        { message: 'Não é possível atualizar itens de um inventário concluído ou cancelado' },
        { status: 400 }
      );
    }

    const { itens } = await request.json();

    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum item para atualizar' },
        { status: 400 }
      );
    }

    // Processar cada item da lista
    const atualizacoes = itens.map(async (item) => {
      const quantidadeFisica = parseFloat(item.quantidadeFisica || 0);
      const quantidadeSistema = parseFloat(item.quantidadeSistema || 0);
      
      return db.itemInventario.update({
        where: {
          id: item.id
        },
        data: {
          quantidadeFisica,
          diferenca: quantidadeFisica - quantidadeSistema,
          justificativa: item.justificativa
        }
      });
    });

    await Promise.all(atualizacoes);

    return NextResponse.json({
      message: 'Itens do inventário atualizados com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar itens do inventário:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
