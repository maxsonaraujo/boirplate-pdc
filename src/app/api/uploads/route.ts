import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { checkAuthAndPermissions } from '@/utils/auth';
import { 
  ensureUploadDir, 
  UPLOADS_DIR, 
  ALLOWED_FILE_TYPES,
  getPublicUrl 
} from '@/utils/fileUpload';

// POST - Fazer upload de um arquivo
export async function POST(request: NextRequest) {
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

    // Processar o arquivo enviado
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Verificar tipo do arquivo (permitir apenas imagens)
    const allowedTypes = ALLOWED_FILE_TYPES.image;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Tipo de arquivo não permitido. Envie apenas imagens (JPEG, PNG, GIF, WEBP).' },
        { status: 400 }
      );
    }

    // Verificar tamanho do arquivo (limitar a 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'Arquivo muito grande. O tamanho máximo permitido é 2MB.' },
        { status: 400 }
      );
    }

    // Gerar nome de arquivo único
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Certificar-se de que o diretório de uploads existe
    await ensureUploadDir(UPLOADS_DIR);
    
    // Definir caminho para salvar o arquivo
    const filePath = path.join(UPLOADS_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Salvar o arquivo
    try {
      console.log(`Salvando arquivo em: ${filePath}`);
      await writeFile(filePath, buffer);
      console.log('Arquivo salvo com sucesso');
    } catch (saveError) {
      console.error('Erro ao salvar o arquivo:', saveError);
      return NextResponse.json(
        { message: 'Erro ao salvar o arquivo no servidor' },
        { status: 500 }
      );
    }
    
    // Gerar URL pública para o arquivo através da API dinâmica
    const publicPath = getPublicUrl(fileName);

    return NextResponse.json({
      message: 'Arquivo enviado com sucesso',
      fileName,
      filePath: publicPath
    });
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    return NextResponse.json(
      { message: 'Erro ao processar o upload do arquivo' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false, // Desabilitar o bodyParser padrão para processar o formData
  },
};

export const dynamic = 'force-dynamic';
