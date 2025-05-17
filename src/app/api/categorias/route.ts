import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders, addTenantId } from '@/utils/tenant';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';

// GET - Listar todas as categorias
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
    const categoriaPaiId = searchParams.get('categoriaPaiId') ?
      parseInt(searchParams.get('categoriaPaiId') as string) : null;

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

    if (categoriaPaiId !== null) {
      whereClause.categoriaPaiId = categoriaPaiId;
    }

    // Buscar categorias do tenant
    const categorias = await db.categoria.findMany({
      where: whereClause,
      include: {
        localProducao: {
          select: {
            id: true,
            nome: true
          }
        },
        categoriaPai: {
          select: {
            id: true,
            nome: true
          }
        },
        _count: {
          select: {
            produtos: true,
            subCategorias: true
          }
        }
      },
      orderBy: [
        { ordemExibicao: 'asc' },
        { nome: 'asc' }
      ]
    });

    return NextResponse.json({ categorias });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect()
  }
}

// POST - Criar uma nova categoria
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

    // Verificar se já existe uma categoria com o mesmo nome neste tenant
    const categoriaExistente = await db.categoria.findFirst({
      where: {
        nome: data.nome,
        tenantId
      }
    });

    if (categoriaExistente) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      );
    }

    // Adicionar tenantId aos dados
    const categoriaData = await addTenantId({
      nome: data.nome,
      descricao: data.descricao,
      status: data.status !== undefined ? data.status : true,
      ordemExibicao: data.ordemExibicao || null,
      geraComanda: data.geraComanda !== undefined ? data.geraComanda : true,
      localProducaoId: data.localProducaoId ? parseInt(data.localProducaoId) : null,
      categoriaPaiId: data.categoriaPaiId ? parseInt(data.categoriaPaiId) : null,
      cor: data.cor,
      icone: data.icone,
      visivelPdv: data.visivelPdv !== undefined ? data.visivelPdv : true,
      visivelDelivery: data.visivelDelivery !== undefined ? data.visivelDelivery : true,
      tempoPreparoPadrao: data.tempoPreparoPadrao || null
    }, tenantId);

    // Criar categoria
    const categoria = await db.categoria.create({
      data: categoriaData
    });

    return NextResponse.json({
      message: 'Categoria criada com sucesso',
      categoria
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect()
  }
}

// PUT - Atualizar categorias em lote (reordenação)
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

    const { categorias } = await request.json()

    // Validar dados
    if (!Array.isArray(categorias)) {
      return NextResponse.json(
        { message: 'Formato inválido. Esperado um array de categorias.' },
        { status: 400 }
      )
    }

    if (categorias.length === 0) {
      return NextResponse.json(
        { message: 'Nenhuma categoria para atualizar' },
        { status: 400 }
      )
    }

    // Verificar se todas as categorias têm id e ordemExibicao
    for (const cat of categorias) {
      if (!cat.id || cat.ordemExibicao === undefined) {
        return NextResponse.json(
          { message: 'Dados inválidos. Cada categoria deve ter id e ordemExibicao.' },
          { status: 400 }
        )
      }
    }

    // Atualizar todas as categorias em uma transação
    const result = await db.$transaction(
      categorias.map(cat =>
        db.categoria.update({
          where: { id: cat.id },
          data: { ordemExibicao: cat.ordemExibicao }
        })
      )
    )

    return NextResponse.json({
      message: 'Categorias atualizadas com sucesso',
      count: result.length
    })
  } catch (error) {
    console.error('Erro ao atualizar categorias:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
