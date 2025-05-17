import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirecionar para a API principal de unidades
  const url = new URL(request.url);
  const newUrl = new URL('/api/unidades-medida', url.origin);
  
  // Transferir todos os parâmetros de consulta
  for (const [key, value] of url.searchParams.entries()) {
    newUrl.searchParams.append(key, value);
  }
  
  return NextResponse.redirect(newUrl);
}

export async function POST(request: NextRequest) {
  // Redirecionar para a API principal de unidades
  const url = new URL('/api/unidades-medida', new URL(request.url).origin);
  
  return NextResponse.redirect(url, {
    status: 307 // Temporary redirect that preserves the HTTP method and body
  });
}

export const dynamic = 'force-dynamic';
