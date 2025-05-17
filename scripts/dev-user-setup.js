// Script para criar um usuário padrão de desenvolvimento

const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcrypt');
const prisma = new PrismaClient();

async function setupDevUser() {
  console.log('Configurando usuário de desenvolvimento...');
  
  try {
    // Verificar se o tenant de desenvolvimento existe
    const devTenant = await prisma.tenant.findFirst({
      where: {
        slug: 'dev'
      }
    });

    if (!devTenant) {
      console.log('Tenant de desenvolvimento não encontrado. Execute dev-setup.js primeiro.');
      return;
    }

    // Verificar se usuário admin já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        email: 'admin@dev.com',
        tenantId: devTenant.id
      }
    });

    if (existingUser) {
      console.log('Usuário de desenvolvimento já existe:', existingUser.email);
      return;
    }

    // Criar senha hash
    const hashedPassword = await hash('admin123', 10);

    // Criar usuário admin para o tenant de desenvolvimento
    const user = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@dev.com',
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
        tenantId: devTenant.id
      }
    });

    console.log('Usuário de desenvolvimento criado com sucesso:', user.email);
  } catch (error) {
    console.error('Erro ao configurar usuário de desenvolvimento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDevUser();
