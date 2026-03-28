import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Plus, 
  Upload, 
  Search, 
  Settings, 
  Zap, 
  DollarSign, 
  Package, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  FileText,
  LayoutGrid,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  Lock,
  User,
  Key,
  Globe,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Kit } from '../types';
import { createDocument, updateDocument, deleteDocument } from '../firestoreUtils';

import { NewKitModal } from './NewKitModal';

interface KitsViewProps {
  kits: Kit[];
  targetPower?: number;
}

export const KitsView: React.FC<KitsViewProps> = ({ kits, targetPower: initialTargetPower }) => {
  const [activeSubView, setActiveSubView] = useState<'list' | 'upload' | 'fortlev'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [targetPower, setTargetPower] = useState<number | ''>(initialTargetPower || '');
  const [prioritizeTargetPower, setPrioritizeTargetPower] = useState(false);
  const [expandedKitId, setExpandedKitId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [fortlevAuth, setFortlevAuth] = useState({ email: '', password: '' });
  const [isFortlevConnected, setIsFortlevConnected] = useState(false);
  const [fortlevKits, setFortlevKits] = useState<any[]>([]);
  const [fortlevSearchTerm, setFortlevSearchTerm] = useState('');
  const [isFortlevLoading, setIsFortlevLoading] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFortlevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fortlevAuth.email)) {
      showToast('Por favor, insira um e-mail válido.');
      return;
    }

    setIsFortlevLoading(true);
    try {
      const response = await fetch('/api/fortlev/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fortlevAuth)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsFortlevConnected(true);
        showToast(`Conectado à Fortlev como ${data.user.name}!`);
        
        const kitsResponse = await fetch('/api/fortlev/kits');
        const kitsData = await kitsResponse.json();
        setFortlevKits(kitsData);
      } else {
        showToast(data.message || 'Erro ao conectar à Fortlev.');
      }
    } catch (error) {
      showToast('Erro ao conectar à Fortlev.');
    } finally {
      setIsFortlevLoading(false);
    }
  };

  const handleImportFortlevKit = async (kit: any) => {
    try {
      await createDocument('kits', {
        ...kit,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      showToast(`Kit ${kit.name} importado da Fortlev!`);
    } catch (error) {
      showToast('Erro ao importar kit.');
    }
  };

  const handleEditKit = (kit: Kit) => {
    setSelectedKit(kit);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast(`Processando arquivo: ${file.name}...`);

    // Simulate parsing and uploading
    setTimeout(async () => {
      try {
        // Mock data from CSV/XLSX
        const mockKits = [
          { name: 'Kit Upload 1', power: 5.5, price: 15000, description: 'Importado via planilha', components: [{ name: 'Painel', quantity: 10, brand: 'Jinko', model: 'Tiger' }] },
          { name: 'Kit Upload 2', power: 8.2, price: 22000, description: 'Importado via planilha', components: [{ name: 'Inversor', quantity: 1, brand: 'Deye', model: 'Hybrid' }] }
        ];

        for (const kit of mockKits) {
          await createDocument('kits', {
            ...kit,
            status: 'active',
            createdAt: new Date().toISOString()
          });
        }

        showToast(`${mockKits.length} kits importados com sucesso!`);
        setActiveSubView('list');
      } catch (error) {
        showToast('Erro ao importar kits.');
      } finally {
        setIsUploading(false);
      }
    }, 2000);
  };

  const filteredKits = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const brandLower = filterBrand.toLowerCase();
    const modelLower = filterModel.toLowerCase();

    return kits.filter(k => {
      const matchesText = k.name.toLowerCase().includes(searchLower) ||
                         k.description.toLowerCase().includes(searchLower);
      
      const matchesBrand = !filterBrand || k.components?.some(c => c.brand?.toLowerCase().includes(brandLower));
      const matchesModel = !filterModel || k.components?.some(c => c.model?.toLowerCase().includes(modelLower));

      // Check if search term is a number and matches power
      const searchNum = parseFloat(searchTerm);
      const matchesPower = !isNaN(searchNum) && k.power.toString().includes(searchTerm);

      // Check components array if it exists
      const componentsMatch = k.components?.some((comp: any) => 
        comp.brand?.toLowerCase().includes(searchLower) || 
        comp.model?.toLowerCase().includes(searchLower) ||
        comp.name?.toLowerCase().includes(searchLower)
      );

      return (matchesText || matchesPower || componentsMatch) && matchesBrand && matchesModel;
    }).sort((a, b) => {
      if (prioritizeTargetPower && targetPower !== '') {
        const diffA = Math.abs(a.power - Number(targetPower));
        const diffB = Math.abs(b.power - Number(targetPower));
        return diffA - diffB;
      }
      return 0;
    });
  }, [kits, searchTerm, filterBrand, filterModel, prioritizeTargetPower, targetPower]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBrand, filterModel, prioritizeTargetPower, targetPower]);

  const paginatedKits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredKits.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredKits, currentPage]);

  const totalPages = Math.ceil(filteredKits.length / itemsPerPage);

  const filteredFortlevKits = useMemo(() => {
    const searchLower = fortlevSearchTerm.toLowerCase();
    return fortlevKits.filter(k => {
      return k.name.toLowerCase().includes(searchLower) || 
             k.power.toString().includes(searchLower) ||
             k.description?.toLowerCase().includes(searchLower);
    });
  }, [fortlevKits, fortlevSearchTerm]);

  const handleDeleteKit = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o kit "${name}"?`)) {
      try {
        await deleteDocument('kits', id);
        showToast('Kit removido com sucesso!');
      } catch (error) {
        console.error(error);
        showToast('Erro ao remover kit.');
      }
    }
  };

  const handleUpdateComponent = async (kitId: string, components: any[]) => {
    // Optimistic update
    const updatedKits = kits.map(k => k.id === kitId ? { ...k, components } : k);
    // This is handled by syncCollection, but we can update local state if needed
    // However, since we use syncCollection, it will update automatically when Firestore updates.
    // To avoid flicker, we could use a local state for the components being edited.
    
    try {
      await updateDocument('kits', kitId, { components, updatedAt: new Date().toISOString() });
      showToast('Componentes atualizados!');
    } catch (error) {
      showToast('Erro ao atualizar componentes.');
    }
  };

  // Debounced version of handleUpdateComponent
  const debouncedUpdateComponent = useMemo(
    () => {
      let timeout: any;
      return (kitId: string, components: any[]) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          handleUpdateComponent(kitId, components);
        }, 1000);
      };
    },
    [kits] // Re-create if kits change to have latest data, though not strictly necessary for updateDocument
  );

  const downloadTemplate = () => {
    const headers = ['Nome', 'Potência (kWp)', 'Preço (R$)', 'Descrição', 'Componente 1 Nome', 'Componente 1 Qtd', 'Componente 1 Marca', 'Componente 1 Modelo'];
    const row = ['Exemplo Kit 5kWp', '5.0', '15000', 'Kit completo com 10 painéis', 'Painel Solar', '10', 'Jinko', 'Tiger Pro'];
    const csvContent = [headers.join(','), row.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_kits_fotovoltaicos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Modelo de planilha baixado!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-[#004a61]/10 rounded-lg text-[#004a61]">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">Kits</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gerenciamento de kits fotovoltaicos e componentes.</p>
        </div>
      </header>

      {/* Sub-navigation based on the image */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setActiveSubView('list')}
          className={cn(
            "flex items-center gap-4 p-6 rounded-xl transition-all font-black uppercase tracking-widest text-sm",
            activeSubView === 'list' 
              ? "bg-[#004a61] text-white shadow-lg shadow-[#004a61]/20" 
              : "bg-white dark:bg-[#231d0f]/40 text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          )}
        >
          <Box className="w-6 h-6" />
          <span>Meus Kits</span>
        </button>

        <button 
          onClick={() => {
            setSelectedKit(null);
            setIsModalOpen(true);
          }}
          className={cn(
            "flex items-center gap-4 p-6 rounded-xl transition-all font-black uppercase tracking-widest text-sm",
            isModalOpen && !selectedKit
              ? "bg-[#004a61] text-white shadow-lg shadow-[#004a61]/20" 
              : "bg-white dark:bg-[#231d0f]/40 text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          )}
        >
          <Plus className="w-6 h-6" />
          <span>Registrar Kit</span>
        </button>

        <button 
          onClick={() => setActiveSubView('upload')}
          className={cn(
            "flex items-center gap-4 p-6 rounded-xl transition-all font-black uppercase tracking-widest text-sm",
            activeSubView === 'upload' 
              ? "bg-[#004a61] text-white shadow-lg shadow-[#004a61]/20" 
              : "bg-white dark:bg-[#231d0f]/40 text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          )}
        >
          <Upload className="w-6 h-6" />
          <span>Upload de Kits</span>
        </button>

        <button 
          onClick={() => setActiveSubView('fortlev')}
          className={cn(
            "flex items-center gap-4 p-6 rounded-xl transition-all font-black uppercase tracking-widest text-sm",
            activeSubView === 'fortlev' 
              ? "bg-[#004a61] text-white shadow-lg shadow-[#004a61]/20" 
              : "bg-white dark:bg-[#231d0f]/40 text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          )}
        >
          <Globe className="w-6 h-6" />
          <span>Fortlev API</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        {activeSubView === 'list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Lista de Kits</h3>
              <div className="text-xs font-bold text-slate-400">
                {filteredKits.length} kits encontrados
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar kits por nome ou potência..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marca</label>
                <input 
                  type="text" 
                  placeholder="Filtrar por marca..."
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modelo</label>
                <input 
                  type="text" 
                  placeholder="Filtrar por modelo..."
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Potência Alvo (kWp)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 5.5"
                  value={targetPower}
                  onChange={(e) => setTargetPower(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] w-32"
                />
              </div>
              <div className="flex items-center gap-2 pb-3">
                <input 
                  type="checkbox" 
                  id="prioritize"
                  checked={prioritizeTargetPower}
                  onChange={(e) => setPrioritizeTargetPower(e.target.checked)}
                  className="size-4 accent-[#004a61]"
                />
                <label htmlFor="prioritize" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  Priorizar Potência Próxima
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      Ordena os kits pela proximidade da potência (kWp) em relação ao valor definido no campo "Potência Alvo".
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedKits.map((kit) => (
                <div key={kit.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 hover:border-[#fdb612]/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#004a61] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start">
                    <div className="size-12 rounded-xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612]">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditKit(kit)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-[#004a61] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteKit(kit.id, kit.name)}
                        className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-[#004a61] transition-colors">{kit.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">{kit.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800/50">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Potência Total</span>
                      <p className="text-xl font-black text-[#004a61]">{kit.power} <span className="text-[10px] font-bold">kWp</span></p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Investimento</span>
                      <p className="text-xl font-black text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kit.price)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => setExpandedKitId(expandedKitId === kit.id ? null : kit.id)}
                      className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#004a61] transition-colors"
                    >
                      <span>Componentes do Kit</span>
                      {expandedKitId === kit.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    
                    <div className={cn(
                      "space-y-4 overflow-hidden transition-all duration-300",
                      expandedKitId === kit.id ? "max-h-[800px] opacity-100 pt-4" : "max-h-0 opacity-0"
                    )}>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#004a61]">Descrição Completa</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                          {kit.description || "Sem descrição adicional."}
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Data de Criação</span>
                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {new Date(kit.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Status</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[8px] font-black uppercase">
                              {kit.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#004a61] px-1">Lista de Componentes</h4>
                        {kit.components.map((comp, idx) => (
                          <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{comp.name}</span>
                              <span className="text-[10px] font-black text-[#004a61]">x{comp.quantity}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Marca</span>
                                <input 
                                  type="text"
                                  defaultValue={comp.brand}
                                  onChange={(e) => {
                                    const newComps = [...kit.components];
                                    newComps[idx] = { ...newComps[idx], brand: e.target.value };
                                    debouncedUpdateComponent(kit.id, newComps);
                                  }}
                                  className="w-full text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#004a61]"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Modelo</span>
                                <input 
                                  type="text"
                                  defaultValue={comp.model}
                                  onChange={(e) => {
                                    const newComps = [...kit.components];
                                    newComps[idx] = { ...newComps[idx], model: e.target.value };
                                    debouncedUpdateComponent(kit.id, newComps);
                                  }}
                                  className="w-full text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#004a61]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {expandedKitId !== kit.id && (
                      <div className="space-y-2">
                        {kit.components.slice(0, 3).map((comp, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] font-medium">
                            <div className="flex items-center gap-2 truncate">
                              <div className="size-1.5 rounded-full bg-[#fdb612]" />
                              <span className="text-slate-700 dark:text-slate-300 truncate">{comp.name}</span>
                            </div>
                            <span className="text-slate-400 font-bold">x{comp.quantity}</span>
                          </div>
                        ))}
                        {kit.components.length > 3 && (
                          <p className="text-[10px] text-slate-400 font-bold italic pl-3.5">+ {kit.components.length - 3} outros itens...</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "size-10 rounded-xl font-bold text-sm transition-all",
                        currentPage === page
                          ? "bg-[#004a61] text-white shadow-lg shadow-[#004a61]/20"
                          : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeSubView === 'fortlev' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {!isFortlevConnected ? (
              <div className="max-w-md mx-auto p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="size-16 bg-[#004a61]/10 rounded-2xl flex items-center justify-center text-[#004a61] mx-auto mb-4">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black">Conectar Fortlev</h3>
                  <p className="text-sm text-slate-500">Insira suas credenciais da plataforma Fortlev para importar kits.</p>
                </div>

                <form onSubmit={handleFortlevLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required
                        type="email" 
                        value={fortlevAuth.email}
                        onChange={(e) => setFortlevAuth({ ...fortlevAuth, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61]"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Senha</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required
                        type="password" 
                        value={fortlevAuth.password}
                        onChange={(e) => setFortlevAuth({ ...fortlevAuth, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61]"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isFortlevLoading}
                    className="w-full py-4 bg-[#004a61] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isFortlevLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Conectar Agora
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <h3 className="text-xl font-black uppercase tracking-widest">Kits Disponíveis na Fortlev</h3>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Buscar na Fortlev..."
                        value={fortlevSearchTerm}
                        onChange={(e) => setFortlevSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#004a61]"
                      />
                    </div>
                    <button 
                      onClick={() => setIsFortlevConnected(false)}
                      className="text-xs font-bold text-rose-500 hover:underline whitespace-nowrap"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredFortlevKits.map((kit) => (
                    <div key={kit.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="text-lg font-black">{kit.name}</h4>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">Disponível</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Potência</span>
                          <p className="text-xl font-black text-[#004a61]">{kit.power} kWp</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Preço</span>
                          <p className="text-xl font-black text-emerald-600">R$ {kit.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleImportFortlevKit(kit)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-[#004a61] hover:text-white rounded-xl font-bold text-xs transition-all"
                      >
                        Importar para Meus Kits
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubView === 'upload' && (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
            <div className="size-24 bg-[#004a61]/10 rounded-3xl flex items-center justify-center text-[#004a61] mx-auto mb-4">
              {isUploading ? <Loader2 className="w-12 h-12 animate-spin" /> : <Upload className="w-12 h-12" />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Importação em Massa</h3>
              <p className="text-slate-500 max-w-md mx-auto mt-2">Arraste sua planilha de kits ou clique para selecionar o arquivo. Suportamos formatos .CSV e .XLSX.</p>
            </div>
            
            <label className="block border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 hover:border-[#fdb612] transition-all cursor-pointer group">
              <input 
                type="file" 
                className="hidden" 
                accept=".csv, .xlsx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <div className="space-y-4">
                <FileText className="w-12 h-12 text-slate-300 mx-auto group-hover:text-[#fdb612] transition-colors" />
                <div className="text-sm font-bold text-slate-400">
                  {isUploading ? (
                    <span className="text-blue-500 animate-pulse">Processando...</span>
                  ) : (
                    <>
                      <span className="text-[#004a61] hover:underline">Clique para fazer upload</span> ou arraste e solte
                    </>
                  )}
                </div>
              </div>
            </label>

            <div className="pt-8">
              <button 
                onClick={downloadTemplate}
                className="text-xs font-black text-[#004a61] hover:underline uppercase tracking-widest"
              >
                Baixar Modelo de Planilha
              </button>
            </div>
          </div>
        )}
      </div>

      <NewKitModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kit={selectedKit}
        showToast={showToast}
      />
    </div>
  );
};
