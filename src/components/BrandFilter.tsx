import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface BrandFilterProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const BrandFilter: React.FC<BrandFilterProps> = ({
  label,
  options,
  selectedOptions,
  onChange,
  isOpen,
  onToggle,
}) => {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedOptions);

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedOptions);
    }
  }, [selectedOptions, isOpen]);

  const handleToggleOption = (option: string) => {
    if (tempSelected.includes(option)) {
      setTempSelected(tempSelected.filter((o) => o !== option));
    } else {
      setTempSelected([...tempSelected, option]);
    }
  };

  const handleApply = () => {
    onChange(tempSelected);
    onToggle();
  };

  const handleClear = () => {
    setTempSelected([]);
    onChange([]);
    onToggle();
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={onToggle}
          className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest min-w-[200px] flex items-center justify-between hover:border-[#fdb612]/50 transition-all"
        >
          <span className="truncate max-w-[140px]">
            {selectedOptions.length === 0
              ? `Todas as Marcas (${options.length})`
              : `${selectedOptions.length} Selecionada(s)`}
          </span>
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform text-slate-400",
              isOpen ? "rotate-90" : "rotate-0"
            )}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={onToggle}
            />
            <div className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 p-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1 space-y-1">
                {options.length === 0 ? (
                  <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nenhuma marca disponível
                  </div>
                ) : (
                  options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={tempSelected.includes(option)}
                        onChange={() => handleToggleOption(option)}
                        className="size-4 rounded border-slate-300 text-[#fdb612] focus:ring-[#fdb612]"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                        {option}
                      </span>
                    </label>
                  ))
                )}
              </div>
              
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
              
              <div className="flex gap-2 p-1">
                <button
                  onClick={handleClear}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Limpar
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-3 py-2 bg-[#fdb612] hover:bg-[#fdb612]/90 text-[#231d0f] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#fdb612]/10"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
