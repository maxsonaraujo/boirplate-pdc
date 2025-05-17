import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/connector'
import { cookies } from 'next/headers'
import { checkAuthAndPermissions } from '@/utils/auth'
import * as xlsx from 'xlsx'

// POST - Importar produtos a partir de um arquivo Excel
export async function POST(request: NextRequest) {
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

    // Obter o ID do tenant
    const tenantId = authCheck.user?.tenantId

    if (!tenantId) {
      return NextResponse.json(
        { message: 'Tenant não identificado' },
        { status: 400 }
      )
    }

    // Obter formData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Verificar tipo de arquivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream', // Alguns navegadores usam isso para .xlsx
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Formato de arquivo não suportado. Use Excel (.xlsx, .xls) ou CSV.' },
        { status: 400 }
      )
    }

    // Processar o arquivo
    const buffer = await file.arrayBuffer()
    const workbook = xlsx.read(buffer, { type: 'array' })

    // Obter a primeira planilha
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Converter planilha para JSON
    const data = xlsx.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return NextResponse.json(
        { message: 'Arquivo vazio ou sem dados válidos' },
        { status: 400 }
      )
    }

    // Preparar para processamento
    const results = {
      total: data.length,
      success: 0,
      errors: 0,
      messages: [] as { type: 'success' | 'error', message: string }[]
    }

    // Buscar dados de referência do banco de dados
    const [categorias, unidadesMedida, locaisProducao] = await Promise.all([
      db.categoria.findMany({ where: { tenantId } }),
      db.unidadeMedida.findMany({ where: { tenantId } }),
      db.localProducao.findMany({ where: { tenantId } })
    ])

    // Mapear por códigos e IDs para facilitar a busca
    const unidadesPorSimbolo = new Map(unidadesMedida.map(um => [um.simbolo, um.id]))
    const locaisPorId = new Map(locaisProducao.map(local => [local.id.toString(), local.id]))
    const categoriasPorId = new Map(categorias.map(cat => [cat.id.toString(), cat.id]))

    // Processar cada linha
    for (const [index, row] of data.entries()) {
      const linha = index + 2 // +2 porque a planilha tem cabeçalho e começa em 1

      try {
        // Extrair e validar campos obrigatórios
        const codigo = row['Código (obrigatório)'] || row['Código'] || ''
        const nome = row['Nome (obrigatório)'] || row['Nome'] || ''
        const precoVenda = parseFloat(row['Preço de Venda (obrigatório)'] || row['Preço de Venda'] || 0)

        // Validações básicas
        if (!codigo) {
          throw new Error('Código do produto é obrigatório')
        }

        if (!nome) {
          throw new Error('Nome do produto é obrigatório')
        }

        if (isNaN(precoVenda) || precoVenda <= 0) {
          throw new Error('Preço de venda inválido')
        }

        // Verificar categorias
        const categoriaIds = ((row['Categorias (ID separados por vírgula)'] || row['Categorias']) + '')
          .split(',')
          .map(id => id.trim())
          .filter(id => id && categoriasPorId.has(id))
          .map(id => categoriasPorId.get(id))

        if (categoriaIds.length === 0) {
          throw new Error('Pelo menos uma categoria válida deve ser informada')
        }

        // Verificar unidade de medida
        const unidadeSimbolo = (row['Unidade de Medida'] || '') + ''
        const unidadeMedidaId = unidadeSimbolo ? unidadesPorSimbolo.get(unidadeSimbolo) : null

        // Verificar local de produção
        const localProducaoIdStr = (row['Local de Produção (ID)'] || row['Local de Produção'] || '') + ''
        const localProducaoId = localProducaoIdStr ? locaisPorId.get(localProducaoIdStr) : null

        // Verificar categoria principal
        let categoriaPrincipalId = Number((row['Categoria Principal (ID)'] || row['Categoria Principal'] || '') + '')
        // Converter para número se for um ID válido, caso contrário será null
        categoriaPrincipalId = categoriaPrincipalId && categoriasPorId.has(categoriaPrincipalId.toString()) 
          ? categoriasPorId.get(categoriaPrincipalId.toString())
          : null

        // Converter campos booleanos
        const geraComandaStr = ((row['Gera Comanda (sim/não)'] || row['Gera Comanda']) + '').toLowerCase()
        const geraComanda = geraComandaStr === 'sim' || geraComandaStr === 'true' || geraComandaStr === '1'

        const controlaEstoqueStr = ((row['Controla Estoque (sim/não)'] || row['Controla Estoque']) + '').toLowerCase()
        const controlaEstoque = controlaEstoqueStr === 'sim' || controlaEstoqueStr === 'true' || controlaEstoqueStr === '1'

        const statusStr = ((row['Status (ativo/inativo)'] || row['Status']) + '').toLowerCase()
        const status = statusStr !== 'inativo' && statusStr !== 'false' && statusStr !== '0'

        // Outros campos
        const descricao = (row['Descrição'] || '') + ''
        const tempoPreparo = row['Tempo de Preparo (min)'] || row['Tempo de Preparo'] ? parseInt(row['Tempo de Preparo (min)'] || row['Tempo de Preparo']) : null

        // Verificar se produto já existe
        const produtoExistente = await db.produto.findFirst({
          where: { 
            codigo,
            tenantId // Importante adicionar o tenantId para garantir que estamos verificando no escopo correto
          },
          include: {
            ProdutoCategoria: true
          }
        })

        // Preparar dados do produto
        const produtoData = {
          codigo,
          nome,
          descricao,
          precoVenda,
          status,
          unidadeMedidaId,
          tempoPreparo,
          geraComanda,
          localProducaoId,
          controlaEstoque,
          estoqueAtual: 0, // Inicializa com estoque zerado
          tenantId // Adicionar tenantId
        }

        // Criar ou atualizar o produto
        if (produtoExistente) {
          // Atualizar produto existente
          await db.$transaction(async (tx) => {
            // Atualizar produto
            await tx.produto.update({
              where: { id: produtoExistente.id },
              data: produtoData
            })

            // Atualizar categorias
            // Primeiro remover todas as existentes
            await tx.categoriaProduto.deleteMany({
              where: { produtoId: produtoExistente.id }
            })

            // Depois criar as novas
            for (const categoriaId of categoriaIds) {
              await tx.categoriaProduto.create({
                data: {
                  produtoId: produtoExistente.id,
                  categoriaId,
                  isPrincipal: categoriaId === categoriaPrincipalId
                }
              })
            }
          })

          results.success++
          results.messages.push({
            type: 'success',
            message: `Produto ${codigo} "${nome}" atualizado com sucesso`
          })
        } else {
          // Criar novo produto
          await db.$transaction(async (tx) => {
            // Criar produto
            const novoProduto = await tx.produto.create({
              data: produtoData
            })

            // Criar categorias
            for (const categoriaId of categoriaIds) {
              await tx.categoriaProduto.create({
                data: {
                  produtoId: novoProduto.id,
                  categoriaId,
                  isPrincipal: categoriaId === categoriaPrincipalId
                }
              })
            }
          })

          results.success++
          results.messages.push({
            type: 'success',
            message: `Produto ${codigo} "${nome}" criado com sucesso`
          })
        }
      } catch (error: any) {
        results.errors++
        results.messages.push({
          type: 'error',
          message: `Erro na linha ${linha}: ${error.message}`
        })
      }
    }

    return NextResponse.json({
      message: `Importação concluída: ${results.success} produtos importados, ${results.errors} erros`,
      results
    })
  } catch (error) {
    console.error('Erro ao importar produtos:', error)
    return NextResponse.json(
      { message: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
