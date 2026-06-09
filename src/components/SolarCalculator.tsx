import React, { useState, useEffect } from 'react';
import { updateDocument } from '../firestoreUtils';
import { Calculator, Sun, DollarSign, Battery, Zap, Save, Check } from 'lucide-react';
import { Lead } from '../types';

interface SolarCalculatorProps {
  lead?: Lead | null;
  onSave?: (kWp: number, monthlyGeneration: number, payback: number) => void;
}

export const SolarCalculator: React.FC<SolarCalculatorProps> = ({ lead, onSave }) => {
  const [consumptionStr, setConsumptionStr] = useState('500');
  const [hspStr, setHspStr] = useState('4.5');
  const [tariffStr, setTariffStr] = useState('0.95');
  const [costPerKwpStr, setCostPerKwpStr] = useState('3500');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (lead?.energyConsumption) {
      setConsumptionStr(lead.energyConsumption.toString());
    }
  }, [lead]);

  // Calculations
  const consumption = parseFloat(consumptionStr) || 0;
  const hsp = parseFloat(hspStr) || 0;
  const tariff = parseFloat(tariffStr) || 0;
  const costPerKwp = parseFloat(costPerKwpStr) || 0;

  // kWp formula: Consumo / (HSP * 30 * 0.8)
  const kwp = (hsp > 0 && consumption > 0) ? (consumption / (hsp * 30 * 0.8)) : 0;
  const kwpFormatted = kwp.toFixed(2);
  
  // Geração Mensal (equivale ao consumo neste caso, ou podemos calcular kWp * HSP * 30 * 0.8)
  const monthlyGeneration = kwp * hsp * 30 * 0.8;
  const monthlyGenerationFormatted = monthlyGeneration.toFixed(0);

  // Estimativa de Custo
  const estimatedCost = kwp * costPerKwp;
  
  // Economia Mensal / Anual
  const monthlySavings = monthlyGeneration * tariff;
  const annualSavings = monthlySavings * 12;

  // Payback Simples (Anos)
  const payback = annualSavings > 0 ? (estimatedCost / annualSavings) : 0;
  const paybackFormatted = payback.toFixed(1);

  // VPL (25 anos, taxa de desconto 10%)
  const discountRate = 0.10;
  let vpl = -estimatedCost;
  for (let i = 1; i <= 25; i++) {
    vpl += annualSavings / Math.pow(1 + discountRate, i);
  }
  const vplFormatted = vpl > 0 ? `R$ ${vpl.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : 'R$ 0';

  // TIR (Aproximação Bisection 25 anos)
  let min = 0.0;
  let max = 1.0;
  let irr = 0;
  if (estimatedCost > 0 && annualSavings > 0) {
    for (let i = 0; i < 50; i++) {
        irr = (min + max) / 2;
        let npv = -estimatedCost;
        for (let j = 1; j <= 25; j++) {
            npv += annualSavings / Math.pow(1 + irr, j);
        }
        if (npv > 0) {
            min = irr;
        } else {
            max = irr;
        }
    }
  }
  const tirFormatted = (irr * 100).toFixed(1);

  const handleSave = async () => {
    if (!lead || !lead.id) return;
    setIsSaving(true);
    try {
      const updateData = {
        calculatedKwp: parseFloat(kwpFormatted),
        calculatedMonthlyGen: parseFloat(monthlyGenerationFormatted),
        calculatedPayback: parseFloat(paybackFormatted),
        energyConsumption: consumptionStr
      };
      
      await updateDocument('leads', lead.id, updateData);
      setSaved(true);
      if (onSave) onSave(updateData.calculatedKwp, updateData.calculatedMonthlyGen, updateData.calculatedPayback);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving calculation', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#231d0f]/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Calculadora Solar</h3>
          <p className="text-xs font-bold text-slate-400">Dimensionamento Rápido ABSOLAR</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consumo (kWh/mês)</label>
          <input 
            type="number" 
            value={consumptionStr}
            onChange={e => setConsumptionStr(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all text-sm font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">HSP Local</label>
          <input 
            type="number" 
            value={hspStr}
            onChange={e => setHspStr(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all text-sm font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tarifa (R$/kWh)</label>
          <input 
            type="number" 
            value={tariffStr}
            onChange={e => setTariffStr(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all text-sm font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custo Est. (R$/kWp)</label>
          <input 
            type="number" 
            value={costPerKwpStr}
            onChange={e => setCostPerKwpStr(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all text-sm font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-emerald-500">
            <Sun className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Potência</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{kwpFormatted} <span className="text-sm text-slate-400">kWp</span></p>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-blue-500">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Geração</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{monthlyGenerationFormatted} <span className="text-sm text-slate-400">kWh</span></p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-amber-500">
            <Battery className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Payback</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{paybackFormatted} <span className="text-sm text-slate-400">Anos</span></p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-purple-500">
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">TIR</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{tirFormatted} <span className="text-sm text-slate-400">%</span></p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">VPL (25 anos)</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-slate-100">{vplFormatted}</p>
        </div>
      </div>

      <div className="flex justify-end">
        {lead && lead.id && (
          <button 
            disabled={isSaving || saved}
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              saved ? 'bg-emerald-500 text-white' : 'bg-[#fdb612] text-[#231d0f] hover:bg-[#fdb612]/90 shadow-lg shadow-[#fdb612]/20 active:scale-95'
            }`}
          >
            {isSaving ? (
              <span className="animate-pulse">Salvando...</span>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Cálculo
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
