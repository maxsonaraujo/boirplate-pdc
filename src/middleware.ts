import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware para configurar headers padrão em ambiente de desenvolvimento
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  return response;
}

// Configurar padrões para que o middleware seja executado em rotas específicas
export const config = {
  matcher: ['/api/:path*']
};
