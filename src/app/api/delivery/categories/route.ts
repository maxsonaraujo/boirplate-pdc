import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';

// GET - Obter categorias para exibição no delivery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tenantId = parseInt(searchParams.get('tenantId') || '0');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'ID do tenant é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar todas as categorias ativas e visíveis no delivery
    // Observe que vamos buscar as categorias principais primeiro (sem categoriaPaiId)
    const mainCategories = await db.categoria.findMany({
      where: {
        tenantId,
        status: true,
        visivelDelivery: true,
        categoriaPaiId: null  // Apenas categorias principais (sem pai)
      },
      orderBy: [
        { ordemExibicao: 'asc' },
        { nome: 'asc' }
      ],
      include: {
        _count: {
          select: {
            produtos: true
          }
        }
      }
    });

    // Agora buscamos as subcategorias para cada categoria principal
    const formattedCategories = [];

    // Para cada categoria principal, adicionar ela mesma e buscar suas subcategorias
    for (const mainCategory of mainCategories) {
      // Adicionar a categoria principal
      formattedCategories.push({
        ...mainCategory,
        isMainCategory: true
      });
      
      // Buscar subcategorias desta categoria principal
      const subCategories = await db.categoria.findMany({
        where: {
          tenantId,
          status: true,
          visivelDelivery: true,
          categoriaPaiId: mainCategory.id // Filtrar por categorias que têm esta como pai
        },
        orderBy: [
          { ordemExibicao: 'asc' },
          { nome: 'asc' }
        ],
        include: {
          _count: {
            select: {
              produtos: true
            }
          }
        }
      });
      
      // Adicionar subcategorias marcadas corretamente
      for (const subCategory of subCategories) {
        formattedCategories.push({
          ...subCategory,
          isMainCategory: false,
          parentId: mainCategory.id,
          parentName: mainCategory.nome
        });
      }
    }

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error('Erro ao buscar categorias para delivery:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
