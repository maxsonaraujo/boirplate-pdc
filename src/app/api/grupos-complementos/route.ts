import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { getTenantIdFromHeaders, whereTenant, addTenantId } from '@/utils/tenant';

export async function GET(request: NextRequest) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const includeComplementos = url.searchParams.get('includeComplementos') === 'true';

    // Obter tenant ID dos headers
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      // Retornar estrutura vazia compatível com o frontend
      return NextResponse.json({ gruposComplementos: [] });
    }

    // Definir condições de busca
    const whereConditions = {
      //@ts-ignore
      ...(await whereTenant(tenantId)),
      ...(search ? {
        nome: {
          contains: search,
          mode: 'insensitive'
        }
      } : {})
    };

    // Configurar inclusões
    const include: any = includeComplementos ? {
      complementos: {
        include: {
          complemento: true
        },
        orderBy: {
          ordem: 'asc'
        }
      }
    } : {};

    // Buscar grupos de complementos
    const gruposComplementos = await db.grupoComplemento.findMany({
      where: whereConditions,
      include,
      orderBy: {
        id: 'asc' // Usando ID para ordenação já que 'ordem' não existe
      },
    });

    // Transformar os dados para o formato esperado pelo frontend
    let result = gruposComplementos;

    if (includeComplementos) {
      // O frontend espera um array em 'complementos' com os objetos de complemento diretos
      result = gruposComplementos.map((grupo: any) => {
        const complementosArray = grupo.complementos || [];

        return {
          ...grupo,
          complementos: complementosArray.map(item => ({
            complementoId: item.complementoId,
            complemento: item.complemento
          }))
        };
      });
    }

    // Retornar no formato esperado pelo frontend: { gruposComplementos: [...] }
    return NextResponse.json({ gruposComplementos: result });
  } catch (error) {
    console.error("Erro ao buscar grupos de complementos:", error);
    // Em caso de erro, retornar estrutura vazia compatível com o frontend
    return NextResponse.json({ gruposComplementos: [] });
  }
}

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

    // Verificar se já existe um grupo com o mesmo nome neste tenant
    const grupoExistente = await db.grupoComplemento.findFirst({
      where: {
        nome: data.nome,
        tenantId
      }
    });

    if (grupoExistente) {
      return NextResponse.json(
        { error: 'Já existe um grupo com este nome' },
        { status: 400 }
      );
    }

    // Adicionar tenantId aos dados
    const grupoData = await addTenantId({
      nome: data.nome,
      descricao: data.descricao,
      minSelecao: data.minSelecao !== undefined ? parseInt(data.minSelecao) : 0,
      maxSelecao: data.maxSelecao !== undefined ? parseInt(data.maxSelecao) : 0,
      status: data.status !== undefined ? data.status : true
    }, tenantId);

    // Criar grupo de complementos
    const grupo = await db.grupoComplemento.create({
      data: grupoData
    });

    // Se os complementos foram enviados, adicionar ao grupo
    if (data.complementos && Array.isArray(data.complementos) && data.complementos.length > 0) {
      // Verificar se os complementos pertencem ao mesmo tenant
      const complementosIds = data.complementos.map(id => parseInt(id));

      const complementos = await db.complemento.findMany({
        where: {
          id: { in: complementosIds },
          tenantId
        }
      });

      if (complementos.length !== complementosIds.length) {
        console.warn('Alguns complementos não pertencem ao tenant ou não existem');
      }

      // Criar relações apenas para complementos válidos
      const validComplementosIds = complementos.map(c => c.id);

      if (validComplementosIds.length > 0) {
        await Promise.all(
          validComplementosIds.map((complementoId, index) =>
            db.grupoComplementoItem.create({
              data: {
                grupoComplementoId: grupo.id,
                complementoId,
                ordem: index + 1
              }
            })
          )
        );
      }
    }

    return NextResponse.json({
      message: 'Grupo de complementos criado com sucesso',
      grupo
    });
  } catch (error) {
    console.error('Erro ao criar grupo de complementos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'
