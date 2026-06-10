import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Edit2, Check, X } from 'lucide-react';
import { getDocument, setDocument } from '../firestoreUtils';

export const SalesGaugeChart: React.FC<{ currentSales: number }> = ({ currentSales }) => {
  const [goal, setGoal] = useState(100000);
  const [isEditing, setIsEditing] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const data = await getDocument<any>('settings', 'salesGoal');
        if (data && data.targetValue) {
          setGoal(parseFloat(data.targetValue));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoal();
  }, []);

  const handleSaveGoal = async () => {
    const parsed = parseFloat(newGoal);
    if (!isNaN(parsed) && parsed > 0) {
      setGoal(parsed);
      try {
        await setDocument('settings', 'salesGoal', { targetValue: parsed, targetCount: 10 }); // Keep backward compat or read it first
      } catch (err) {
        console.error(err);
      }
    }
    setIsEditing(false);
  };

  const percent = goal > 0 ? (currentSales / goal) * 100 : 0;
  const displayPercent = Math.min(percent, 100);
  
  const data = [{
    name: 'Vendas',
    value: displayPercent,
    fill: displayPercent >= 100 ? '#10b981' : '#fdb612'
  }];

  return (
    <div className="bg-white dark:bg-[#1a160d] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#fdb612]/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#fdb612]" />
          </div>
          <h3 className="font-bold text-sm tracking-widest uppercase">Meta Mensal</h3>
        </div>
        {!isEditing && (
          <button onClick={() => { setNewGoal(goal.toString()); setIsEditing(true); }} className="p-1.5 text-slate-400 hover:text-[#fdb612] bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="h-40 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="100%" 
            innerRadius="80%" 
            outerRadius="100%" 
            barSize={16} 
            data={data} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            {/* Background bar */}
            <RadialBar 
              background={{ fill: '#f1f5f9' }} // Try adapting for dark mode separately if needed
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <div className="text-center">
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {percent.toFixed(1)}%
            </p>
            <p className="text-[10px] uppercase font-black tracking-widest text-[#fdb612]">Atingido</p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-400">R$</span>
            <input 
              type="number"
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded outline-none border focus:border-[#fdb612] text-sm font-bold text-center"
              autoFocus
            />
            <button onClick={handleSaveGoal} className="p-1.5 bg-emerald-500 text-white rounded"><Check className="w-3 h-3" /></button>
            <button onClick={() => setIsEditing(false)} className="p-1.5 bg-rose-500 text-white rounded"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              R$ {currentSales.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} / <span className="font-medium text-xs">R$ {goal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
