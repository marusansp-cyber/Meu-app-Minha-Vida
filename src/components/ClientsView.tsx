import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  History as HistoryIcon,
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
  X,
  CreditCard
} from 'lucide-react';
import { Client, Proposal, Installation, History as HistoryType, Lead, User as UserType } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ClientModal } from './ClientModal';
import { ClientsMap } from './ClientsMap';
import { syncCollection } from '../firestoreUtils';

interface ClientsViewProps {
  clients: Client[];
  proposals: Proposal[];
  installations: Installation[];
  leads?: Lead[];
  user?: UserType | null;
  onAddClient: (client: Partial<Client>) => Promise<void>;
  onUpdateClient: (id: string, client: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onCreateProposal?: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ 
  clients, 
  proposals, 
  installations,
  leads = [],
  user,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onCreateProposal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [clientFilters, setClientFilters] = useState({
    cnpj_cpf: '',
    startDate: '',
    endDate: '',
    hasProject: 'all' as 'all' | 'yes' | 'no',
    type: 'all' as Client['type'] | 'all'
  });
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'projects'>('recent');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [history, setHistory] = useState<HistoryType[]>([]);

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'admin_staff' || user?.role === 'sales' || user?.role === 'finance' || user?.role === 'engineer';

  const searchSuggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    const suggestions: { client: Client; match: string; type: 'name' | 'email' | 'id' }[] = [];
    
    (clients || []).forEach(client => {
      if (client.name.toLowerCase().includes(term)) {
        suggestions.push({ client, match: client.name, type: 'name' });
      } else if (client.email.toLowerCase().includes(term)) {
        suggestions.push({ client, match: client.email, type: 'email' });
      } else if ((client.cnpj && client.cnpj.includes(term)) || (client.cpf && client.cpf.includes(term))) {
        suggestions.push({ client, match: client.cnpj || client.cpf || '', type: 'id' });
      }
    });

    return suggestions.slice(0, 5);
  }, [clients, searchTerm]);

  React.useEffect(() => {
    const unsubscribe = syncCollection<HistoryType>('history', setHistory, 'timestamp');
    return () => unsubscribe();
  }, []);

  const allInteractions = useMemo(() => {
    if (!selectedClient) return [];
    
    const clientProposals = proposals
      .filter(p => p.client === selectedClient.name)
      .map(p => ({
        id: `prop-${p.id}`,
        date: p.date,
        type: 'Proposta',
        title: `Proposta Gerada: ${p.systemSize}`,
        description: `Valor: ${typeof p.value === 'number' ? p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : p.value}`,
        status: p.status,
        timestamp: new Date(p.date.split('/').reverse().join('-')).getTime() || 0,
        userName: p.representative
      }));
    
    const clientInstallations = installations
      .filter(i => i.name === selectedClient.name)
      .map(i => ({
        id: `inst-${i.id}`,
        date: i.startDate || i.lastUpdated,
        type: 'Instalação',
        title: `Projeto de Instalação: ${i.stage}`,
        description: `Progresso atual: ${i.progress}%`,
        status: i.progress + '%',
        timestamp: new Date(i.startDate ? i.startDate.split('/').reverse().join('-') : i.lastUpdated.split('/').reverse().join('-')).getTime() || 0,
        userName: i.technician.name
      }));

    const clientManualInteractions = (selectedClient.interactions || []).map(i => ({
      ...i,
      timestamp: i.timestamp || new Date(i.date.split('/').reverse().join('-')).getTime() || 0
    }));

    return [...clientProposals, ...clientInstallations, ...clientManualInteractions]
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedClient, proposals, installations]);

  const clientHistory = useMemo(() => {
    if (!selectedClient) return [];
    return (history || []).filter(h => h.collection === 'clients' && h.docId === selectedClient.id);
  }, [history, selectedClient]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      if (editingClient) {
        // Record audit log
        const changes: any[] = [];
        const oldData = editingClient as any;
        const newData = clientData as any;
        
        Object.keys(clientData).forEach(key => {
          if (oldData[key] !== newData[key]) {
            changes.push({
              field: key,
              oldValue: oldData[key],
              newValue: newData[key]
            });
          }
        });

        const auditLog = {
          id: Math.random().toString(36).substr(2, 9),
          userId: user?.id || 'system',
          userName: user?.name || 'Sistema',
          action: 'Atualização de Informações',
          changes,
          timestamp: new Date().toISOString()
        };

        const finalData = {
          ...clientData,
          lastModifiedBy: user?.name || 'Sistema',
          lastModifiedAt: new Date().toISOString(),
          auditLogs: [...(editingClient.auditLogs || []), auditLog]
        };

        await onUpdateClient(editingClient.id, finalData);
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
    const clientProposals = (proposals || []).filter(p => p.client === client.name);
    const clientInstallations = (installations || []).filter(i => i.name === client.name);
    
    return {
      proposals: clientProposals,
      installations: clientInstallations
    };
  };

  const filteredClients = useMemo(() => {
    return (clients || []).filter(client => {
      const projects = getClientProjects(client);
      const hasProjects = projects.proposals.length > 0 || projects.installations.length > 0;

      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.cnpj && client.cnpj.includes(searchTerm)) ||
        (client.cpf && client.cpf.includes(searchTerm));
      
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(client.status);
      
      const matchesCnpj = !clientFilters.cnpj_cpf || 
        (client.cnpj && client.cnpj.includes(clientFilters.cnpj_cpf)) ||
        (client.cpf && client.cpf.includes(clientFilters.cnpj_cpf));
      
      let matchesDate = true;
      if (clientFilters.startDate || clientFilters.endDate) {
        const regDate = client.createdAt ? new Date(client.createdAt) : null;
        if (regDate) {
          if (clientFilters.startDate) {
            const start = new Date(clientFilters.startDate);
            start.setHours(0, 0, 0, 0);
            if (regDate < start) matchesDate = false;
          }
          if (clientFilters.endDate) {
            const end = new Date(clientFilters.endDate);
            end.setHours(23, 59, 59, 999);
            if (regDate > end) matchesDate = false;
          }
        } else {
          matchesDate = false;
        }
      }

      const matchesProjectFilter = 
        clientFilters.hasProject === 'all' || 
        (clientFilters.hasProject === 'yes' && hasProjects) ||
        (clientFilters.hasProject === 'no' && !hasProjects);
      
      const matchesType = clientFilters.type === 'all' || client.type === clientFilters.type;
      
      return matchesSearch && matchesStatus && matchesCnpj && matchesDate && matchesProjectFilter && matchesType;
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
  }, [clients, searchTerm, statusFilters, clientFilters, sortBy, proposals, installations]);

  const stats = useMemo(() => {
    const active = (clients || []).filter(c => c.status === 'active').length;
    const inactive = (clients || []).filter(c => c.status === 'inactive').length;
    return { active, inactive, total: (clients || []).length };
  }, [clients]);

  const renderClientInteractions = (client: Client) => (
    <div className="bg-white dark:bg-[#231d0f] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-[#fdb612]" />
          Histórico Completo de Interações
        </h4>
        <button 
          onClick={() => {
            const description = window.prompt('Descreva a interação:');
            if (description) {
              const newInteraction = {
                id: Math.random().toString(36).substr(2, 9),
                date: new Date().toLocaleDateString('pt-BR'),
                type: 'Manual',
                title: 'Nota Manual',
                description,
                userName: user?.name || 'Vendedor',
                status: 'completed',
                timestamp: Date.now()
              };
              const updatedInteractions = [...(client.interactions || []), newInteraction];
              onUpdateClient(client.id, { interactions: updatedInteractions });
            }
          }}
          className="text-[10px] font-black text-[#fdb612] uppercase tracking-widest hover:underline"
        >
          + Adicionar Nota
        </button>
      </div>
      <div className="space-y-4">
        {allInteractions.length > 0 ? (
          allInteractions.map((interaction) => (
            <div key={interaction.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{interaction.date}</span>
                  {interaction.userName && (
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Por: {interaction.userName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded uppercase",
                    interaction.type === 'Proposta' ? "bg-amber-100 text-amber-600" : 
                    interaction.type === 'Instalação' ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {interaction.type}
                  </span>
                  {interaction.status && (
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded uppercase",
                      ['accepted', 'completed', '100%'].includes(interaction.status) ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                    )}>
                      {interaction.status}
                    </span>
                  )}
                </div>
              </div>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">{interaction.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {interaction.description}
              </p>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
            <p className="text-xs italic">Nenhuma interação, proposta ou instalação registrada.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderClientDetails = (client: Client) => (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-[#231d0f] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#fdb612]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="size-20 rounded-2xl bg-[#fdb612] flex items-center justify-center text-[#231d0f] text-3xl font-black shadow-lg shadow-[#fdb612]/20">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">{client.name}</h3>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <Mail className="w-4 h-4 text-[#fdb612]" />
                  {client.email}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <Phone className="w-4 h-4 text-[#fdb612]" />
                  {client.phone}
                </span>
                {(client.cnpj || client.cpf) && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <CreditCard className="w-4 h-4 text-[#fdb612]" />
                    {client.cnpj || client.cpf}
                  </span>
                )}
                {client.address && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <MapPin className="w-4 h-4 text-[#fdb612]" />
                    {client.address}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onCreateProposal && (
              <button 
                onClick={() => {
                  const projects = getClientProjects(client);
                  // Find latest proposal to get kWp and value
                  const latestProposal = projects.proposals.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date.split('/').reverse().join('-')).getTime() : 0;
                    const dateB = b.date ? new Date(b.date.split('/').reverse().join('-')).getTime() : 0;
                    return dateB - dateA;
                  })[0];
                  
                  onCreateProposal({
                    ...client,
                    systemSize: latestProposal?.systemSize || '',
                    value: latestProposal?.value || 0
                  });
                }}
                className="flex items-center gap-2 px-4 py-3 bg-[#fdb612]/10 text-[#fdb612] rounded-xl font-bold text-sm hover:bg-[#fdb612] hover:text-[#231d0f] transition-all group"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Criar Proposta</span>
              </button>
            )}
            <button 
              onClick={() => {
                setEditingClient(client);
                setIsModalOpen(true);
              }}
              className="p-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-[#fdb612] hover:text-[#231d0f] transition-all"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleDeleteClient(client.id)}
              className="p-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactions Section */}
      {renderClientInteractions(client)}

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
              {getClientProjects(client).proposals.length} TOTAL
            </span>
          </div>
          <div className="space-y-3">
            {getClientProjects(client).proposals.map((proposal) => (
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
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {proposal.systemSize} - {typeof proposal.value === 'number' ? proposal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : proposal.value}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-slate-500 font-medium">Rep: {proposal.representative}</span>
                  <button className="text-[#fdb612] hover:underline text-[10px] font-black flex items-center gap-1">
                    VER DETALHES <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {getClientProjects(client).proposals.length === 0 && (
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
              {getClientProjects(client).installations.length} TOTAL
            </span>
          </div>
          <div className="space-y-3">
            {getClientProjects(client).installations.map((installation) => (
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
            {getClientProjects(client).installations.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs">Nenhuma instalação em andamento</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline History (System Audit) */}
      <div className="bg-white dark:bg-[#231d0f] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-8">
          <HistoryIcon className="w-5 h-5 text-[#fdb612]" />
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
                {item.action && (
                  <p className="text-[10px] text-slate-400 mt-1 font-medium italic">{item.action}</p>
                )}
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
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-brand-primary transition-all"
        >
          <div className="size-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Clientes</span>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.total}</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-emerald-500 transition-all"
        >
          <div className="size-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contas Ativas</span>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.active}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-amber-500 transition-all"
        >
          <div className="size-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Em Prospecção</span>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.inactive}</span>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="size-16 rounded-[1.5rem] bg-brand-primary text-white flex items-center justify-center shadow-xl shadow-brand-primary/20">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-brand-primary dark:text-white tracking-tight">
              Central de Clientes
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Gestão de relacionamento e inteligência geográfica</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-inner">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'list' ? "bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Lista
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'map' ? "bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
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
            className="flex items-center gap-3 px-10 py-4 bg-brand-secondary text-brand-primary rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-secondary/20"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Cliente
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
              proposals={proposals}
              installations={installations}
              className="h-full w-full"
              onSelectClient={(client) => {
                setSelectedClient(client);
              }}
              onEditClient={(client) => {
                setEditingClient(client);
                setIsModalOpen(true);
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
            className="grid grid-cols-1 gap-6"
          >
            {/* Clients List */}
          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none group-focus-within:text-brand-primary transition-colors text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Busca por nome, e-mail, telefone ou documento (CPF/CNPJ)..."
                value={searchTerm || ''}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-14 pr-14 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-slate-700 dark:text-white shadow-sm"
              />
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "absolute right-3 top-1.5 bottom-1.5 px-4 rounded-xl transition-all flex items-center gap-2",
                  showFilters ? "bg-brand-primary text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-slate-600"
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filtros</span>
              </button>
              
              <AnimatePresence>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowSuggestions(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-3 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4 py-3 border-b border-slate-50 dark:border-white/5 mb-2">Sugestões de Busca</p>
                        {searchSuggestions.map((suggestion, idx) => (
                          <button
                            key={`${suggestion.client.id}-${idx}`}
                            onClick={() => {
                              setSearchTerm(suggestion.client.name);
                              setShowSuggestions(false);
                              setSelectedClient(suggestion.client);
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-brand-primary/5 rounded-2xl transition-all text-left group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black">
                                {suggestion.client.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white capitalize group-hover:text-brand-primary transition-colors">
                                  {suggestion.client.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {suggestion.type === 'name' ? suggestion.client.email : suggestion.match}
                                  </span>
                                  <span className="text-[8px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 font-black uppercase tracking-tighter">
                                    {suggestion.type === 'id' ? 'CPF/CNPJ' : suggestion.type === 'email' ? 'CONTATO' : 'CLIENTE'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-brand-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Cliente</label>
                        <select 
                          value={clientFilters.type}
                          onChange={(e) => setClientFilters({ ...clientFilters, type: e.target.value as any })}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#fdb612]/30"
                        >
                          <option value="all">Todos</option>
                          <option value="residential">Residencial</option>
                          <option value="rural">Rural</option>
                          <option value="industrial">Industrial</option>
                          <option value="commercial">Comercial</option>
                          <option value="public">Público</option>
                        </select>
                      </div>
                      <div className="pt-2">
                        <button 
                          onClick={() => {
                            setClientFilters({
                              cnpj_cpf: '',
                              startDate: '',
                              endDate: '',
                              hasProject: 'all',
                              type: 'all'
                            });
                            setSearchTerm('');
                            setStatusFilters([]);
                          }}
                          className="w-full py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#fdb612] hover:text-[#231d0f] transition-all"
                        >
                          Limpar Filtros
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Status:</span>
                    {[
                      { id: 'active', label: 'Ativos', color: 'bg-emerald-500' },
                      { id: 'inactive', label: 'Inativos', color: 'bg-slate-500' }
                    ].map((status) => (
                      <button
                        key={status.id}
                        onClick={() => {
                          setStatusFilters(prev => 
                            prev.includes(status.id) ? prev.filter(s => s !== status.id) : [...prev, status.id]
                          );
                        }}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
                          statusFilters.includes(status.id)
                            ? `bg-white dark:bg-slate-800 border-[#fdb612] text-[#fdb612] shadow-sm` 
                            : "bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("size-1.5 rounded-full", status.color)} />
                          {status.label}
                        </div>
                      </button>
                    ))}
                    {statusFilters.length > 0 && (
                      <button 
                        onClick={() => setStatusFilters([])}
                        className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline ml-2"
                      >
                        Limpar
                      </button>
                    )}
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="ml-auto px-4 py-1.5 bg-[#fdb612] text-[#231d0f] rounded-lg font-black uppercase tracking-widest text-[9px] shadow-lg shadow-[#fdb612]/10"
                    >
                      Aplicar
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordenar por:</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-[10px] font-black uppercase tracking-widest text-[#fdb612] outline-none cursor-pointer hover:underline"
                    >
                      <option value="recent">Recen. Cadastrados</option>
                      <option value="name">Alfabética (A-Z)</option>
                      <option value="projects">Volume de Projetos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredClients.map((client) => {
                    const clientProjects = getClientProjects(client);
                    const totalProjects = clientProjects.proposals.length + clientProjects.installations.length;
                    
                    return (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden cursor-pointer",
                          selectedClient?.id === client.id
                            ? "bg-[#fdb612]/10 border-[#fdb612] shadow-md ring-1 ring-[#fdb612]/20"
                            : "bg-white dark:bg-transparent border-slate-100 dark:border-slate-800 hover:border-[#fdb612]/30 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-slate-900 dark:text-slate-100 group-hover:text-[#fdb612] transition-colors truncate">
                                {client.name}
                              </h4>
                              {totalProjects > 0 && (
                                <span className="px-1.5 py-0.5 bg-[#fdb612] text-[#231d0f] text-[8px] font-black rounded uppercase">
                                  {totalProjects} {totalProjects === 1 ? 'PROJETO' : 'PROJETOS'}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                <Mail className="w-3.5 h-3.5 text-[#fdb612]/60" />
                                <span className="truncate">{client.email}</span>
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                <Phone className="w-3.5 h-3.5 text-[#fdb612]/60" />
                                {client.phone}
                              </p>
                              {(client.cnpj || client.cpf) && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 flex items-center gap-2">
                                  <CreditCard className="w-3 h-3" />
                                  {client.cnpj || client.cpf}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 transition-colors shadow-sm",
                            client.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                          )}>
                            {client.status}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                          {client.phone && (
                            <a 
                              href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-110"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <a 
                            href={`mailto:${client.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-[#fdb612]/10 text-[#fdb612] rounded-lg hover:bg-[#fdb612] hover:text-[#231d0f] transition-all transform hover:scale-110"
                            title="E-mail"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClient(client);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all transform hover:scale-110"
                            title="Editar Cliente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <div className="flex-1" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 group-hover:text-[#fdb612]">
                            Ver Detalhes <Maximize className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <div className="py-8 text-center text-slate-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhum cliente encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side Panel Drawer */}
            <AnimatePresence>
              {selectedClient && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedClient(null)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
                  />
                  {/* Drawer Content */}
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#f8f7f5] dark:bg-[#1a160d] shadow-2xl z-[120] overflow-hidden flex flex-col border-l border-slate-200 dark:border-slate-800"
                  >
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#231d0f]">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612]">
                          <Users className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Ficha do Cliente</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedClient(null)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                      {renderClientDetails(selectedClient)}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={editingClient}
        leads={leads}
        clients={clients}
        user={user}
      />
    </div>
  );
};
