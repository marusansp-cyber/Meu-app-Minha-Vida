import React, { useState } from 'react';
import { X, User, Zap, DollarSign, AlertCircle, Phone, MessageCircle, Mail, CheckCircle2 } from 'lucide-react';
import { Lead } from '../types';
import { cn } from '../lib/utils';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lead: Lead) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    systemSize: '',
    value: '',
    representative: 'Marusan Pinto',
    status: 'new' as Lead['status'],
    urgent: false
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    if (!email) return "E-mail é obrigatório";
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(email)) return "Formato de e-mail inválido";
    return null;
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "Telefone é obrigatório";
    const regex = /^\(\d{2}\) 9\d{4}-\d{4}$/;
    if (!regex.test(phone)) return "Formato inválido: (XX) 9XXXX-XXXX";
    return null;
  };

  const validateValue = (value: string) => {
    if (!value) return "Valor é obrigatório";
    const numbers = value.replace(/\D/g, '');
    if (parseInt(numbers) === 0) return "O valor deve ser maior que zero";
    return null;
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const maskCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidationError = validateEmail(formData.email);
    const phoneValidationError = validatePhone(formData.phone);
    const valueValidationError = validateValue(formData.value);
    setEmailError(emailValidationError);
    setPhoneError(phoneValidationError);
    setValueError(valueValidationError);

    const newErrors: Record<string, boolean> = {
      name: !formData.name,
      email: !!emailValidationError,
      phone: !!phoneValidationError,
      whatsapp: !formData.whatsapp,
      systemSize: !formData.systemSize,
      value: !!valueValidationError
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean) || emailValidationError || phoneValidationError || valueValidationError) {
      return;
    }

    const { id, ...leadData } = {
      ...formData,
      time: 'Agora',
      createdAt: new Date().toLocaleDateString('pt-BR')
    } as any;
    
    onAdd(leadData);
    setFormData({ name: '', email: '', phone: '', whatsapp: '', systemSize: '', value: '', representative: 'Marusan Pinto', status: 'new', urgent: false });
    setErrors({});
    setEmailError(null);
    setPhoneError(null);
    setValueError(null);
    onClose();
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
          <div className="space-y-1.5">
            <label className={cn("text-xs font-bold uppercase tracking-wider", errors.name ? "text-red-500" : "text-slate-500")}>
              Nome do Cliente <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", errors.name ? "text-red-400" : "text-slate-400")} />
              <input
                type="text"
                placeholder="Ex: João Silva"
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                  errors.name ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-slate-200 dark:border-slate-800"
                )}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (e.target.value) setErrors({ ...errors, name: false });
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className={cn("text-xs font-bold uppercase tracking-wider", (errors.email || emailError) ? "text-red-500" : "text-slate-500")}>
                E-mail <span className="text-red-500">*</span>
              </label>
              {emailError && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-2">{emailError}</span>}
            </div>
            <div className="relative">
              <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", (errors.email || emailError) ? "text-red-400" : "text-slate-400")} />
              <input
                type="email"
                placeholder="Ex: joao@email.com"
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                  (errors.email || emailError) ? "border-red-500 bg-red-50 dark:bg-red-900/10" : 
                  (formData.email && !emailError) ? "border-green-500 bg-green-50 dark:bg-green-900/10" :
                  "border-slate-200 dark:border-slate-800"
                )}
                value={formData.email}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, email: val });
                  if (emailError) {
                    const err = validateEmail(val);
                    setEmailError(err);
                    setErrors({ ...errors, email: !!err });
                  }
                }}
                onBlur={() => {
                  const err = validateEmail(formData.email);
                  setEmailError(err);
                  setErrors({ ...errors, email: !!err });
                }}
              />
              {formData.email && !emailError && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-in zoom-in duration-300" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className={cn("text-xs font-bold uppercase tracking-wider", (errors.phone || phoneError) ? "text-red-500" : "text-slate-500")}>
                  Telefone <span className="text-red-500">*</span>
                </label>
                {phoneError && <span className="text-[9px] font-bold text-red-500">{phoneError}</span>}
              </div>
              <div className="relative">
                <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", (errors.phone || phoneError) ? "text-red-400" : "text-slate-400")} />
                <input
                  type="tel"
                  placeholder="(00) 90000-0000"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                    (errors.phone || phoneError) ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-slate-200 dark:border-slate-800"
                  )}
                  value={formData.phone}
                  onChange={(e) => {
                    const masked = maskPhone(e.target.value);
                    setFormData({ ...formData, phone: masked });
                    const err = validatePhone(masked);
                    setPhoneError(err);
                    setErrors({ ...errors, phone: !!err });
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={cn("text-xs font-bold uppercase tracking-wider", errors.whatsapp ? "text-red-500" : "text-slate-500")}>
                WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MessageCircle className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", errors.whatsapp ? "text-red-400" : "text-slate-400")} />
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                    errors.whatsapp ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-slate-200 dark:border-slate-800"
                  )}
                  value={formData.whatsapp}
                  onChange={(e) => {
                    const masked = maskPhone(e.target.value);
                    setFormData({ ...formData, whatsapp: masked });
                    if (masked) setErrors({ ...errors, whatsapp: false });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={cn("text-xs font-bold uppercase tracking-wider", errors.systemSize ? "text-red-500" : "text-slate-500")}>
                Tamanho do Sistema <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Zap className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", errors.systemSize ? "text-red-400" : "text-slate-400")} />
                <input
                  type="text"
                  placeholder="Ex: 5.4 kWp"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                    errors.systemSize ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-slate-200 dark:border-slate-800"
                  )}
                  value={formData.systemSize}
                  onChange={(e) => {
                    setFormData({ ...formData, systemSize: e.target.value });
                    if (e.target.value) setErrors({ ...errors, systemSize: false });
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className={cn("text-xs font-bold uppercase tracking-wider", (errors.value || valueError) ? "text-red-500" : "text-slate-500")}>
                  Valor Estimado <span className="text-red-500">*</span>
                </label>
                {valueError && <span className="text-[9px] font-bold text-red-500">{valueError}</span>}
              </div>
              <div className="relative">
                <DollarSign className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", (errors.value || valueError) ? "text-red-400" : "text-slate-400")} />
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                    (errors.value || valueError) ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-slate-200 dark:border-slate-800"
                  )}
                  value={formData.value}
                  onChange={(e) => {
                    const masked = maskCurrency(e.target.value);
                    setFormData({ ...formData, value: masked });
                    const err = validateValue(masked);
                    setValueError(err);
                    setErrors({ ...errors, value: !!err });
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
                value={formData.status}
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
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
              >
                <option value="Marusan Pinto">Marusan Pinto</option>
                <option value="Ana Silva">Ana Silva</option>
                <option value="Carlos Oliveira">Carlos Oliveira</option>
              </select>
            </div>
          </div>

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
              className="flex-1 px-6 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95"
            >
              Salvar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
