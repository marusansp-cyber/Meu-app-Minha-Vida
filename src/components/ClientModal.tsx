import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Mail, Phone, MapPin, Building2, CreditCard, Loader2, Search, Crosshair, Maximize } from 'lucide-react';
import { Client, Lead, User as UserType } from '../types';
import { validateCNPJ, validateCPF, formatCNPJ, formatCPF, formatPhone } from '../lib/validations';
import { cn } from '../lib/utils';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  client?: Client | null;
  leads?: Lead[];
  clients?: Client[];
  user?: UserType | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, client, leads = [], clients = [], user }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    cnpj: '',
    cpf: '',
    status: 'active',
    type: 'residential'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const canSearch = user?.role === 'admin' || user?.role === 'admin_staff' || user?.role === 'sales' || user?.role === 'finance';

  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    
    const leadMatches = leads.filter(l => 
      l.name.toLowerCase().includes(term) || 
      l.email.toLowerCase().includes(term)
    ).map(l => ({ ...l, type: 'Lead' as const }));

    const clientMatches = clients.filter(c => 
      (c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term)) &&
      c.id !== client?.id
    ).map(c => ({ ...c, type: 'Cliente' as const }));

    return [...leadMatches, ...clientMatches].slice(0, 8);
  }, [searchTerm, leads, clients, client]);

  const selectSuggestion = (item: any) => {
    setFormData({
      ...formData,
      name: item.name,
      email: item.email,
      phone: item.phone || (item.whatsapp) || (item.type === 'Cliente' ? (item as any).phone : ''),
      address: item.address || '',
      cnpj: item.cnpj || (item.cpfCnpj && item.cpfCnpj.length > 11 ? item.cpfCnpj : ''),
      cpf: item.cpf || (item.cpfCnpj && item.cpfCnpj.length <= 11 ? item.cpfCnpj : ''),
      latitude: item.latitude,
      longitude: item.longitude
    });
    setSearchTerm('');
    setShowSuggestions(false);
  };

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
        status: 'active',
        type: 'residential'
      });
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleCnpjChange = async (value: string) => {
    const formatted = formatCNPJ(value);
    setFormData({ ...formData, cnpj: formatted });
    
    const cleaned = formatted.replace(/\D/g, '');
    
    // Clear error if empty or typing
    if (cleaned.length < 14) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.cnpj;
        return next;
      });
    }

    if (cleaned.length === 14) {
      if (!validateCNPJ(cleaned)) {
        setErrors(prev => ({ ...prev, cnpj: 'CNPJ inválido (Dígito verificador incorreto)' }));
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

    // Clear error if typing
    if (cleaned.length < 11) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.cpf;
        return next;
      });
    }

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
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'E-mail inválido';
    if (formData.cnpj && !validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido';
    if (formData.cpf && !validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleGeocode = async () => {
    if (!formData.address?.trim()) {
      setErrors(prev => ({ ...prev, address: 'Informe um endereço para buscar as coordenadas' }));
      return;
    }

    setIsGeocoding(true);
    setErrors(prev => {
      const next = { ...prev };
      delete next.address;
      return next;
    });

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
          setErrors(prev => ({ ...prev, address: 'Endereço não localizado no mapa' }));
        }
      } else {
        setErrors(prev => ({ ...prev, address: 'Erro ao consultar geolocalização' }));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setErrors(prev => ({ ...prev, address: 'Falha na conexão com o serviço de mapas' }));
    } finally {
      setIsGeocoding(false);
    }
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar bg-gradient-to-br from-white to-[#fdb612]/5 dark:from-[#1a160d] dark:to-[#fdb612]/2">
          {!client && canSearch && (
            <div className="relative group">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#fdb612] mb-1.5 block">
                Bucar dados (Lead ou Cliente)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#fdb612] transition-colors" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-4 py-2 bg-[#fdb612]/5 dark:bg-[#fdb612]/5 border border-[#fdb612]/10 hover:border-[#fdb612]/30 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#fdb612] focus:bg-white dark:focus:bg-slate-900 transition-all font-bold italic"
                />
              </div>

              {showSuggestions && searchTerm && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1a160d] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[60] overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectSuggestion(item)}
                        className="w-full px-4 py-3 text-left hover:bg-[#fdb612]/10 flex flex-col gap-0.5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.name}</span>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded font-black uppercase",
                            item.type === 'Cliente' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                          )}>
                            {item.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.email}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      Nenhum resultado encontrado
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2 h-px bg-slate-100 dark:bg-slate-800 w-full" />
            </div>
          )}

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
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, email: val });
                  if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    setErrors(prev => ({ ...prev, email: 'E-mail inválido' }));
                  } else {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }}
                placeholder="joao@email.com"
                className={cn(
                  "w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                  errors.email ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                )}
              />
              {errors.email && <p className="text-[10px] font-bold text-rose-500">{errors.email}</p>}
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
            <div className="flex flex-col gap-2">
              <div className="relative group">
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  className={cn(
                    "w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all",
                    errors.address ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                  )}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={isGeocoding}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-[#fdb612]/10 hover:text-[#fdb612] transition-all border border-slate-200 dark:border-slate-800 font-bold text-xs disabled:opacity-50"
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-3 h-3" />
                      Buscar por Endereço
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setFormData({
                            ...formData,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                          });
                        },
                        (error) => {
                          console.error('Geolocation error:', error);
                          alert('Não foi possível obter sua localização atual.');
                        }
                      );
                    }
                  }}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-[#fdb612]/10 hover:text-[#fdb612] transition-all border border-slate-200 dark:border-slate-800"
                  title="Usar minha localização atual"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
            {errors.address && <p className="text-[10px] font-bold text-rose-500">{errors.address}</p>}
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

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tipo de Cliente</label>
              <select
                value={formData.type || 'residential'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Client['type'] })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
              >
                <option value="residential">Residencial</option>
                <option value="rural">Rural</option>
                <option value="industrial">Industrial</option>
                <option value="commercial">Comercial</option>
                <option value="public">Público</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-[#fdb612]" />
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                placeholder="-23.5505"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-[#fdb612]" />
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                placeholder="-46.6333"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
              />
            </div>
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
