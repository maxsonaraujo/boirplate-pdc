import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    let { email, senha: password } = await request.json();

    // Extract domain from the request
    const domain = request.headers.get('host') || request.nextUrl.hostname;
    console.log('Domain:', domain);
    // Look up tenant ID in the database based on domain
    const tenant = (process.env.NODE_ENV === "development" || (domain && domain.includes("localhost")) ?

      await db.tenant.findFirst({
        where: { id: 1 },
        select: { id: true, ativo: true, nome: true, slug: true }
      })

      :

      await db.tenant.findFirst({
        where: { dominio: domain },
        select: { id: true, ativo: true, nome: true, slug: true }
      })
    );




    // If tenant not found, return error response
    if (!tenant) {
      return NextResponse.json({ message: 'Tenant não encontrado' }, { status: 404 });
    }

    if (!email || !password) {
      return NextResponse.json({ message: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    if (!tenant.ativo) {
      return NextResponse.json({ message: 'Este tenant está inativo' }, { status: 403 });
    }

    // Buscar o usuário pelo email
    const user = await db.user.findFirst({
      where: {
        email,
        tenantId: tenant.id,
        active: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }

    // Verificar a senha usando bcrypt.compare
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    // Gerar refresh token (opcional, para implementação posterior)
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret',
      { expiresIn: '7d' }
    );

    // Preparar resposta
    const response = NextResponse.json({
      message: 'Autenticado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      tenant: {
        id: tenant.id,
      },
      token,
      refreshToken
    });

    // Configurar cookies
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/'
    });


    // Configurar cookies
    response.cookies.set('x-tenant-id', tenant.id.toString(), {
      httpOnly: false,
      path: '/'
    });


    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });

    response.cookies.set('current-tenant', JSON.stringify({
      id: tenant.id,
      nome: tenant.nome,
      slug: tenant.slug
    }), {
      httpOnly: false, // Precisa ser acessível pelo JavaScript
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Erro durante autenticação:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}
