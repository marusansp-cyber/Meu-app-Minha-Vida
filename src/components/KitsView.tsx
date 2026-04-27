import React, { useState, useMemo, useEffect } from 'react';
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
  Download,
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
import { generateKitsReportPDF } from '../services/pdfService';

import { NewKitModal } from './NewKitModal';

interface KitsViewProps {
  kits: Kit[];
  targetPower?: number;
}

export const KitsView: React.FC<KitsViewProps> = ({ kits, targetPower: initialTargetPower }) => {
  const [activeSubView, setActiveSubView] = useState<'list' | 'upload'>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInverterBrand, setFilterInverterBrand] = useState<string[]>([]);
  const [filterPanelBrand, setFilterPanelBrand] = useState<string[]>([]);
  const [filterComponentBrand, setFilterComponentBrand] = useState<string[]>([]);
  const [minPower, setMinPower] = useState<number | ''>('');
  const [maxPower, setMaxPower] = useState<number | ''>('');
  const [showInverterFilter, setShowInverterFilter] = useState(false);
  const [showPanelFilter, setShowPanelFilter] = useState(false);
  const [showComponentFilter, setShowComponentFilter] = useState(false);
  const [targetPower, setTargetPower] = useState<number | ''>(initialTargetPower || '');
  const [prioritizeTargetPower, setPrioritizeTargetPower] = useState(false);
  const [expandedKitId, setExpandedKitId] = useState<string | null>(null);
  
  // CSV Mapping State
  const [uploadStep, setUploadStep] = useState<'upload' | 'mapping'>('upload');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    name: 'Nome',
    power: 'Potência (kWp)',
    price: 'Preço (R$)',
    description: 'Descrição'
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isSavingComponent, setIsSavingComponent] = useState<string | null>(null); // kitId-compIdx
  
  // Search Cache
  const searchCache = React.useRef<Record<string, Kit[]>>({});

  // Invalidate cache when raw kits data changes
  React.useEffect(() => {
    searchCache.current = {};
  }, [kits]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleKitStatus = async (kitId: string, currentStatus: string | undefined) => {
    try {
      await updateDocument('kits', kitId, {
        status: currentStatus === 'active' ? 'inactive' : 'active',
        updatedAt: new Date().toISOString()
      });
      showToast('Status do kit atualizado.');
    } catch (error) {
      showToast('Erro ao atualizar status do kit.');
    }
  };

  const handleEditKit = (kit: Kit) => {
    setSelectedKit(kit);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data);
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          
          // Try to auto-map
          const newMapping = { ...columnMapping };
          headers.forEach(h => {
            const lowerH = h.toLowerCase();
            if (lowerH.includes('nome')) newMapping.name = h;
            if (lowerH.includes('potencia') || lowerH.includes('power')) newMapping.power = h;
            if (lowerH.includes('preco') || lowerH.includes('price')) newMapping.price = h;
            if (lowerH.includes('descricao') || lowerH.includes('desc')) newMapping.description = h;
          });
          setColumnMapping(newMapping);
          setUploadStep('mapping');
        } else {
          showToast('O arquivo parece estar vazio.');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        showToast('Erro ao processar planilha.');
      }
    });
  };

  const processImport = async () => {
    // Validation
    const required = ['name', 'power', 'price'];
    const missing = required.filter(key => !columnMapping[key] || !csvHeaders.includes(columnMapping[key]));
    
    if (missing.length > 0) {
      showToast(`Colunas obrigatórias não mapeadas: ${missing.join(', ')}`);
      return;
    }

    setIsUploading(true);
    showToast(`Processando ${csvData.length} kits...`);

    let successCount = 0;
    try {
      for (const row of csvData) {
        const name = row[columnMapping.name];
        if (!name) continue;

        const power = parseFloat(row[columnMapping.power] || '0');
        const price = parseFloat(row[columnMapping.price] || '0');
        const description = row[columnMapping.description] || '';

        const components: any[] = [];
        
        // Map defined components
        for (let i = 1; i <= 3; i++) {
          const nameKey = `comp${i}Name`;
          const qtyKey = `comp${i}Qty`;
          const cName = row[columnMapping[nameKey]];
          if (cName) {
            components.push({
              name: cName,
              quantity: parseInt(row[columnMapping[qtyKey]] || '1'),
              brand: '',
              model: '',
              notes: ''
            });
          }
        }

        // Also check if pattern from previous implementation is still useful as backup
        if (components.length === 0) {
          for (let i = 1; i <= 10; i++) {
            const cName = row[`Componente ${i} Nome`] || row[`componente_${i}_nome`];
            if (cName) {
              components.push({
                name: cName,
                quantity: parseInt(row[`Componente ${i} Qtd`] || row[`componente_${i}_qtd`] || '1'),
                brand: row[`Componente ${i} Marca`] || row[`componente_${i}_marca`] || '',
                model: row[`Componente ${i} Modelo`] || row[`componente_${i}_modelo`] || '',
                notes: row[`Componente ${i} Notas`] || row[`componente_${i}_notas`] || ''
              });
            }
          }
        }

        const kitData: Omit<Kit, 'id'> = {
          name,
          power,
          price,
          description,
          components: components.length > 0 ? components : [],
          status: 'active',
          createdAt: new Date().toISOString(),
          panelBrand: components.find(c => c.name.toLowerCase().includes('painel') || c.name.toLowerCase().includes('módulo'))?.brand || '',
          inverterBrand: components.find(c => c.name.toLowerCase().includes('inversor'))?.brand || ''
        };

        await createDocument('kits', kitData);
        successCount++;
      }
      showToast(`${successCount} kits importados com sucesso!`);
      setActiveSubView('list');
      setUploadStep('upload');
      setCsvData([]);
    } catch (error) {
      console.error('Error importing:', error);
      showToast('Erro ao importar dados.');
    } finally {
      setIsUploading(false);
    }
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
  
  const availablePanelBrands = useMemo(() => {
    const brands = new Set<string>();
    kits.forEach(k => {
      if (k.panelBrand) brands.add(k.panelBrand);
      k.components?.forEach(c => {
        if ((c.name.toLowerCase().includes('painel') || c.name.toLowerCase().includes('módulo')) && c.brand) {
          brands.add(c.brand);
        }
      });
    });
    return Array.from(brands).sort();
  }, [kits]);

  const availableComponentBrands = useMemo(() => {
    const brands = new Set<string>();
    kits.forEach(k => {
      k.components?.forEach(c => {
        if (c.brand) brands.add(c.brand);
      });
    });
    return Array.from(brands).sort();
  }, [kits]);

  const filteredKits = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    // Generate cache key based on all filters
    const cacheKey = JSON.stringify({
      searchTerm,
      filterInverterBrand,
      filterPanelBrand,
      filterComponentBrand,
      minPower,
      maxPower,
      prioritizeTargetPower,
      targetPower
    });

    if (searchCache.current[cacheKey]) {
      return searchCache.current[cacheKey];
    }

    const results = kits.filter(k => {
      const matchesText = k.name.toLowerCase().includes(searchLower) ||
                         k.description.toLowerCase().includes(searchLower);
      
      const priceStr = k.price.toString();
      const matchesPrice = priceStr.includes(searchTerm);
      
      const matchesInverter = filterInverterBrand.length === 0 || 
                           (k.inverterBrand && filterInverterBrand.includes(k.inverterBrand)) ||
                           k.components?.some(c => c.name.toLowerCase().includes('inversor') && c.brand && filterInverterBrand.includes(c.brand));
                           
      const matchesPanel = filterPanelBrand.length === 0 || 
                          (k.panelBrand && filterPanelBrand.includes(k.panelBrand)) ||
                          k.components?.some(c => (c.name.toLowerCase().includes('painel') || c.name.toLowerCase().includes('módulo')) && c.brand && filterPanelBrand.includes(c.brand));

      const matchesComponentBrand = filterComponentBrand.length === 0 ||
                                   k.components?.some(c => c.brand && filterComponentBrand.includes(c.brand));

      const matchesMinPower = minPower === '' || k.power >= Number(minPower);
      const matchesMaxPower = maxPower === '' || k.power <= Number(maxPower);

      // Check if search term is a number and matches power
      const searchNum = parseFloat(searchTerm);
      const matchesPower = !isNaN(searchNum) && k.power.toString().includes(searchTerm);

      // Check components array if it exists
      const componentsMatch = k.components?.some((comp: any) => 
        comp.brand?.toLowerCase().includes(searchLower) || 
        comp.model?.toLowerCase().includes(searchLower) ||
        comp.name?.toLowerCase().includes(searchLower) ||
        comp.notes?.toLowerCase().includes(searchLower)
      );

      return (matchesText || matchesPower || matchesPrice || componentsMatch) && 
             matchesInverter && matchesPanel && matchesComponentBrand && matchesMinPower && matchesMaxPower;
    }).sort((a, b) => {
      if (prioritizeTargetPower && targetPower !== '') {
        const diffA = Math.abs(a.power - Number(targetPower));
        const diffB = Math.abs(b.power - Number(targetPower));
        return diffA - diffB;
      }
      return 0;
    });

    // Store in cache
    searchCache.current[cacheKey] = results;
    // Limit cache size
    const keys = Object.keys(searchCache.current);
    if (keys.length > 50) {
      delete searchCache.current[keys[0]];
    }

    return results;
  }, [kits, searchTerm, filterInverterBrand, filterPanelBrand, filterComponentBrand, prioritizeTargetPower, targetPower, minPower, maxPower]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterInverterBrand, filterPanelBrand, filterComponentBrand, prioritizeTargetPower, targetPower, minPower, maxPower]);

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

  const handleDeleteAllKits = async () => {
    if (kits.length === 0) return;
    setIsDeletingAll(true);
    try {
      for (const kit of kits) {
        await deleteDocument('kits', kit.id);
      }
      showToast(`${kits.length} kits removidos com sucesso!`);
      setShowDeleteAllConfirm(false);
    } catch (error) {
      console.error(error);
      showToast('Erro ao remover todos os kits.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleUpdateComponent = async (kitId: string, components: any[]) => {
    try {
      await updateDocument('kits', kitId, { components, updatedAt: new Date().toISOString() });
      // Successful save - indicator will be cleared by the debounced caller
    } catch (error) {
      showToast('Erro ao atualizar componentes.');
    }
  };

  const debouncedUpdateComponent = useMemo(
    () => {
      let timeout: any;
      return (kitId: string, components: any[], compIdx: number) => {
        setIsSavingComponent(`${kitId}-${compIdx}`);
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(async () => {
          await handleUpdateComponent(kitId, components);
          setIsSavingComponent(null);
        }, 1000);
      };
    },
    [kits]
  );

  const handleExportPdf = async () => {
    if (filteredKits.length === 0) {
      showToast('Nenhum kit para exportar.');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const pdfData = await generateKitsReportPDF(filteredKits);
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = `relatorio_kits_${new Date().getTime()}.pdf`;
      link.click();
      showToast('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error(error);
      showToast('Erro ao gerar PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Lista de Kits</h3>
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                      viewMode === 'grid' ? "bg-white dark:bg-slate-800 text-[#004a61] shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grade</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('table')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                      viewMode === 'table' ? "bg-white dark:bg-slate-800 text-[#004a61] shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Lista</span>
                  </button>
                </div>
                <button 
                  onClick={handleExportPdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#004a61]/10 hover:bg-[#004a61] text-[#004a61] hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Exportar PDF
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs font-bold text-slate-400">
                  {filteredKits.length} kits encontrados
                </div>
                {kits.length > 0 && (
                  <button 
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Tudo
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Pesquisa inteligente: Nome, potência, marca ou nota de componente..."
                  value={searchTerm || ''}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] transition-all font-medium"
                />
              </div>
              <div className="space-y-1 relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Inversores</label>
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowInverterFilter(!showInverterFilter);
                      setShowPanelFilter(false);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] min-w-[160px] transition-all",
                      filterInverterBrand.length > 0 && "border-[#004a61] ring-1 ring-[#004a61]/30"
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                      {filterInverterBrand.length === 0 ? 'Todas Marcas' : `${filterInverterBrand.length} Sel.`}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showInverterFilter && "rotate-180")} />
                  </button>

                  {showInverterFilter && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowInverterFilter(false)} />
                      <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 p-2 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                        {filterInverterBrand.length > 0 && (
                          <button 
                            onClick={() => setFilterInverterBrand([])}
                            className="w-full text-left px-4 py-2 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg mb-2 flex items-center justify-between"
                          >
                            Limpar Seleção
                            <X className="w-3 h-3" />
                          </button>
                        )}
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Módulos</label>
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowPanelFilter(!showPanelFilter);
                      setShowInverterFilter(false);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] min-w-[160px] transition-all",
                      filterPanelBrand.length > 0 && "border-[#004a61] ring-1 ring-[#004a61]/30"
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                      {filterPanelBrand.length === 0 ? 'Todas Marcas' : `${filterPanelBrand.length} Sel.`}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showPanelFilter && "rotate-180")} />
                  </button>

                  {showPanelFilter && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowPanelFilter(false)} />
                      <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 p-2 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                        {filterPanelBrand.length > 0 && (
                          <button 
                            onClick={() => setFilterPanelBrand([])}
                            className="w-full text-left px-4 py-2 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg mb-2 flex items-center justify-between"
                          >
                            Limpar Seleção
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        {availablePanelBrands.map(brand => (
                          <label key={brand} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                            <input 
                              type="checkbox"
                              checked={filterPanelBrand.includes(brand)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterPanelBrand([...filterPanelBrand, brand]);
                                } else {
                                  setFilterPanelBrand(filterPanelBrand.filter(b => b !== brand));
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Marcas Extras</label>
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowComponentFilter(!showComponentFilter);
                      setShowInverterFilter(false);
                      setShowPanelFilter(false);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] min-w-[160px] transition-all",
                      filterComponentBrand.length > 0 && "border-[#004a61] ring-1 ring-[#004a61]/30"
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                      {filterComponentBrand.length === 0 ? 'Outras Marcas' : `${filterComponentBrand.length} Sel.`}
                    </span>
                    <span className="flex items-center justify-center size-5 bg-slate-100 dark:bg-slate-800 rounded-full group">
                      <Filter className="w-3 h-3 text-slate-400 group-hover:text-[#004a61]" />
                    </span>
                  </button>

                  {showComponentFilter && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowComponentFilter(false)} />
                      <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 p-2 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                        {filterComponentBrand.length > 0 && (
                          <button 
                            onClick={() => setFilterComponentBrand([])}
                            className="w-full text-left px-4 py-2 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg mb-2 flex items-center justify-between"
                          >
                            Limpar Seleção
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        {availableComponentBrands.map(brand => (
                          <label key={brand} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                            <input 
                              type="checkbox"
                              checked={filterComponentBrand.includes(brand)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterComponentBrand([...filterComponentBrand, brand]);
                                } else {
                                  setFilterComponentBrand(filterComponentBrand.filter(b => b !== brand));
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
              <div className="flex gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min kWp</label>
                  <input 
                    type="number" 
                    placeholder="Min"
                    value={minPower}
                    onChange={(e) => setMinPower(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] w-20 text-[10px] font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max kWp</label>
                  <input 
                    type="number" 
                    placeholder="Max"
                    value={maxPower}
                    onChange={(e) => setMaxPower(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#004a61] w-20 text-[10px] font-bold"
                  />
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

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedKits.map((kit) => (
                  <div key={kit.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 hover:border-[#fdb612]/50 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#004a61] opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start">
                      <div className="relative group/img">
                        {(kit.panelImage || kit.inverterImage) ? (
                          <div className="flex -space-x-4 mb-2">
                            {kit.panelImage && (
                              <div className="size-12 rounded-xl overflow-hidden border-2 border-white dark:border-slate-900 bg-white">
                                <img src={kit.panelImage} alt="Painel" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            {kit.inverterImage && (
                              <div className="size-12 rounded-xl overflow-hidden border-2 border-white dark:border-slate-900 bg-white shadow-lg">
                                <img src={kit.inverterImage} alt="Inversor" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="size-12 rounded-xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612]">
                            <Zap className="w-6 h-6" />
                          </div>
                        )}
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
                              <button
                                onClick={() => toggleKitStatus(kit.id, kit.status)}
                                className={cn(
                                  "px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1",
                                  kit.status === 'active' 
                                    ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" 
                                    : "bg-rose-100 text-rose-600 hover:bg-rose-200"
                                )}
                              >
                                {kit.status === 'active' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                                {kit.status === 'active' ? 'Ativo' : 'Inativo'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#004a61] px-1">Lista de Componentes</h4>
                          {kit.components.map((comp, idx) => (
                            <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{comp.name}</span>
                                <div className="flex items-center gap-2">
                                  {isSavingComponent === `${kit.id}-${idx}` && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[8px] font-black uppercase text-[#004a61] animate-pulse">Salvando</span>
                                      <Loader2 className="w-3 h-3 text-[#004a61] animate-spin" />
                                    </div>
                                  )}
                                  <span className="text-[10px] font-black text-[#004a61]">x{comp.quantity}</span>
                                </div>
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
                                      debouncedUpdateComponent(kit.id, newComps, idx);
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
                                      debouncedUpdateComponent(kit.id, newComps, idx);
                                    }}
                                    className="w-full text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#004a61]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Quantidade</span>
                                  <input 
                                    type="number"
                                    defaultValue={comp.quantity}
                                    onChange={(e) => {
                                      const newComps = [...kit.components];
                                      newComps[idx] = { ...newComps[idx], quantity: parseInt(e.target.value) || 0 };
                                      debouncedUpdateComponent(kit.id, newComps, idx);
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
                                      debouncedUpdateComponent(kit.id, newComps, idx);
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
            ) : (
              <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Kit / Potência</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Inversor / Módulo</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Investimento</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {paginatedKits.map((kit) => (
                      <tr key={kit.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-[#004a61]/5 flex items-center justify-center text-[#004a61]">
                              <Zap className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{kit.name}</p>
                              <p className="text-[10px] font-bold text-[#004a61] uppercase tracking-widest">{kit.power} kWp</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {kit.inverterBrand && (
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase text-slate-400">INV:</span>
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{kit.inverterBrand}</span>
                              </div>
                            )}
                            {kit.panelBrand && (
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase text-slate-400">MOD:</span>
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{kit.panelBrand}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kit.price)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
          <div className="max-w-4xl mx-auto py-12 text-center space-y-8">
            {uploadStep === 'upload' ? (
              <>
                <div className="size-24 bg-[#004a61]/10 rounded-3xl flex items-center justify-center text-[#004a61] mx-auto mb-4">
                  {isUploading ? <Loader2 className="w-12 h-12 animate-spin" /> : <Upload className="w-12 h-12" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Importação de Kits</h3>
                  <p className="text-slate-500 max-w-md mx-auto mt-2 font-medium">Suba sua planilha em CSV e mapeie as colunas para importar seus kits automaticamente.</p>
                </div>
                
                <label className="block border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 hover:border-[#fdb612] transition-all cursor-pointer group bg-slate-50/50 dark:bg-white/5">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <div className="space-y-4">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto group-hover:text-[#fdb612] transition-colors" />
                    <div className="text-sm font-bold text-slate-400">
                      {isUploading ? (
                        <span className="text-[#004a61] animate-pulse">Lendo arquivo...</span>
                      ) : (
                        <>
                          <span className="text-[#004a61] hover:underline uppercase tracking-widest">Clique para selecionar</span> ou arraste e solte o CSV
                        </>
                      )}
                    </div>
                  </div>
                </label>

                <div className="pt-8">
                  <button 
                    onClick={downloadTemplate}
                    className="text-[10px] font-black text-slate-400 hover:text-[#004a61] uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Modelo de Planilha (.CSV)
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 text-left">
                <div className="flex items-center justify-between p-8 bg-amber-50 dark:bg-[#fdb612]/5 rounded-[2.5rem] border border-[#fdb612]/20">
                  <div className="flex items-center gap-6">
                    <div className="size-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center text-[#fdb612] shadow-xl border border-[#fdb612]/10">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight italic">Mapeamento de Importação</h3>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{csvData.length} registros prontos para sincronização</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setUploadStep('upload');
                      setCsvData([]);
                    }}
                    className="p-3 hover:bg-white/50 dark:hover:bg-white/5 rounded-full transition-all group"
                  >
                    <X className="w-8 h-8 text-slate-400 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-[#004a61]/10 rounded-lg text-[#004a61]">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#004a61]">Definição de Colunas</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { key: 'name', label: 'Nome do Kit' },
                        { key: 'power', label: 'Potência (kWp)' },
                        { key: 'price', label: 'Preço (R$)' },
                        { key: 'description', label: 'Descrição' },
                        { key: 'comp1Name', label: 'Componente 1 - Nome' },
                        { key: 'comp1Qty', label: 'Componente 1 - Qtd' },
                        { key: 'comp2Name', label: 'Componente 2 - Nome' },
                        { key: 'comp2Qty', label: 'Componente 2 - Qtd' },
                        { key: 'comp3Name', label: 'Componente 3 - Nome' },
                        { key: 'comp3Qty', label: 'Componente 3 - Qtd' },
                      ].map(field => (
                      <div key={field.key} className="space-y-2 group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within:text-[#004a61]">{field.label}</label>
                        <select 
                          value={columnMapping[field.key]}
                          onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                          className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#004a61] transition-all font-bold text-sm"
                        >
                          <option value="">-- Ignorar ou Selecionar Coluna --</option>
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 px-1">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#004a61]">Pré-visualização</h4>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Primeiros 3 itens</span>
                    </div>

                    <div className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nome</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Potência</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Preço</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                          {csvData.slice(0, 3).map((row, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                                {row[columnMapping.name] || <span className="text-rose-500 italic opacity-50">Não mapeado</span>}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-[#004a61]">
                                {row[columnMapping.power] || '0'} kWp
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-emerald-600">
                                R$ {row[columnMapping.price] || '0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-4 space-y-4">
                      <div className="flex items-center gap-4 p-5 bg-[#004a61]/5 rounded-[2rem] border border-[#004a61]/10">
                        <div className="size-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-[#004a61] shadow-sm shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-bold text-[#004a61] leading-tight flex-1">
                          Componentes extras serão extraídos automaticamente se houver colunas começando com "Componente X Nome", "Qtd", "Marca", etc.
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <button 
                          onClick={() => {
                            setUploadStep('upload');
                            setCsvData([]);
                          }}
                          className="flex-1 py-5 border border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                          Alterar Arquivo
                        </button>
                        <button 
                          onClick={processImport}
                          disabled={isUploading}
                          className="flex-[2] py-5 bg-[#004a61] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-[#004a61]/30 hover:shadow-xl hover:shadow-[#004a61]/50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          Confirmar Importação de {csvData.length} Kits
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <NewKitModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kit={selectedKit}
        showToast={showToast}
      />

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#231d0f] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="size-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <button 
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 italic uppercase">
                Excluir Todos os Kits?
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Tem certeza que deseja excluir <span className="font-bold text-slate-900 dark:text-slate-100">{kits.length} kits</span> permanentemente? 
                Esta ação é irreversível e removerá todos os kits cadastrados no sistema.
              </p>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <button 
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteAllKits}
                disabled={isDeletingAll}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
              >
                {isDeletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

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
