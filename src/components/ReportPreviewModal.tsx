import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  RefreshCw, 
  Settings, 
  Palette, 
  Sliders, 
  Check, 
  HelpCircle,
  FileText,
  ZoomIn,
  ZoomOut,
  Mail
} from 'lucide-react';
import { Proposal, Kit } from '../types';
import { generateProposalPDF } from '../services/pdfService';
import { sendProposalEmail } from '../services/emailService';
import { cn } from '../lib/utils';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  kit?: Kit | null | undefined;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  proposal,
  kit = null
}) => {
  // Layout Options State (Fully customized by the user in Real-Time!)
  const [autoLayout, setAutoLayout] = useState<boolean>(true);
  const [margin, setMargin] = useState<number>(15); // in mm
  const [fontSize, setFontSize] = useState<number>(9); // in pt
  const [themeColor, setThemeColor] = useState<'navy' | 'emerald' | 'amber' | 'slate'>('navy');
  const [compactSpacing, setCompactSpacing] = useState<boolean>(false);
  const [showComponents, setShowComponents] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(100); // Visual Scaling Zoom (%)

  // Preview management State
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Email delivery States
  const [isEmailFormOpen, setIsEmailFormOpen] = useState<boolean>(false);
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

  // Auto-hide toast after 3s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Pre-fill email states when proposal loads
  useEffect(() => {
    if (proposal) {
      setEmailTo(proposal.email || '');
      setEmailSubject(`Proposta Comercial Solar #${proposal.proposalNumber || '2601'} - JV Mendes Junior Engenharia`);
      setEmailBody(`Olá ${proposal.client || proposal.titular || 'Prezado Cliente'},\n\nSegue em anexo a nossa proposta comercial personalizada para o seu sistema de energia solar fotovoltaico de ${proposal.systemSize || ''} kWp, preparada pela JV Mendes Junior Engenharia.\n\nFicamos à total disposição para sanar quaisquer dúvidas e definir os próximos passos para a instalação do seu sistema.\n\nAtenciosamente,\nJV Mendes Junior Engenharia`);
    }
  }, [proposal]);

  // Re-generate PDF Blob URL when settings change
  useEffect(() => {
    if (!isOpen || !proposal) return;

    let active = true;
    let localBlobUrl = '';

    const renderPDF = async () => {
      try {
        setIsGenerating(true);
        // Call the service with custom layout parameters
        const pdfDataUri = await generateProposalPDF(proposal, kit || undefined, {
          autoLayout,
          margin,
          fontSize,
          themeColor,
          compactSpacing,
          showComponents
        });

        if (!active) return;

        // Store base64 data for email sharing
        setPdfBase64(pdfDataUri);

        // Decode Base64 to Blob to avoid iframe URL limitations with long strings
        const byteCharacters = atob(pdfDataUri.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create standard Blob URL
        localBlobUrl = URL.createObjectURL(blob);
        
        // Clean up previous blob URL
        setPdfUrl(prev => {
          if (prev && prev.startsWith('blob:')) {
            URL.revokeObjectURL(prev);
          }
          return localBlobUrl;
        });

      } catch (error) {
        console.error('Error rendering live proposal preview:', error);
        triggerToast('⚠️ Falha ao atualizar prévia do PDF.');
      } finally {
        if (active) {
          setIsGenerating(false);
        }
      }
    };

    // Debounce to avoid slamming the CPU during rapid form updates (e.g. margin slider)
    const debounceTimer = setTimeout(() => {
      renderPDF();
    }, 250);

    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [isOpen, proposal, kit, autoLayout, margin, fontSize, themeColor, compactSpacing, showComponents]);

  // Clean up object URL on modal close
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen || !proposal) return null;

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Proposta_${proposal.proposalNumber || 'A4_Preview'}_${proposal.client?.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('📥 Download iniciado!');
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    } else {
      // Fallback
      window.open(pdfUrl, '_blank');
    }
  };

  const handleSendByEmail = async () => {
    if (!emailTo) {
      triggerToast('⚠️ Por favor, insira o e-mail do destinatário.');
      return;
    }
    if (!pdfBase64) {
      triggerToast('⚠️ PDF ainda não gerado. Aguarde...');
      return;
    }

    try {
      setIsSendingEmail(true);
      const res = await sendProposalEmail({
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
        pdfBase64: pdfBase64,
        fileName: `Proposta_${proposal.proposalNumber || '2601'}_${proposal.client?.replace(/\s+/g, '_')}.pdf`
      });

      if (res.success) {
        triggerToast('✅ E-mail enviado com sucesso!');
        setIsEmailFormOpen(false);
      } else {
        triggerToast(`❌ Erro: ${res.message}`);
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      triggerToast('❌ Erro de conexão ao enviar e-mail.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div 
      id="report-preview-modal"
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-6"
    >
      <div className="bg-white dark:bg-[#12141c] rounded-[32px] w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-[#161a24]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center border border-[#fdb612]/20">
              <FileText className="w-5 h-5 text-[#fdb612]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
                Visualizador de <span className="text-[#fdb612]">Relatórios & Propostas</span>
              </h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Otimizado para Impressão Profissional em Papel A4
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-250 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Outer Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Real-time PDF Adjustments Sidebar */}
          <div className="w-full md:w-80 bg-slate-50 dark:bg-[#161a25]/60 p-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80 overflow-y-auto flex flex-col justify-between gap-6">
            
            <div className="space-y-6">
              {/* Layout Engine Select */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Motor de Grid
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-xl">
                  <button
                    onClick={() => setAutoLayout(true)}
                    className={cn(
                      "py-2 rounded-lg font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5",
                      autoLayout 
                        ? "bg-white dark:bg-slate-800 text-[#fdb612] shadow-sm" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                    )}
                  >
                    <span>Automático (A4)</span>
                    <span className="text-[8px] font-normal opacity-70">Anti-Quebra</span>
                  </button>
                  <button
                    onClick={() => setAutoLayout(false)}
                    className={cn(
                      "py-2 rounded-lg font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5",
                      !autoLayout 
                        ? "bg-white dark:bg-slate-800 text-[#fdb612] shadow-sm" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                    )}
                  >
                    <span>Padrão Estático</span>
                    <span className="text-[8px] font-normal opacity-70">Posições Fixas</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-normal mt-1.5 italic">
                  *O <strong>Layout Automático</strong> recalcula as quebras de páginas, ajusta dinamicamente as tabelas de componentes e evita rodapés órfãos.
                </p>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Paleta Executiva
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'navy', label: 'Classic Azul', bg: 'bg-[#004a61]' },
                    { key: 'emerald', label: 'Ecológico', bg: 'bg-emerald-700' },
                    { key: 'amber', label: 'Solar Gold', bg: 'bg-amber-600' },
                    { key: 'slate', label: 'Charcoal', bg: 'bg-slate-700' }
                  ].map(theme => (
                    <button
                      key={theme.key}
                      onClick={() => setThemeColor(theme.key as any)}
                      className={cn(
                        "p-2 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-95",
                        themeColor === theme.key
                          ? "border-[#fdb612] bg-[#fdb612]/5 dark:bg-[#fdb612]/10 text-slate-800 dark:text-slate-100 font-bold"
                          : "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 text-xs"
                      )}
                    >
                      <span className={cn("h-3 w-3 rounded-full shrink-0", theme.bg)} />
                      <span className="text-xs truncate">{theme.label}</span>
                      {themeColor === theme.key && <Check className="w-3 h-3 text-[#fdb612] ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest flex items-center gap-1.5">
                    📏 Margens do A4
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{margin} mm</span>
                </div>
                <input 
                  type="range" 
                  min="8" 
                  max="24" 
                  step="1"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full accent-[#fdb612] bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1">
                  <span>Compactas (8mm)</span>
                  <span>Elegantes (24mm)</span>
                </div>
              </div>

              {/* Zoom Scale Selector */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-[#fdb612]" /> Zoom da Visualização
                  </label>
                  <span className="text-xs font-mono font-black text-[#fdb612] bg-[#fdb612]/10 px-2 py-0.5 rounded-md">{zoom}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                    disabled={zoom <= 50}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 transition-colors"
                    title="Diminuir Zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    type="range" 
                    min="50" 
                    max="200" 
                    step="5"
                    value={zoom}
                    onChange={(e) => setZoom(parseInt(e.target.value))}
                    className="flex-1 accent-[#fdb612] bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <button
                    onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                    disabled={zoom >= 200}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 transition-colors"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1">
                  <span>50%</span>
                  <button 
                    onClick={() => setZoom(100)}
                    className="hover:text-[#fdb612] transition-colors focus:outline-none uppercase text-[8px] tracking-wider font-extrabold"
                    type="button"
                    title="Redefinir visualização"
                  >
                    Reset (100%)
                  </button>
                  <span>200%</span>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest mb-2">
                  🔤 Escala Tipográfica
                </label>
                <div className="flex gap-1.5 bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-xl">
                  {[
                    { value: 8, label: '8pt', desc: 'Compacta' },
                    { value: 9, label: '9pt', desc: 'Padrão' },
                    { value: 10, label: '10pt', desc: 'Ampla' }
                  ].map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFontSize(f.value)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center",
                        fontSize === f.value
                          ? "bg-white dark:bg-slate-800 text-[#fdb612] shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                      )}
                    >
                      <span>{f.label}</span>
                      <span className="text-[7.5px] opacity-60 font-normal">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra toggles */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">
                  ⚙️ Preferências Adicionais
                </label>
                
                {/* Compact Spacing */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={compactSpacing}
                      onChange={(e) => setCompactSpacing(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-10 h-5 rounded-full transition-all duration-200",
                      compactSpacing ? "bg-[#fdb612]" : "bg-slate-300 dark:bg-slate-705"
                    )} />
                    <div className={cn(
                      "absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm duration-200 transform",
                      compactSpacing ? "translate-x-5" : "translate-x-0"
                    )} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-650 dark:text-slate-300">Espaçamento Compacto</span>
                    <span className="text-[9.5px] text-slate-400 block">Reduz altura e padding das tabelas</span>
                  </div>
                </label>

                {/* Show detailed components */}
                <label className="flex items-center gap-3 cursor-pointer group pt-1">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={showComponents}
                      onChange={(e) => setShowComponents(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-10 h-5 rounded-full transition-all duration-200",
                      showComponents ? "bg-[#fdb612]" : "bg-slate-300 dark:bg-slate-705"
                    )} />
                    <div className={cn(
                      "absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm duration-200 transform",
                      showComponents ? "translate-x-5" : "translate-x-0"
                    )} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-650 dark:text-slate-300 flex items-center gap-1">
                      Tabela de Componentes
                    </span>
                    <span className="text-[9.5px] text-slate-400 block">Especificações de inversores & painéis</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/15">
              <h5 className="text-[10px] font-black tracking-wider text-amber-500 uppercase flex items-center gap-1.5 mb-1 bg-amber-500/10 dark:bg-transparent px-2 py-0.5 rounded w-max">
                <HelpCircle className="w-3.5 h-3.5" /> Dica de Impressão
              </h5>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                Pressione <kbd className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[8.5px] font-mono">Ctrl + P</kbd> na tela de visualização ou use o botão de imprimir para abrir o driver oficial. Habilite <strong>"Gráficos de Fundo"</strong> nas configurações do Chrome.
              </p>
            </div>
          </div>

          {/* PDF Visualizer Section */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 flex flex-col justify-between overflow-hidden relative">
            
            {/* Real-time Loader Backdrop */}
            {isGenerating && (
              <div className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center transition-all duration-200">
                <div className="bg-white dark:bg-[#1e2330] px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xl flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-[#fdb612] animate-spin" />
                  <span className="text-xs font-black tracking-tight text-slate-700 dark:text-slate-200 uppercase">
                    Otimizando Layout A4...
                  </span>
                </div>
              </div>
            )}

            {/* Embed PDF Reader Frame */}
            <div className="flex-1 rounded-[20px] overflow-auto border border-slate-200 dark:border-slate-800 bg-slate-200/40 dark:bg-slate-950 shadow-inner flex justify-center items-start p-4">
              {pdfUrl ? (
                <div 
                  style={{
                    width: `${zoom}%`,
                    height: `${zoom}%`,
                    minWidth: zoom < 100 ? '300px' : '100%',
                    minHeight: zoom < 100 ? '424px' : '100%',
                    transition: 'width 0.15s ease, height 0.15s ease',
                  }}
                  className="relative shrink-0 rounded-2xl overflow-hidden shadow-xl border border-slate-300 dark:border-slate-800/80 bg-white transition-opacity duration-200"
                >
                  <iframe
                    id="pdf-preview-iframe"
                    src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    className="w-full h-full bg-slate-100 dark:bg-slate-900 absolute inset-0 rounded-2xl"
                    title="PDF Preview"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-550 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                  <p className="text-xs font-semibold">Renderizando documento fotovoltaico...</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-[10px] font-bold text-slate-500">
                JV Mendes Junior Engenharia © 2026
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePrint}
                  disabled={!pdfUrl}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1d28] rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Imprimir PDF</span>
                </button>
                <button
                  onClick={() => setIsEmailFormOpen(true)}
                  disabled={!pdfUrl}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/10 rounded-xl font-bold text-xs hover:bg-emerald-500/20 dark:hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 animate-in fade-in duration-200"
                >
                  <Mail className="w-4 h-4 text-emerald-500" />
                  <span>Enviar por Email</span>
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!pdfUrl}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#fdb612] text-slate-900 shadow-lg shadow-[#fdb612]/20 rounded-xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>Baixar Versão A4</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email Form Overlay */}
        {isEmailFormOpen && (
          <div className="absolute inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#181a24] rounded-3xl w-full max-w-lg shadow-2xl border border-slate-150 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-[#161922] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25">
                    <Mail className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                      Enviar por E-mail
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      O PDF atualizado será anexado automaticamente.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEmailFormOpen(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-4.5 h-4.5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              {/* Email form Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 block tracking-widest mb-1.5">
                    E-mail do Destinatário *
                  </label>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#12141c] border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 block tracking-widest mb-1.5">
                    Assunto da Mensagem
                  </label>
                  <input
                    type="text"
                    placeholder="Assunto do e-mail"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#12141c] border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 block tracking-widest mb-1.5">
                    Corpo de Texto (Mensagem)
                  </label>
                  <textarea
                    placeholder="Escreva sua mensagem personalizada..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-50 dark:bg-[#12141c] border border-slate-250 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#12141c]/50 rounded-xl border border-slate-200/50 dark:border-slate-800/80 flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#fdb612] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-black block text-slate-700 dark:text-slate-300 truncate">
                      Proposta_{proposal.proposalNumber || '2601'}_{proposal.client?.replace(/\s+/g, '_')}.pdf
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      Anexo PDF profissional otimizado para dimensões A4
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#161922] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEmailFormOpen(false)}
                  className="px-4.5 py-2.5 border border-slate-250 dark:border-slate-800 text-slate-650 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendByEmail}
                  disabled={isSendingEmail || !emailTo}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95",
                    isSendingEmail
                      ? "bg-slate-300 dark:bg-slate-850 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/10"
                  )}
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Disparar E-mail</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-55 bg-slate-900/95 dark:bg-slate-800 border border-[#fdb612]/40 text-[#fdb612] px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce md:animate-none">
            <Check className="w-4 h-4 text-[#fdb612]" />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
};
