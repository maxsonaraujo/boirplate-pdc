import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getTenantIdFromHeaders } from '@/utils/tenant';
import { 
  ensureUploadDir, 
  UPLOADS_DIR, 
  ALLOWED_FILE_TYPES,
  getPublicUrl 
} from '@/utils/fileUpload';

// Função para processar upload de imagens
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromHeaders();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Verificar tipo do arquivo (somente imagens)
    const validTypes = ALLOWED_FILE_TYPES.image;
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo inválido. Somente imagens são permitidas (JPEG, PNG, GIF, WebP)' 
      }, { status: 400 });
    }
    
    // Limitar tamanho do arquivo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. O tamanho máximo permitido é 5MB' 
      }, { status: 400 });
    }

    // Gerar nome de arquivo único para evitar colisões
    const extension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${extension}`;
    
    // Garantir que o diretório de uploads existe
    await ensureUploadDir(UPLOADS_DIR);
    
    const filePath = path.join(UPLOADS_DIR, fileName);
    console.log(`Salvando arquivo em: ${filePath}`);
    
    // Converter o arquivo para ArrayBuffer e depois para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Salvar o arquivo
    try {
      await writeFile(filePath, buffer);
      console.log('Arquivo salvo com sucesso');
    } catch (saveError) {
      console.error('Erro ao salvar o arquivo:', saveError);
      return NextResponse.json({ 
        error: 'Erro ao salvar o arquivo no servidor' 
      }, { status: 500 });
    }
    
    // Gerar URL pública para o arquivo através da API dinâmica
    const fileUrl = getPublicUrl(fileName);
    
    return NextResponse.json({ 
      success: true, 
      file: fileUrl,
      fileName: fileName,
      filePath: fileUrl
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return NextResponse.json({ error: 'Erro ao processar upload do arquivo' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';