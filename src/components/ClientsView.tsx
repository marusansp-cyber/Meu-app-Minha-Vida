import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  History,
  FileText,
  Construction,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  MessageCircle,
  Maximize,
  X
} from 'lucide-react';
import { Client, Proposal, Installation, History as HistoryType } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ClientModal } from './ClientModal';
import { ClientsMap } from './ClientsMap';
import { syncCollection } from '../firestoreUtils';

interface ClientsViewProps {
  clients: Client[];
  proposals: Proposal[];
  installations: Installation[];
  onAddClient: (client: Partial<Client>) => Promise<void>;
  onUpdateClient: (id: string, client: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onCreateProposal?: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ 
  clients, 
  proposals, 
  installations,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onCreateProposal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [clientFilters, setClientFilters] = useState({
    cnpj_cpf: '',
    startDate: '',
    endDate: '',
    hasProject: 'all' as 'all' | 'yes' | 'no'
  });
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'projects'>('recent');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [history, setHistory] = useState<HistoryType[]>([]);

  React.useEffect(() => {
    const unsubscribe = syncCollection<HistoryType>('history', setHistory, 'timestamp');
    return () => unsubscribe();
  }, []);

  const clientHistory = useMemo(() => {
    if (!selectedClient) return [];
    return history.filter(h => h.collection === 'clients' && h.docId === selectedClient.id);
  }, [history, selectedClient]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      if (editingClient) {
        await onUpdateClient(editingClient.id, clientData);
        showToast('Cliente atualizado com sucesso!');
      } else {
        await onAddClient(clientData);
        showToast('Cliente cadastrado com sucesso!');
      }
    } catch (error) {
      showToast('Erro ao salvar cliente.');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await onDeleteClient(id);
        showToast('Cliente excluído com sucesso.');
        if (selectedClient?.id === id) setSelectedClient(null);
      } catch (error) {
        showToast('Erro ao excluir cliente.');
      }
    }
  };

  const getClientProjects = (client: Client) => {
    const clientProposals = proposals.filter(p => p.client === client.name);
    const clientInstallations = installations.filter(i => i.name === client.name);
    
    return {
      proposals: clientProposals,
      installations: clientInstallations
    };
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const projects = getClientProjects(client);
      const hasProjects = projects.proposals.length > 0 || projects.installations.length > 0;

      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.cnpj_cpf && client.cnpj_cpf.includes(searchTerm));
      
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      
      const matchesCnpj = !clientFilters.cnpj_cpf || (client.cnpj_cpf && client.cnpj_cpf.includes(clientFilters.cnpj_cpf));
      
      let matchesDate = true;
      if (clientFilters.startDate || clientFilters.endDate) {
        const regDate = client.createdAt ? new Date(client.createdAt) : null;
        if (regDate) {
          if (clientFilters.startDate && regDate < new Date(clientFilters.startDate)) matchesDate = false;
          if (clientFilters.endDate && regDate > new Date(clientFilters.endDate)) matchesDate = false;
        } else {
          matchesDate = false;
        }
      }

      const matchesProjectFilter = 
        clientFilters.hasProject === 'all' || 
        (clientFilters.hasProject === 'yes' && hasProjects) ||
        (clientFilters.hasProject === 'no' && !hasProjects);
      
      return matchesSearch && matchesStatus && matchesCnpj && matchesDate && matchesProjectFilter;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'recent') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'projects') {
        const countA = getClientProjects(a).proposals.length + getClientProjects(a).installations.length;
        const countB = getClientProjects(b).proposals.length + getClientProjects(b).installations.length;
        return countB - countA;
      }
      return 0;
    });
  }, [clients, searchTerm, filterStatus, clientFilters, sortBy, proposals, installations]);

  const stats = useMemo(() => {
    const active = clients.filter(c => c.status === 'active').length;
    const inactive = clients.filter(c => c.status === 'inactive').length;
    return { active, inactive, total: clients.length };
  }, [clients]);

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#231d0f] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-[#fdb612]/10 text-[#fdb612] rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Clientes</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total}</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#231d0f] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Clientes Ativos</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.active}</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#231d0f] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-slate-500/10 text-slate-500 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Clientes Inativos</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.inactive}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#fdb612]" />
            Gestão de Clientes
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Visualize e gerencie sua base de clientes e histórico de projetos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                viewMode === 'list' ? "bg-[#fdb612] text-[#231d0f]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Lista
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                viewMode === 'map' ? "bg-[#fdb612] text-[#231d0f]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Mapa
            </button>
          </div>
          <button 
            onClick={() => {
              setEditingClient(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'map' ? (
          <motion.div
            key="map-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-[700px] relative"
          >
            <ClientsMap 
              clients={filteredClients} 
              className="h-full w-full"
              onSelectClient={(client) => {
                setSelectedClient(client);
              }}
            />
            {selectedClient && viewMode === 'map' && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute top-4 right-4 bottom-4 w-96 bg-white dark:bg-[#231d0f] shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-800 z-[1001] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Detalhes do Cliente</h3>
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-2xl bg-[#fdb612] flex items-center justify-center text-[#231d0f] text-2xl font-black">
                      {selectedClient.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-900 dark:text-slate-100">{selectedClient.name}</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedClient.status}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 text-[#fdb612]" />
                      {selectedClient.email}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4 text-[#fdb612]" />
                      {selectedClient.phone}
                    </div>
                    {selectedClient.address && (
                      <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4 text-[#fdb612] shrink-0 mt-0.5" />
                        {selectedClient.address}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    {onCreateProposal && (
                      <button 
                        onClick={() => onCreateProposal(selectedClient)}
                        className="flex-1 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all"
                      >
                        Criar Proposta
                      </button>
                    )}
                    <button 
                      onClick={() => setViewMode('list')}
                      className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                    >
                      Ir para Lista
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Clients List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, e-mail, tel ou CNPJ..."
                      value={searchTerm || ''}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fdb612]/50 transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "p-2 rounded-xl border transition-all",
                      showFilters ? "bg-[#fdb612] text-[#231d0f] border-[#fdb612]" : "bg-white dark:bg-white/5 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>

                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CNPJ/CPF</label>
                        <input 
                          type="text" 
                          placeholder="Filtro por documento"
                          value={clientFilters.cnpj_cpf}
                          onChange={(e) => setClientFilters({ ...clientFilters, cnpj_cpf: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#fdb612]/30"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">De</label>
                          <input 
                            type="date"
                            value={clientFilters.startDate}
                            onChange={(e) => setClientFilters({ ...clientFilters, startDate: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Até</label>
                          <input 
                            type="date"
                            value={clientFilters.endDate}
                            onChange={(e) => setClientFilters({ ...clientFilters, endDate: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Possui Projetos?</label>
                        <select 
                          value={clientFilters.hasProject}
                          onChange={(e) => setClientFilters({ ...clientFilters, hasProject: e.target.value as any })}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none"
                        >
                          <option value="all">Todos</option>
                          <option value="yes">Sim</option>
                          <option value="no">Não</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#fdb612]/30 transition-all cursor-pointer"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-pointer"
                  >
                    <option value="recent">Recent</option>
                    <option value="name">Nome</option>
                    <option value="projects">Projetos</option>
                  </select>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all group",
                        selectedClient?.id === client.id
                          ? "bg-[#fdb612]/10 border-[#fdb612] shadow-sm"
                          : "bg-white dark:bg-transparent border-slate-100 dark:border-slate-800 hover:border-[#fdb612]/30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#fdb612] transition-colors truncate">
                            {client.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <a 
                              href={`mailto:${client.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-[#fdb612]/10 text-[#fdb612] rounded-lg hover:bg-[#fdb612] hover:text-[#231d0f] transition-all"
                              title="E-mail"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0",
                          client.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                        )}>
                          {client.status}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="py-8 text-center text-slate-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhum cliente encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client Details & History */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {selectedClient ? (
                  <motion.div
                    key={selectedClient.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Header Info */}
                    <div className="bg-white dark:bg-[#231d0f] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#fdb612]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                          <div className="size-20 rounded-2xl bg-[#fdb612] flex items-center justify-center text-[#231d0f] text-3xl font-black shadow-lg shadow-[#fdb612]/20">
                            {selectedClient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">{selectedClient.name}</h3>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                              <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                <Mail className="w-4 h-4 text-[#fdb612]" />
                                {selectedClient.email}
                              </span>
                              <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                <Phone className="w-4 h-4 text-[#fdb612]" />
                                {selectedClient.phone}
                              </span>
                              {selectedClient.address && (
                                <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                  <MapPin className="w-4 h-4 text-[#fdb612]" />
                                  {selectedClient.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {onCreateProposal && (
                            <button 
                              onClick={() => onCreateProposal(selectedClient)}
                              className="flex items-center gap-2 px-4 py-3 bg-[#fdb612]/10 text-[#fdb612] rounded-xl font-bold text-sm hover:bg-[#fdb612] hover:text-[#231d0f] transition-all group"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="hidden sm:inline">Criar Proposta</span>
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setEditingClient(selectedClient);
                              setIsModalOpen(true);
                            }}
                            className="p-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-[#fdb612] hover:text-[#231d0f] transition-all"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(selectedClient.id)}
                            className="p-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Project History */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Proposals */}
                      <div className="bg-white dark:bg-[#231d0f] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#fdb612]" />
                            Propostas
                          </h4>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-black text-slate-500">
                            {getClientProjects(selectedClient).proposals.length} TOTAL
                          </span>
                        </div>
                        <div className="space-y-3">
                          {getClientProjects(selectedClient).proposals.map((proposal) => (
                            <div key={proposal.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 group hover:border-[#fdb612]/30 transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{proposal.date}</span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                                  proposal.status === 'accepted' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                )}>
                                  {proposal.status}
                                </span>
                              </div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{proposal.systemSize} - {proposal.value}</p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-[10px] text-slate-500 font-medium">Rep: {proposal.representative}</span>
                                <button className="text-[#fdb612] hover:underline text-[10px] font-black flex items-center gap-1">
                                  VER DETALHES <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {getClientProjects(selectedClient).proposals.length === 0 && (
                            <div className="py-8 text-center text-slate-400">
                              <p className="text-xs">Nenhuma proposta registrada</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Installations */}
                      <div className="bg-white dark:bg-[#231d0f] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Construction className="w-5 h-5 text-[#fdb612]" />
                            Instalações
                          </h4>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-black text-slate-500">
                            {getClientProjects(selectedClient).installations.length} TOTAL
                          </span>
                        </div>
                        <div className="space-y-3">
                          {getClientProjects(selectedClient).installations.map((installation) => (
                            <div key={installation.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 group hover:border-[#fdb612]/30 transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{installation.lastUpdated}</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[#fdb612]" 
                                      style={{ width: `${installation.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-black text-[#fdb612]">{installation.progress}%</span>
                                </div>
                              </div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{installation.stage}</p>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={installation.technician.avatar} 
                                    alt="" 
                                    className="size-5 rounded-full" 
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="text-[10px] text-slate-500 font-medium">{installation.technician.name}</span>
                                </div>
                                <button className="text-[#fdb612] hover:underline text-[10px] font-black flex items-center gap-1">
                                  ACOMPANHAR <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {getClientProjects(selectedClient).installations.length === 0 && (
                            <div className="py-8 text-center text-slate-400">
                              <p className="text-xs">Nenhuma instalação em andamento</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeline History */}
                    <div className="bg-white dark:bg-[#231d0f] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                      <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-8">
                        <History className="w-5 h-5 text-[#fdb612]" />
                        Histórico de Alterações
                      </h4>
                      <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-white/5">
                        {clientHistory.map((item, idx) => (
                          <div key={item.id || idx} className="relative pl-10">
                            <div className={cn(
                              "absolute left-0 top-1 size-6 rounded-full border-4 border-white dark:border-[#231d0f] flex items-center justify-center",
                              item.type === 'create' ? "bg-emerald-500/20" : "bg-blue-500/20"
                            )}>
                              {item.type === 'create' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Edit className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {item.type === 'create' ? 'Cliente Cadastrado' : 'Informações Atualizadas'}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Realizado por: <span className="font-bold">{item.user?.displayName || item.user?.email || 'Sistema'}</span>
                              </p>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">
                                {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleString('pt-BR') : 'Agora'}
                              </span>
                            </div>
                          </div>
                        ))}
                        {clientHistory.length === 0 && (
                          <div className="py-4 text-center text-slate-400">
                            <p className="text-xs italic">Nenhum histórico registrado para este cliente.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Users className="w-20 h-20 mb-4 opacity-10" />
                    <p className="text-xl font-bold">Selecione um cliente</p>
                    <p className="text-sm">Escolha um cliente na lista ao lado para ver detalhes e histórico.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
};
