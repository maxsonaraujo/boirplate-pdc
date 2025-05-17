import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/connector';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { getTenantIdFromHeaders } from '@/utils/tenant';

// GET - Obter configurações do tenant
export async function GET(request: NextRequest) {
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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Buscar o tenant com todas as configurações
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Erro ao buscar configurações do tenant:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

// PUT - Atualizar configurações do tenant
export async function PUT(request: NextRequest) {
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

    // Obter o ID do tenant dos headers
    const tenantId = await getTenantIdFromHeaders();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Obter dados do corpo da requisição
    const data = await request.json();

    // Verificar se o tenant existe
    const tenantExistente = await db.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenantExistente) {
      return NextResponse.json(
        { message: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se é uma atualização completa ou apenas atualização de configurações
    const isFullUpdate = data.nome !== undefined && data.slug !== undefined && data.dominio !== undefined;
    
    // Se for uma atualização completa, validar os campos obrigatórios
    if (isFullUpdate) {
      if (!data.nome || !data.slug || !data.dominio) {
        return NextResponse.json(
          { message: 'Dados obrigatórios não fornecidos: nome, slug e domínio são obrigatórios' },
          { status: 400 }
        );
      }
      
      // Verificar se o slug já está em uso por outro tenant
      if (data.slug !== tenantExistente.slug) {
        const slugExistente = await db.tenant.findFirst({
          where: {
            slug: data.slug,
            id: { not: tenantId }
          }
        });

        if (slugExistente) {
          return NextResponse.json(
            { message: 'Este slug já está em uso por outro tenant' },
            { status: 400 }
          );
        }
      }

      // Verificar se o domínio já está em uso por outro tenant
      if (data.dominio !== tenantExistente.dominio) {
        const dominioExistente = await db.tenant.findFirst({
          where: {
            dominio: data.dominio,
            id: { not: tenantId }
          }
        });

        if (dominioExistente) {
          return NextResponse.json(
            { message: 'Este domínio já está em uso por outro tenant' },
            { status: 400 }
          );
        }
      }
    }

    // Preparar os dados para atualização
    const updateData: any = {
      // Atualizar apenas os campos fornecidos, mantendo os valores existentes
      // para os campos não fornecidos
      ...(data.nome && { nome: data.nome }),
      ...(data.slug && { slug: data.slug }),
      ...(data.dominio && { dominio: data.dominio }),
      ...(data.corPrimaria && { corPrimaria: data.corPrimaria }),
      ...(data.corSecundaria && { corSecundaria: data.corSecundaria }),
      ...(data.logotipo !== undefined && { logotipo: data.logotipo }),
      ...(data.ativo !== undefined && { ativo: data.ativo }),

      // Campos de contato e SEO - atualizados se fornecidos
      ...(data.siteTitle !== undefined && { siteTitle: data.siteTitle }),
      ...(data.siteDescription !== undefined && { siteDescription: data.siteDescription }),
      ...(data.siteKeywords !== undefined && { siteKeywords: data.siteKeywords }),
      ...(data.enderecoLoja !== undefined && { enderecoLoja: data.enderecoLoja }),
      ...(data.telefoneLoja !== undefined && { telefoneLoja: data.telefoneLoja }),
      ...(data.emailLoja !== undefined && { emailLoja: data.emailLoja }),

      // Configurações de delivery - atualizadas se fornecidas
      ...(data.deliveryAtivo !== undefined && { deliveryAtivo: data.deliveryAtivo }),
      ...(data.deliveryMinimoEntrega !== undefined && { 
        deliveryMinimoEntrega: typeof data.deliveryMinimoEntrega === 'string' 
          ? parseFloat(data.deliveryMinimoEntrega) 
          : data.deliveryMinimoEntrega 
      }),
      ...(data.taxaEntregaPadrao !== undefined && { 
        taxaEntregaPadrao: typeof data.taxaEntregaPadrao === 'string' 
          ? parseFloat(data.taxaEntregaPadrao) 
          : data.taxaEntregaPadrao 
      }),
      ...(data.tempoEstimadoEntregaMin !== undefined && { 
        tempoEstimadoEntregaMin: typeof data.tempoEstimadoEntregaMin === 'string' 
          ? parseInt(data.tempoEstimadoEntregaMin) 
          : data.tempoEstimadoEntregaMin 
      }),
      ...(data.tempoEstimadoEntregaMax !== undefined && { 
        tempoEstimadoEntregaMax: typeof data.tempoEstimadoEntregaMax === 'string' 
          ? parseInt(data.tempoEstimadoEntregaMax) 
          : data.tempoEstimadoEntregaMax 
      }),
      ...(data.observacaoEntrega !== undefined && { observacaoEntrega: data.observacaoEntrega }),
      ...(data.notificacoes !== undefined && { notificacoes: data.notificacoes }),

      // Atualizando a data de atualização
      atualizadoEm: new Date()
    };

    // Atualizar o tenant com apenas os campos válidos
    const tenantAtualizado = await db.tenant.update({
      where: { id: tenantId },
      data: updateData
    });
    
    return NextResponse.json({
      message: 'Configurações do tenant atualizadas com sucesso',
      tenant: tenantAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações do tenant:', error);
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação: ' + error.message },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
