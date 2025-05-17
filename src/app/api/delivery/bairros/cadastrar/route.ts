import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';

// POST - Cadastrar um bairro público no sistema
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      nome, 
      cidadeId, 
      slug,
      grupoBairroId = null,
      valorEntregaPersonalizado = null,
      tempoEstimadoPersonalizado = null 
    } = data;
    
    if (!nome || !cidadeId || !slug) {
      return NextResponse.json(
        { error: 'Nome do bairro, ID da cidade e slug são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Buscar tenant
    const tenant = await db.tenant.findUnique({
      where: { slug },
      select: { id: true }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se a cidade existe - convertendo cidadeId para número inteiro
    const cidade = await db.cidadeEntrega.findFirst({
      where: {
        id: parseInt(cidadeId.toString()),
        tenantId: tenant.id
      }
    });
    
    if (!cidade) {
      return NextResponse.json(
        { error: 'Cidade não encontrada ou não pertence a este tenant' },
        { status: 404 }
      );
    }
    
    // Verificar se o bairro já existe
    const bairroExistente = await db.bairro.findFirst({
      where: {
        nome: { 
          contains: nome
          // Remover mode: 'insensitive'
        },
        cidadeId: cidade.id,
        tenantId: tenant.id
      }
    });
    
    // Verificação adicional para garantir case-insensitive corretamente
    if (bairroExistente && bairroExistente.nome.toLowerCase() === nome.toLowerCase()) {
      // Se o bairro já existe, atualizamos seus valores
      const bairroAtualizado = await db.bairro.update({
        where: { id: bairroExistente.id },
        data: {
          grupoBairroId: grupoBairroId ? parseInt(grupoBairroId.toString()) : bairroExistente.grupoBairroId,
          valorEntregaPersonalizado,
          tempoEstimadoPersonalizado
        },
        include: {
          cidade: true,
          grupoBairro: true
        }
      });
      
      return NextResponse.json({
        message: 'Bairro atualizado com sucesso',
        bairro: bairroAtualizado
      });
    }
    
    // Processar grupoBairroId se existir
    let grupoBairroIdFinal = null;
    if (grupoBairroId !== null && grupoBairroId !== '') {
      grupoBairroIdFinal = parseInt(grupoBairroId.toString());
    }
    
    // Criar novo bairro
    const novoBairro = await db.bairro.create({
      data: {
        nome,
        cidadeId: cidade.id,
        tenantId: tenant.id,
        grupoBairroId: grupoBairroIdFinal,
        valorEntregaPersonalizado,
        tempoEstimadoPersonalizado,
        ativo: true
      },
      include: {
        cidade: true,
        grupoBairro: true
      }
    });
    
    return NextResponse.json({
      message: 'Bairro cadastrado com sucesso',
      bairro: novoBairro
    });
  } catch (error) {
    console.error('Erro ao cadastrar bairro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
