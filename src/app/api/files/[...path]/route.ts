import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { UPLOADS_DIR } from '@/utils/fileUpload';

/**
 * API Route para servir dinamicamente arquivos de upload
 * Esta rota permite acessar arquivos que foram enviados após o build do Next.js
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Obter o caminho do arquivo a partir do parâmetro de rota
    const filePath = params.path.join('/');
    // Caminho completo para o arquivo no sistema de arquivos
    const fullPath = path.join(UPLOADS_DIR, filePath);

    // Verificar se o arquivo existe
    try {
      await fs.access(fullPath);
    } catch (error) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    // Ler o arquivo
    const file = await fs.readFile(fullPath);

    // Determinar o tipo MIME com base na extensão
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Retornar o arquivo com o tipo MIME apropriado
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
      },
    });
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';