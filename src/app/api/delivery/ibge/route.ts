import { NextRequest, NextResponse } from 'next/server';

// GET - Buscar dados do IBGE (estados e cidades)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tipo = searchParams.get('tipo'); // 'estados' ou 'cidades'
    const uf = searchParams.get('uf'); // usado quando o tipo é 'cidades'

    if (tipo === 'estados') {
      // Buscar lista de estados do IBGE
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estados do IBGE');
      }
      
      const estados = await response.json();
      return NextResponse.json({ estados });
    } 
    else if (tipo === 'cidades' && uf) {
      // Buscar cidades de um estado específico do IBGE
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar cidades do IBGE');
      }
      
      const cidades = await response.json();
      return NextResponse.json({ cidades });
    }
    else {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Use tipo=estados ou tipo=cidades&uf=SIGLA' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro na API do IBGE:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
