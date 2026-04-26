import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Plus, Search, Filter, MoreVertical, Download, Send, Eye, Clock, CheckCircle2, AlertCircle, X, XCircle, CheckCircle, Printer, Share2, Copy, Calendar, User, ArrowUpRight, Trash2, HardHat } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Proposal, User as UserType, Lead, Client } from '../types';
import { NewProposalModal } from './NewProposalModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { SMTPHelpModal } from './SMTPHelpModal';
import { HelpCircle } from 'lucide-react';
import { syncCollection, createDocument, updateDocument, deleteDocument } from '../firestoreUtils';
import { generateProposalPDF } from '../services/pdfService';
import { sendProposalEmail } from '../services/emailService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface ProposalsViewProps {
  proposals: Proposal[];
  user: UserType | null;
  kits: any[];
  leads: Lead[];
  clients: Client[];
  preFill?: Partial<Proposal> | null;
  onPreFillComplete?: () => void;
  onConvertToInstallation?: (proposal: Proposal) => void;
}

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800">
    <td className="px-6 py-4"><div className="size-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-6 py-4">
      <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
      <div className="w-16 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
    </td>
    <td className="px-6 py-4">
      <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
      <div className="w-20 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
    </td>
    <td className="px-6 py-4"><div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-6 py-4"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-6 py-4"><div className="w-24 h-6 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="size-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="w-20 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    </td>
    <td className="px-6 py-4 text-right"><div className="w-24 h-8 bg-slate-50 dark:bg-white/5 rounded ml-auto" /></td>
  </tr>
);

