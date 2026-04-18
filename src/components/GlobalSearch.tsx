import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, User, FileText, Zap, X, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Client, Proposal, Installation } from '../types';

interface GlobalSearchProps {
  clients: Client[];
  proposals: Proposal[];
  installations: Installation[];
  onResultClick: (view: 'clients' | 'proposals' | 'installations', id: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ clients, proposals, installations, onResultClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase();

    return {
      clients: clients.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.email.toLowerCase().includes(term)
      ).slice(0, 3),
      proposals: proposals.filter(p => 
        p.client.toLowerCase().includes(term) || 
        p.proposalNumber?.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
      ).slice(0, 3),
      installations: installations.filter(i => 
        i.name.toLowerCase().includes(term)
      ).slice(0, 3)
    };
  }, [searchTerm, clients, proposals, installations]);

  const hasResults = results && (results.clients.length > 0 || results.proposals.length > 0 || results.installations.length > 0);

  return (
    <div className="relative w-full max-w-md ml-4" ref={containerRef}>
      <div className="relative group">
        <Search className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
          isOpen ? "text-[#fdb612]" : "text-slate-400 group-focus-within:text-[#fdb612]"
        )} />
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Busca global..."
          className="w-full pl-12 pr-10 py-2.5 bg-slate-100 dark:bg-white/5 border-none rounded-xl text-sm font-bold outline-none ring-2 ring-transparent focus:ring-[#fdb612]/20 focus:bg-white dark:focus:bg-[#231d0f] transition-all"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {isOpen && searchTerm.trim() && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[160] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {!hasResults ? (
            <div className="p-8 text-center">
              <p className="text-sm font-bold text-slate-400">Nenhum resultado encontrado</p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              {results.clients.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                    <span>Clientes</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{results.clients.length}</span>
                  </p>
                  <div className="space-y-1">
                    {results.clients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => {
                          onResultClick('clients', client.id);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#fdb612] transition-colors">{client.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{client.email}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.installations.length > 0 && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                    <span>Instalações</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{results.installations.length}</span>
                  </p>
                  <div className="space-y-1">
                    {results.installations.map(installation => (
                      <button
                        key={installation.id}
                        onClick={() => {
                          onResultClick('installations', installation.id);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#fdb612] transition-colors">{installation.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">Estágio: {installation.stage}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.proposals.length > 0 && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                    <span>Propostas</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{results.proposals.length}</span>
                  </p>
                  <div className="space-y-1">
                    {results.proposals.map(proposal => (
                      <button
                        key={proposal.id}
                        onClick={() => {
                          onResultClick('proposals', proposal.id);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="size-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#fdb612] transition-colors">{proposal.client}</p>
                          <p className="text-[10px] text-slate-400 truncate">No: {proposal.proposalNumber || proposal.id.slice(0, 8)} • {proposal.value}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
