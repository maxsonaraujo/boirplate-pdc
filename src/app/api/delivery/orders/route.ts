import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { PedidoStatus, TipoDesconto } from '@prisma/client';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// POST - Criar um novo pedido de delivery
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      tipo,
      cliente,
      entrega,
      retirada,
      pagamento,
      itens,
      valorItens,
      taxaEntrega,
      valorTotal,
      cupom // Novo campo para cupom de desconto
    } = data;

    console.log('Dados recebidos:', data);

    if (!cliente || !pagamento || !itens || itens.length === 0) {
      return NextResponse.json(
        { error: 'Dados incompletos para criação do pedido' },
        { status: 400 }
      );
    }

    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }
    // Buscar tenant pelo ID
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, nome: true }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o método de pagamento existe e está ativo
    const paymentMethodObj = await db.metodoPagamento.findFirst({
      where: {
        id: Number(pagamento.metodo),
        tenantId: tenant.id,
        active: true
      }
    });

    if (!paymentMethodObj) {
      return NextResponse.json(
        {
          error: 'Método de pagamento inválido ou indisponível',
          details: {
            metodoId: pagamento.metodo,
            tenantId: tenant.id
          }
        },
        { status: 400 }
      );
    }

    // Validar se o campo troco foi informado quando o método aceita troco
    if (paymentMethodObj.acceptsChange && pagamento.troco) {
      const trocoValor = parseFloat(pagamento.troco.toString().replace(',', '.'));
      // Validar apenas se o troco for fornecido
      if (trocoValor > 0 && trocoValor <= valorTotal) {
        return NextResponse.json(
          { error: 'O valor do troco deve ser maior que o valor total do pedido' },
          { status: 400 }
        );
      }
    }

    // Verificar se há cupom e validá-lo
    let cupomObj = null;
    let valorCupomDesconto = 0;

    if (cupom && cupom.id) {
      cupomObj = await db.cupom.findFirst({
        where: {
          id: cupom.id,
          tenantId: tenant.id,
          ativo: true
        }
      });

      if (!cupomObj) {
        return NextResponse.json(
          { error: 'Cupom inválido ou expirado' },
          { status: 400 }
        );
      }

      // Verificar validade do cupom
      if (cupomObj.validoAte && new Date() > cupomObj.validoAte) {
        return NextResponse.json(
          { error: 'Este cupom expirou' },
          { status: 400 }
        );
      }

      // Verificar limite de uso
      if (cupomObj.usoMaximo && cupomObj.usoAtual >= cupomObj.usoMaximo) {
        return NextResponse.json(
          { error: 'Este cupom já atingiu o limite máximo de uso' },
          { status: 400 }
        );
      }

      // Cálculo do valor de desconto
      if (cupomObj.tipoDesconto === TipoDesconto.PERCENTUAL) {
        valorCupomDesconto = (valorItens * cupomObj.valorDesconto) / 100;
      } else {
        valorCupomDesconto = Math.min(valorItens, cupomObj.valorDesconto);
      }

      // Verificar se o valor calculado é consistente com o informado
      const diferencaTolerada = 0.5; // Tolerância de 50 centavos para arredondamentos
      if (Math.abs(valorCupomDesconto - cupom.valorDesconto) > diferencaTolerada) {
        console.warn(`Valor de desconto inconsistente. Calculado: ${valorCupomDesconto}, Informado: ${cupom.valorDesconto}`);
        return NextResponse.json(
          { error: 'Valor de desconto de cupom inconsistente' },
          { status: 400 }
        );
      }
    }

    // Gerar um número de pedido único
    const orderNumber = `D${Date.now().toString().substring(6)}`;

    // Iniciar transação para garantir integridade dos dados
    const order = await db.$transaction(async (tx) => {
      // Primeiro, criar o cliente
      const clienteObj = await tx.cliente.create({
        data: {
          tenantId: tenant.id,
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email || null
        }
      });

      // Se for delivery, criar o endereço de entrega
      let enderecoEntregaId = null;
      if (tipo === 'DELIVERY' && entrega) {
        // Buscar o nome da cidade, caso necessário
        let cidade = entrega.cidade || "";
        if (entrega.cidadeId) {
          const cidadeObj = await tx.cidadeEntrega.findUnique({
            where: { id: parseInt(entrega.cidadeId.toString()) }
          });
          if (cidadeObj) {
            cidade = cidadeObj.nome;
          }
        }

        // Criar endereço de entrega (sem enviar cidadeId, pois não existe no schema)
        const enderecoObj = await tx.enderecoEntrega.create({
          data: {
            tenantId: tenant.id,
            rua: entrega.rua,
            numero: entrega.numero,
            complemento: entrega.complemento || '',
            bairro: entrega.bairro,
            cidade: cidade, // Usar o nome da cidade, não o ID
            referencia: entrega.referencia || '',
            // Removemos cidadeId e bairroId pois não existem no modelo EnderecoEntrega
          }
        });
        enderecoEntregaId = enderecoObj.id;
      }

      // Criar o pedido
      let pedidoData: any = {
        tenantId: tenant.id,
        numero: orderNumber,
        tipo: tipo || 'DELIVERY',
        status: PedidoStatus.PENDING,
        clienteId: clienteObj.id,
        enderecoEntregaId: enderecoEntregaId,
        formaPagamento: paymentMethodObj.code,
        troco: paymentMethodObj.acceptsChange && pagamento.troco ?
          parseFloat(pagamento.troco.toString().replace(',', '.')) : null,
        taxaEntrega: tipo === 'DELIVERY' ? taxaEntrega : 0,
        observacoes: pagamento.observacoes || '',
        valorItens,
        valorTotal,
        dataPedido: new Date()
      };

      // Armazenar informações de retirada no campo observacoes se for pickup
      if (tipo === 'PICKUP' && retirada) {
        pedidoData.observacoes = retirada.observacaoRetirada || '';
      }

      const newOrder = await tx.pedido.create({
        data: pedidoData
      });

      // Adicionar histórico inicial - corrigindo os campos de acordo com o schema
      await tx.historicoPedido.create({
        data: {
          pedidoId: newOrder.id,
          statusAnterior: null,  // Não existe status anterior, é o primeiro registro
          statusNovo: PedidoStatus.PENDING, // Campo obrigatório
          observacao: 'Pedido recebido. Pedido criado pelo cliente via delivery online',
          data: new Date()
        }
      });

      // Adicionar os itens do pedido
      for (const item of itens) {
        await tx.itemPedido.create({
          data: {
            pedidoId: newOrder.id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal,
            observacoes: item.observacoes || '',
            opcoes: item.opcoes || {}
          }
        });
      }

      // Se tem cupom, registrar o uso e incrementar contador
      if (cupomObj) {
        // Registrar uso do cupom neste pedido
        await tx.pedidoCupom.create({
          data: {
            pedidoId: newOrder.id,
            cupomId: cupomObj.id,
            valorDesconto: valorCupomDesconto
          }
        });

        // Atualizar contador de uso do cupom
        await tx.cupom.update({
          where: { id: cupomObj.id },
          data: {
            usoAtual: { increment: 1 }
          }
        });
      }

      // Criar notificações para administradores e gerentes
      // Buscar todos os usuários com papel de ADMIN ou MANAGER deste tenant
      const adminsAndManagers = await tx.user.findMany({
        where: {
          tenantId: tenant.id,
          role: {
            in: ['ADMIN', 'MANAGER']
          },
          active: true
        },
        select: {
          id: true
        }
      });

      // Formato da entrega para a mensagem
      const tipoEntrega = tipo === 'DELIVERY' ? 'Entrega' : 'Retirada';
      const formaPagamentoTexto = paymentMethodObj.name;

      // Criar uma notificação para cada administrador/gerente
      for (const user of adminsAndManagers) {
        await tx.notificacao.create({
          data: {
            tenantId: tenant.id,
            usuarioId: user.id,
            titulo: `Novo Pedido #${orderNumber}`,
            mensagem: `${tipoEntrega}: ${cliente.nome}, ${formaPagamentoTexto}, R$ ${valorTotal.toFixed(2)}`,
            tipo: 'INFO',
            icone: 'order',
            url: `/desk/delivery/pedidos/${newOrder.id}`,
            referencia: `pedido-${newOrder.id}`,
            lida: false,
            dataEnvio: new Date()
          }
        });
      }

      return newOrder;
    });

    return NextResponse.json({
      message: 'Pedido criado com sucesso',
      order: {
        id: order.id,
        numero: order.numero,
        status: order.status,
        valorTotal: order.valorTotal
      }
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação', details: error.message },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
