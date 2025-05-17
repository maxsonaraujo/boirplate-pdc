import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { bairroId, bairroNome, cidadeId, slug } = data;
    
    // Verificamos se temos informações para identificar o bairro
    if ((!bairroId && !bairroNome) || !cidadeId || !slug) {
      return NextResponse.json(
        { error: 'Dados incompletos para cálculo de entrega' },
        { status: 400 }
      );
    }

    // Buscar tenant pelo slug
    const tenant = await db.tenant.findUnique({
      where: { slug },
      select: { id: true, taxaEntregaPadrao: true }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // Taxa padrão que será usada como fallback
    const taxaPadrao = tenant.taxaEntregaPadrao || 0;
    let taxaEntrega = taxaPadrao;
    let tempoEstimado = '30-45';
    let origem = 'padrao';
    
    // Buscar cidade
    const cidade = await db.cidadeEntrega.findFirst({
      where: {
        id: parseInt(cidadeId.toString()),
        tenantId: tenant.id
      }
    });
    
    if (cidade) {
      // Usar taxa da cidade como fallback mais próximo
      taxaEntrega = cidade.valorEntrega || taxaPadrao;
      tempoEstimado = cidade.tempoEstimado || tempoEstimado;
      origem = 'cidade';
      
      let bairro;
      
      // Buscar bairro pelo ID ou nome
      if (bairroId) {
        bairro = await db.bairro.findFirst({
          where: {
            id: parseInt(bairroId.toString()),
            cidadeId: cidade.id,
            tenantId: tenant.id
          },
          include: {
            grupoBairro: true
          }
        });
      } else if (bairroNome) {
        // Buscar com contains e verificar manualmente
        const bairrosPossiveis = await db.bairro.findMany({
          where: {
            nome: {
              contains: bairroNome
            },
            cidadeId: cidade.id,
            tenantId: tenant.id
          },
          include: {
            grupoBairro: true
          }
        });
        
        // Verificação case-insensitive manual
        bairro = bairrosPossiveis.find(b => 
          b.nome.toLowerCase() === bairroNome.toLowerCase()
        );
      }
      
      // Hierarquia de taxas:
      if (bairro) {
        // 1. Verificar se o bairro tem valor personalizado
        if (bairro.valorEntregaPersonalizado !== null) {
          taxaEntrega = bairro.valorEntregaPersonalizado;
          tempoEstimado = bairro.tempoEstimadoPersonalizado || tempoEstimado;
          origem = 'bairro';
        }
        // 2. Verificar se o bairro pertence a um grupo
        else if (bairro.grupoBairroId && bairro.grupoBairro) {
          taxaEntrega = bairro.grupoBairro.valorEntrega;
          tempoEstimado = bairro.grupoBairro.tempoEstimado || tempoEstimado;
          origem = 'grupo';
        }
        // 3. Já estamos usando a taxa da cidade (definida acima)
      }
    }
    
    return NextResponse.json({
      taxaEntrega,
      tempoEstimado,
      origem,
      cidadeId: cidade?.id,
      cidadeNome: cidade?.nome,
      estado: cidade?.estado
    });
  } catch (error) {
    console.error('Erro ao calcular taxa de entrega:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
