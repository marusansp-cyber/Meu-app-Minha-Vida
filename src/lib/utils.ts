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

/**
 * Fixes oklch color functions in a cloned document for html2canvas compatibility.
 * html2canvas currently crashes when encountering oklch colors used by Tailwind 4.
 */
export function fixOklch(clonedDoc: Document) {
  const elements = clonedDoc.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as HTMLElement;
    if (!el.style) continue;

    // Properties likely to have oklch colors from Tailwind 4
    const props = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke', 'outlineColor', 'textDecorationColor'];
    
    // Check computed style if inline style doesn't have it
    // But modifying the inline style is what html2canvas will pick up
    const style = window.getComputedStyle(el);
    
    props.forEach(prop => {
      const value = style.getPropertyValue(prop.replace(/[A-Z]/g, m => "-" + m.toLowerCase()));
      if (value && value.includes('oklch')) {
        // Fallback to a simple hex/rgb if it's oklch
        // For slate/gray colors (common in Tailwind), we'll use a neutral gray
        if (value.includes('0.9') || value.includes('0.8')) { // Dark colors (L is low)
           el.style.setProperty(prop.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), '#1e293b', 'important');
        } else if (value.includes('0.1') || value.includes('0.2')) { // Light colors
           el.style.setProperty(prop.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), '#f1f5f9', 'important');
        } else {
           el.style.setProperty(prop.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), '#64748b', 'important');
        }
      }
    });
  }
}

export function validateEmail(email: string): string | null {
  if (!email) return 'E-mail é obrigatório';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Formato de e-mail inválido';
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return 'Telefone é obrigatório';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return 'Telefone deve ter ao menos 10 dígitos';
  if (digits.length > 11) return 'Telefone deve ter no máximo 11 dígitos';
  return null;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCurrency(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return 'R$ 0,00';
  const amount = parseInt(numbers) / 100;
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function currencyToNumber(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/\D/g, '')) / 100;
}
