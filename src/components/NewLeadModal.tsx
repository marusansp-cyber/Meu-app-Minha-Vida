import React, { useState } from 'react';
import { X, User, Zap, DollarSign, AlertCircle, Phone, MessageCircle, Mail, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import { Lead } from '../types';
import { cn, validateEmail, validatePhone, maskPhone, maskCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lead: Lead) => void;
  existingLeads?: Lead[];
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd,
  existingLeads = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    systemSize: '',
    value: '',
    representative: 'Marusan Pinto',
    status: 'new' as Lead['status'],
    urgent: false,
    cpfCnpj: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    ucNumber: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    scheduledDate: ''
  });

  const [isValidatingCep, setIsValidatingCep] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  if (!isOpen) return null;

  const handleCepChange = async (value: string) => {
    const masked = maskCep(value);
    setFormData(prev => ({ ...prev, cep: masked }));
    
    const cleaned = masked.replace(/\D/g, '');
    if (cleaned.length === 8) {
      setIsValidatingCep(true);
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleaned}`);
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            address: data.street || prev.address,
            neighborhood: data.neighborhood || prev.neighborhood,
            city: data.city || prev.city,
            state: data.state || prev.state
          }));
        }
      } catch (error) {
        console.error('CEP lookup error:', error);
      } finally {
        setIsValidatingCep(false);
      }
    }
  };

  const handleGeocode = async () => {
    if (!formData.address?.trim()) {
      setErrors(prev => ({ ...prev, address: 'Informe um endereço para buscar as coordenadas' }));
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
          }));
        } else {
          setErrors(prev => ({ ...prev, address: 'Endereço não localizado' }));
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const validateName = (name: string) => {
    if (!name) return "Nome completo é obrigatório";
    if (name.length < 3) return "Nome muito curto";
    return null;
  };

  const maskCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const maskCep = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const validateSystemSize = (size: string) => {
    if (!size) return "Obrigatório";
    const num = parseFloat(size.replace(',', '.'));
    if (isNaN(num)) return "Valor inválido";
    if (num <= 0) return "Deve ser maior que zero";
    return null;
  };

  const validateValue = (value: string) => {
    if (!value || value === 'R$ 0,00' || value === 'R$ 0') return "Valor é obrigatório";
    const numbers = value.replace(/\D/g, '');
    if (!numbers || parseInt(numbers) === 0) return "Deve ser maior que zero";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameErr = validateName(formData.name);
    const emailErr = validateEmail(formData.email);
    const phoneErr = validatePhone(formData.phone);
    const whatsappErr = validatePhone(formData.whatsapp);
    const valueErr = validateValue(formData.value);
    const systemSizeErr = validateSystemSize(formData.systemSize);

    const newErrors: Record<string, string | null> = {
      name: nameErr,
      email: emailErr,
      phone: phoneErr,
      whatsapp: whatsappErr,
      systemSize: systemSizeErr,
      value: valueErr
    };

    // Check for duplicates (Phone only, as requested to allow duplicate emails)
    if (!phoneErr && formData.phone) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const duplicatePhone = existingLeads.find(l => l.phone?.replace(/\D/g, '') === cleanPhone);
      if (duplicatePhone) newErrors.phone = 'Este telefone já está cadastrado em outro lead.';
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some(err => err !== null)) {
      return;
    }

    // Duplicate Check
    setIsSubmitting(true);
    try {
      const { getDocs, query, collection, where } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const phoneQuery = query(collection(db, 'leads'), where('phone', '==', formData.phone));
      const phoneSnap = await getDocs(phoneQuery);

      if (!phoneSnap.empty) {
        setErrors(prev => ({
          ...prev,
          submit: 'Já existe um lead cadastrado com este telefone.'
        }));
        setIsSubmitting(false);
        return;
      }

      // Check for incomplete data to flag
      const isIncomplete = !formData.cpfCnpj || !formData.address || !formData.cep || !formData.ucNumber;

      const { id, ...leadData } = {
        ...formData,
        time: 'Agora',
        createdAt: new Date().toISOString(),
        flagged: isIncomplete,
        flagReason: isIncomplete ? 'Informações cadastrais incompletas (Endereço, CPF/CNPJ ou UC).' : null
      } as any;
      
      onAdd(leadData);

      // Trigger Notification (simulated ID lookup)
      const { notifyLeadAssigned } = await import('../services/notificationService');
      const repIdMap: Record<string, string> = {
        'Marusan Pinto': 'marusan-id-123',
        'Ana Silva': 'ana-id-456',
        'Carlos Oliveira': 'carlos-id-789'
      };
      notifyLeadAssigned(formData.name, formData.representative, repIdMap[formData.representative] || 'system');
      
      setFormData({ 
        name: '', email: '', phone: '', whatsapp: '', systemSize: '', value: '', 
        representative: 'Marusan Pinto', status: 'new', urgent: false,
        cpfCnpj: '', address: '', cep: '', ucNumber: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error checking duplicates:', error);
      setErrors(prev => ({ ...prev, submit: 'Erro ao validar lead. Tente novamente.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#231d0f] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Novo Lead</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.submit}
            </div>
          )}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className={cn("text-xs font-bold uppercase tracking-wider", errors.name ? "text-red-500" : "text-slate-500")}>
                Nome do Cliente <span className="text-red-500">*</span>
              </label>
              {errors.name && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">{errors.name}</span>}
            </div>
            <div className="relative">
              <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", errors.name ? "text-red-400" : "text-slate-400")} />
              <input
                type="text"
                placeholder="Ex: João Silva"
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                  errors.name ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-sm shadow-red-500/10" : "border-slate-200 dark:border-slate-800"
                )}
                value={formData.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, name: val });
                  const err = validateName(val);
                  setErrors(prev => ({ ...prev, name: err }));
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className={cn("text-xs font-bold uppercase tracking-wider", errors.email ? "text-red-500" : "text-slate-500")}>
                E-mail <span className="text-red-500">*</span>
              </label>
              {errors.email && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">{errors.email}</span>}
            </div>
            <div className="relative">
              <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", errors.email ? "text-red-400" : "text-slate-400")} />
              <input
                type="email"
                placeholder="Ex: joao@email.com"
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                  errors.email ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-sm shadow-red-500/10" : 
                  (formData.email && !errors.email) ? "border-green-500 bg-green-50 dark:bg-green-900/10" :
                  "border-slate-200 dark:border-slate-800"
                )}
                value={formData.email || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, email: val });
                  const err = validateEmail(val);
                  setErrors(prev => ({ ...prev, email: err }));
                }}
              />
              {formData.email && !errors.email && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-in zoom-in duration-300" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className={cn("text-xs font-bold uppercase tracking-wider", errors.phone ? "text-red-500" : "text-slate-500")}>
                  Telefone <span className="text-red-500">*</span>
                </label>
                {errors.phone && <span className="text-[9px] font-bold text-red-500">{errors.phone}</span>}
              </div>
            <div className="relative">
              <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", errors.phone ? "text-red-400" : (formData.phone && !errors.phone) ? "text-green-500" : "text-slate-400")} />
              <input
                type="tel"
                placeholder="(00) 90000-0000"
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                  errors.phone ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-sm shadow-red-500/10" : 
                  (formData.phone && !errors.phone) ? "border-green-500 bg-green-50 dark:bg-green-900/10" :
                  "border-slate-200 dark:border-slate-800"
                )}
                value={formData.phone || ''}
                onChange={(e) => {
                  const masked = maskPhone(e.target.value);
                  setFormData({ ...formData, phone: masked });
                  const err = validatePhone(masked);
                  setErrors(prev => ({ ...prev, phone: err }));
                }}
              />
              {formData.phone && !errors.phone && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-in zoom-in duration-300" />
              )}
            </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className={cn("text-xs font-bold uppercase tracking-wider", errors.whatsapp ? "text-red-500" : "text-slate-500")}>
                  WhatsApp <span className="text-red-500">*</span>
                </label>
                {errors.whatsapp && <span className="text-[9px] font-bold text-red-500">{errors.whatsapp}</span>}
              </div>
              <div className="relative">
                <MessageCircle className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", errors.whatsapp ? "text-red-400" : (formData.whatsapp && !errors.whatsapp) ? "text-green-500" : "text-slate-400")} />
                <input
                  type="tel"
                  placeholder="(00) 90000-0000"
                  className={cn(
                    "w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                    errors.whatsapp ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-sm shadow-red-500/10" : 
                    (formData.whatsapp && !errors.whatsapp) ? "border-green-500 bg-green-50 dark:bg-green-900/10" :
                    "border-slate-200 dark:border-slate-800"
                  )}
                  value={formData.whatsapp || ''}
                  onChange={(e) => {
                    const masked = maskPhone(e.target.value);
                    setFormData({ ...formData, whatsapp: masked });
                    const err = validatePhone(masked);
                    setErrors(prev => ({ ...prev, whatsapp: err }));
                  }}
                />
                {formData.whatsapp && !errors.whatsapp && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-in zoom-in duration-300" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className={cn("text-xs font-bold uppercase tracking-wider", errors.systemSize ? "text-red-500" : "text-slate-500")}>
                  Tamanho do Sistema <span className="text-red-500">*</span>
                </label>
                {errors.systemSize && <span className="text-[9px] font-bold text-red-500">{errors.systemSize}</span>}
              </div>
              <div className="relative">
                <Zap className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", errors.systemSize ? "text-red-400" : "text-slate-400")} />
                <input
                  type="text"
                  placeholder="Ex: 5.4"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                    errors.systemSize ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-sm shadow-red-500/10" : 
                    (formData.systemSize && !errors.systemSize) ? "border-green-500 bg-green-50 dark:bg-green-900/10" :
                    "border-slate-200 dark:border-slate-800"
                  )}
                  value={formData.systemSize || ''}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                    const parts = val.split('.');
                    if (parts.length > 2) val = parts[0] + '.' + parts[1];
                    setFormData({ ...formData, systemSize: val });
                    const err = validateSystemSize(val);
                    setErrors(prev => ({ ...prev, systemSize: err }));
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className={cn("text-xs font-bold uppercase tracking-wider", errors.value ? "text-red-500" : "text-slate-500")}>
                  Valor Estimado <span className="text-red-500">*</span>
                </label>
                {errors.value && <span className="text-[9px] font-bold text-red-500">{errors.value}</span>}
              </div>
              <div className="relative">
                <DollarSign className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", errors.value ? "text-red-400" : "text-slate-400")} />
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                    errors.value ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-sm shadow-red-500/10" : 
                    (formData.value && !errors.value) ? "border-green-500 bg-green-50 dark:bg-green-900/10" :
                    "border-slate-200 dark:border-slate-800"
                  )}
                  value={formData.value || ''}
                  onChange={(e) => {
                    const masked = maskCurrency(e.target.value);
                    setFormData({ ...formData, value: masked });
                    const err = validateValue(masked);
                    setErrors(prev => ({ ...prev, value: err }));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status Inicial</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all appearance-none"
                value={formData.status || 'new'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead['status'] })}
              >
                <option value="new">Novo Lead</option>
                <option value="survey">Vistoria Técnica</option>
                <option value="proposal">Proposta Enviada</option>
                <option value="negotiation">Negociação</option>
                <option value="closed">Fechado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Representante Responsável</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all appearance-none"
                value={formData.representative || 'Marusan Pinto'}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
              >
                <option value="Marusan Pinto">Marusan Pinto</option>
                <option value="Ana Silva">Ana Silva</option>
                <option value="Carlos Oliveira">Carlos Oliveira</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#fdb612]">Informações Adicionais</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">CPF / CNPJ</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: maskCpfCnpj(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Número da UC</label>
                <input
                  type="text"
                  placeholder="Ex: 12345678"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
                  value={formData.ucNumber}
                  onChange={(e) => setFormData({ ...formData, ucNumber: e.target.value.replace(/\D/g, '') })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Endereço Completo</label>
                {isGeocoding && <Loader2 className="w-3 h-3 animate-spin text-[#fdb612]" />}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rua, número, bairro, cidade - UF"
                  className={cn(
                    "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                    errors.address ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                  )}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                {errors.address && <p className="text-[9px] font-bold text-red-500 mt-1">{errors.address}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">CEP</label>
                  {isValidatingCep && <Loader2 className="w-3 h-3 animate-spin text-[#fdb612]" />}
                </div>
                <input
                  type="text"
                  placeholder="00000-000"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
                  value={formData.cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bairro</label>
                <input
                  type="text"
                  placeholder="Bairro"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cidade</label>
                <input
                  type="text"
                  placeholder="Cidade"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">UF</label>
                <input
                  type="text"
                  placeholder="UF"
                  maxLength={2}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all uppercase"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleGeocode}
                disabled={isGeocoding}
                className="py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-[#fdb612]/10 hover:text-[#fdb612] transition-all flex items-center justify-center gap-2"
              >
                {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : "Validar Mapa"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                    });
                  }
                }}
                className="py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-[#fdb612]/10 hover:text-[#fdb612] transition-all"
              >
                Usar GPS
              </button>
            </div>

            {(formData.latitude && formData.longitude) && (
              <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center justify-between animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Localização OK</span>
                </div>
                <span className="text-[9px] font-medium text-slate-400">
                  {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          <AnimatePresence>
            {formData.status === 'survey' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-xs font-bold uppercase tracking-wider text-blue-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendamento da Vistoria
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={(formData as any).scheduledDate || ''}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value } as any)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
            <input
              type="checkbox"
              id="urgent"
              className="size-5 rounded border-amber-300 text-[#fdb612] focus:ring-[#fdb612]"
              checked={formData.urgent}
              onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
            />
            <label htmlFor="urgent" className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Marcar como Lead Urgente
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Validando...' : 'Salvar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
