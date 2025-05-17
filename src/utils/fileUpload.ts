import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Tipos para o resultado do upload
export type UploadedFile = {
  filename: string
  originalFilename: string
  mimetype: string
  size: number
  url: string
}

// Definir o diretório de uploads fora da pasta public
// Isso permite que os arquivos sejam acessíveis mesmo após o build
export const UPLOADS_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
}

/**
 * Assegura que o diretório de uploads existe
 */
export async function ensureUploadDir(dir = UPLOADS_DIR): Promise<void> {
  try {
    await fs.access(dir)
    console.log(`Diretório de uploads já existe: ${dir}`)
  } catch (error) {
    console.log(`Criando diretório de uploads: ${dir}`)
    await fs.mkdir(dir, { recursive: true })
  }
}

/**
 * Gera um nome de arquivo único
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename)
  return `${uuidv4()}${ext}`
}

/**
 * Valida o tipo do arquivo
 */
export function validateFileType(mimetype: string, allowedTypes: string[] = ALLOWED_FILE_TYPES.image): boolean {
  return allowedTypes.includes(mimetype)
}

/**
 * Salva o arquivo no sistema de arquivos
 */
export async function saveFile(tempPath: string, filename: string, dir = UPLOADS_DIR): Promise<string> {
  await ensureUploadDir(dir);
  const targetPath = path.join(dir, filename)
  try {
    await fs.rename(tempPath, targetPath)
    console.log(`Arquivo salvo com sucesso em: ${targetPath}`)
    return targetPath
  } catch (error) {
    console.error(`Erro ao salvar arquivo ${filename}:`, error)
    
    // Tentar copiar o arquivo se renomear falhar (pode ocorrer entre sistemas de arquivos diferentes)
    try {
      console.log('Tentando copiar o arquivo ao invés de renomear...')
      const data = await fs.readFile(tempPath)
      await fs.writeFile(targetPath, data)
      await fs.unlink(tempPath).catch(() => {})
      console.log(`Arquivo copiado com sucesso para: ${targetPath}`)
      return targetPath
    } catch (copyError) {
      console.error('Erro ao copiar o arquivo:', copyError)
      throw copyError
    }
  }
}

/**
 * Calcula a URL pública para o arquivo
 * Gera URLs que apontam para nossa API de arquivos dinâmica
 */
export function getPublicUrl(filename: string): string {
  // Usar a rota de API dinâmica para servir o arquivo
  // Isso garante que arquivos enviados após o build sejam acessíveis
  return `/api/files/${filename}`
}

/**
 * Remove um arquivo
 */
export async function removeFile(filename: string, dir = UPLOADS_DIR): Promise<void> {
  try {
    const filePath = path.join(dir, filename)
    await fs.unlink(filePath)
    console.log(`Arquivo removido com sucesso: ${filePath}`)
  } catch (error) {
    console.error(`Erro ao remover arquivo ${filename}:`, error)
    throw error
  }
}
