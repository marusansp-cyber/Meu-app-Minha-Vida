import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Proposal, Kit, Installation } from "../types";

export const generateKitsReportPDF = async (kits: Kit[]): Promise<string> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = [0, 74, 97]; // #004a61
  const accentColor = [253, 182, 18]; // #fdb612

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CATÁLOGO DE KITS FOTOVOLTAICOS", 20, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 60, 25);

  // Table
  const tableData = kits.map(kit => [
    kit.name,
    `${kit.power.toFixed(2)} kWp`,
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(kit.price),
    kit.components.map(c => `${c.quantity}x ${c.name} ${c.brand ? '('+c.brand+')' : ''}`).join('\n')
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['Nome do Kit', 'Potência', 'Preço Sugerido', 'Principais Componentes']],
    body: tableData,
    headStyles: {
      fillColor: primaryColor as any,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 'auto' }
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 50, left: 20, right: 20 }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Vieira's Solar & Engenharia | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc.output('datauristring');
};

export const generateInstallationReportPDF = async (installation: Installation): Promise<string> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = [253, 182, 18]; // #fdb612 (Yellow)
  const secondaryColor = [35, 29, 15]; // Dark
  const lightGray = [245, 245, 245];

  const centerText = (text: string, y: number) => {
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // --- Cover ---
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  centerText("RELATÓRIO TÉCNICO DE INSTALAÇÃO", 35);

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(28);
  centerText(installation.name, 90);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  centerText(`Projeto ID: ${installation.projectId}`, 105);

  // Info Box
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(20, 130, pageWidth - 40, 50, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Técnico Responsável:", 30, 145);
  doc.setFont("helvetica", "normal");
  doc.text(installation.technician?.name || "Técnico Responsável", 80, 145);

  doc.setFont("helvetica", "bold");
  doc.text("Data de Início:", 30, 155);
  doc.setFont("helvetica", "normal");
  doc.text(installation.startDate || "N/A", 80, 155);

  doc.setFont("helvetica", "bold");
  doc.text("Progresso Atual:", 30, 165);
  doc.setFont("helvetica", "normal");
  doc.text(`${installation.progress}%`, 80, 165);

  // Footer
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(9);
  centerText(`Gerado em ${new Date().toLocaleDateString('pt-BR')} | VIEIRA'S SOLAR & ENGENHARIA`, pageHeight - 6);

  // --- Stages ---
  if (installation.stages && installation.stages.length > 0) {
    installation.stages.forEach((stage, index) => {
      doc.addPage();
      
      // Header
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`ETAPA ${index + 1}: ${stage.name.toUpperCase()}`, 20, 20);

      // Status
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(12);
      doc.text("Status:", 20, 45);
      const statusText = stage.status === 'completed' ? 'CONCLUÍDO' : stage.status === 'in-progress' ? 'EM CURSO' : 'PENDENTE';
      doc.setFont("helvetica", "bold");
      doc.text(statusText, 40, 45);

      // Notes
      doc.setFont("helvetica", "bold");
      doc.text("Observações Técnicas:", 20, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(stage.notes || "Nenhuma observação registrada para esta etapa.", pageWidth - 40);
      doc.text(splitNotes, 20, 70);

      // Photos
      if (stage.photos && stage.photos.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Evidências Fotográficas:", 20, 110);

        let photoX = 20;
        let photoY = 120;
        const photoWidth = 80;
        const photoHeight = 60;

        stage.photos.forEach((photo, pIdx) => {
          try {
            // Check if we need a new page for photos
            if (photoY + photoHeight > pageHeight - 30) {
              doc.addPage();
              photoY = 20;
            }

            doc.addImage(photo, 'JPEG', photoX, photoY, photoWidth, photoHeight);
            
            if (pIdx % 2 === 0) {
              photoX = 110;
            } else {
              photoX = 20;
              photoY += photoHeight + 10;
            }
          } catch (e) {
            console.error("Error adding image to PDF", e);
          }
        });
      }
    });
  }

  return doc.output('datauristring');
};

export const generateProposalPDF = async (proposal: Proposal, kit?: Kit): Promise<string> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

  // Colors
  const primaryGold = [253, 182, 18];  // #fdb612
  const secondaryNavy = [0, 74, 97];    // #004a61
  const textDark = [35, 29, 15];       // #231d0f
  const textLight = [100, 100, 100];
  const bgGray = [248, 250, 252];

  const formatCurrency = (val: number | string | undefined | null) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val;
    if (num === null || num === undefined || isNaN(num)) return "R$ [Aguardando]";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const aguardando = (val: any) => val || "[Aguardando]";

  // --- HEADER & COVER ---
  doc.setFillColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PROPOSTA COMERCIAL – SYSTEM SOLAR", margin, 20);
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("GERANDO SUSTENTABILIDADE E ECONOMIA", margin, 25);

  doc.setFontSize(10);
  doc.text(`Proposta ${proposal.proposalNumber || "2026/001"}`, pageWidth - margin - 45, 25);

  let currentY = 55;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(16);
  doc.text("Preparada para:", margin, currentY);
  doc.setFont("helvetica", "bold");
  doc.text(aguardando(proposal.client || proposal.titular), margin + 45, currentY);
  
  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const proposalDate = proposal.date ? (proposal.date.includes('T') ? new Date(proposal.date).toLocaleDateString('pt-BR') : proposal.date) : new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${proposalDate}`, margin, currentY);
  doc.text(`Validade da proposta: 15 dias`, margin + 60, currentY);

  currentY += 12;

  // --- CLIENT DATA ---
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", margin + 2, currentY + 5.5);
  
  autoTable(doc, {
    startY: currentY + 8,
    body: [
      ["Nome completo", aguardando(proposal.client || proposal.titular)],
      ["CPF/CNPJ", aguardando(proposal.cpfCnpj)],
      ["Endereço", aguardando(proposal.endereco)],
      ["Telefone", aguardando(proposal.telefone || proposal.phone)],
      ["E-mail", aguardando(proposal.email)]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 130 } },
    margin: { left: margin + 2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- INTEGRATOR DATA ---
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DA EMPRESA INTEGRADORA", margin + 2, currentY + 5.5);

  autoTable(doc, {
    startY: currentY + 8,
    body: [
      ["Razão Social", "JV Mendes JUNIOR ENGENHARIA"],
      ["Nome fantasia", "Vieira's Solar & Engenharia"],
      ["CNPJ", "61.950.902/0001-83"],
      ["Endereço", "São João do Oriente – MG"],
      ["Telefone / WhatsApp", "(33) 99903-2281"],
      ["E-mail", "marusanspc@gmail.com"],
      ["Contato", "Marusan Pinto – Corretor Imóveis"]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 130 } },
    margin: { left: margin + 2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- SYSTEM SUMMARY ---
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO DO SISTEMA", margin + 2, currentY + 5.5);

  autoTable(doc, {
    startY: currentY + 8,
    body: [
      ["Potência instalada", proposal.systemSize ? (proposal.systemSize.includes('kWp') ? proposal.systemSize : `${proposal.systemSize} kWp`) : "[Aguardando]"],
      ["Quantidade de módulos", aguardando(proposal.panelQuantity)],
      ["Inversor", aguardando(proposal.inverterBrandModel)],
      ["Consumo médio", proposal.energyConsumption ? `${proposal.energyConsumption} kWh/mês` : "[Aguardando]"],
      ["Geração média estimada", proposal.monthlyGeneration ? `${proposal.monthlyGeneration} kWh/mês` : "[Aguardando]"],
      ["Cobertura estimada", proposal.energyConsumption && proposal.monthlyGeneration ? `${Math.min(100, Math.round((parseFloat(proposal.monthlyGeneration) / parseFloat(proposal.energyConsumption)) * 100))}%` : "~88%"]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    margin: { left: margin + 2 }
  });

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(textLight[0], textLight[1], textLight[2]);
  doc.text("*Estimativa para região de São João do Oriente - MG, considerando inclinação e orientação ideais.", margin + 2, (doc as any).lastAutoTable.finalY + 4);

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- INVESTMENT ---
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("INVESTIMENTO", margin + 2, currentY + 5.5);

  const valNum = typeof proposal.value === 'string' ? parseFloat(proposal.value) : proposal.value;
  autoTable(doc, {
    startY: currentY + 8,
    body: [
      ["Equipamentos (Tier-1 Alta Performance)", formatCurrency(valNum ? valNum * 0.7 : null)],
      ["Projeto e Engenharia", formatCurrency(valNum ? valNum * 0.1 : null)],
      ["Instalação e Logística", formatCurrency(valNum ? valNum * 0.2 : null)],
      ["TOTAL DO INVESTIMENTO", formatCurrency(valNum)]
    ],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: margin + 2 },
    didParseCell: (data) => {
      if (data.row.index === 3) {
        data.cell.styles.fillColor = primaryGold as any;
        data.cell.styles.textColor = [0,0,0];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- FINANCIAL INDICATORS ---
  if (currentY > pageHeight - 60) { doc.addPage(); currentY = 20; }
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("INDICADORES FINANCEIROS (REALISTAS)", margin + 2, currentY + 5.5);

  const monthlySavings = proposal.annualSavings ? proposal.annualSavings / 12 : 0;
  const annualSavings = proposal.annualSavings || 0;
  const paybackVal = valNum && annualSavings > 0 ? (valNum / annualSavings).toFixed(1) : (proposal.payback ? proposal.payback.replace(' Anos', '') : "[Aguardando]");
  const roiVal = proposal.roi || (valNum && annualSavings > 0 ? (((annualSavings * 47.727 - valNum) / valNum) * 100).toFixed(0) + "%" : "[Aguardando]");
  const total25 = annualSavings ? annualSavings * 47.727 : 0; // Updated to match 25y 5% inflation factor

  autoTable(doc, {
    startY: currentY + 8,
    body: [
      ["Economia média mensal", monthlySavings ? formatCurrency(monthlySavings) : "~R$ [Aguardando]"],
      ["Economia anual (1º ano)", annualSavings ? formatCurrency(annualSavings) : "~R$ [Aguardando]"],
      ["Payback simples", paybackVal === "[Aguardando]" ? paybackVal : `~${paybackVal} anos`],
      ["ROI (25 anos)", roiVal],
      ["Economia acumulada em 25 anos*", total25 ? formatCurrency(total25) : "~[Aguardando]"]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
    margin: { left: margin + 2 }
  });

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("*Considerando reajustes anuais de 5% – valor total economizado corrigido monetariamente.", margin + 2, (doc as any).lastAutoTable.finalY + 4);

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // --- COMMISSION ---
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("COMISSÃO ESTIMADA (PARCEIRO INTEGRADOR)", margin + 2, currentY + 5.5);
  
  const comm = valNum ? valNum * 0.05 : null;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Taxa: 5% sobre o investimento total`, margin + 2, currentY + 13);
  doc.setFont("helvetica", "bold");
  doc.text(`Valor: ${formatCurrency(comm)}`, pageWidth - margin - 5, currentY + 13, { align: 'right' });

  currentY += 20;

  // --- ENVIRONMENTAL ---
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("BENEFÍCIOS AMBIENTAIS", margin + 2, currentY + 5.5);

  autoTable(doc, {
    startY: currentY + 8,
    body: [
      ["Redução de CO2 por ano", "~950 kg/ano"],
      ["Árvores equivalentes", "~43 árvores/ano"],
      ["Energia limpa gerada em 25 anos", proposal.monthlyGeneration ? `~${(parseFloat(proposal.monthlyGeneration) * 12 * 25).toLocaleString('pt-BR')} kWh` : "~345.000 kWh"]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
    margin: { left: margin + 2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- WARRANTIES ---
  if (currentY > pageHeight - 60) { doc.addPage(); currentY = 20; }
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("GARANTIAS", margin + 2, currentY + 5.5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const warranties = [
    "• Módulos fotovoltaicos: 25 anos de performance linear (80% da potência)",
    "• Inversor: 10 anos (padrão de fábrica)",
    "• Estrutura de alumínio: Garantia vitalícia contra corrosão e defeitos de fabricação",
    "• Serviço de instalação: 12 meses (mão de obra)"
  ];
  warranties.forEach((w, i) => doc.text(w, margin + 2, currentY + 13 + (i * 6)));

  currentY += 40;

  // --- COMMERCIAL CONDITIONS ---
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CONDIÇÕES COMERCIAIS", margin + 2, currentY + 5.5);

  autoTable(doc, {
    startY: currentY + 8,
    body: [
      ["Prazo de pagamento", aguardando(proposal.paymentTerms)],
      ["Validade dos créditos", "60 meses (Lei 14.300/2022)"],
      ["Taxa mínima concessionária", "Estimada R$ 100,00/mês"]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
    margin: { left: margin + 2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // --- NEXT STEPS ---
  if (currentY > pageHeight - 80) { doc.addPage(); currentY = 20; }
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("PRÓXIMOS PASSOS", margin + 2, currentY + 5.5);

  const steps = [
    "1. Assinatura da proposta (cliente + integrador)",
    "2. Envio de documentos (CPF, comprovante de residência, conta de luz)",
    "3. Vistoria técnica (agendamento em até 5 dias úteis)",
    "4. Elaboração do projeto executivo (até 10 dias)",
    "5. Instalação (prazo médio: 15 a 20 dias úteis após aprovação da concessionária)",
    "6. Comissionamento e ativação do sistema"
  ];
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  steps.forEach((s, i) => doc.text(s, margin + 2, currentY + 13 + (i * 6)));

  currentY += 55;

  // --- SIGNATURES ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DECLARAÇÃO E ASSINATURAS", margin, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Declaro que li e concordo com os termos desta proposta, incluindo condições de pagamento, garantias e prazo de validade.", margin, currentY);
  
  currentY += 25;
  doc.line(margin, currentY, margin + 80, currentY);
  doc.line(pageWidth - margin - 80, currentY, pageWidth - margin, currentY);
  
  doc.setFontSize(8);
  doc.text("Cliente:", margin, currentY + 5);
  doc.setFont("helvetica", "bold");
  doc.text(aguardando(proposal.client || proposal.titular), margin, currentY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`CPF: ${proposal.cpfCnpj || "[a preencher]"}`, margin, currentY + 15);
  doc.text(`Data:    /    /2026`, margin, currentY + 20);

  doc.text("Integrador:", pageWidth - margin - 80, currentY + 5);
  doc.setFont("helvetica", "bold");
  doc.text("JV Mendes JUNIOR ENGENHARIA", pageWidth - margin - 80, currentY + 10);
  doc.setFont("helvetica", "normal");
  doc.text("CNPJ: 61.950.902/0001-83", pageWidth - margin - 80, currentY + 15);
  doc.text(`Data:    /    /2026`, pageWidth - margin - 80, currentY + 20);

  return doc.output('datauristring');
};

