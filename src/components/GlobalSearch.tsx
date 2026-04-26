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
          isOpen ? "text-brand-secondary" : "text-slate-400 group-focus-within:text-brand-primary"
        )} />
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Busca global integrada..."
          className="w-full pl-12 pr-10 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none ring-4 ring-transparent focus:ring-brand-primary/10 focus:border-brand-primary transition-all dark:text-slate-100"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {isOpen && searchTerm.trim() && (
        <div className="absolute top-full left-0 w-full mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl shadow-brand-primary/10 z-[160] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {!hasResults ? (
            <div className="p-10 text-center">
              <div className="size-12 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Search className="size-5 text-slate-300" />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum resultado</p>
              <p className="text-[10px] text-slate-500 mt-1">Tente pesquisar com outros termos</p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-2">
              {results.clients.length > 0 && (
                <div className="mb-2">
                  <p className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-2"><User className="size-3" /> Clientes</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{results.clients.length}</span>
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
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-brand-primary/5 transition-all group border border-transparent hover:border-brand-primary/10"
                      >
                        <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-primary transition-colors">{client.name}</p>
                          <p className="text-[10px] font-medium text-slate-500 truncate">{client.email}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.installations.length > 0 && (
                <div className="mb-2">
                  <p className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-2">
                    <span className="flex items-center gap-2"><Zap className="size-3" /> Instalações</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{results.installations.length}</span>
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
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-brand-primary/5 transition-all group border border-transparent hover:border-brand-primary/10"
                      >
                        <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-primary transition-colors">{installation.name}</p>
                          <p className="text-[10px] font-medium text-slate-500 truncate">{installation.stage}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.proposals.length > 0 && (
                <div>
                  <p className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-2">
                    <span className="flex items-center gap-2"><FileText className="size-3" /> Propostas</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{results.proposals.length}</span>
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
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-brand-primary/5 transition-all group border border-transparent hover:border-brand-primary/10"
                      >
                        <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-primary transition-colors">{proposal.client}</p>
                          <p className="text-[10px] font-medium text-slate-500 truncate">{proposal.proposalNumber || proposal.id.slice(0, 8)} • {proposal.value}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
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
