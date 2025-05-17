import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';

// GET - Obter produtos para o cardápio de delivery
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const tenantId = parseInt(searchParams.get('tenantId') || '0');
        const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId') as string) : null;
        const search = searchParams.get('search') || '';

        if (!tenantId) {
            return NextResponse.json(
                { error: 'ID do tenant é obrigatório' },
                { status: 400 }
            );
        }

        // Construir where clause para a busca
        let whereClause: any = {
            tenantId,
            status: true
        };

        // Filtrar por categoria se especificado
        if (categoryId) {
            // Verificar se a categoria especificada tem subcategorias
            const subcategories = await db.categoria.findMany({
                where: {
                    categoriaPaiId: categoryId,
                    status: true,
                    visivelDelivery: true
                },
                select: {
                    id: true
                }
            });
            
            // Preparar IDs de todas as categorias (a principal e suas subcategorias)
            const categoryIds = [categoryId, ...subcategories.map(sub => sub.id)];
            
            // Filtrar produtos que pertencem a qualquer uma destas categorias
            whereClause.categorias = {
                some: {
                    categoriaId: {
                        in: categoryIds
                    }
                }
            };
        }

        // Adicionar busca por texto se especificado
        if (search) {
            whereClause.OR = [
                { nome: { contains: search } },
                { descricao: { contains: search } }
            ];
        }

        // Buscar produtos com suas relações
        const products = await db.produto.findMany({
            where: whereClause,
            include: {
                categorias: {
                    include: {
                        categoria: true
                    }
                },
                unidadeMedida: true,
                // Como não temos grupoComplementos, vamos buscar GrupoProduto
                GrupoProduto: {
                    include: {
                        grupoComplemento: {
                            include: {
                                complementos: {
                                    include: {
                                        complemento: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: [
                { nome: 'asc' }
            ]
        });

        // Formatar os produtos para o frontend, mapeando GrupoProduto para grupoComplementos
        const formattedProducts = products.map(product => {
            return {
                ...product,
                // Mapeamento de GrupoProduto para grupoComplementos para compatibilidade
                grupoComplementos: product.GrupoProduto.map(gp => ({
                    grupoComplementoId: gp.grupoComplementoId,
                    obrigatorio: gp.obrigatorio,
                    minSelecao: gp.minSelecao,
                    maxSelecao: gp.maxSelecao,
                    grupoComplemento: gp.grupoComplemento
                }))
            };
        });

        return NextResponse.json({ products: formattedProducts });
    } catch (error) {
        console.error('Erro ao buscar produtos para delivery:', error);
        return NextResponse.json(
            { error: 'Erro ao processar a solicitação' },
            { status: 500 }
        );
    } finally {
        await db.$disconnect();
    }
}

export const dynamic = 'force-dynamic';
