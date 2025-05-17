/**
 * Utilitários para paginação
 */

/**
 * Pagina um array de dados
 * @param array Array a ser paginado
 * @param page Número da página (começando em 1)
 * @param itemsPerPage Itens por página
 * @returns Objeto contendo os itens paginados e informações sobre a paginação
 */
export function paginateArray<T>(
  array: T[], 
  page: number = 1, 
  itemsPerPage: number = 10
): { 
  items: T[]; 
  totalItems: number; 
  totalPages: number; 
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
} {
  // Verificar se a página é válida
  if (page < 1) page = 1;
  
  // Calcular índices
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Extrair os itens da página atual
  const items = array.slice(startIndex, endIndex);
  
  // Calcular informações da paginação
  const totalItems = array.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return {
    items,
    totalItems,
    totalPages,
    currentPage: page,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages
  };
}

/**
 * Gera um array de números de página para exibição em controles de paginação
 * @param currentPage Página atual
 * @param totalPages Total de páginas
 * @param maxPages Número máximo de páginas a serem exibidas
 * @returns Array com os números de página a serem exibidos
 */
export function generatePageNumbers(
  currentPage: number, 
  totalPages: number, 
  maxPages: number = 5
): (number | string)[] {
  // Se houver poucas páginas, mostrar todas
  if (totalPages <= maxPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  // Calcular o número de páginas a mostrar de cada lado da atual
  const sidePages = Math.floor((maxPages - 3) / 2);
  
  // Inicializar o array de páginas
  const pageNumbers: (number | string)[] = [];
  
  // Sempre incluir a primeira página
  pageNumbers.push(1);
  
  // Adicionar reticências ou a página 2
  if (currentPage - sidePages > 2) {
    pageNumbers.push('...');
  } else if (totalPages > 1) {
    pageNumbers.push(2);
  }
  
  // Adicionar páginas ao redor da atual
  const startPage = Math.max(currentPage - sidePages, 2);
  const endPage = Math.min(currentPage + sidePages, totalPages - 1);
  
  for (let i = startPage; i <= endPage; i++) {
    if (pageNumbers[pageNumbers.length - 1] !== i) {
      pageNumbers.push(i);
    }
  }
  
  // Adicionar reticências ou a penúltima página
  if (currentPage + sidePages < totalPages - 1) {
    pageNumbers.push('...');
  } else if (totalPages > 1 && !pageNumbers.includes(totalPages - 1) && totalPages - 1 > 1) {
    pageNumbers.push(totalPages - 1);
  }
  
  // Sempre incluir a última página
  if (totalPages > 1 && !pageNumbers.includes(totalPages)) {
    pageNumbers.push(totalPages);
  }
  
  return pageNumbers;
}
