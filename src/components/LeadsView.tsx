import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreHorizontal, 
  Zap, 
  DollarSign, 
  Calendar, 
  CheckCircle2,
  HardHat,
  Trash2,
  AlertTriangle,
  X,
  Mail,
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Clock,
  FileText,
  Download,
  LogOut,
  Save,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { LEADS } from '../constants';
import { cn } from '../lib/utils';
import { Lead } from '../types';

interface LeadsViewProps {
  leads: Lead[];
  onOpenNewLead: () => void;
  onDeleteLead: (id: string) => void;
  onUpdateLead: (lead: Lead) => void;
  onLogout: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ leads, onOpenNewLead, onDeleteLead, onUpdateLead, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<Lead['status'][]>(['new', 'survey', 'proposal', 'negotiation', 'closed']);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilterType, setDateFilterType] = useState<'created' | 'scheduled'>('created');
  const [selectedRepresentative, setSelectedRepresentative] = useState<string>('all');
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [leadModalTab, setLeadModalTab] = useState<'info' | 'history' | 'files'>('info');
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [newNote, setNewNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string | null>>({});

  const maskCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

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

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const representatives = Array.from(new Set(leads.map(l => l.representative).filter(Boolean))) as string[];

  React.useEffect(() => {
    const handleClickOutside = () => setActiveActionMenu(null);
    if (activeActionMenu) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeActionMenu]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const lead = leads.find(l => l.id === draggableId);
    if (lead) {
      const updatedLead: Lead = {
        ...lead,
        status: destination.droppableId as Lead['status']
      };
      onUpdateLead(updatedLead);
      showToast(`Lead ${lead.name} movido para ${columns.find(c => c.id === destination.droppableId)?.label}`);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.systemSize.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatuses.includes(lead.status);
    const matchesUrgency = onlyUrgent ? lead.urgent : true;
    const matchesRepresentative = selectedRepresentative === 'all' || lead.representative === selectedRepresentative;
    
    let matchesDate = true;
    const dateToCompare = dateFilterType === 'created' ? lead.createdAt : lead.scheduledDate;
    
    if (dateToCompare) {
      if (startDate && dateToCompare < startDate) matchesDate = false;
      if (endDate && dateToCompare > endDate) matchesDate = false;
    } else if (startDate || endDate) {
      // If there's a date filter but the lead has no date for that type, exclude it
      matchesDate = false;
    }
    
    return matchesSearch && matchesStatus && matchesUrgency && matchesDate && matchesRepresentative;
  });

  const columns: { id: Lead['status']; label: string }[] = [
    { id: 'new', label: 'Novo' },
    { id: 'survey', label: 'Vistoria' },
    { id: 'proposal', label: 'Proposta' },
    { id: 'negotiation', label: 'Negociação' },
    { id: 'closed', label: 'Fechado' },
  ];

  const chartData = columns.map(col => ({
    name: col.label,
    count: leads.filter(l => l.status === col.id).length,
    color: col.id === 'closed' ? '#10b981' : '#fdb612'
  }));

  const toggleStatus = (status: Lead['status']) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const handleEditLead = (lead: Lead) => {
    setEditForm(lead);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (selectedLead && editForm) {
      const emailErr = validateEmail(editForm.email || '');
      const phoneErr = validatePhone(editForm.phone || '');
      const valueErr = validateValue(editForm.value || '');
      
      if (emailErr || phoneErr || valueErr) {
        setEditErrors({
          email: emailErr,
          phone: phoneErr,
          value: valueErr
        });
        return;
      }

      const updatedLead = { ...selectedLead, ...editForm } as Lead;
      onUpdateLead(updatedLead);
      setSelectedLead(updatedLead);
      setIsEditing(false);
      setEditErrors({});
      showToast('Lead atualizado com sucesso!');
    }
  };

  const handleAddNote = () => {
    if (!selectedLead || !newNote.trim()) return;

    const newHistoryItem = {
      date: new Date().toLocaleString('pt-BR'),
      action: newNote,
      user: 'Marusan Pinto' // Should come from auth
    };

    const updatedLead: Lead = {
      ...selectedLead,
      history: [newHistoryItem, ...(selectedLead.history || [])]
    };

    onUpdateLead(updatedLead);
    setSelectedLead(updatedLead);
    setNewNote('');
    showToast('Nota adicionada com sucesso!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLead) return;

    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      const newFile = {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        date: new Date().toLocaleDateString('pt-BR')
      };

      const updatedLead: Lead = {
        ...selectedLead,
        files: [newFile, ...(selectedLead.files || [])]
      };

      onUpdateLead(updatedLead);
      setSelectedLead(updatedLead);
      setIsUploading(false);
      showToast('Arquivo enviado com sucesso!');
    }, 1500);
  };

  const exportToCSV = () => {
    if (filteredLeads.length === 0) {
      showToast('Nenhum lead para exportar');
      return;
    }

    const headers = ['Nome', 'Status', 'Email', 'WhatsApp', 'Sistema (kWp)', 'Valor', 'Representante', 'Data Criação'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      columns.find(c => c.id === lead.status)?.label || lead.status,
      lead.email,
      lead.whatsapp,
      lead.systemSize,
      lead.value,
      lead.representative || '',
      lead.createdAt || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exportação iniciada');
  };

  return (
    <div className="flex flex-col h-full relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-lg lg:hidden"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tight">Gestão de Leads</h2>
            <p className="text-slate-500 font-medium">Visão Geral do Pipeline e Funil de Vendas</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#231d0f] overflow-hidden">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-3 py-1.5 transition-colors",
                viewMode === 'grid' ? "bg-[#fdb612]/10 text-[#fdb612]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1.5 transition-colors",
                viewMode === 'list' ? "bg-[#fdb612]/10 text-[#fdb612]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <div className="relative flex items-center gap-2">
            {(selectedStatuses.length < 5 || onlyUrgent || searchTerm || startDate || endDate || selectedRepresentative !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatuses(['new', 'survey', 'proposal', 'negotiation', 'closed']);
                  setOnlyUrgent(false);
                  setStartDate('');
                  setEndDate('');
                  setDateFilterType('created');
                  setSelectedRepresentative('all');
                }}
                className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 px-2 py-1"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-2 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors",
                (showFilters || selectedStatuses.length < 5 || onlyUrgent || searchTerm || startDate || endDate || selectedRepresentative !== 'all') && "border-[#fdb612] text-[#fdb612]"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtrar</span>
              {(selectedStatuses.length < 5 || onlyUrgent || startDate || endDate || selectedRepresentative !== 'all') && (
                <span className="size-2 bg-[#fdb612] rounded-full" />
              )}
            </button>
            <AnimatePresence>
              {showFilters && (
                <>
                  {/* Backdrop for mobile */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowFilters(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
                  />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={cn(
                      "fixed inset-x-4 bottom-4 top-20 lg:absolute lg:inset-auto lg:right-0 lg:top-full lg:mt-2 w-auto lg:w-80 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-xl shadow-2xl p-6 lg:p-4 z-[101] lg:z-20 space-y-6 lg:space-y-4 overflow-y-auto custom-scrollbar",
                    )}
                  >
                    <div className="flex items-center justify-between lg:hidden mb-2">
                      <h3 className="text-lg font-black uppercase tracking-tight">Filtros Avançados</h3>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Busca Rápida</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Nome ou sistema..."
                          className="w-full pl-10 pr-4 py-3 lg:py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl lg:rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrar por Data</label>
                      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl lg:rounded-lg">
                        <button 
                          onClick={() => setDateFilterType('created')}
                          className={cn(
                            "flex-1 py-2 lg:py-1 text-[10px] font-bold rounded-lg lg:rounded-md transition-all",
                            dateFilterType === 'created' ? "bg-white dark:bg-slate-800 shadow-sm text-[#fdb612]" : "text-slate-500"
                          )}
                        >
                          Criação
                        </button>
                        <button 
                          onClick={() => setDateFilterType('scheduled')}
                          className={cn(
                            "flex-1 py-2 lg:py-1 text-[10px] font-bold rounded-lg lg:rounded-md transition-all",
                            dateFilterType === 'scheduled' ? "bg-white dark:bg-slate-800 shadow-sm text-[#fdb612]" : "text-slate-500"
                          )}
                        >
                          Agendamento
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Início</span>
                          <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 lg:p-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#fdb612]"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Fim</span>
                          <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-3 lg:p-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#fdb612]"
                          />
                        </div>
                      </div>
                      {(startDate || endDate) && (
                        <button 
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                          }}
                          className="w-full py-1 text-[9px] font-bold text-[#fdb612] hover:underline text-right"
                        >
                          Limpar datas
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Representante</label>
                      <select 
                        value={selectedRepresentative}
                        onChange={(e) => setSelectedRepresentative(e.target.value)}
                        className="w-full px-4 py-3 lg:px-3 lg:py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl lg:rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612] appearance-none"
                      >
                        <option value="all">Todos os Representantes</option>
                        {representatives.map(rep => (
                          <option key={rep} value={rep}>{rep}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status do Funil</label>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => setSelectedStatuses(['new', 'survey', 'proposal', 'negotiation', 'closed'])}
                            className="text-[10px] font-bold text-[#fdb612] hover:underline"
                          >
                            Todos
                          </button>
                          <button 
                            onClick={() => setSelectedStatuses([])}
                            className="text-[10px] font-bold text-slate-400 hover:underline"
                          >
                            Nenhum
                          </button>
                        </div>
                      <div className="grid grid-cols-2 gap-2">
                        {columns.map(col => (
                          <label key={col.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-[#fdb612]/20">
                            <input 
                              type="checkbox" 
                              className="size-4 lg:size-3.5 rounded border-slate-300 text-[#fdb612] focus:ring-[#fdb612]"
                              checked={selectedStatuses.includes(col.id)}
                              onChange={() => toggleStatus(col.id)}
                            />
                            <span className="text-xs font-bold">{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="flex items-center justify-between p-3 lg:p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-[#fdb612]/20">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-[#fdb612]" />
                          <span className="text-sm font-bold">Apenas Urgentes</span>
                        </div>
                        <input 
                          type="checkbox" 
                          className="size-5 lg:size-4 rounded border-slate-300 text-[#fdb612] focus:ring-[#fdb612]"
                          checked={onlyUrgent}
                          onChange={(e) => setOnlyUrgent(e.target.checked)}
                        />
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedStatuses(['new', 'survey', 'proposal', 'negotiation', 'closed']);
                          setOnlyUrgent(false);
                          setStartDate('');
                          setEndDate('');
                          setDateFilterType('created');
                          setSelectedRepresentative('all');
                        }}
                        className="w-full py-3 lg:py-2 text-xs font-bold text-slate-400 hover:text-[#fdb612] transition-colors"
                      >
                        Limpar Filtros
                      </button>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="w-full py-4 bg-[#fdb612] text-[#231d0f] rounded-xl font-black uppercase tracking-widest text-xs lg:hidden"
                      >
                        Aplicar Filtros
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={exportToCSV}
            className="px-4 py-2 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button 
            onClick={onOpenNewLead}
            className="bg-[#fdb612] hover:bg-[#fdb612]/90 text-[#231d0f] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Adicionar Novo Lead
          </button>
        </div>
      </header>

      <div className="mb-8 bg-white dark:bg-[#231d0f]/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Distribuição de Leads por Status</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  backgroundColor: '#231d0f', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-6 h-full min-h-[500px]">
              {columns.map((column) => {
                if (!selectedStatuses.includes(column.id)) return null;
                
                const columnLeads = filteredLeads.filter(l => l.status === column.id);
                
                return (
                  <div key={column.id} className="w-80 flex flex-col gap-4 shrink-0">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{column.label}</h3>
                        <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-bold">
                          {columnLeads.length}
                        </span>
                      </div>
                      <button 
                        onClick={() => showToast(`Ações para a coluna: ${column.label}`)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-white/5 rounded-md transition-colors"
                      >
                        <MoreHorizontal className="text-slate-400 w-5 h-5 cursor-pointer" />
                      </button>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={cn(
                            "flex-1 bg-slate-100/50 dark:bg-white/5 rounded-xl p-3 space-y-4 overflow-y-auto transition-colors",
                            snapshot.isDraggingOver && "bg-[#fdb612]/5"
                          )}
                        >
                          {columnLeads.map((lead, index) => (
                            // @ts-ignore
                            <Draggable draggableId={lead.id} index={index} key={lead.id}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1
                                  }}
                                >
                                  <LeadCard 
                                    lead={lead} 
                                    onDelete={() => setLeadToDelete(lead)}
                                    onClick={() => setSelectedLead(lead)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      ) : (
        <div className="flex-1 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">WhatsApp</th>
                  <th className="px-6 py-4">Sistema</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Criação</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    title="Ver Detalhes"
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612] font-black text-xs">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {lead.name}
                            {lead.status === 'survey' && lead.scheduledDate && (
                              <Calendar className="w-3.5 h-3.5 text-[#fdb612]" />
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        lead.status === 'closed' ? "bg-green-100 text-green-600" : "bg-[#fdb612]/10 text-[#fdb612]"
                      )}>
                        {columns.find(c => c.id === lead.status)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                        <MessageCircle className="w-4 h-4" />
                        {lead.whatsapp}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {lead.systemSize}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-slate-100">
                      {lead.value}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {lead.createdAt || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex justify-end">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenu(activeActionMenu === lead.id ? null : lead.id);
                          }}
                          className="p-2 text-slate-400 hover:text-[#fdb612] transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {activeActionMenu === lead.id && (
                          <div className="absolute right-6 top-12 w-48 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-30 py-2 animate-in fade-in zoom-in duration-200">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                                setActiveActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4 text-slate-400" />
                              Ver Detalhes
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                showToast('Funcionalidade de edição em breve');
                                setActiveActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4 text-slate-400" />
                              Editar
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setLeadToDelete(lead);
                                setActiveActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir Lead
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#231d0f] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <button 
                  onClick={() => setLeadToDelete(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Tem certeza que deseja excluir o lead <span className="font-bold text-slate-900 dark:text-slate-100">"{leadToDelete.name}"</span>? 
                Esta ação não pode ser desfeita.
              </p>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <button 
                onClick={() => setLeadToDelete(null)}
                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onDeleteLead(leadToDelete.id);
                  setLeadToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Excluir Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Side Panel */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedLead(null);
                setIsEditing(false);
              }}
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[120] w-full max-w-md bg-white dark:bg-[#231d0f] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {isEditing ? 'Editar Lead' : 'Detalhes do Lead'}
                </h3>
                <button 
                  onClick={() => {
                    setSelectedLead(null);
                    setIsEditing(false);
                  }}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isEditing && (
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => setLeadModalTab('info')}
                    className={cn(
                      "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors",
                      leadModalTab === 'info' ? "text-[#fdb612] border-b-2 border-[#fdb612]" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Informações
                  </button>
                  <button 
                    onClick={() => setLeadModalTab('history')}
                    className={cn(
                      "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors",
                      leadModalTab === 'history' ? "text-[#fdb612] border-b-2 border-[#fdb612]" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Histórico
                  </button>
                  <button 
                    onClick={() => setLeadModalTab('files')}
                    className={cn(
                      "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors",
                      leadModalTab === 'files' ? "text-[#fdb612] border-b-2 border-[#fdb612]" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Arquivos
                  </button>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</label>
                      <input 
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#fdb612]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</label>
                          {editErrors.email && <span className="text-[9px] font-bold text-red-500">{editErrors.email}</span>}
                        </div>
                        <input 
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => {
                            setEditForm({ ...editForm, email: e.target.value });
                            if (editErrors.email) setEditErrors({ ...editErrors, email: null });
                          }}
                          className={cn(
                            "w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#fdb612]",
                            editErrors.email ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefone</label>
                          {editErrors.phone && <span className="text-[9px] font-bold text-red-500">{editErrors.phone}</span>}
                        </div>
                        <input 
                          type="text"
                          value={editForm.phone || ''}
                          onChange={(e) => {
                            const masked = maskPhone(e.target.value);
                            setEditForm({ ...editForm, phone: masked });
                            if (editErrors.phone) setEditErrors({ ...editErrors, phone: null });
                          }}
                          className={cn(
                            "w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#fdb612]",
                            editErrors.phone ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sistema (kWp)</label>
                        <input 
                          type="text"
                          value={editForm.systemSize || ''}
                          onChange={(e) => setEditForm({ ...editForm, systemSize: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#fdb612]"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Estimado</label>
                          {editErrors.value && <span className="text-[9px] font-bold text-red-500">{editErrors.value}</span>}
                        </div>
                        <input 
                          type="text"
                          value={editForm.value || ''}
                          onChange={(e) => {
                            setEditForm({ ...editForm, value: maskCurrency(e.target.value) });
                            if (editErrors.value) setEditErrors({ ...editErrors, value: null });
                          }}
                          className={cn(
                            "w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#fdb612]",
                            editErrors.value ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Representante</label>
                      <select 
                        value={editForm.representative || ''}
                        onChange={(e) => setEditForm({ ...editForm, representative: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#fdb612]"
                      >
                        <option value="">Selecione um representante</option>
                        {representatives.map(rep => (
                          <option key={rep} value={rep}>{rep}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                      <select 
                        value={editForm.status || ''}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Lead['status'] })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#fdb612]"
                      >
                        {columns.map(col => (
                          <option key={col.id} value={col.id}>{col.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox"
                        id="urgent-edit"
                        checked={editForm.urgent || false}
                        onChange={(e) => setEditForm({ ...editForm, urgent: e.target.checked })}
                        className="size-4 rounded border-slate-300 text-[#fdb612] focus:ring-[#fdb612]"
                      />
                      <label htmlFor="urgent-edit" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Marcar como Urgente</label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {leadModalTab === 'info' ? (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="size-16 rounded-full bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612] text-2xl font-black">
                            {selectedLead.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">{selectedLead.name}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                              selectedLead.status === 'closed' ? "bg-green-100 text-green-600" : "bg-[#fdb612]/10 text-[#fdb612]"
                            )}>
                              {columns.find(c => c.id === selectedLead.status)?.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</label>
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                              <Mail className="w-4 h-4 text-[#fdb612]" />
                              {selectedLead.email}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefone</label>
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                              <Phone className="w-4 h-4 text-[#fdb612]" />
                              {selectedLead.phone}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp</label>
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                              <MessageCircle className="w-4 h-4 text-green-500" />
                              {selectedLead.whatsapp}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tamanho do Sistema</label>
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                              <Zap className="w-4 h-4 text-[#fdb612]" />
                              {selectedLead.systemSize}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Estimado</label>
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                              <DollarSign className="w-4 h-4 text-[#fdb612]" />
                              {selectedLead.value}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Criação</label>
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {selectedLead.createdAt || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {selectedLead.scheduledDate && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                <HardHat className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Vistoria Agendada</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedLead.scheduledDate}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedLead.representative && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Representante Responsável</label>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="size-8 rounded-full bg-[#fdb612] flex items-center justify-center text-[#231d0f] font-black text-xs">
                                {selectedLead.representative.charAt(0)}
                              </div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{selectedLead.representative}</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : leadModalTab === 'history' ? (
                      <div className="space-y-6">
                        <div className="flex flex-col gap-4">
                          <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Histórico de Interações</h4>
                          <div className="space-y-2">
                            <textarea 
                              placeholder="Adicione uma nota sobre este lead..."
                              className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#fdb612] min-h-[100px] resize-none"
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                            />
                            <div className="flex justify-end">
                              <button 
                                onClick={handleAddNote}
                                disabled={!newNote.trim()}
                                className="px-4 py-2 bg-[#fdb612] text-[#231d0f] rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                <Plus className="w-4 h-4" />
                                Adicionar Nota
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                          {selectedLead.history?.map((item, i) => (
                            <div key={i} className="relative pl-10">
                              <div className="absolute left-0 top-1.5 size-8 rounded-full bg-white dark:bg-slate-900 border-2 border-[#fdb612] flex items-center justify-center z-10">
                                <Clock className="w-3 h-3 text-[#fdb612]" />
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.action}</p>
                                <div className="mt-1 flex items-center justify-between">
                                  <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#fdb612]">{item.user}</p>
                                </div>
                              </div>
                            </div>
                          )) || (
                            <div className="text-center py-8 text-slate-400">
                              <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                              <p className="text-sm font-medium">Nenhum histórico registrado</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Documentos do Lead</h4>
                          <label className="px-3 py-1.5 bg-[#fdb612] text-[#231d0f] rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-[#fdb612]/90 transition-all">
                            <FileText className="w-4 h-4" />
                            {isUploading ? 'Enviando...' : 'Upload'}
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={handleFileUpload}
                              disabled={isUploading}
                            />
                          </label>
                        </div>

                        <div className="space-y-2">
                          {selectedLead.files?.map((file, i) => (
                            <div key={i} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-[#fdb612]/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{file.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{file.size} • {file.date}</p>
                                </div>
                              </div>
                              <button className="p-2 text-slate-300 hover:text-[#fdb612] transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          )) || (
                            <div className="text-center py-8 text-slate-400">
                              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                              <p className="text-sm font-medium">Nenhum documento anexado</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 px-4 py-2 bg-[#fdb612] text-[#231d0f] rounded-lg font-bold text-sm hover:bg-[#fdb612]/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setSelectedLead(null)}
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Fechar
                    </button>
                    <button 
                      onClick={() => handleEditLead(selectedLead)}
                      className="flex-1 px-4 py-2 bg-[#fdb612] text-[#231d0f] rounded-lg font-bold text-sm hover:bg-[#fdb612]/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const LeadCard: React.FC<{ lead: Lead; onDelete: () => void; onClick: () => void }> = ({ lead, onDelete, onClick }) => {
  return (
    <div 
      onClick={onClick}
      title="Ver Detalhes"
      className={cn(
      "bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border transition-colors cursor-pointer group relative",
      lead.status === 'closed' ? "border-green-500/30" : "border-slate-200 dark:border-slate-700 hover:border-[#fdb612]"
    )}>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex justify-between items-start mb-2 pr-6">
        {lead.urgent && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#fdb612] bg-[#fdb612]/10 px-2 py-0.5 rounded">
            Urgente
          </span>
        )}
        {lead.status === 'closed' && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 px-2 py-0.5 rounded">
            Ganho
          </span>
        )}
        <span className="text-xs text-slate-400 ml-auto">
          {lead.time || (lead.status === 'closed' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : null)}
        </span>
      </div>
      
      <h4 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#fdb612] transition-all hover:bg-[#fdb612]/10 px-1 -mx-1 rounded cursor-pointer flex items-center gap-2">
        {lead.name}
        {lead.status === 'survey' && lead.scheduledDate && (
          <Calendar className="w-3.5 h-3.5 text-[#fdb612]" />
        )}
      </h4>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Mail className="w-4 h-4" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Zap className="w-4 h-4" />
          <span>{lead.systemSize}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
          <DollarSign className="w-4 h-4" />
          <span className="text-slate-900 dark:text-slate-100">{lead.value}</span>
        </div>
      </div>

      {lead.scheduledDate && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Agendado para {lead.scheduledDate}
          </span>
          <div className="size-6 rounded-full bg-[#fdb612]/20 flex items-center justify-center">
            <HardHat className="w-3 h-3 text-[#fdb612]" />
          </div>
        </div>
      )}

      {lead.status === 'negotiation' && (
        <div className="mt-4 flex -space-x-2">
          {[1, 2].map((i) => (
            <div key={i} className="size-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-300 overflow-hidden">
              <img 
                src={`https://i.pravatar.cc/150?u=${lead.id}${i}`} 
                alt="Team member" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
