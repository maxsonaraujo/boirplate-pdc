import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';
import { getUsuarioFromJwt } from '@/utils/jwt';

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

    // Obter o ID do tenant
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Parâmetros de consulta
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Buscar inventários
    const inventarios = await db.inventarioEstoque.findMany({
      where: { tenantId },
      orderBy: { dataFim: 'desc' },
      take: limit,
      include: {
        responsavel: {
          select: { id: true, name: true }
        },
        itens: {
          include: {
            insumo: {
              select: { 
                id: true, 
                nome: true,
                unidadeMedida: {
                  select: { simbolo: true }
                }
              }
            }
          }
        }
      }
    });

    // Formatar dados para retorno
    const inventariosFormatados = inventarios.map(inventario => ({
      id: inventario.id,
      data: inventario.dataFim,
      observacoes: inventario.observacoes,
      responsavel: inventario.responsavel,
      itens: inventario.itens.map(item => ({
        id: item.id,
        insumoId: item.insumoId,
        insumoNome: item.insumo?.nome || 'Insumo não encontrado',
        estoqueAnterior: item.quantidadeSistema,
        estoqueNovo: item.quantidadeFisica,
        diferenca: item.quantidadeFisica - item.quantidadeSistema,
        unidadeMedida: item.insumo?.unidadeMedida?.simbolo
      }))
    }));

    return NextResponse.json({ inventarios: inventariosFormatados });
  } catch (error) {
    console.error('Erro ao buscar inventários:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar inventários' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const usuario = await getUsuarioFromJwt(token);
    if (!usuario) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
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

    // Obter dados do inventário
    const data = await request.json();
    const { itens, observacoes } = data;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { message: 'É necessário informar pelo menos um item para ajuste' },
        { status: 400 }
      );
    }

    // Processar o inventário em uma transação
    const resultado = await db.$transaction(async (tx) => {
      // Criar o registro de inventário
      const inventario = await tx.inventarioEstoque.create({
        data: await addTenantId({
          data: new Date(),
          observacoes: observacoes || '',
          responsavelId: usuario.id
        }, tenantId)
      });

      // Processar cada item do inventário
      const itensProcessados = [];
      for (const item of itens) {
        // Verificar se o insumo existe
        const insumo = await tx.insumo.findFirst({
          where: { 
            id: item.insumoId,
            tenantId
          }
        });

        if (!insumo) {
          throw new Error(`Insumo com ID ${item.insumoId} não encontrado`);
        }

        // Calcular a diferença
        const diferenca = item.novoEstoque - insumo.estoqueAtual;

        // Registrar o item do inventário
        const itemInventario = await tx.itemInventario.create({
          data: await addTenantId({
            inventarioId: inventario.id,
            insumoId: insumo.id,
            estoqueAnterior: insumo.estoqueAtual,
            estoqueNovo: item.novoEstoque,
            observacao: item.observacao || ''
          }, tenantId)
        });
        
        itensProcessados.push(itemInventario);

        // Atualizar o estoque do insumo
        await tx.insumo.update({
          where: { id: insumo.id },
          data: { estoqueAtual: item.novoEstoque }
        });

        // Registrar a movimentação
        await tx.movimentacaoInsumo.create({
          data: await addTenantId({
            insumoId: insumo.id,
            quantidade: Math.abs(diferenca),
            tipoMovimentacao: diferenca >= 0 ? 'ENTRADA' : 'SAIDA',
            documentoId: inventario.id,
            documentoTipo: 'INVENTARIO',
            observacao: `Ajuste de inventário: ${item.observacao || 'Inventário físico'}`,
            responsavelId: usuario.id
          }, tenantId)
        });
      }

      return {
        inventario,
        itens: itensProcessados
      };
    });

    return NextResponse.json({
      message: 'Inventário processado com sucesso',
      inventario: resultado.inventario,
      itens: resultado.itens
    });
  } catch (error: any) {
    console.error('Erro ao processar inventário:', error);
    return NextResponse.json(
      { message: error.message || 'Erro ao processar inventário' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
