import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithAI } from '../services/chatbotService';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Olá! Sou o Consultor Solar da System Solar. Como posso te ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      const response = await chatWithAI(userMessage, history);
      setMessages(prev => [...prev, { role: 'model', content: response || "Desculpe, tive um problema ao processar sua mensagem." }]);
    } catch (error) {
      console.error('ChatBot error:', error);
      setMessages(prev => [...prev, { role: 'model', content: "Ops! Ocorreu um erro. Tente novamente em instantes." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-80 md:w-96 bg-white dark:bg-[#1a160d] rounded-2xl shadow-2xl border border-[#fdb612]/30 overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="bg-[#fdb612] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-6 h-6 text-[#231d0f]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#231d0f] uppercase tracking-widest">Consultor Solar</h4>
                  <div className="flex items-center gap-1">
                    <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-[#231d0f]/60 uppercase">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <Minimize2 className="w-5 h-5 text-[#231d0f]" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-black/20"
            >
              {messages.map((m, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm",
                    m.role === 'user' 
                      ? "bg-[#004a61] text-white rounded-tr-none" 
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none"
                  )}>
                    {m.content}
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    {m.role === 'user' ? 'Você' : 'Consultor Solar'}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-[#fdb612] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="size-2 bg-[#fdb612] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="size-2 bg-[#fdb612] rounded-full animate-bounce" />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a160d]">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Tire suas dúvidas agora..."
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#fdb612] text-[#231d0f] p-2 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[8px] text-center text-slate-400 mt-2 font-bold uppercase tracking-widest">
                Desenvolvido por System Solar AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "size-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 relative group",
          isOpen ? "bg-slate-900 text-white" : "bg-[#fdb612] text-[#231d0f] hover:bg-[#ffc131]"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 size-3 bg-rose-500 rounded-full border-2 border-[#fdb612] animate-ping" />
            <span className="absolute -top-1 -right-1 size-3 bg-rose-500 rounded-full border-2 border-[#fdb612]" />
          </div>
        )}
        <div className="absolute right-full mr-4 bg-[#231d0f] text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
          Fale com nosso consultor
        </div>
      </button>
    </div>
  );
};
