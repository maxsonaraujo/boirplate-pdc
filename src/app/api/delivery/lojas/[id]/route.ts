import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';
import { NextResponse } from 'next/server';

// GET /api/delivery/lojas/[id] - Busca uma loja pelo ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID da loja inválido' }, { status: 400 });
    }

    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    const loja = await db.loja.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ loja });
  } catch (error) {
    console.error('Erro ao buscar loja:', error);
    return NextResponse.json({ error: 'Erro ao buscar loja' }, { status: 500 });
  }
}

// PUT /api/delivery/lojas/[id] - Atualiza uma loja
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID da loja inválido' }, { status: 400 });
    }

    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // Verificar se a loja existe e pertence ao tenant
    const lojaExistente = await db.loja.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!lojaExistente) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    const data = await request.json();
    console.log("Dados recebidos para atualização:", data);

    // Validação dos campos obrigatórios
    if (!data.nome || !data.nome.trim()) {
      return NextResponse.json({ error: 'O nome da loja é obrigatório' }, { status: 400 });
    }

    if (!data.endereco || !data.endereco.trim()) {
      return NextResponse.json({ error: 'O endereço da loja é obrigatório' }, { status: 400 });
    }

    if (!data.link || !data.link.trim()) {
      return NextResponse.json({ error: 'O link da loja é obrigatório' }, { status: 400 });
    }

    // Validar formato do link
    try {
      new URL(data.link);
    } catch (e) {
      return NextResponse.json({ error: 'O link fornecido não é válido' }, { status: 400 });
    }

    const lojaAtualizada = await db.loja.update({
      where: { id },
      data: {
        nome: data.nome,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        imagem: data.imagem,
        link: data.link,
        ativo: data.ativo !== undefined ? data.ativo : lojaExistente.ativo,
      },
    });

    return NextResponse.json({ loja: lojaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    return NextResponse.json({ error: 'Erro ao atualizar loja' }, { status: 500 });
  }
}

// DELETE /api/delivery/lojas/[id] - Remove uma loja
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID da loja inválido' }, { status: 400 });
    }

    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // Verificar se a loja existe e pertence ao tenant
    const lojaExistente = await db.loja.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!lojaExistente) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    await db.loja.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Loja removida com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir loja:', error);
    return NextResponse.json({ error: 'Erro ao excluir loja' }, { status: 500 });
  }
}