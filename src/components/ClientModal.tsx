import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Building2, CreditCard, Loader2 } from 'lucide-react';
import { Client } from '../types';
import { validateCNPJ, validateCPF, formatCNPJ, formatCPF, formatPhone } from '../lib/validations';
import { cn } from '../lib/utils';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  client?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    cnpj: '',
    cpf: '',
    status: 'active'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData(client);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        cnpj: '',
        cpf: '',
        status: 'active'
      });
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleCnpjChange = async (value: string) => {
    const formatted = formatCNPJ(value);
    setFormData({ ...formData, cnpj: formatted });
    
    const cleaned = formatted.replace(/\D/g, '');
    if (cleaned.length === 14) {
      if (!validateCNPJ(cleaned)) {
        setErrors(prev => ({ ...prev, cnpj: 'CNPJ inválido' }));
        return;
      }
      
      setIsValidating(true);
      setErrors(prev => {
        const next = { ...prev };
        delete next.cnpj;
        return next;
      });
      
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            name: data.razao_social || prev.name,
            address: `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.municipio} - ${data.uf}` || prev.address,
          }));
        } else {
          setErrors(prev => ({ ...prev, cnpj: 'CNPJ não encontrado' }));
        }
      } catch (error) {
        setErrors(prev => ({ ...prev, cnpj: 'Erro ao consultar CNPJ' }));
      } finally {
        setIsValidating(false);
      }
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.cnpj;
        return next;
      });
    }
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setFormData({ ...formData, cpf: formatted });
    
    const cleaned = formatted.replace(/\D/g, '');
    if (cleaned.length === 11) {
      if (!validateCPF(cleaned)) {
        setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.cpf;
          return next;
        });
      }
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.cpf;
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (formData.cnpj && !validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido';
    if (formData.cpf && !validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a160d] w-full max-w-md rounded-2xl shadow-2xl border border-[#fdb612]/20 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#fdb612]" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display">{client ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <p className="text-xs text-slate-500">Preencha os dados do cliente</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-[#fdb612]" />
              Nome Completo
            </label>
            <input
              required
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: João Silva"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-[#fdb612]" />
                E-mail
              </label>
              <input
                required
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao@email.com"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-[#fdb612]" />
                Telefone
              </label>
              <input
                required
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-[#fdb612]" />
              Endereço
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, Número, Bairro, Cidade - UF"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-[#fdb612]" />
                  CNPJ (Opcional)
                </label>
                {isValidating && <Loader2 className="w-3 h-3 animate-spin text-[#fdb612]" />}
              </div>
              <input
                type="text"
                value={formData.cnpj || ''}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0000-00"
                className={cn(
                  "w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                  errors.cnpj ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                )}
              />
              {errors.cnpj && <p className="text-[10px] font-bold text-rose-500">{errors.cnpj}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CreditCard className="w-4 h-4 text-[#fdb612]" />
                CPF (Opcional)
              </label>
              <input
                type="text"
                value={formData.cpf || ''}
                onChange={(e) => handleCpfChange(e.target.value)}
                placeholder="000.000.000-00"
                className={cn(
                  "w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                  errors.cpf ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                )}
              />
              {errors.cpf && <p className="text-[10px] font-bold text-rose-500">{errors.cpf}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Status</label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#fdb612] text-[#231d0f] font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all"
            >
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
