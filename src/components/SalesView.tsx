import React from 'react';
import { TrendingUp, DollarSign, Target, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const SalesView: React.FC = () => {
  const [toast, setToast] = React.useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const [showAll, setShowAll] = React.useState(false);

  const stats = [
    { label: 'Vendas no Mês', value: 'R$ 142.500', change: '+12.5%', trend: 'up', icon: DollarSign },
    { label: 'Ticket Médio', value: 'R$ 28.500', change: '+3.2%', trend: 'up', icon: Target },
    { label: 'Taxa de Conversão', value: '18.4%', change: '-1.5%', trend: 'down', icon: TrendingUp },
    { label: 'Novos Contratos', value: '5', change: '+2', trend: 'up', icon: Users },
  ];

  const recentSales = [
    { id: '1', client: 'Residencial Silva', value: 'R$ 32.000', date: '12/03/2024', status: 'Pago' },
    { id: '2', client: 'Fazenda Boa Vista', value: 'R$ 85.000', date: '10/03/2024', status: 'Aguardando' },
    { id: '3', client: 'Comércio Central', value: 'R$ 45.000', date: '08/03/2024', status: 'Pago' },
    { id: '4', client: 'Condomínio Solar', value: 'R$ 120.000', date: '05/03/2024', status: 'Pago' },
  ];

  const allSales = [
    ...recentSales,
    { id: '5', client: 'Mercado Preço Baixo', value: 'R$ 55.000', date: '03/03/2024', status: 'Pago' },
    { id: '6', client: 'Hotel Fazenda', value: 'R$ 210.000', date: '01/03/2024', status: 'Aguardando' },
    { id: '7', client: 'Padaria Central', value: 'R$ 18.000', date: '28/02/2024', status: 'Pago' },
    { id: '8', client: 'Clínica Saúde', value: 'R$ 42.000', date: '25/02/2024', status: 'Pago' },
  ];

  const salesToDisplay = showAll ? allSales : recentSales;

  return (
    <div className="space-y-8 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}
      <div>
        <h2 className="text-3xl font-bold">Gestão de Vendas</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe o desempenho comercial e novos contratos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-[#231d0f]/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-[#fdb612]/10 rounded-lg">
                  <Icon className="w-5 h-5 text-[#fdb612]" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#231d0f]/20">
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              {showAll ? 'Histórico Completo de Vendas' : 'Vendas Recentes'}
            </h3>
            <p className="text-xs text-slate-500">
              {showAll ? 'Todos os contratos registrados no sistema' : 'Últimos contratos fechados e em negociação'}
            </p>
          </div>
          <button 
            onClick={() => {
              setShowAll(!showAll);
              showToast(showAll ? 'Mostrando vendas recentes' : 'Carregando histórico completo...');
            }}
            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[#fdb612] hover:bg-[#fdb612]/10 rounded-xl transition-colors border border-[#fdb612]/30"
          >
            {showAll ? 'Ver Recentes' : 'Ver Todas'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {salesToDisplay.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                        {sale.client.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sale.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900 dark:text-slate-100">{sale.value}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-medium">{sale.date}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      sale.status === 'Pago' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                    )}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
