import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';
import { checkAuthAndPermissions } from '@/utils/auth';
import { cookies } from 'next/headers';

// GET - Listar todos os locais de produção
export async function GET(request: NextRequest) {
  try {
    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Parâmetros de consulta
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') === 'true' ? true :
      searchParams.get('status') === 'false' ? false : undefined;

    // Construir o where clause para filtros
    let whereClause: any = {
      tenantId
    };

    if (search) {
      whereClause.OR = [
        { nome: { contains: search } },
        { descricao: { contains: search } }
      ];
    }

    if (status !== undefined) {
      whereClause.status = status;
    }

    // Buscar locais de produção do tenant
    const locaisProducao = await db.localProducao.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            categorias: true,
            produtos: true
          }
        }
      },
      orderBy: { nome: 'asc' }
    });

    return NextResponse.json({ locaisProducao });
  } catch (error) {
    console.error('Erro ao buscar locais de produção:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo local de produção
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Validações
    if (!data.nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe um local com o mesmo nome neste tenant
    const localExistente = await db.localProducao.findFirst({
      where: {
        nome: data.nome,
        tenantId
      }
    });

    if (localExistente) {
      return NextResponse.json(
        { error: 'Já existe um local de produção com este nome' },
        { status: 400 }
      );
    }

    // Adicionar tenantId aos dados
    const localData = await addTenantId({
      nome: data.nome,
      descricao: data.descricao,
      status: data.status !== undefined ? data.status : true,
      impressora: data.impressora
    }, tenantId);

    // Criar local de produção
    const localProducao = await db.localProducao.create({
      data: localData
    });

    return NextResponse.json({
      message: 'Local de produção criado com sucesso',
      localProducao
    });
  } catch (error) {
    console.error('Erro ao criar local de produção:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar múltiplos locais de produção (em lote)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')
    const authCheck = await checkAuthAndPermissions(token)

    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { locaisProducao } = await request.json()

    // Validar dados
    if (!Array.isArray(locaisProducao)) {
      return NextResponse.json(
        { message: 'Formato inválido. Esperado um array de locais de produção.' },
        { status: 400 }
      )
    }

    // Atualizar todos os locais em uma transação
    const result = await db.$transaction(
      locaisProducao.map(local =>
        db.localProducao.update({
          where: { id: local.id },
          data: {
            nome: local.nome,
            status: local.status
          }
        })
      )
    )

    return NextResponse.json({
      message: 'Locais de produção atualizados com sucesso',
      count: result.length
    })
  } catch (error) {
    console.error('Erro ao atualizar locais de produção:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
