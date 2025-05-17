import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { hash } from 'bcrypt'

// Função auxiliar para verificar autenticação e permissões
async function checkAuthAndPermissions(token) {
    if (!token) {
        return { error: 'Não autorizado', status: 401 }
    }

    try {
        // Decodificar o token JWT
        const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET || 'SecretSigaCallKey')

        // Buscar o usuário atualizado no banco de dados para verificar permissões atuais
        const user = await db.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                role: true,
                active: true
            }
        })

        // Verificar se o usuário existe e está ativo
        if (!user || !user.active) {
            return { error: 'Usuário inativo ou não encontrado', status: 403 }
        }

        // Verificar se o usuário tem permissão adequada
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return { error: 'Acesso negado. Permissão insuficiente.', status: 403 }
        }

        return { userId: user.id, role: user.role }
    } catch (error) {
        console.error('Erro ao verificar token JWT:', error)
        return { error: 'Token inválido', status: 401 }
    }
}

// GET - Obter um usuário específico
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const userId = Number((await params).id)

        // Buscar o usuário
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { message: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({ user })
    } catch (error) {
        console.error('Erro ao buscar usuário:', error)
        return NextResponse.json(
            { message: 'Erro ao processar a solicitação' },
            { status: 500 }
        )
    } finally {
        await db.$disconnect()
    }
}

// PUT - Atualizar um usuário
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const userId = Number((await params).id)
        const { name, email, password, role, active } = await request.json()

        // Validações básicas
        if (!name || !email || !role) {
            return NextResponse.json(
                { message: 'Dados incompletos. Nome, email e função são obrigatórios.' },
                { status: 400 }
            )
        }

        // Verificar se o usuário existe
        const existingUser = await db.user.findUnique({
            where: { id: userId }
        })

        if (!existingUser) {
            return NextResponse.json(
                { message: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se está tentando atualizar o email para um já existente
        if (email !== existingUser.email) {
            const emailExists = await db.user.findFirst({
                where: { email }
            })

            if (emailExists) {
                return NextResponse.json(
                    { message: 'Este e-mail já está em uso por outro usuário' },
                    { status: 400 }
                )
            }
        }

        // Verificar permissões especiais

        // 1. Restrição: apenas ADMIN pode alterar outros ADMINs
        if (existingUser.role === 'ADMIN' && authCheck.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Apenas administradores podem modificar outros administradores' },
                { status: 403 }
            )
        }

        // 2. Restrição: apenas ADMIN pode promover usuários para ADMIN
        if (role === 'ADMIN' && existingUser.role !== 'ADMIN' && authCheck.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Apenas administradores podem promover usuários para administradores' },
                { status: 403 }
            )
        }

        // Preparar dados para atualização
        const updateData: any = {
            name,
            email,
            role,
            active: active !== undefined ? active : existingUser.active,
            updatedAt: new Date()
        }

        // Atualizar senha se fornecida
        if (password) {
            updateData.password = await hash(password, 10)
        }

        // Atualizar o usuário
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return NextResponse.json({
            message: 'Usuário atualizado com sucesso',
            user: updatedUser
        })
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error)
        return NextResponse.json(
            { message: 'Erro ao processar a solicitação' },
            { status: 500 }
        )
    } finally {
        await db.$disconnect()
    }
}

// DELETE - Excluir um usuário
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const userId = Number((await params).id)

        // Verificar se o usuário existe
        const existingUser = await db.user.findUnique({
            where: { id: userId }
        })

        if (!existingUser) {
            return NextResponse.json(
                { message: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // Verificações de segurança

        // 1. Não permitir que um usuário exclua a si mesmo
        if (userId === authCheck.userId) {
            return NextResponse.json(
                { message: 'Não é possível excluir sua própria conta' },
                { status: 400 }
            )
        }

        // 2. Apenas ADMIN pode excluir outros ADMINs
        if (existingUser.role === 'ADMIN' && authCheck.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Apenas administradores podem excluir outros administradores' },
                { status: 403 }
            )
        }

        // Excluir o usuário
        await db.user.delete({
            where: { id: userId }
        })

        return NextResponse.json({
            message: 'Usuário excluído com sucesso'
        })
    } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        return NextResponse.json(
            { message: 'Erro ao processar a solicitação' },
            { status: 500 }
        )
    } finally {
        await db.$disconnect()
    }
}

export const dynamic = 'force-dynamic'
