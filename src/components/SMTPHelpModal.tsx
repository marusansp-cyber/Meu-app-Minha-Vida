import React from 'react';
import { X, Mail, ShieldCheck, Key, ExternalLink, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SMTPHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SMTPHelpModal: React.FC<SMTPHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#231d0f] w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight uppercase">Guia de Configuração Gmail</h3>
              <p className="text-xs text-slate-500 font-medium">Como corrigir o Erro de Autenticação (SMTP)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/20">
            <h4 className="text-amber-700 dark:text-amber-400 font-bold text-sm mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Por que isso acontece?
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              O Google não permite mais que aplicativos usem sua senha normal por motivos de segurança. Você precisa gerar uma <strong>Senha de App</strong> de 16 dígitos exclusiva para este sistema.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="size-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black flex-shrink-0 text-sm">1</div>
              <div>
                <h5 className="font-black text-slate-900 dark:text-slate-100 mb-1">Ative a Verificação em 2 Etapas</h5>
                <p className="text-sm text-slate-500 mb-2">Acesse sua Conta Google e certifique-se de que a segurança em dois passos está ativa.</p>
                <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-[#fdb612] text-xs font-bold hover:underline flex items-center gap-1">
                  Abrir Segurança do Google <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="size-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black flex-shrink-0 text-sm">2</div>
              <div>
                <h5 className="font-black text-slate-900 dark:text-slate-100 mb-1">Gere a Senha de App</h5>
                <p className="text-sm text-slate-500 mb-2">Na aba 'Segurança', pesquise por <strong>"Senhas de App"</strong>. Selecione 'E-mail' e 'Outro (Nome personalizado)'. Digite "Vieira Solar" e clique em Criar.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="size-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black flex-shrink-0 text-sm">3</div>
              <div>
                <h5 className="font-black text-slate-900 dark:text-slate-100 mb-1">Configure no AI Studio</h5>
                <p className="text-sm text-slate-500 mb-2">Copie o código amarelo de 16 dígitos que aparecerá. No menu superior do AI Studio, clique nas <strong>Configurações (ícone de engrenagem)</strong> e cole no campo <code>SMTP_PASS</code>.</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 flex gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="text-emerald-700 dark:text-emerald-400 font-bold text-sm mb-1">Pronto!</h4>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Após salvar as configurações no AI Studio, o envio de propostas funcionará instantaneamente.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Entendi, vou configurar
          </button>
        </div>
      </div>
    </div>
  );
};
