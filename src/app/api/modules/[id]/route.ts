import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';

// GET - Obter detalhes de um módulo específico
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verificar autenticação
        const token = (await cookies()).get('token');
        const authCheck = await checkAuthAndPermissions(token);
        if (authCheck.error) {
            return NextResponse.json(
                { message: authCheck.error },
                { status: authCheck.status }
            );
        }

        const moduleId = parseInt((await params).id);

        if (isNaN(moduleId)) {
            return NextResponse.json(
                { error: 'ID do módulo inválido' },
                { status: 400 }
            );
        }

        // Buscar o módulo no banco de dados
        const module = await db.module.findUnique({
            where: { id: moduleId },
            include: {
                _count: {
                    select: {
                        tenants: true
                    }
                }
            }
        });

        if (!module) {
            return NextResponse.json(
                { error: 'Módulo não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ module });

    } catch (error) {
        console.error('Erro ao buscar detalhes do módulo:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    } finally {
        await db.$disconnect();
    }
}

// PUT - Atualizar um módulo existente
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verificar autenticação
        const token = (await cookies()).get('token');
        const authCheck = await checkAuthAndPermissions(token);
        if (authCheck.error) {
            return NextResponse.json(
                { message: authCheck.error },
                { status: authCheck.status }
            );
        }

        // Verificar se é administrador
        if (authCheck.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Apenas administradores podem editar módulos' },
                { status: 403 }
            );
        }

        const moduleId = parseInt((await params).id);

        if (isNaN(moduleId)) {
            return NextResponse.json(
                { error: 'ID do módulo inválido' },
                { status: 400 }
            );
        }

        // Verificar se o módulo existe
        const existingModule = await db.module.findUnique({
            where: { id: moduleId }
        });

        if (!existingModule) {
            return NextResponse.json(
                { error: 'Módulo não encontrado' },
                { status: 404 }
            );
        }

        // Obter dados da requisição
        const data = await request.json();
        const { nome, slug, descricao, status } = data;

        // Validações básicas
        if (!nome || !slug) {
            return NextResponse.json(
                { error: 'Nome e slug são obrigatórios' },
                { status: 400 }
            );
        }

        // Verificar se o novo slug já existe em outro módulo
        if (slug !== existingModule.slug) {
            const duplicateSlug = await db.module.findUnique({
                where: { slug }
            });

            if (duplicateSlug) {
                return NextResponse.json(
                    { error: 'Já existe um módulo com este slug' },
                    { status: 409 }
                );
            }
        }

        // Atualizar o módulo
        const updatedModule = await db.module.update({
            where: { id: moduleId },
            data: {
                name: nome,
                slug,
                description: descricao || null,
                isActive: status !== undefined ? status : existingModule.isActive
            }
        });

        return NextResponse.json({
            module: updatedModule,
            message: 'Módulo atualizado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar módulo:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    } finally {
        await db.$disconnect();
    }
}

// DELETE - Excluir um módulo
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verificar autenticação
        const token = (await cookies()).get('token');
        const authCheck = await checkAuthAndPermissions(token);
        if (authCheck.error) {
            return NextResponse.json(
                { message: authCheck.error },
                { status: authCheck.status }
            );
        }

        // Verificar se é administrador
        if (authCheck.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Apenas administradores podem excluir módulos' },
                { status: 403 }
            );
        }

        const moduleId = parseInt((await params).id);

        if (isNaN(moduleId)) {
            return NextResponse.json(
                { error: 'ID do módulo inválido' },
                { status: 400 }
            );
        }

        // Verificar se o módulo existe
        const module = await db.module.findUnique({
            where: { id: moduleId },
            include: {
                _count: {
                    select: {
                        tenants: true
                    }
                }
            }
        });

        if (!module) {
            return NextResponse.json(
                { error: 'Módulo não encontrado' },
                { status: 404 }
            );
        }

        // Verificar se o módulo está em uso por algum tenant
        if (module._count.tenants > 0) {
            return NextResponse.json(
                { error: 'Não é possível excluir um módulo que está em uso por tenants' },
                { status: 400 }
            );
        }

        // Excluir o módulo
        await db.module.delete({
            where: { id: moduleId }
        });

        return NextResponse.json({
            message: 'Módulo excluído com sucesso'
        });

    } catch (error) {
        console.error('Erro ao excluir módulo:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    } finally {
        await db.$disconnect();
    }
}

// PATCH - Atualizar parcialmente um módulo (usado para ativar/desativar)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verificar autenticação
        const token = (await cookies()).get('token');
        const authCheck = await checkAuthAndPermissions(token);
        if (authCheck.error) {
            return NextResponse.json(
                { message: authCheck.error },
                { status: authCheck.status }
            );
        }

        // Verificar se é administrador
        if (authCheck.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Apenas administradores podem modificar módulos' },
                { status: 403 }
            );
        }

        const moduleId = parseInt((await params).id);

        if (isNaN(moduleId)) {
            return NextResponse.json(
                { error: 'ID do módulo inválido' },
                { status: 400 }
            );
        }

        // Verificar se o módulo existe
        const existingModule = await db.module.findUnique({
            where: { id: moduleId }
        });

        if (!existingModule) {
            return NextResponse.json(
                { error: 'Módulo não encontrado' },
                { status: 404 }
            );
        }

        // Obter dados da requisição
        const data = await request.json();

        // Construir objeto de atualização apenas com campos fornecidos
        const updateData: any = {};

        if ('name' in data) updateData.name = data.name;
        if ('description' in data) updateData.description = data.description;
        if ('isActive' in data) updateData.isActive = Boolean(data.isActive);

        // Se nenhum campo foi fornecido para atualização
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'Nenhum dado fornecido para atualização' },
                { status: 400 }
            );
        }

        // Atualizar o módulo
        const updatedModule = await db.module.update({
            where: { id: moduleId },
            data: updateData
        });

        return NextResponse.json({
            module: updatedModule,
            message: 'Módulo atualizado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar parcialmente o módulo:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    } finally {
        await db.$disconnect();
    }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;