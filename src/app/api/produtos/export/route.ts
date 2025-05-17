import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'
import * as xlsx from 'xlsx'

// GET - Exportar produtos para Excel
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = (await cookies()).get('token')
    const authCheck = await checkAuthAndPermissions(token)

    if (authCheck.error) {
      return NextResponse.json(
        { message: authCheck.error },
        { status: authCheck.status }
      )
    }

    // Buscar todos os produtos com relacionamentos relevantes para exportação
    const produtos = await db.produto.findMany({
      include: {
        categorias: {
          include: {
            categoria: true
          }
        },
        unidadeMedida: true,
        localProducao: true
      },
      orderBy: {
        nome: 'asc'
      }
    })

    // Transformar dados para formato de exportação
    const dadosParaExportar = produtos.map(produto => {
      // Extrair nomes das categorias
      const categorias = produto.categorias
        .map(cat => cat.categoria.nome)
        .join(', ')
      
      // Encontrar categoria principal
      const categoriaPrincipal = produto.categorias
        .find(cat => cat.isPrincipal)?.categoria.nome || ''

      return {
        'Código': produto.codigo,
        'Nome': produto.nome,
        'Descrição': produto.descricao || '',
        'Preço de Venda': produto.precoVenda,
        'Unidade': produto.unidadeMedida?.simbolo || '',
        'Categorias': categorias,
        'Categoria Principal': categoriaPrincipal,
        'Local de Produção': produto.localProducao?.nome || '',
        'Tempo de Preparo (min)': produto.tempoPreparo || '',
        'Gera Comanda': produto.geraComanda ? 'Sim' : 'Não',
        'Status': produto.status ? 'Ativo' : 'Inativo',
        'Controla Estoque': produto.controlaEstoque ? 'Sim' : 'Não',
        'Criado em': produto.dataHoraCriacao.toLocaleString(),
        'Atualizado em': produto.dataHoraUpdate.toLocaleString()
      }
    })

    // Criar workbook e adicionar worksheet
    const wb = xlsx.utils.book_new()
    const ws = xlsx.utils.json_to_sheet(dadosParaExportar)

    // Adicionar worksheet ao workbook
    xlsx.utils.book_append_sheet(wb, ws, 'Produtos')

    // Gerar buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Retornar como arquivo para download
    return new NextResponse(buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="produtos_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
  } catch (error) {
    console.error('Erro ao exportar produtos:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
