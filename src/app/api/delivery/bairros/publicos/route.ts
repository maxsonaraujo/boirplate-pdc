import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';

// GET - Obter bairros de uma cidade a partir de APIs públicas ou base local
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cidadeId = searchParams.get('cidadeId');
    const cidadeNome = searchParams.get('cidade');
    const uf = searchParams.get('uf');
    const slug = searchParams.get('slug');
    const source = searchParams.get('source') || 'auto'; // 'auto', 'ibge', 'osm', 'generic'
    
    // Validar parâmetros
    if ((!cidadeId && (!cidadeNome || !uf)) || !slug) {
      return NextResponse.json(
        { error: 'Parâmetros insuficientes. Forneça cidadeId ou (cidade e uf), além do slug.' },
        { status: 400 }
      );
    }
    
    // Buscar tenant
    const tenant = await db.tenant.findUnique({
      where: { slug },
      select: { id: true }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }
    
    let cidade;
    
    // Buscar cidade pelo ID ou nome+uf
    if (cidadeId) {
      cidade = await db.cidadeEntrega.findFirst({
        where: {
          id: parseInt(cidadeId),
          tenantId: tenant.id
        }
      });
    } else {
      cidade = await db.cidadeEntrega.findFirst({
        where: {
          nome: cidadeNome,
          estado: uf,
          tenantId: tenant.id
        }
      });
    }
    
    if (!cidade) {
      return NextResponse.json(
        { error: 'Cidade não encontrada para este tenant' },
        { status: 404 }
      );
    }
    
    // Buscar bairros já cadastrados no sistema para esta cidade
    const bairrosCadastrados = await db.bairro.findMany({
      where: {
        cidadeId: cidade.id,
        tenantId: tenant.id
      },
      include: {
        grupoBairro: true
      }
    });
    
    // Mapear bairros já cadastrados para ter informações sobre preço e fonte
    const bairrosMapeados = bairrosCadastrados.map(bairro => {
      let taxaEntrega = cidade.valorEntrega;
      let fonte = 'cidade';
      
      if (bairro.valorEntregaPersonalizado !== null) {
        taxaEntrega = bairro.valorEntregaPersonalizado;
        fonte = 'bairro';
      } else if (bairro.grupoBairro && bairro.grupoBairro.valorEntrega !== null) {
        taxaEntrega = bairro.grupoBairro.valorEntrega;
        fonte = 'grupo';
      }
      
      return {
        id: bairro.id,
        nome: bairro.nome,
        isCadastrado: true,
        taxaEntrega,
        fonte,
        grupoId: bairro.grupoBairroId,
        grupoNome: bairro.grupoBairro?.nome
      };
    });
    
    // Agora, vamos buscar bairros de APIs públicas
    let bairrosPublicos = [];
    
    if (source === 'auto' || source === 'ibge') {
      try {
        // Tentar buscar bairros do Brasil API
        const response = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${uf}`);
        if (response.ok) {
          const municipios = await response.json();
          // Encontrar o município correspondente
          const municipio = municipios.find(m => 
            m.nome.toLowerCase() === cidade.nome.toLowerCase() ||
            m.nome.toLowerCase().includes(cidade.nome.toLowerCase())
          );
          if (municipio) {
            // Buscar bairros pelo código IBGE do município
            const bairrosResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${municipio.codigo_ibge}/subdistritos`);
            if (bairrosResponse.ok) {
              const bairrosData = await bairrosResponse.json();
              
              // Processar bairros, excluindo os que já estão cadastrados
              bairrosPublicos = bairrosData.map(b => ({
                id: null,
                nome: b.nome,
                isCadastrado: false,
                taxaEntrega: cidade.valorEntrega,
                fonte: 'cidade',
                grupoId: null,
                grupoNome: null
              }));
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar IBGE:', error);
      }
    }
    
    if ((source === 'auto' && bairrosPublicos.length === 0) || source === 'osm') {
      try {
        // Buscar via OpenStreetMap
        const osmQuery = `
          [out:json];
          area[name="${cidade.nome}"][admin_level~"8|6"];
          node(area)["place"="suburb"];
          out body;
        `;
        const overpassResponse = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`);
        if (overpassResponse.ok) {
          const osmData = await overpassResponse.json();
          if (osmData.elements && osmData.elements.length > 0) {
            const osmBairros = osmData.elements
              .filter(el => el.tags && el.tags.name)
              .map(el => ({
                id: null,
                nome: el.tags.name,
                isCadastrado: false,
                taxaEntrega: cidade.valorEntrega,
                fonte: 'cidade',
                grupoId: null,
                grupoNome: null
              }));
            
            bairrosPublicos = osmBairros;
            console.log(`${bairrosPublicos.length} bairros encontrados via OpenStreetMap`);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar OSM:', error);
      }
    }
    
    if ((source === 'auto' && bairrosPublicos.length === 0) || source === 'generic') {
      // Se não conseguimos bairros da API, usamos uma lista básica
      const bairrosComuns = [
        'Centro', 'Jardim', 'Vila', 'Industrial', 'Parque', 'São José', 
        'Santa Luzia', 'São Pedro', 'Santo Antônio', 'Nova', 'São Francisco', 
        'São João', 'Vila Nova', 'Bela Vista', 'São Cristóvão'
      ];
      
      bairrosPublicos = bairrosComuns.map((nome, index) => ({
        id: null,
        nome: `${nome} ${index + 1}`,
        isCadastrado: false,
        taxaEntrega: cidade.valorEntrega,
        fonte: 'cidade',
        grupoId: null,
        grupoNome: null
      }));
    }
    
    // Filtrar bairros públicos para excluir os que já estão cadastrados
    const nomesBairrosCadastrados = new Set(bairrosMapeados.map(b => b.nome.toLowerCase()));
    const bairrosPublicosFiltrados = bairrosPublicos.filter(
      b => !nomesBairrosCadastrados.has(b.nome.toLowerCase())
    );
    
    // Combinar e ordenar todos os bairros
    const todosBairros = [
      ...bairrosMapeados,
      ...bairrosPublicosFiltrados
    ].sort((a, b) => a.nome.localeCompare(b.nome));
    
    return NextResponse.json({
      bairros: todosBairros,
      cidade: {
        id: cidade.id,
        nome: cidade.nome,
        estado: cidade.estado,
        taxaPadrao: cidade.valorEntrega
      }
    });
  } catch (error) {
    console.error('Erro ao buscar bairros públicos:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
