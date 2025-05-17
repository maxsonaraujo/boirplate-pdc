/**
 * Utilitários para formatação de valores, datas e outros campos
 */

// Função para formatação de moeda em Real (R$)
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

/**
 * Formata uma data para exibição em formato brasileiro
 * @param dateValue Data a ser formatada (string, Date ou null)
 * @param withTime Se true, inclui horas e minutos
 * @returns String com a data formatada
 */
export function formatDate(dateValue: string | Date | null, withTime = false): string {
  if (!dateValue) return '-';

  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

  if (isNaN(date.getTime())) {
    return '-';
  }

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };

  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('pt-BR', options).format(date);
}

/**
 * Formata uma data ISO para exibir apenas o horário no formato HH:MM
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar horário:', error);
    return '--:--';
  }
}

// Formatar CNPJ
export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  
  // Remove caracteres não numéricos
  const numericCnpj = cnpj.replace(/\D/g, '');
  
  // Aplica a formatação XX.XXX.XXX/XXXX-XX
  return numericCnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

// Formatar CPF
export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  
  // Remove caracteres não numéricos
  const numericCpf = cpf.replace(/\D/g, '');
  
  // Aplica a formatação XXX.XXX.XXX-XX
  return numericCpf.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4'
  );
}

// Formatar Telefone
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove caracteres não numéricos
  const numericPhone = phone.replace(/\D/g, '');
  
  // Verifica se é celular (9 dígitos) ou fixo (8 dígitos)
  if (numericPhone.length === 11) {
    // Celular com DDD: (XX) XXXXX-XXXX
    return numericPhone.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1) $2-$3'
    );
  } else if (numericPhone.length === 10) {
    // Fixo com DDD: (XX) XXXX-XXXX
    return numericPhone.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  }
  
  // Se não se encaixar nos formatos acima, retorna o valor original
  return phone;
}

// Formatar CEP
export function formatCEP(cep: string): string {
  if (!cep) return '';
  
  // Remove caracteres não numéricos
  const numericCep = cep.replace(/\D/g, '');
  
  // Aplica a formatação XXXXX-XXX
  return numericCep.replace(
    /^(\d{5})(\d{3})$/,
    '$1-$2'
  );
}

// Remover formatação
export function removeFormatting(value: string): string {
  return value ? value.replace(/\D/g, '') : '';
}

// Truncar texto com ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}
