import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';

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

    const id = parseInt((await params).id);

    // Buscar compra
    const compra = await db.compra.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        fornecedor: true,
        responsavel: {
          select: {
            id: true,
            name: true
          }
        },
        itens: {
          include: {
            insumo: {
              include: {
                unidadeMedida: true
              }
            }
          }
        }
      }
    });

    if (!compra) {
      return NextResponse.json(
        { error: 'Compra não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ compra });
  } catch (error) {
    console.error('Erro ao buscar detalhes da compra:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

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

    const id = parseInt((await params).id);
    const data = await request.json();

    // Buscar compra existente
    const compraExistente = await db.compra.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        itens: true
      }
    });

    if (!compraExistente) {
      return NextResponse.json(
        { message: 'Compra não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a compra já está finalizada ou cancelada
    if (compraExistente.status === 'FINALIZADA' || compraExistente.status === 'CANCELADA') {
      return NextResponse.json(
        { message: 'Não é possível editar uma compra finalizada ou cancelada' },
        { status: 400 }
      );
    }

    // Validações básicas
    if (!data.fornecedorId) {
      return NextResponse.json(
        { message: 'Fornecedor é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!data.dataCompra) {
      return NextResponse.json(
        { message: 'Data da compra é obrigatória' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(data.itens) || data.itens.length === 0) {
      return NextResponse.json(
        { message: 'É necessário incluir pelo menos um item na compra' },
        { status: 400 }
      );
    }

    // Calcular valor total da compra
    const valorTotal = data.itens.reduce(
      (total: number, item: any) => total + (parseFloat(item.quantidade) * parseFloat(item.valorUnitario)),
      0
    );

    // Iniciar transação
    const resultado = await db.$transaction(async (tx) => {
      // 1. Atualizar a compra
      const compra = await tx.compra.update({
        where: { id },
        data: {
          fornecedorId: parseInt(data.fornecedorId),
          dataCompra: new Date(data.dataCompra),
          dataPrevisaoEntrega: data.dataPrevisaoEntrega ? new Date(data.dataPrevisaoEntrega) : undefined,
          notaFiscal: data.numeroNota,
          valorTotal,
          observacoes: data.observacoes
        }
      });

      // 2. Remover itens que não estão mais na lista
      const novosInsumoIds = data.itens
        .filter((item: any) => item.insumoId)
        .map((item: any) => parseInt(item.insumoId));
      
      const itensParaRemover = compraExistente.itens.filter(item => 
        !novosInsumoIds.includes(item.insumoId)
      );
      
      for (const item of itensParaRemover) {
        await tx.itemCompra.delete({
          where: {
            compraId_insumoId: {
              compraId: id,
              insumoId: item.insumoId
            }
          }
        });
      }

      // 3. Atualizar ou criar itens
      for (const item of data.itens) {
        const insumoId = parseInt(item.insumoId);
        const quantidade = parseFloat(item.quantidade);
        const valorUnitario = parseFloat(item.valorUnitario);
        const precoTotal = quantidade * valorUnitario;
        
        // Verificar se o item já existe na compra
        const itemExistente = compraExistente.itens.find(i => i.insumoId === insumoId);
        
        if (itemExistente) {
          // Atualizar item existente
          await tx.itemCompra.update({
            where: {
              compraId_insumoId: {
                compraId: id,
                insumoId: insumoId
              }
            },
            data: {
              quantidade: quantidade,
              precoUnitario: valorUnitario,
              precoTotal: precoTotal,
              quantidadePendente: quantidade - (itemExistente.quantidadeRecebida || 0)
            }
          });
        } else {
          // Criar novo item
          await tx.itemCompra.create({
            data: {
              compraId: id,
              insumoId: insumoId,
              quantidade: quantidade,
              precoUnitario: valorUnitario,
              precoTotal: precoTotal,
              quantidadeRecebida: 0,
              quantidadePendente: quantidade,
              observacoes: item.observacoes
            }
          });
        }
      }

      return compra;
    });

    return NextResponse.json({
      message: 'Compra atualizada com sucesso',
      compra: resultado
    });
  } catch (error) {
    console.error('Erro ao atualizar compra:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const id = parseInt((await params).id);

    // Buscar compra
    const compra = await db.compra.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!compra) {
      return NextResponse.json(
        { message: 'Compra não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a compra já está finalizada
    if (compra.status === 'FINALIZADA') {
      return NextResponse.json(
        { message: 'Não é possível excluir uma compra finalizada' },
        { status: 400 }
      );
    }

    // Iniciar transação para excluir compra e itens
    await db.$transaction(async (tx) => {
      // Remover itens primeiro (devido à restrição de chave estrangeira)
      await tx.itemCompra.deleteMany({
        where: { compraId: id }
      });

      // Remover a compra
      await tx.compra.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      message: 'Compra excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir compra:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
