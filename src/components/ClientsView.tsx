import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { Client, Proposal, Installation } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ClientModal } from './ClientModal';

interface ClientsViewProps {
  clients: Client[];
  proposals: Proposal[];
  installations: Installation[];
  onAddClient: (client: Partial<Client>) => Promise<void>;
  onUpdateClient: (id: string, client: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ 
  clients, 
  proposals, 
  installations,
  onAddClient,
  onUpdateClient,
  onDeleteClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getClientProjects = (client: Client) => {
    const clientProposals = proposals.filter(p => p.client === client.name);
    const clientInstallations = installations.filter(i => i.name === client.name);
    
    return {
      proposals: clientProposals,
      installations: clientInstallations
    };
  };

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#fdb612]" />
            Gestão de Clientes
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Visualize e gerencie sua base de clientes e histórico de projetos.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fdb612]/50 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {(['all', 'active', 'inactive'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                    filterStatus === status
                      ? "bg-[#fdb612] text-[#231d0f]"
                      : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10"
                  )}
                >
                  {status === 'all' ? 'Todos' : status === 'active' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
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
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#fdb612] transition-colors">
                        {client.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </p>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase",
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
                              <img src={installation.technician.avatar} alt="" className="size-5 rounded-full" />
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
                    Linha do Tempo
                  </h4>
                  <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-white/5">
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 size-6 rounded-full bg-emerald-500/20 border-4 border-white dark:border-[#231d0f] flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Contrato Assinado</p>
                        <p className="text-xs text-slate-500 mt-1">O cliente aceitou a proposta comercial e o contrato foi formalizado.</p>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">20 MAR 2024</span>
                      </div>
                    </div>
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 size-6 rounded-full bg-[#fdb612]/20 border-4 border-white dark:border-[#231d0f] flex items-center justify-center">
                        <Clock className="w-3 h-3 text-[#fdb612]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Vistoria Técnica Realizada</p>
                        <p className="text-xs text-slate-500 mt-1">Equipe de engenharia realizou a medição e análise do telhado.</p>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">15 MAR 2024</span>
                      </div>
                    </div>
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 size-6 rounded-full bg-blue-500/20 border-4 border-white dark:border-[#231d0f] flex items-center justify-center">
                        <FileText className="w-3 h-3 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Proposta Enviada</p>
                        <p className="text-xs text-slate-500 mt-1">Primeira proposta comercial enviada para análise do cliente.</p>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">10 MAR 2024</span>
                      </div>
                    </div>
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
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
};
