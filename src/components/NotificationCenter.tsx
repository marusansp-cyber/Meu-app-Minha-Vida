import React, { useState, useMemo } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Clock, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { Proposal } from '../types';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  read: boolean;
}

interface NotificationCenterProps {
  proposals?: Proposal[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ proposals = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);

  const staticNotifications: Notification[] = [
    {
      id: 'static-1',
      title: 'Nova Proposta Aceita',
      message: 'O cliente João Silva aceitou a proposta para o Projeto Alpha.',
      type: 'success',
      time: 'há 5 min',
      read: false,
    },
    {
      id: 'static-2',
      title: 'Vistoria Agendada',
      message: 'Vistoria técnica agendada para Residencial Vale Verde amanhã às 14h.',
      type: 'info',
      time: 'há 1 hora',
      read: false,
    }
  ];

  const dynamicNotifications = useMemo(() => {
    const alerts: Notification[] = [];
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    proposals.forEach(p => {
      if (p.expiryDate && p.status !== 'accepted' && p.status !== 'cancelled' && p.status !== 'expired') {
        const expiry = new Date(p.expiryDate);
        if (expiry > today && expiry <= sevenDaysFromNow) {
          alerts.push({
            id: `expiry-${p.id}`,
            title: 'Proposta Próxima do Vencimento',
            message: `A proposta para ${p.client} vence em ${expiry.toLocaleDateString('pt-BR')}.`,
            type: 'warning',
            time: 'Alerta',
            read: false
          });
        }
      }
    });

    return alerts;
  }, [proposals]);

  const allNotifications = useMemo(() => {
    const combined = [...dynamicNotifications, ...staticNotifications];
    return combined.map(n => ({
      ...n,
      read: readNotifications.includes(n.id)
    }));
  }, [dynamicNotifications, staticNotifications, readNotifications]);

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    if (!readNotifications.includes(id)) {
      setReadNotifications(prev => [...prev, id]);
    }
  };

  const markAllAsRead = () => {
    setReadNotifications(allNotifications.map(n => n.id));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 size-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#231d0f]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[140]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <h3 className="font-black text-slate-900 dark:text-slate-100">Notificações</h3>
              <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-[#fdb612] hover:underline"
              >
                Marcar todas como lidas
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {allNotifications.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-4",
                        !notification.read && "bg-blue-50/30 dark:bg-[#fdb612]/5"
                      )}
                    >
                      <div className={cn(
                        "size-10 rounded-full flex items-center justify-center shrink-0",
                        notification.type === 'success' && "bg-emerald-100 text-emerald-600",
                        notification.type === 'info' && "bg-blue-100 text-blue-600",
                        notification.type === 'warning' && "bg-amber-100 text-amber-600",
                        notification.type === 'error' && "bg-red-100 text-red-600"
                      )}>
                        {notification.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {notification.type === 'info' && <Info className="w-5 h-5" />}
                        {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                        {notification.type === 'error' && <X className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">Nenhuma notificação</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <button className="text-xs font-bold text-slate-500 hover:text-[#fdb612] transition-colors">
                Ver histórico completo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
