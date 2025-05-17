'use server';
import { db } from '@/db/connector';
import { cookies, headers } from 'next/headers';

// Função para obter ID do tenant a partir dos headers
export async function getTenantIdFromHeaders(): Promise<number | null> {
  try {
    // Usar um try/catch específico para o uso de headers()
    // Isso permite que o código funcione durante a renderização estática (SSG)
    let headersList;
    let cookieStore;
    let domain = '';
    let tenantId: string;

    try {
      domain = await (await headers()).get('host')||'';
    } catch (error) {
    }


    
    try {
      cookieStore = await cookies();
      tenantId = cookieStore.get('x-tenant-id')?.value;

      if (!tenantId) {
        console.log('Tenant não identificado, tentando obter do header');
        tenantId = process.env.NODE_ENV === 'development' || domain.includes("localhost") ? '1' : null;
      }


    } catch (e) {
      // Se houver erro ao acessar headers durante SSG, retornar um valor padrão
      // Isso evita o erro "Dynamic server usage" durante o build
      // console.warn('Headers não disponíveis durante a renderização estática, usando valor padrão');
      tenantId = process.env.NODE_ENV === 'development' || domain.includes("localhost") ? '1' : null;
    }

    if (!tenantId && (process.env.NODE_ENV === 'development' || domain.includes("localhost"))) {
      return 1;
    }

    if (!tenantId) {

      if (domain) {
        const tenant = await db.tenant.findFirst({
          where: { dominio: domain },
          select: { id: true, ativo: true }
        });

        if (tenant && tenant.ativo) {
          // Tentar definir o cookie - pode falhar durante SSG
          try {
            console.log('Definindo header x-tenant-id:', tenant.id);
            headersList.set('x-tenant-id', tenant.id.toString());
          } catch (e) {
            console.warn('Erro ao definir header durante SSG');
          }
          try {
            console.log('Definindo cookie x-tenant-id:', tenant.id);
            (await cookies()).set('x-tenant-id', tenant.id.toString());
          } catch (e) {
            console.warn('Erro ao definir cookie durante SSG');
          }
          return tenant.id;
        }
      }
    }

    const tenantIdNumber = Number(tenantId);

    if (isNaN(tenantIdNumber)) {
      console.warn(`Tenant ID inválido: ${tenantId}`);

      // Em ambiente de desenvolvimento, retornar ID 1 como padrão
      if (process.env.NODE_ENV === 'development') {
        return 1;
      }

      return null;
    }

    return tenantIdNumber;
  } catch (error) {
    console.error('Erro ao obter tenant ID dos headers:', error);

    // Em ambiente de desenvolvimento, retornar ID 1 como padrão em caso de erro
    if (process.env.NODE_ENV === 'development') {
      return 1;
    }

    return null;
  }
}


// Função para incluir tenantId em queries do Prisma
export async function withTenantId(query: any, tenantId: number | null) {
  if (!tenantId) {
    // Em desenvolvimento, usar ID 1 para facilitar testes
    if (process.env.NODE_ENV === 'development') {
      return {
        ...query,
        where: {
          ...query.where,
          tenantId: 1
        }
      };
    }

    return query;
  }

  return {
    ...query,
    where: {
      ...query.where,
      tenantId
    }
  };
}

// Funções para trabalhar com objetos de dados e tenant

// Função para adicionar tenantId a objetos antes de serem criados/atualizados
export async function addTenantId(data: any, tenantId: number | null) {
  if (!tenantId) {
    if (process.env.NODE_ENV === 'development') {
      return { ...data, tenantId: 1 };
    }
    return data;
  }

  return { ...data, tenantId };
}

// Função para adicionar condição de tenant ao where de consultas create/update/delete
export async function whereTenant(where: any = {}, tenantId: number | null) {
  if (!tenantId) {
    if (process.env.NODE_ENV === 'development') {
      return { ...where, tenantId: 1 };
    }
    return where;
  }

  return { ...where, tenantId };
}

// Função para obter os metadados do tenant para SEO
export async function getTenantMetadata() {
  try {
    // Obter o tenant ID de forma segura para SSG
    let tenantId;

    try {
      tenantId = await getTenantIdFromHeaders();
    } catch (e) {
      console.warn('Headers não disponíveis durante a renderização estática');
      tenantId = process.env.NODE_ENV === 'development' ? 1 : null;
    }

    // Se não conseguimos um ID válido para o tenant, retornar dados padrão
    if (!tenantId) {
      if (process.env.NODE_ENV === 'development') {
        return {
          siteTitle: 'Degusflow (Dev)',
          siteDescription: 'Sistema de gestão para restaurantes e delivery',
          siteKeywords: 'restaurante, delivery, gestão',
          nome: 'Degusflow',
          corPrimaria: '#38B2AC',
          corSecundaria: '#319795'
        };
      }
      return null;
    }

    const tenant = await db.tenant.findFirst({
      where: {
        id: tenantId,
        ativo: true
      },
      select: {
        siteTitle: true,
        siteDescription: true,
        siteKeywords: true,
        nome: true,
        logotipo: true,
        corPrimaria: true,
        corSecundaria: true
      }
    });

    return tenant;
  } catch (error) {
    console.error('Erro ao obter metadados do tenant:', error);

    // Retornar dados padrão em caso de erro em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return {
        siteTitle: 'Degusflow (Dev)',
        siteDescription: 'Sistema de gestão para restaurantes e delivery',
        siteKeywords: 'restaurante, delivery, gestão',
        nome: 'Degusflow',
        corPrimaria: '#38B2AC',
        corSecundaria: '#319795'
      };
    }

    return null;
  }
}

