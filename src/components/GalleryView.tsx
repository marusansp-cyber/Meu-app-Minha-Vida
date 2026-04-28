import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Maximize2, 
  Image as ImageIcon,
  Filter,
  Download,
  Calendar,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { GalleryItem, User } from '../types';
import { syncCollection, createDocument, deleteDocument } from '../firestoreUtils';

interface GalleryViewProps {
  user: User | null;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ user }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return syncCollection<GalleryItem>('gallery', (data) => {
      setItems(data.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
    });
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // In a real app, you'd upload to Firebase Storage
      // For this environment, we'll use base64 for simulation
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const newItem: Omit<GalleryItem, 'id'> = {
          url: base64String,
          name: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.name,
          category: 'other'
        };

        if (base64String.length > 1048487) { // Firestore limit check roughly
           alert("Arquivo muito grande para o Firestore. Use imagens menores de 1MB.");
           setIsUploading(false);
           return;
        }

        await createDocument('gallery', newItem);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta imagem?')) {
      await deleteDocument('gallery', id);
    }
  };

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'installation', label: 'Instalações' },
    { id: 'product', label: 'Produtos' },
    { id: 'blueprint', label: 'Projetos' },
    { id: 'other', label: 'Outros' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Galeria de Mídia</h1>
          <p className="text-slate-500 font-medium">Acervo fotográfico e documentos visuais do projeto.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className={cn(
            "flex items-center gap-2 px-6 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#fdb612]/20",
            isUploading && "opacity-50 cursor-not-allowed"
          )}>
            <Plus className="w-4 h-4" />
            {isUploading ? 'Enviando...' : 'Carregar Imagem'}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#fdb612] transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-[#fdb612] focus:border-transparent outline-none transition-all shadow-sm font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                activeCategory === cat.id
                  ? "bg-[#231d0f] dark:bg-white text-white dark:text-[#231d0f] border-transparent shadow-lg"
                  : "bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-[#fdb612]/50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredItems.map((item, index) => (
          <motion.div
            layoutId={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="group relative aspect-square bg-slate-100 dark:bg-white/5 rounded-[2rem] overflow-hidden cursor-pointer border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[#fdb612]/50 transition-all"
          >
            <img 
              src={item.url} 
              alt={item.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#231d0f]/80 via-[#231d0f]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-white text-xs font-black uppercase truncate mb-1">{item.name}</p>
                  <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest truncate flex items-center gap-1">
                    <UserIcon className="w-2 h-2" />
                    {item.uploadedBy}
                  </p>
                </div>
                <div className="flex gap-2">
                  {user?.role === 'admin' && (
                    <button 
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 bg-rose-500 text-white rounded-lg hover:scale-110 transition-all shadow-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <div className="p-2 bg-white/20 backdrop-blur-md text-white rounded-lg">
                    <Maximize2 className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="size-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Nenhuma imagem encontrada</p>
              <p className="text-slate-500 font-medium">Tente ajustar sua busca ou carregar novos arquivos.</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231d0f]/95 backdrop-blur-md"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              layoutId={selectedItem.id}
              className="relative max-w-5xl w-full bg-white dark:bg-[#231d0f] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="md:col-span-2 aspect-square md:aspect-auto bg-black flex items-center justify-center">
                  <img 
                    src={selectedItem.url} 
                    alt={selectedItem.name} 
                    className="max-w-full max-h-[80vh] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="p-8 space-y-8 flex flex-col h-full">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="px-3 py-1 bg-[#fdb612]/20 text-[#fdb612] rounded-full text-[8px] font-black uppercase tracking-widest">
                        {selectedItem.category || 'Outros'}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{selectedItem.name}</h2>
                    </div>
                    <button 
                      onClick={() => setSelectedItem(null)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <X className="w-6 h-6 text-slate-500" />
                    </button>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes do Arquivo</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                          <div className="size-8 bg-slate-50 dark:bg-white/5 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Data de Upload</p>
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatDate(selectedItem.uploadedAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                          <div className="size-8 bg-slate-50 dark:bg-white/5 rounded-lg flex items-center justify-center">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Responsável</p>
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">{selectedItem.uploadedBy}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedItem.description && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</p>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{selectedItem.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-slate-100 dark:border-white/5">
                    <a
                      href={selectedItem.url}
                      download={selectedItem.name}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Baixar HD
                    </a>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
