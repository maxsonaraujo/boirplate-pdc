import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const fornecedorId = searchParams.get('fornecedorId') ? 
      parseInt(searchParams.get('fornecedorId') as string) : null;
    const status = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'dataCompra';
    const order = searchParams.get('order') || 'desc';
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';

    // Construir o where clause para filtros
    let whereClause: any = { tenantId };

    if (search) {
      whereClause.OR = [
        { codigo: { contains: search } },
        { numeroNota: { contains: search } },
        { observacoes: { contains: search } },
        { fornecedor: { razaoSocial: { contains: search } } },
        { fornecedor: { nomeFantasia: { contains: search } } }
      ];
    }

    if (fornecedorId) {
      whereClause.fornecedorId = fornecedorId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Filtro de data
    if (dataInicio || dataFim) {
      whereClause.dataCompra = {};
      
      if (dataInicio) {
        whereClause.dataCompra.gte = new Date(dataInicio);
      }
      
      if (dataFim) {
        // Adicionar um dia para incluir todo o dia final
        const fimDate = new Date(dataFim);
        fimDate.setDate(fimDate.getDate() + 1);
        whereClause.dataCompra.lt = fimDate;
      }
    }

    // Consulta para contagem total
    const totalCount = await db.compra.count({ where: whereClause });

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Ordenação
    const orderByClause: any = {};
    orderByClause[sort] = order.toLowerCase();

    // Consulta principal com paginação
    const compras = await db.compra.findMany({
      where: whereClause,
      include: {
        fornecedor: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true
          }
        },
        _count: {
          select: {
            itens: true
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit
    });

    // Calcular valor total
    let valorTotal = 0;
    if (compras.length > 0) {
      // Se temos paginação e podemos ter resultados parciais, fazemos uma consulta completa para sum
      const resultado = await db.compra.aggregate({
        where: whereClause,
        _sum: {
          valorTotal: true
        }
      });
      
      valorTotal = (resultado._sum.valorTotal || 0) as number;
    }

    return NextResponse.json({
      compras,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      valorTotal
    });
  } catch (error) {
    console.error('Erro ao listar compras:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const data = await request.json();

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

    // Gerar código único para a compra
    const codigoPrefixo = 'C';
    const timestamp = new Date().getTime().toString().slice(-6);
    const codigo = `${codigoPrefixo}${timestamp}`;

    // Calcular valor total da compra
    const valorTotal = data.itens.reduce(
      (total: number, item: any) => total + (parseFloat(item.quantidade) * parseFloat(item.valorUnitario)),
      0
    );

    // Iniciar transação
    const resultado = await db.$transaction(async (tx) => {
      // 1. Criar a compra
      const compra = await tx.compra.create({
        data: await addTenantId({
          codigo,
          fornecedorId: parseInt(data.fornecedorId),
          dataCompra: new Date(data.dataCompra),
          dataPrevisaoEntrega: data.dataPrevisaoEntrega ? new Date(data.dataPrevisaoEntrega) : undefined,
          dataEntrega: data.dataEntrega ? new Date(data.dataEntrega) : undefined,
          numeroNota: data.numeroNota,
          valorTotal: valorTotal, // O Prisma fará a conversão para Decimal automaticamente
          status: data.status || 'PENDENTE',
          observacoes: data.observacoes,
          responsavelId: authCheck.user?.id,
        }, tenantId)
      });

      // 2. Criar os itens da compra
      const itensCompra = [];
      for (const item of data.itens) {
        const quantidade = parseFloat(item.quantidade);
        const valorUnitario = parseFloat(item.valorUnitario);
        const subtotal = quantidade * valorUnitario;
        
        const novoItem = await tx.itemCompra.create({
          data: {
            compraId: compra.id,
            insumoId: parseInt(item.insumoId),
            quantidade: quantidade,
            precoUnitario: valorUnitario, // O Prisma converte para Decimal
            precoTotal: subtotal, // O Prisma converte para Decimal
            quantidadeRecebida: 0,
            quantidadePendente: quantidade,
            observacoes: item.observacoes
            // Removido o campo tenantId que não existe no modelo ItemCompra
          }
        });
        itensCompra.push(novoItem);
      }

      // 3. Se a compra já estiver finalizada, atualizar o estoque e o preço de custo dos insumos
      if (data.status === 'FINALIZADA') {
        for (let i = 0; i < data.itens.length; i++) {
          const item = data.itens[i];
          const itemCriado = itensCompra[i];
          
          if (!itemCriado) {
            console.error(`Item criado não encontrado para o índice ${i}`);
            continue;
          }
          
          // Buscar insumo atual
          const insumo = await tx.insumo.findUnique({
            where: { id: parseInt(item.insumoId) }
          });

          if (!insumo) {
            throw new Error(`Insumo com ID ${item.insumoId} não encontrado`);
          }

          // Calcular a quantidade a ser adicionada
          const quantidadeIncremento = parseFloat(item.quantidade);
          
          // Atualizar preço de custo (média ponderada)
          const estoqueAnterior = insumo.estoqueAtual;
          const novoEstoque = estoqueAnterior + quantidadeIncremento;
          
          // Convertendo Decimal para number para cálculos
          const precoCustoAtual = typeof insumo.precoCusto === 'object' ? 
            parseFloat(insumo.precoCusto.toString()) : 
            insumo.precoCusto;
          
          // Só atualiza o preço se tiver estoque anterior ou quantidade recebida > 0
          let novoPrecoCusto = precoCustoAtual;
          
          if (novoEstoque > 0) {
            // Cálculo do preço médio ponderado
            novoPrecoCusto = (
              (estoqueAnterior * precoCustoAtual) + 
              (quantidadeIncremento * parseFloat(item.valorUnitario))
            ) / novoEstoque;
            
            // Garantir precisão de 2 casas decimais sem arredondamentos inesperados
            novoPrecoCusto = Math.round(novoPrecoCusto * 100) / 100;
          }

          // Atualizar insumo - o Prisma fará conversão de number para Decimal
          await tx.insumo.update({
            where: { id: parseInt(item.insumoId) },
            data: {
              estoqueAtual: novoEstoque,
              precoCusto: novoPrecoCusto
            }
          });

          // Registrar movimentação de estoque
          await tx.movimentacaoInsumo.create({
            data: await addTenantId({
              insumoId: parseInt(item.insumoId),
              quantidade: quantidadeIncremento,
              tipoMovimentacao: 'ENTRADA',
              documentoId: compra.id.toString(),
              documentoTipo: 'COMPRA',
              observacao: `Entrada por compra ${compra.codigo}`,
              responsavelId: authCheck.user?.id
            }, tenantId)
          });

          // Atualizar status do item
          await tx.itemCompra.update({
            where: {
              compraId_insumoId: {
                compraId: compra.id,
                insumoId: parseInt(item.insumoId)
              }
            },
            data: {
              quantidadeRecebida: quantidadeIncremento,
              quantidadePendente: 0
            }
          });
        }
      }

      return compra;
    });

    return NextResponse.json({
      message: 'Compra registrada com sucesso',
      compra: resultado
    });
  } catch (error) {
    console.error('Erro ao registrar compra:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
