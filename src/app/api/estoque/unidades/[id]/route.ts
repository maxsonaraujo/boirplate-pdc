// Modificar para redirecionar à API principal

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Redirecionar para a API principal
  const url = new URL(request.url);
  const newUrl = new URL(`/api/unidades-medida/${(await params).id}`, url.origin);
  
  return NextResponse.redirect(newUrl);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Redirecionar para a API principal
  const url = new URL(`/api/unidades-medida/${(await params).id}`, new URL(request.url).origin);
  
  return NextResponse.redirect(url, {
    status: 307 // Temporary redirect that preserves the HTTP method and body
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Redirecionar para a API principal
  const url = new URL(`/api/unidades-medida/${(await params).id}`, new URL(request.url).origin);
  
  return NextResponse.redirect(url, {
    status: 307 // Temporary redirect that preserves the HTTP method and body
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Redirecionar para a API principal
  const url = new URL(`/api/unidades-medida/${(await params).id}`, new URL(request.url).origin);
  
  return NextResponse.redirect(url, {
    status: 307 // Temporary redirect that preserves the HTTP method and body
  });
}

export const dynamic = 'force-dynamic';
