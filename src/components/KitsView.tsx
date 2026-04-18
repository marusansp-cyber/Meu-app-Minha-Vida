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
  ChevronRight,
  AlertTriangle,
  X
} from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../lib/utils';
import { Kit } from '../types';
import { createDocument, updateDocument, deleteDocument } from '../firestoreUtils';

import { NewKitModal } from './NewKitModal';

interface KitsViewProps {
  kits: Kit[];
  targetPower?: number;
}

export const KitsView: React.FC<KitsViewProps> = ({ kits, targetPower: initialTargetPower }) => {
  const [activeSubView, setActiveSubView] = useState<'list' | 'upload'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInverterBrand, setFilterInverterBrand] = useState<string[]>([]);
  const [filterPanelModel, setFilterPanelModel] = useState<string[]>([]);
  const [showInverterFilter, setShowInverterFilter] = useState(false);
  const [showPanelFilter, setShowPanelFilter] = useState(false);
  const [targetPower, setTargetPower] = useState<number | ''>(initialTargetPower || '');
  const [prioritizeTargetPower, setPrioritizeTargetPower] = useState(false);
  const [expandedKitId, setExpandedKitId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        let successCount = 0;
        let errorCount = 0;

        try {
          for (const row of data) {
            const name = row['Nome'] || row['nome'];
            if (!name) continue;

            const power = parseFloat(row['Potência (kWp)'] || row['potencia'] || '0');
            const price = parseFloat(row['Preço (R$)'] || row['preco'] || '0');
            const description = row['Descrição'] || row['descricao'] || '';

            const components: any[] = [];
            // Extract components from columns like "Componente 1 Nome", "Componente 1 Qtd", etc.
            for (let i = 1; i <= 10; i++) {
              const compName = row[`Componente ${i} Nome`] || row[`componente_${i}_nome`];
              if (compName) {
                components.push({
                  name: compName,
                  quantity: parseInt(row[`Componente ${i} Qtd`] || row[`componente_${i}_qtd`] || '1'),
                  brand: row[`Componente ${i} Marca`] || row[`componente_${i}_marca`] || '',
                  model: row[`Componente ${i} Modelo`] || row[`componente_${i}_modelo`] || '',
                  notes: row[`Componente ${i} Notas`] || row[`componente_${i}_notas`] || ''
                });
              }
            }

            const kitData: Omit<Kit, 'id'> = {
              name,
              power,
              price,
              description,
              components,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              panelBrand: components.find(c => c.name.toLowerCase().includes('painel') || c.name.toLowerCase().includes('módulo'))?.brand || '',
              inverterBrand: components.find(c => c.name.toLowerCase().includes('inversor'))?.brand || ''
            };

            await createDocument('kits', kitData);
            successCount++;
          }

          showToast(`${successCount} kits importados com sucesso!`);
          setActiveSubView('list');
        } catch (error) {
          console.error('Error importing kits:', error);
          showToast('Erro ao importar kits.');
        } finally {
          setIsUploading(false);
          // Reset file input
          e.target.value = '';
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        showToast('Erro ao processar planilha.');
        setIsUploading(false);
      }
    });
  };

  const availableInverterBrands = useMemo(() => {
    const brands = new Set<string>();
    kits.forEach(k => {
      if (k.inverterBrand) brands.add(k.inverterBrand);
      k.components?.forEach(c => {
        if (c.name.toLowerCase().includes('inversor') && c.brand) brands.add(c.brand);
      });
    });
    return Array.from(brands).sort();
  }, [kits]);
  
  const availablePanelModels = useMemo(() => {
    const models = new Set<string>();
    kits.forEach(k => {
      k.components?.forEach(c => {
        if ((c.name.toLowerCase().includes('painel') || c.name.toLowerCase().includes('módulo')) && c.model) {
          models.add(c.model);
        }
      });
    });
    return Array.from(models).sort();
  }, [kits]);

  const filteredKits = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return kits.filter(k => {
      const matchesText = k.name.toLowerCase().includes(searchLower) ||
                         k.description.toLowerCase().includes(searchLower);
      
      const matchesInverter = filterInverterBrand.length === 0 || 
                           (k.inverterBrand && filterInverterBrand.includes(k.inverterBrand)) ||
                           k.components?.some(c => c.name.toLowerCase().includes('inversor') && c.brand && filterInverterBrand.includes(c.brand));
                           
      const matchesPanel = filterPanelModel.length === 0 || 
                          k.components?.some(c => (c.name.toLowerCase().includes('painel') || c.name.toLowerCase().includes('módulo')) && c.model && filterPanelModel.includes(c.model));

      // Check if search term is a number and matches power
      const searchNum = parseFloat(searchTerm);
      const matchesPower = !isNaN(searchNum) && k.power.toString().includes(searchTerm);

      // Check components array if it exists
      const componentsMatch = k.components?.some((comp: any) => 
        comp.brand?.toLowerCase().includes(searchLower) || 
        comp.model?.toLowerCase().includes(searchLower) ||
        comp.name?.toLowerCase().includes(searchLower)
      );

      return (matchesText || matchesPower || componentsMatch) && matchesInverter && matchesPanel;
    }).sort((a, b) => {
      if (prioritizeTargetPower && targetPower !== '') {
        const diffA = Math.abs(a.power - Number(targetPower));
        const diffB = Math.abs(b.power - Number(targetPower));
        return diffA - diffB;
      }
      return 0;
    });
  }, [kits, searchTerm, filterInverterBrand, filterPanelModel, prioritizeTargetPower, targetPower]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterInverterBrand, filterPanelModel, prioritizeTargetPower, targetPower]);

  const paginatedKits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredKits.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredKits, currentPage]);

  const totalPages = Math.ceil(filteredKits.length / itemsPerPage);

  const [kitToDelete, setKitToDelete] = useState<{ id: string, name: string } | null>(null);

  const handleDeleteKit = async (id: string) => {
    try {
      await deleteDocument('kits', id);
      showToast('Kit removido com sucesso!');
    } catch (error) {
      console.error(error);
      showToast('Erro ao remover kit.');
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  value={searchTerm || ''}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] transition-all"
                />
              </div>
              <div className="space-y-1 relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inversores</label>
                <div className="relative">
                  <button 
                    onClick={() => setShowInverterFilter(!showInverterFilter)}
                    className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] min-w-[160px]"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                      {filterInverterBrand.length === 0 ? 'Todas Marcas' : `${filterInverterBrand.length} Sel.`}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showInverterFilter && "rotate-180")} />
                  </button>

                  {showInverterFilter && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowInverterFilter(false)} />
                      <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        <button 
                          onClick={() => {
                            setFilterInverterBrand([]);
                            setShowInverterFilter(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors mb-1",
                            filterInverterBrand.length === 0 ? "bg-[#fdb612]/10 text-[#fdb612]" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500"
                          )}
                        >
                          Todas as Marcas
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                        {availableInverterBrands.map(brand => (
                          <label key={brand} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                            <input 
                              type="checkbox"
                              checked={filterInverterBrand.includes(brand)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterInverterBrand([...filterInverterBrand, brand]);
                                } else {
                                  setFilterInverterBrand(filterInverterBrand.filter(b => b !== brand));
                                }
                              }}
                              className="size-4 rounded border-slate-300 text-[#004a61] focus:ring-[#004a61]"
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1 relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Painéis</label>
                <div className="relative">
                  <button 
                    onClick={() => setShowPanelFilter(!showPanelFilter)}
                    className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] min-w-[160px]"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                      {filterPanelModel.length === 0 ? 'Todos Modelos' : `${filterPanelModel.length} Sel.`}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showPanelFilter && "rotate-180")} />
                  </button>

                  {showPanelFilter && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowPanelFilter(false)} />
                      <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        <button 
                          onClick={() => {
                            setFilterPanelModel([]);
                            setShowPanelFilter(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors mb-1",
                            filterPanelModel.length === 0 ? "bg-[#fdb612]/10 text-[#fdb612]" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500"
                          )}
                        >
                          Todos os Modelos
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                        {availablePanelModels.map(model => (
                          <label key={model} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                            <input 
                              type="checkbox"
                              checked={filterPanelModel.includes(model)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterPanelModel([...filterPanelModel, model]);
                                } else {
                                  setFilterPanelModel(filterPanelModel.filter(m => m !== model));
                                }
                              }}
                              className="size-4 rounded border-slate-300 text-[#004a61] focus:ring-[#004a61]"
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">{model}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Potência Alvo (kWp)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 5.5"
                  value={targetPower === '' ? '' : targetPower}
                  onChange={(e) => setTargetPower(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] w-32"
                />
              </div>
              <div className="flex items-center gap-2 pb-3">
                <input 
                  type="checkbox" 
                  id="prioritize"
                  checked={prioritizeTargetPower || false}
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
                        onClick={() => setKitToDelete({ id: kit.id, name: kit.name })}
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
                              <div className="col-span-2 space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Notas / Observações</span>
                                <input 
                                  type="text"
                                  defaultValue={comp.notes}
                                  placeholder="Observações específicas..."
                                  onChange={(e) => {
                                    const newComps = [...kit.components];
                                    newComps[idx] = { ...newComps[idx], notes: e.target.value };
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

      {/* Confirmation Modal */}
      {kitToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#231d0f] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <button 
                  onClick={() => setKitToDelete(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Tem certeza que deseja excluir o kit <span className="font-bold text-slate-900 dark:text-slate-100">"{kitToDelete.name}"</span>? 
                Esta ação não pode ser desfeita.
              </p>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <button 
                onClick={() => setKitToDelete(null)}
                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleDeleteKit(kitToDelete.id);
                  setKitToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Excluir Kit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
