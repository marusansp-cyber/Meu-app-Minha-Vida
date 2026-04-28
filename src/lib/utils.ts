import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDate(dateStr: any): Date {
  if (!dateStr) return new Date();
  
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? new Date() : dateStr;
  }

  const str = String(dateStr).trim();

  // Guard against common invalid strings
  if (str === 'Invalid Date' || str === 'NaN' || str === 'null' || str === 'undefined') {
    return new Date();
  }

  // Handle "7 de dez. de 2024" or "28 de abril de 2024"
  if (str.includes(' de ')) {
    const monthsMap: Record<string, number> = {
      'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
      'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    const parts = str.replace('.', '').split(' de ');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1].toLowerCase().substring(0, 3);
      const year = parseInt(parts[2]);
      return new Date(year, monthsMap[monthStr] || 0, day);
    }
  }

  // Handle "DD/MM/YYYY, HH:mm:ss" or just "DD/MM/YYYY"
  const cleanStr = str.split(',')[0].split(' ')[0];
  if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

export function formatDate(date: any): string {
  if (!date) return 'Não informada';
  
  // Handle Firestore Timestamp
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
  }

  // Guard against "Invalid Date" string
  if (String(date) === 'Invalid Date') {
    return new Date().toLocaleDateString('pt-BR');
  }
  
  try {
    const d = parseDate(date);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('pt-BR');
    return d.toLocaleDateString('pt-BR');
  } catch (e) {
    return new Date().toLocaleDateString('pt-BR');
  }
}
