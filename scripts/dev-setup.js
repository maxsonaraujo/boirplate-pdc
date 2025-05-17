// Script para criar um tenant de desenvolvimento se não existir

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupDevTenant() {
  console.log('Verificando tenant de desenvolvimento...');
  
  try {
    // Verificar se já existe um tenant de desenvolvimento
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        slug: 'dev'
      }
    });

    if (existingTenant) {
      console.log('Tenant de desenvolvimento já existe:', existingTenant);
      return;
    }

    // Criar tenant de desenvolvimento
    const devTenant = await prisma.tenant.create({
      data: {
        nome: 'Desenvolvimento',
        slug: 'dev',
        corPrimaria: '#38B2AC',
        corSecundaria: '#319795',
        dominio: 'localhost:3000',
        ativo: true
      }
    });

    console.log('Tenant de desenvolvimento criado com sucesso:', devTenant);
  } catch (error) {
    console.error('Erro ao configurar tenant de desenvolvimento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDevTenant();
