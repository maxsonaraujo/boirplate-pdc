import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'
import * as xlsx from 'xlsx'

// GET - Obter template para importação de produtos
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

    // Buscar dados necessários para o template (categorias, unidades de medida, etc.)
    const [categorias, unidadesMedida, locaisProducao] = await Promise.all([
      db.categoria.findMany({ where: { status: true }, orderBy: { nome: 'asc' } }),
      db.unidadeMedida.findMany({ where: { status: true }, orderBy: { nome: 'asc' } }),
      db.localProducao.findMany({ where: { status: true }, orderBy: { nome: 'asc' } })
    ])

    // Criar workbook e adicionar planilha principal
    const wb = xlsx.utils.book_new()
    
    // Dados de exemplo para o template
    const dadosExemplo = [
      {
        'Código (obrigatório)': 'PROD001',
        'Nome (obrigatório)': 'Produto de Exemplo',
        'Descrição': 'Descrição detalhada do produto',
        'Preço de Venda (obrigatório)': 25.90,
        'Unidade de Medida': 'UN',
        'Categorias (ID separados por vírgula)': '1,3',
        'Categoria Principal (ID)': '1',
        'Tempo de Preparo (min)': 15,
        'Gera Comanda (sim/não)': 'sim',
        'Local de Produção (ID)': '1',
        'Controla Estoque (sim/não)': 'não',
        'Estoque Mínimo': 10,
        'Status (ativo/inativo)': 'ativo'
      },
      {
        'Código (obrigatório)': 'PROD002',
        'Nome (obrigatório)': 'Outro Produto Exemplo',
        'Descrição': '',
        'Preço de Venda (obrigatório)': 15.50,
        'Unidade de Medida': 'KG',
        'Categorias (ID separados por vírgula)': '2',
        'Categoria Principal (ID)': '2',
        'Tempo de Preparo (min)': '',
        'Gera Comanda (sim/não)': 'não',
        'Local de Produção (ID)': '',
        'Controla Estoque (sim/não)': 'sim',
        'Estoque Mínimo': 5,
        'Status (ativo/inativo)': 'ativo'
      }
    ]

    // Adicionar planilha principal com exemplos
    const ws = xlsx.utils.json_to_sheet(dadosExemplo)
    xlsx.utils.book_append_sheet(wb, ws, 'Produtos')

    // Adicionar planilha com referência de categorias
    const categoriasData = categorias.map(cat => ({
      'ID': cat.id,
      'Nome': cat.nome,
      'Categoria Pai': cat.categoriaPaiId || ''
    }))
    const wsCategorias = xlsx.utils.json_to_sheet(categoriasData)
    xlsx.utils.book_append_sheet(wb, wsCategorias, 'Referência - Categorias')

    // Adicionar planilha com referência de unidades de medida
    const unidadesData = unidadesMedida.map(um => ({
      'ID': um.id,
      'Nome': um.nome,
      'Símbolo': um.simbolo
    }))
    const wsUnidades = xlsx.utils.json_to_sheet(unidadesData)
    xlsx.utils.book_append_sheet(wb, wsUnidades, 'Referência - Unidades')

    // Adicionar planilha com referência de locais de produção
    const locaisData = locaisProducao.map(local => ({
      'ID': local.id,
      'Nome': local.nome,
      'Impressora': local.impressora || ''
    }))
    const wsLocais = xlsx.utils.json_to_sheet(locaisData)
    xlsx.utils.book_append_sheet(wb, wsLocais, 'Referência - Locais')

    // Adicionar planilha com instruções
    const instrucoesData = [
      { 'Campo': 'Código', 'Obrigatório': 'Sim', 'Descrição': 'Código único do produto (SKU)' },
      { 'Campo': 'Nome', 'Obrigatório': 'Sim', 'Descrição': 'Nome do produto' },
      { 'Campo': 'Descrição', 'Obrigatório': 'Não', 'Descrição': 'Descrição detalhada do produto' },
      { 'Campo': 'Preço de Venda', 'Obrigatório': 'Sim', 'Descrição': 'Preço de venda do produto (use ponto como separador decimal)' },
      { 'Campo': 'Unidade de Medida', 'Obrigatório': 'Não', 'Descrição': 'Símbolo da unidade de medida (consultar planilha de Unidades)' },
      { 'Campo': 'Categorias', 'Obrigatório': 'Sim', 'Descrição': 'IDs das categorias separados por vírgula (consultar planilha de Categorias)' },
      { 'Campo': 'Categoria Principal', 'Obrigatório': 'Não', 'Descrição': 'ID da categoria principal (deve estar entre as categorias informadas)' },
      { 'Campo': 'Tempo de Preparo', 'Obrigatório': 'Não', 'Descrição': 'Tempo de preparo em minutos' },
      { 'Campo': 'Gera Comanda', 'Obrigatório': 'Não', 'Descrição': 'Informe "sim" ou "não" se o produto gera comanda de produção' },
      { 'Campo': 'Local de Produção', 'Obrigatório': 'Não', 'Descrição': 'ID do local de produção (consultar planilha de Locais)' },
      { 'Campo': 'Controla Estoque', 'Obrigatório': 'Não', 'Descrição': 'Informe "sim" ou "não" se o produto tem controle de estoque' },
      { 'Campo': 'Estoque Mínimo', 'Obrigatório': 'Não', 'Descrição': 'Quantidade mínima para alerta de estoque baixo' },
      { 'Campo': 'Status', 'Obrigatório': 'Não', 'Descrição': 'Informe "ativo" ou "inativo" (padrão é ativo se não informado)' }
    ]
    const wsInstrucoes = xlsx.utils.json_to_sheet(instrucoesData)
    xlsx.utils.book_append_sheet(wb, wsInstrucoes, 'Instruções')

    // Gerar buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Retornar como arquivo para download
    return new NextResponse(buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="modelo_importacao_produtos.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
  } catch (error) {
    console.error('Erro ao gerar template:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
