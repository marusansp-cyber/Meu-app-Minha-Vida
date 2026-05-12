import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Smartphone, Key, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TwoFactorModalProps {
  isOpen: boolean;
  onVerify: (code: string) => void;
  onCancel?: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ isOpen, onVerify, onCancel }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`2fa-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`2fa-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (fullCode === '123456') {
      setIsSuccess(true);
      setTimeout(() => {
        onVerify(fullCode);
      }, 1000);
    } else {
      setError('Código inválido. Tente novamente (Dica: tente 123456).');
      setIsVerifying(false);
      setCode(['', '', '', '', '', '']);
      document.getElementById('2fa-input-0')?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#231d0f]/80 backdrop-blur-md" onClick={onCancel} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-[#1a160d] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-[#fdb612]/20 p-8 overflow-hidden"
      >
        {/* Background Accents */}
        <div className="absolute -top-24 -right-24 size-48 bg-[#fdb612]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-48 bg-[#fdb612]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex size-16 bg-[#fdb612]/10 rounded-3xl items-center justify-center text-[#fdb612] mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 italic">Verificação de Segurança</h3>
            <p className="text-sm text-slate-500 font-medium">
              Digite o código de 6 dígitos enviado para seu aplicativo autenticador ou dispositivo vinculado.
            </p>
          </div>

          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`2fa-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifying || isSuccess}
                className={cn(
                  "size-12 md:size-14 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-2xl text-center text-xl font-black outline-none transition-all",
                  error ? "border-rose-500 text-rose-500" : 
                  digit ? "border-[#fdb612] text-[#fdb612] bg-[#fdb612]/5 shadow-lg shadow-[#fdb612]/10" : 
                  "border-slate-200 dark:border-slate-800 focus:border-[#fdb612]"
                )}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold justify-center"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
            
            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-emerald-500 text-xs font-bold justify-center"
              >
                <CheckCircle2 className="w-4 h-4" />
                Código verificado! Acessando...
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <button
              onClick={handleVerify}
              disabled={code.join('').length !== 6 || isVerifying || isSuccess}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-[#fdb612]/20",
                code.join('').length === 6 && !isVerifying ? "bg-[#fdb612] text-[#231d0f]" : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              )}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Validar Acesso
                </>
              )}
            </button>

            <button
              onClick={onCancel}
              className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancelar e Voltar
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <Smartphone className="w-3 h-3" />
              App Autenticador
            </div>
            <div className="size-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <Key className="w-3 h-3" />
              Token de Backup
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
