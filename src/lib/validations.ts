
export const validateCNPJ = (cnpj: string) => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length === 0) return true;
  if (cleaned.length !== 14) return false;
  
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  const digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

export const validateCPF = (cpf: string) => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 0) return true;
  if (cleaned.length !== 11) return false;
  
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
};

export const formatCNPJ = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  
  let formatted = cleaned;
  if (cleaned.length > 2) formatted = cleaned.substring(0, 2) + '.' + cleaned.substring(2);
  if (cleaned.length > 5) formatted = formatted.substring(0, 6) + '.' + formatted.substring(6);
  if (cleaned.length > 8) formatted = formatted.substring(0, 10) + '/' + formatted.substring(10);
  if (cleaned.length > 12) formatted = formatted.substring(0, 15) + '-' + formatted.substring(15);
  
  return formatted.substring(0, 18);
};

export const formatCPF = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  
  let formatted = cleaned;
  if (cleaned.length > 3) formatted = cleaned.substring(0, 3) + '.' + cleaned.substring(3);
  if (cleaned.length > 6) formatted = formatted.substring(0, 7) + '.' + formatted.substring(7);
  if (cleaned.length > 9) formatted = formatted.substring(0, 11) + '-' + formatted.substring(11);
  
  return formatted.substring(0, 14);
};

export const formatPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  
  let formatted = cleaned;
  if (cleaned.length <= 2) {
    formatted = `(${cleaned}`;
  } else if (cleaned.length <= 6) {
    formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
  } else if (cleaned.length <= 10) {
    formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  } else {
    formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
  }
  return formatted;
};
