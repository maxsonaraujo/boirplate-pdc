import { NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET /api/delivery/lojas - Lista todas as lojas
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    const whereClause: any = {
      tenantId,
    };

    // Se não foi solicitado para incluir lojas inativas, filtra apenas as ativas
    if (!includeInactive) {
      whereClause.ativo = true;
    }

    if (search) {
      whereClause.OR = [
        { nome: { contains: search } },
        { endereco: { contains: search } },
        { cidade: { contains: search } },
      ];
    }

    const lojas = await db.loja.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json({ lojas });
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    return NextResponse.json({ error: 'Erro ao buscar lojas' }, { status: 500 });
  }
}

// POST /api/delivery/lojas - Cria uma nova loja
export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    const data = await request.json();
    console.log("Dados recebidos na API:", data);
    
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

    const novaLoja = await db.loja.create({
      data: {
        tenantId,
        nome: data.nome,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        imagem: data.imagem,
        link: data.link,
        ativo: data.ativo !== undefined ? data.ativo : true,
      },
    });

    return NextResponse.json({ loja: novaLoja }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    return NextResponse.json({ error: 'Erro ao criar loja' }, { status: 500 });
  }
}