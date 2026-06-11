import React, { useState } from 'react';
import { Clock, MessageCircle, Phone, FileText, Send, History as HistoryIcon, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';

export interface HistoryItem {
  date: string;
  action: string;
  user: string;
}

interface InteractionTimelineProps {
  history: HistoryItem[];
  onAddNote: (note: string) => void;
  currentUser?: string;
}

export const InteractionTimeline: React.FC<InteractionTimelineProps> = ({ history, onAddNote, currentUser = 'Sistema' }) => {
  const [newNote, setNewNote] = useState('');

  const getActionIcon = (action: string) => {
    const text = action.toLowerCase();
    if (text.includes('email') || text.includes('e-mail')) return <Send className="w-4 h-4" />;
    if (text.includes('telefon') || text.includes('liga')) return <Phone className="w-4 h-4" />;
    if (text.includes('whatsapp') || text.includes('mensagem')) return <MessageCircle className="w-4 h-4" />;
    if (text.includes('proposta') || text.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (text.includes('import')) return <User className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Add New Note */}
      <div className="p-4 bg-[#fdb612]/5 border border-[#fdb612]/20 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <MessageCircle className="w-16 h-16" />
        </div>
        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-2 relative z-10">Nova Etapa / Anotação</h4>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Ex: Cliente atendeu a ligação e agendou vistoria para amanhã..."
          className="w-full h-24 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#fdb612] outline-none resize-none relative z-10"
        />
        <div className="flex justify-end mt-2 relative z-10">
          <button 
            onClick={() => {
              if (newNote.trim()) {
                onAddNote(newNote);
                setNewNote('');
              }
            }}
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-[#fdb612] text-[#231d0f] font-bold text-sm rounded-lg hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Adicionar ao Histórico
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {history && history.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#fdb612] to-slate-200 dark:to-slate-800" />
            <div className="space-y-6">
              <AnimatePresence>
                {history.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                  >
                    <div className="absolute -left-6 top-4 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-[#fdb612] flex items-center justify-center text-[#fdb612]">
                      {getActionIcon(item.action)}
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <HistoryIcon className="w-4 h-4 text-slate-300" />
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {formatDate(item.date)}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#fdb612] bg-[#fdb612]/10 px-2 py-0.5 rounded-full">
                          {item.user}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {item.action}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <HistoryIcon className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-500">Nenhum histórico registrado</p>
            <p className="text-xs text-slate-400 mt-1">Todas as interações ficarão salvas aqui</p>
          </div>
        )}
      </div>
    </div>
  );
};
