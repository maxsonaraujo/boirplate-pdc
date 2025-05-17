import { PrismaClient } from '@prisma/client'

// Configurar cliente Prisma com timeout aumentado
export const db = new PrismaClient({
  // Definir opções globais para todas as transações
  transactionOptions: {
    maxWait: 10000, // 10 segundos para esperar uma conexão
    timeout: 30000   // 30 segundos para transações interativas
  }
})