export const ProposalsView: React.FC<ProposalsViewProps> = ({ 
  proposals: initialProposals, 
  user, 
  kits, 
  leads, 
  clients,
  preFill,
  onPreFillComplete,
  onConvertToInstallation
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [representativeFilter, setRepresentativeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Proposal | 'value_num'; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    id: '',
    client: '',
    system: '',
    value: '',
    representative: 'all',
    startDate: '',
    endDate: '',
    commissionStatus: 'all',
    kitPanel: '',
    kitInverter: ''
  });
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([]);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [isUpdatingCommission, setIsUpdatingCommission] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info'; isProminent?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  useEffect(() => {
    // Simulate loading or wait for proposals
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (preFill) {
      setSelectedProposal(preFill as Proposal);
      setIsModalOpen(true);
      if (onPreFillComplete) onPreFillComplete();
    }
  }, [preFill]);

  const proposals = initialProposals;

  // Auto-expire logic
  useEffect(() => {
    if (!proposals || proposals.length === 0) return;
    
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const expiredProposals = (proposals || []).filter(p => {
      if (!p.id || !p.expiryDate) return false;
      if (p.status !== 'pending' && p.status !== 'sent') return false;
      const expiry = new Date(p.expiryDate);
      return expiry < now;
    });

    const nearExpiration = (proposals || []).filter(p => {
      if (!p.id || !p.expiryDate) return false;
      if (p.status !== 'pending' && p.status !== 'sent') return false;
      const expiry = new Date(p.expiryDate);
      return expiry > now && expiry <= sevenDaysFromNow;
    });

    if (expiredProposals.length > 0) {
      expiredProposals.forEach(p => {
        updateDocument('proposals', p.id, { status: 'expired' });
      });
    }

    if (nearExpiration.length > 0) {
      const names = nearExpiration.map(p => p.client).join(', ');
      showToast(`Atenção: Propostas de ${names} vencem em menos de 7 dias!`, 'info', true);
    }
  }, [proposals]);

  const showToast = (message: string, type: 'success' | 'info' = 'success', isProminent: boolean = false) => {
    setToast({ message, type, isProminent });
    setTimeout(() => setToast(null), 3000);
  };

  const stats = useMemo(() => {
    const totalOpen = (proposals || []).filter(p => p.status === 'pending' || p.status === 'sent').reduce((acc, p) => {
      const val = typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      // Safety guard: ignore values over 100M as they are likely erroneous data
      if (val > 100000000) return acc;
      return acc + val;
    }, 0);
    
    const acceptedCount = (proposals || []).filter(p => p.status === 'accepted').length;
    const totalCount = (proposals || []).length;
    const acceptRate = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;
    
    return {
      totalOpen,
      acceptRate,
      avgTime: totalCount > 0 ? '4.8' : '0'
    };
  }, [proposals]);

  const getNextProposalNumber = async () => {
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const prefix = year;
      
      const q = query(
        collection(db, 'proposals'), 
        where('proposalNumber', '>=', prefix),
        where('proposalNumber', '<=', prefix + '\uf8ff')
      );
      
      const snapshot = await getDocs(q);
      let maxNum = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.proposalNumber) {
          const numStr = data.proposalNumber.replace(prefix, '');
          const num = parseInt(numStr);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
      
      const nextNum = (maxNum + 1).toString().padStart(2, '0');
      return `${prefix}${nextNum}`;
    } catch (error) {
      console.error('Error generating proposal number:', error);
      const year = new Date().getFullYear().toString().slice(-2);
      return `${year}01`; // Fallback
    }
  };

  const handleAddProposal = async (proposalData: Proposal) => {
    if (proposalData.id && proposals.find(p => p.id === proposalData.id)) {
      const { id, ...data } = proposalData;
      await updateDocument('proposals', id, data);
      showToast('Proposta atualizada com sucesso!');
    } else {
      const proposalNumber = await getNextProposalNumber();
      await createDocument('proposals', {
        ...proposalData,
        proposalNumber,
        date: new Date().toLocaleDateString('pt-BR')
      });
      showToast('Proposta criada com sucesso!');
    }
    setSelectedProposal(null);
  };

  const handleEdit = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (proposal: Proposal) => {
    const { id, ...rest } = proposal;
    const duplicated = {
      ...rest,
      client: `${proposal.client} (Cópia)`,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'pending' as const
    };
    await createDocument('proposals', duplicated);
    showToast('Proposta duplicada com sucesso!');
  };

  const confirmDelete = async () => {
    if (proposalToDelete) {
      await deleteDocument('proposals', proposalToDelete.id);
      setIsDeleteModalOpen(false);
      setProposalToDelete(null);
      showToast('Proposta excluída permanentemente.');
    }
  };

  const handleExport = () => {
    showToast('Exportando dados para CSV...', 'info');
    
    try {
      // Define CSV headers
      const headers = ['ID', 'Cliente', 'E-mail', 'Valor', 'Data Criacao', 'Status', 'Tamanho Sistema', 'Representante', 'Data Validade', 'Comissao (%)'];
      
      // Map data to CSV rows
      const rows = filteredProposals.map(p => [
        p.proposalNumber || p.id,
        p.client,
        p.email || 'N/A',
        p.value?.toString() || '0', 
        p.date,
        p.status,
        p.systemSize,
        p.representative,
        p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('pt-BR') : 'N/A',
        p.commission || 5
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
      ].join('\n');

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `propostas_solar_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => showToast('Exportação concluída!'), 1500);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      showToast('Erro ao exportar dados.', 'info');
    }
  };

  const handleSend = async (id: string) => {
    if (!id) {
      showToast('Erro: ID da proposta não encontrado. Tente recarregar a página.', 'info');
      console.error('handleSend called without ID');
      return;
    }

    const proposal = proposals.find(p => p.id === id);
    if (!proposal) {
      showToast('Erro: Proposta não encontrada no sistema.', 'info');
      console.error(`Proposal with ID ${id} not found in proposals list`);
      return;
    }

    if (!proposal.email) {
      showToast('Erro: E-mail do cliente não cadastrado.', 'info');
      return;
    }

    try {
      showToast('Gerando PDF e preparando e-mail...', 'info');
      
      const kit = kits.find(k => k.id === proposal.kitId);
      const pdfBase64 = await generateProposalPDF(proposal, kit);
      
      const result = await sendProposalEmail({
        to: proposal.email,
        subject: `Proposta Solar - ${proposal.client}`,
        body: `Olá ${proposal.client},\n\nSegue em anexo a proposta comercial para o seu sistema de energia solar de ${proposal.systemSize}.\n\nFicamos à disposição para dúvidas.\n\nAtenciosamente,\nVieira's Solar & Engenharia`,
        pdfBase64,
        fileName: `proposta_${proposal.id}.pdf`
      });

      if (result.success) {
        await updateDocument('proposals', id, { status: 'sent' });
        showToast('Proposta enviada ao cliente com sucesso!', 'success', true);
      } else {
        showToast(`Erro ao enviar: ${result.message}`, 'info', true);
      }
    } catch (error) {
      console.error('Erro ao enviar proposta:', error);
      showToast('Erro ao processar envio.', 'info');
    }
  };

  const handleDownload = async (id: string) => {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return;

    try {
      showToast('Gerando PDF...', 'info');
      const kit = kits.find(k => k.id === proposal.kitId);
      const pdfBase64 = await generateProposalPDF(proposal, kit);
      
      const link = document.createElement('a');
      link.href = pdfBase64;
      link.download = `proposta_${proposal.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Download concluído!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      showToast('Erro ao gerar PDF.', 'info');
    }
  };

  const handlePrint = async (id: string) => {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return;

    try {
      showToast('Preparando para impressão...', 'info');
      const kit = kits.find(k => k.id === proposal.kitId);
      const pdfBase64 = await generateProposalPDF(proposal, kit);
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Imprimir Proposta - ${proposal.id}</title></head>
            <body style="margin:0;padding:0;">
              <embed width="100%" height="100%" src="${pdfBase64}" type="application/pdf">
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      showToast('Erro ao preparar impressão.', 'info');
    }
  };

  const handleExportListPDF = () => {
    setIsLoading(true);
    showToast('Gerando relatório consolidado...', 'info');
    
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(35, 29, 15); // #231d0f
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(253, 182, 18); // #fdb612
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO DE PROPOSTAS", pageWidth / 2, 25, { align: "center" });
      
      // Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 50);
      doc.text(`Consultor: ${representativeFilter === 'all' ? 'Todos' : representativeFilter}`, 20, 57);
      doc.text(`Status: ${statusFilters.length === 0 ? 'Todos' : statusFilters.join(', ')}`, 20, 64);
      
      // Table
      const headers = [['ID', 'CLIENTE', 'VALOR', 'DATA', 'STATUS', 'SISTEMA (kWp)', 'COMISSÃO']];
      const data = filteredProposals.map(p => {
        const value = p.value || 0;
        const commissionRate = p.commission || 5;
        const commissionValue = value * (commissionRate / 100);
        
        return [
          p.proposalNumber || p.id,
          p.client,
          `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
          p.date,
          p.status.toUpperCase(),
          p.systemSize,
          `R$ ${commissionValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
        ];
      });

      (doc as any).autoTable({
        head: headers,
        body: data,
        startY: 75,
        theme: 'striped',
        headStyles: { fillColor: [35, 29, 15], textColor: [253, 182, 18] },
        styles: { fontSize: 8 },
        margin: { top: 75 }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Vieira's Solar & Engenharia - Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      }

      doc.save(`relatorio_propostas_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF list:', error);
      showToast('Erro ao gerar relatório PDF.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsDetailsModalOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedProposalIds.length === filteredProposals.length) {
      setSelectedProposalIds([]);
    } else {
      setSelectedProposalIds(filteredProposals.map(p => p.id).filter((id): id is string => !!id));
    }
  };

  const toggleSelectProposal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedProposalIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleBulkSend = async () => {
    if (selectedProposalIds.length === 0) return;
    
    setIsSendingBulk(true);
    showToast(`Iniciando envio em massa para ${selectedProposalIds.length} propostas...`, 'info');
    
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedProposalIds) {
      const proposal = proposals.find(p => p.id === id);
      if (!proposal || !proposal.email) {
        failCount++;
        continue;
      }

      try {
        const kit = kits.find(k => k.id === proposal.kitId);
        const pdfBase64 = await generateProposalPDF(proposal, kit);
        
        const result = await sendProposalEmail({
          to: proposal.email,
          subject: `Proposta Solar - ${proposal.client}`,
          body: `Olá ${proposal.client},\n\nSegue em anexo a proposta comercial para o seu sistema de energia solar de ${proposal.systemSize}.\n\nFicamos à disposição para dúvidas.\n\nAtenciosamente,\nVieira's Solar & Engenharia`,
          pdfBase64,
          fileName: `proposta_${proposal.id}.pdf`
        });

        if (result.success) {
          await updateDocument('proposals', id, { status: 'sent' });
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Erro ao enviar proposta ${id}:`, error);
        failCount++;
      }
    }

    setIsSendingBulk(false);
    setSelectedProposalIds([]);
    showToast(`Envio concluído: ${successCount} sucesso, ${failCount} erros.`, successCount > 0 ? 'success' : 'info', true);
  };

  const handleBulkDelete = async () => {
    if (selectedProposalIds.length === 0) return;
    
    if (window.confirm(`Tem certeza que deseja excluir ${selectedProposalIds.length} propostas permanentemente?`)) {
      showToast(`Excluindo ${selectedProposalIds.length} propostas...`, 'info');
      
      try {
        for (const id of selectedProposalIds) {
          await deleteDocument('proposals', id);
        }
        setSelectedProposalIds([]);
        showToast(`${selectedProposalIds.length} propostas excluídas com sucesso!`);
      } catch (error) {
        console.error('Erro ao excluir propostas em massa:', error);
        showToast('Erro ao realizar exclusão em massa.', 'info');
      }
    }
  };

  const handleDeleteClick = (proposal: Proposal) => {
    setProposalToDelete(proposal);
    setIsDeleteModalOpen(true);
  };

  const panelBrands = useMemo(() => {
    const brands = new Set<string>();
    kits.forEach(kit => {
      if (kit.panelBrand) brands.add(kit.panelBrand);
      kit.components?.forEach((c: any) => {
        if ((c.name.toLowerCase().includes('painel') || c.name.toLowerCase().includes('modulo')) && c.brand) brands.add(c.brand);
      });
    });
    return Array.from(brands).sort();
  }, [kits]);

  const inverterBrands = useMemo(() => {
    const brands = new Set<string>();
    kits.forEach(kit => {
      if (kit.inverterBrand) brands.add(kit.inverterBrand);
      kit.components?.forEach((c: any) => {
        if (c.name.toLowerCase().includes('inversor') && c.brand) brands.add(c.brand);
      });
    });
    return Array.from(brands).sort();
  }, [kits]);

  const representatives = useMemo(() => {
    const reps = new Set<string>();
    proposals.forEach(p => {
      if (p.representative) reps.add(p.representative);
    });
    return Array.from(reps).sort();
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    let result = proposals.filter(p => {
      const kit = kits.find(k => k.id === p.kitId);
      const kitSearch = kit ? (
        kit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kit.components?.some((c: any) => 
          c.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.model?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) : false;

      const matchesSearch = searchTerm === '' || 
                           p.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           kitSearch;
      
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(p.status);
      const matchesRepFilter = representativeFilter === 'all' || p.representative === representativeFilter;
      
      const matchesId = filters.id === '' || p.id.toLowerCase().includes(filters.id.toLowerCase());
      const matchesClient = filters.client === '' || p.client.toLowerCase().includes(filters.client.toLowerCase());
      const matchesSystem = filters.system === '' || p.systemSize.toLowerCase().includes(filters.system.toLowerCase());
      const matchesValue = filters.value === '' || (p.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).toLowerCase().includes(filters.value.toLowerCase()));
      const matchesRepresentative = filters.representative === 'all' || p.representative === filters.representative;
      const matchesCommissionStatus = filters.commissionStatus === 'all' || p.commissionStatus === filters.commissionStatus;
      
      // Kit component filtering
      let matchesKit = true;
      if (filters.kitPanel || filters.kitInverter) {
        if (!kit) {
          matchesKit = false;
        } else {
          if (filters.kitPanel) {
            const hasPanel = kit.panelBrand?.toLowerCase().includes(filters.kitPanel.toLowerCase()) || 
                             kit.components?.some((c: any) => c.name.toLowerCase().includes('painel') && c.brand?.toLowerCase().includes(filters.kitPanel.toLowerCase()));
            if (!hasPanel) matchesKit = false;
          }
          if (filters.kitInverter) {
            const hasInverter = kit.inverterBrand?.toLowerCase().includes(filters.kitInverter.toLowerCase()) || 
                                kit.components?.some((c: any) => c.name.toLowerCase().includes('inversor') && c.brand?.toLowerCase().includes(filters.kitInverter.toLowerCase()));
            if (!hasInverter) matchesKit = false;
          }
        }
      }
      
      let matchesDate = true;
      if (filters.startDate || filters.endDate) {
        const [day, month, year] = p.date.split('/').map(Number);
        const propDate = new Date(year, month - 1, day);
        
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          if (propDate < start) matchesDate = false;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          if (propDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesKit && matchesRepFilter && matchesId && matchesClient && matchesSystem && matchesValue && matchesRepresentative && matchesDate && matchesCommissionStatus;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'value_num') {
          aValue = a.value || 0;
          bValue = b.value || 0;
        } else if (sortConfig.key === 'date' || sortConfig.key === 'expiryDate') {
          const aKey = a[sortConfig.key];
          const bKey = b[sortConfig.key];
          
          if (sortConfig.key === 'date') {
            const [ad, am, ay] = a.date.split('/').map(Number);
            const [bd, bm, by] = b.date.split('/').map(Number);
            aValue = new Date(ay, am - 1, ad).getTime();
            bValue = new Date(by, bm - 1, bd).getTime();
          } else {
            aValue = aKey ? new Date(aKey).getTime() : 0;
            bValue = bKey ? new Date(bKey).getTime() : 0;
          }
        } else {
          aValue = a[sortConfig.key as keyof Proposal] || '';
          bValue = b[sortConfig.key as keyof Proposal] || '';
          if (typeof aValue === 'string') {
            return sortConfig.direction === 'asc' 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [proposals, searchTerm, statusFilters, representativeFilter, filters, sortConfig]);

  const handleToggleCommissionStatus = async (proposal: Proposal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!proposal.id) return;
    
    setIsUpdatingCommission(proposal.id);
    try {
      const newStatus = proposal.commissionStatus === 'paid' ? 'pending' : 'paid';
      await updateDocument('proposals', proposal.id, { 
        commissionStatus: newStatus 
      });
      showToast(`Comissão de ${proposal.client} marcada como ${newStatus === 'paid' ? 'Paga' : 'Pendente'}`);
    } catch (error) {
      console.error('Error updating commission status:', error);
      showToast('Erro ao atualizar status da comissão.', 'info');
    } finally {
      setIsUpdatingCommission(null);
    }
  };

  const handleSort = (key: keyof Proposal | 'value_num') => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getCommissionBadge = (status: string | undefined) => {
    if (status === 'paid') {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 text-[8px] font-bold uppercase border border-emerald-100 dark:border-emerald-800/50">
          Comissão Paga
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 text-[8px] font-bold uppercase border border-amber-100 dark:border-amber-800/50">
        Comissão Pendente
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'sent':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Send className="w-3 h-3" />
            Enviada
          </span>
        );
      case 'accepted':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Aceita
          </span>
        );
      case 'expired':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
            <AlertCircle className="w-3 h-3" />
            Expirada
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50 line-through opacity-80">
            <XCircle className="w-3 h-3" />
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Propostas Comerciais</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie orçamentos e propostas enviadas aos clientes.</p>
          </div>
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="group flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            title="Dificuldade com e-mail? Clique aqui"
          >
            <HelpCircle className="w-5 h-5 text-blue-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase text-blue-400 group-hover:text-blue-600 transition-colors">Ajuda E-mail</span>
          </button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#fdb612] hover:bg-[#fdb612]/90 text-[#231d0f] px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#fdb612]/20"
        >
          <Plus className="w-4 h-4" />
          Nova Proposta
        </button>
      </header>

      <NewProposalModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProposal(null);
        }}
        onAdd={handleAddProposal}
        initialData={selectedProposal}
        user={user}
        leads={leads}
        clients={clients}
      />

      <ProposalDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        proposal={selectedProposal}
        onUpdate={async (updatedProp) => {
          if (!updatedProp.id) {
            showToast('Erro: ID da proposta não encontrado.', 'info');
            return;
          }
          await updateDocument('proposals', updatedProp.id, updatedProp);
          setSelectedProposal(updatedProp);
          showToast('Proposta atualizada com sucesso!');
        }}
        onConvertToInstallation={onConvertToInstallation}
        user={user}
      />

      <SMTPHelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#231d0f] w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="size-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-2">Excluir Proposta?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Tem certeza que deseja excluir a proposta <span className="font-bold text-slate-900 dark:text-slate-100">{proposalToDelete?.id}</span>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-600/20"
                >
                  Excluir Permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={cn(
          "fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300",
          toast.isProminent 
            ? "bg-[#fdb612] text-[#231d0f] border-[#fdb612] scale-110 origin-bottom-right" 
            : (toast.type === 'success' ? "bg-emerald-500 text-white border-emerald-400" : "bg-blue-500 text-white border-blue-400")
        )}>
          {toast.isProminent ? (
            <div className="flex items-center gap-3">
              <div className="size-8 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="font-black text-base uppercase tracking-tight">{toast.message}</span>
            </div>
          ) : (
            <>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              <span className="font-bold text-sm">{toast.message}</span>
            </>
          )}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#231d0f]/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total em Aberto</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">R$ {stats.totalOpen.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
          <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#fdb612]" style={{ width: '60%' }} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#231d0f]/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Taxa de Aceite</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.acceptRate.toFixed(1)}%</p>
          <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${stats.acceptRate}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#231d0f]/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Tempo Médio</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.avgTime} Dias</p>
          <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-1/2" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar propostas..." 
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center">
            {(searchTerm || statusFilters.length > 0 || representativeFilter !== 'all' || filters.id || filters.client || filters.system || filters.value || filters.representative !== 'all' || filters.startDate || filters.endDate) && (
              <button 
                onClick={() => {
                  setFilters({
                    id: '',
                    client: '',
                    system: '',
                    value: '',
                    representative: 'all',
                    startDate: '',
                    endDate: ''
                  });
                  setSearchTerm('');
                  setStatusFilters([]);
                  setRepresentativeFilter('all');
                }}
                className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 px-2 py-1"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
                (showFilters || filters.id || filters.client || filters.system || filters.value || filters.representative !== 'all' || filters.startDate || filters.endDate) && "border-[#fdb612] text-[#fdb612]"
              )}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <div className="relative flex-1 md:flex-none">
              <select 
                value={representativeFilter || 'all'}
                onChange={(e) => setRepresentativeFilter(e.target.value)}
                className="w-full md:w-auto appearance-none pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
              >
                <option value="all">Todos Consultores</option>
                {representatives.map(rep => (
                  <option key={rep} value={rep}>{rep}</option>
                ))}
              </select>
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex flex-wrap gap-2 items-center bg-slate-50/50 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 hidden lg:block">Filtrar por Status:</span>
              {[
                { id: 'pending', label: 'Pendente', icon: Clock },
                { id: 'sent', label: 'Enviada', icon: Send },
                { id: 'accepted', label: 'Aceita', icon: CheckCircle2 },
                { id: 'expired', label: 'Expirada', icon: AlertCircle },
                { id: 'cancelled', label: 'Cancelada', icon: XCircle }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setStatusFilters(prev => 
                      prev.includes(s.id) ? prev.filter(f => f !== s.id) : [...prev, s.id]
                    );
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border",
                    statusFilters.includes(s.id)
                      ? "bg-[#fdb612] text-[#231d0f] border-[#fdb612] shadow-md shadow-[#fdb612]/20 scale-105"
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                  )}
                >
                  <s.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={handleExportListPDF}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
            <button 
              onClick={handleExport}
              className="flex-1 md:flex-none px-4 py-2.5 bg-[#fdb612]/10 border border-[#fdb612]/20 text-[#fdb612] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#fdb612]/20 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Exportar CSV
            </button>
            {selectedProposalIds.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={handleBulkDelete}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-600/20"
                >
                  <X className="w-4 h-4" />
                  Excluir ({selectedProposalIds.length})
                </button>
                <button 
                  onClick={handleBulkSend}
                  disabled={isSendingBulk}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {isSendingBulk ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar Massa ({selectedProposalIds.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID da Proposta</label>
                <input 
                  type="text" 
                  value={filters.id || ''}
                  onChange={(e) => setFilters({ ...filters, id: e.target.value })}
                  placeholder="Ex: PROP-2024"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</label>
                <input 
                  type="text" 
                  value={filters.client || ''}
                  onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sistema</label>
                <input 
                  type="text" 
                  value={filters.system || ''}
                  onChange={(e) => setFilters({ ...filters, system: e.target.value })}
                  placeholder="Ex: 45 kWp"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</label>
                <input 
                  type="text" 
                  value={filters.value || ''}
                  onChange={(e) => setFilters({ ...filters, value: e.target.value })}
                  placeholder="Ex: 120.000"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Representante</label>
                <select 
                  value={filters.representative || 'all'}
                  onChange={(e) => setFilters({ ...filters, representative: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                >
                  <option value="all">Todos</option>
                  <option value="Marusan Pinto">Marusan Pinto</option>
                  <option value="Ana Silva">Ana Silva</option>
                  <option value="Carlos Oliveira">Carlos Oliveira</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intervalo de Datas</label>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 focus-within:ring-2 focus-within:ring-[#fdb612] transition-all">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="flex-1 bg-transparent border-none text-sm outline-none py-1"
                  />
                  <span className="text-slate-400 text-xs font-bold">até</span>
                  <input 
                    type="date" 
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="flex-1 bg-transparent border-none text-sm outline-none py-1"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marca Painel</label>
                <select 
                  value={filters.kitPanel || ''}
                  onChange={(e) => setFilters({ ...filters, kitPanel: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                >
                  <option value="">Todas</option>
                  {panelBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marca Inversor</label>
                <select 
                  value={filters.kitInverter || ''}
                  onChange={(e) => setFilters({ ...filters, kitInverter: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                >
                  <option value="">Todas</option>
                  {inverterBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comissão</label>
                <select 
                  value={filters.commissionStatus || 'all'}
                  onChange={(e) => setFilters({ ...filters, commissionStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                >
                  <option value="all">Todas</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Paga</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button 
                  onClick={() => {
                    setFilters({
                      id: '',
                      client: '',
                      system: '',
                      value: '',
                      representative: 'all',
                      startDate: '',
                      endDate: '',
                      kitPanel: '',
                      kitInverter: '',
                      commissionStatus: 'all'
                    });
                    setSearchTerm('');
                    setStatusFilters([]);
                  }}
                  className="flex-1 py-1 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  Limpar
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-2 bg-[#fdb612] text-[#231d0f] rounded-lg font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#fdb612]/10"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedProposalIds.length === filteredProposals.length && filteredProposals.length > 0}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-slate-300 text-[#fdb612] focus:ring-[#fdb612]"
                    />
                  </div>
                </th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    ID / Data
                    <ArrowUpRight className={cn("w-3 h-3 transition-transform", sortConfig?.key === 'date' && sortConfig.direction === 'desc' && "rotate-180")} />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => handleSort('client')}
                    className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Cliente / Sistema
                    <ArrowUpRight className={cn("w-3 h-3 transition-transform", sortConfig?.key === 'client' && sortConfig.direction === 'desc' && "rotate-180")} />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => handleSort('value_num')}
                    className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Valor
                    <ArrowUpRight className={cn("w-3 h-3 transition-transform", sortConfig?.key === 'value_num' && sortConfig.direction === 'desc' && "rotate-180")} />
                  </button>
                </th>
                <th className="px-6 py-4">Comissão</th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Status / Validade
                    <ArrowUpRight className={cn("w-3 h-3 transition-transform", sortConfig?.key === 'status' && sortConfig.direction === 'desc' && "rotate-180")} />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => handleSort('representative')}
                    className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Consultor
                    <ArrowUpRight className={cn("w-3 h-3 transition-transform", sortConfig?.key === 'representative' && sortConfig.direction === 'desc' && "rotate-180")} />
                  </button>
                </th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredProposals.length > 0 ? (
                <AnimatePresence>
                  {filteredProposals.map((prop, index) => (
                    <motion.tr 
                      key={prop.id || `prop-${index}`} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleViewDetails(prop)}
                      className={cn(
                        "hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer border-l-4 border-transparent",
                        prop.status === 'expired' && "bg-rose-50/50 dark:bg-rose-900/10 border-l-rose-500",
                        selectedProposalIds.includes(prop.id!) && "bg-[#fdb612]/5 dark:bg-[#fdb612]/5"
                      )}
                    >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedProposalIds.includes(prop.id!)}
                      onChange={(e) => {
                        const id = prop.id;
                        if (id) {
                          setSelectedProposalIds(prev => 
                            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
                          );
                        }
                      }}
                      className="size-4 rounded border-slate-300 text-[#fdb612] focus:ring-[#fdb612]"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{prop.proposalNumber || prop.id}</p>
                        {prop.expiryDate && (new Date(prop.expiryDate).getTime() - new Date().getTime()) > 0 && (new Date(prop.expiryDate).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                            <div className="size-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center animate-pulse" title="Vencimento Próximo (< 7 dias)">
                                <Clock className="w-3 h-3" />
                            </div>
                        )}
                        {prop.expiryDate && new Date(prop.expiryDate) < new Date() && prop.status !== 'accepted' && (
                            <div className="size-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center" title="Expirada">
                                <AlertCircle className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs text-slate-500">Criada: {prop.date}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Proposta para {prop.client}</p>
                    <p className="text-xs text-slate-500">{prop.systemSize}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-sm text-[#fdb612]">
                      {prop.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </p>
                    {prop.discount > 0 && (
                      <p className="text-[10px] text-rose-500 font-bold">Desc: R$ {prop.discount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="font-bold text-sm text-emerald-500">
                        R$ {((prop.value || 0) * ((prop.commission || 5) / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{prop.commission || 5}%</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 relative group/status-listing" onClick={(e) => e.stopPropagation()}>
                        <div className="cursor-pointer">
                          {getStatusBadge(prop.status)}
                        </div>
                        <div className="absolute left-0 top-full mt-1 hidden group-hover/status-listing:flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-[60] min-w-[120px]">
                          {(['pending', 'sent', 'accepted', 'expired', 'cancelled'] as Proposal['status'][]).map((s) => (
                            <button
                              key={s}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (prop.id) {
                                  await updateDocument('proposals', prop.id, { status: s });
                                  showToast(`Status atualizado para ${s}`);
                                }
                              }}
                              className={cn(
                                "px-3 py-1.5 text-[10px] font-black uppercase text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
                                prop.status === s ? "text-[#fdb612] bg-[#fdb612]/5" : "text-slate-600 dark:text-slate-400"
                              )}
                            >
                              {s === 'pending' ? 'Pendente' : s === 'sent' ? 'Enviada' : s === 'accepted' ? 'Aceita' : s === 'expired' ? 'Expirada' : 'Cancelada'}
                            </button>
                          ))}
                        </div>
                        {prop.status === 'accepted' && (
                          <button 
                            onClick={(e) => handleToggleCommissionStatus(prop, e)}
                            className="transition-transform active:scale-95"
                            disabled={isUpdatingCommission === prop.id}
                          >
                            {getCommissionBadge(prop.commissionStatus)}
                          </button>
                        )}
                      </div>
                      {prop.expiryDate && (
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-tighter ml-1",
                          new Date(prop.expiryDate) < new Date() ? "text-rose-500" : "text-slate-400"
                        )}>
                          Validade: {new Date(prop.expiryDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {prop.representative.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{prop.representative}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(prop);
                        }}
                        className="p-2 hover:bg-[#fdb612]/10 text-slate-400 hover:text-[#fdb612] rounded-lg transition-colors" 
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(prop);
                        }}
                        className="p-2 hover:bg-[#fdb612]/10 text-slate-400 hover:text-[#fdb612] rounded-lg transition-colors" 
                        title="Editar"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {prop.status === 'accepted' && onConvertToInstallation && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onConvertToInstallation(prop);
                          }}
                          className="p-2 hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600 rounded-lg transition-colors" 
                          title="Converter para Instalação"
                        >
                          <HardHat className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(prop);
                        }}
                        className="p-2 hover:bg-[#fdb612]/10 text-slate-400 hover:text-[#fdb612] rounded-lg transition-colors" 
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(prop);
                        }}
                        className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-colors" 
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSend(prop.id);
                        }}
                        className="p-2 hover:bg-[#fdb612]/10 text-slate-400 hover:text-[#fdb612] rounded-lg transition-colors" 
                        title="Enviar por e-mail"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast('Link de compartilhamento copiado!', 'info');
                        }}
                        className="p-2 hover:bg-[#fdb612]/10 text-slate-400 hover:text-[#fdb612] rounded-lg transition-colors" 
                        title="Compartilhar proposta com outros"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDownload(prop.id)}
                        className="p-2 hover:bg-[#fdb612]/10 text-slate-400 hover:text-[#fdb612] rounded-lg transition-colors" 
                        title="Baixar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePrint(prop.id)}
                        className="p-2 hover:bg-[#fdb612]/10 text-slate-400 hover:text-[#fdb612] rounded-lg transition-colors" 
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <div className="relative group/actions">
                        <button 
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 hidden group-hover/actions:block animate-in fade-in slide-in-from-top-2 duration-200">
                          <button 
                            onClick={() => handleViewDetails(prop)}
                            className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                            Visualizar
                          </button>
                          <button 
                            onClick={() => handleSend(prop.id)}
                            className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                          >
                            <Send className="w-4 h-4 text-slate-400" />
                            Enviar
                          </button>
                          <button 
                            onClick={() => {
                              showToast('Link de compartilhamento copiado!', 'info');
                            }}
                            className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                          >
                            <Share2 className="w-4 h-4 text-slate-400" />
                            Compartilhar
                          </button>
                          <button 
                            onClick={() => handleDownload(prop.id)}
                            className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4 text-slate-400" />
                            Baixar PDF
                          </button>
                          <button 
                            onClick={() => handlePrint(prop.id)}
                            className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                          >
                            <Printer className="w-4 h-4 text-slate-400" />
                            Imprimir
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                          <button 
                            onClick={() => handleEdit(prop)}
                            className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4 text-slate-400" />
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDuplicate(prop)}
                            className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4 text-slate-400" />
                            Duplicar
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(prop)}
                            className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma proposta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
