import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: any): string {
  if (!date) return 'N/A';
  
  // Handle Firestore Timestamp (though firestoreUtils now converts them)
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
  }
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('pt-BR');
  } catch (e) {
    return String(date);
  }
}
