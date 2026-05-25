import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Proposal, Kit, Installation } from "../types";

// Helper to safely convert R$ strings or numbers to float
const stringToNumber = (val: any): string => {
  if (typeof val === 'number') return val.toString();
  if (!val) return '0';
  return val.replace(/[^\d.,]/g, '').replace(',', '.');
};

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
      `JV Mendes Junior Engenharia | Página ${i} de ${pageCount}`,
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
  centerText(`Gerado em ${new Date().toLocaleDateString('pt-BR')} | JV MENDES JUNIOR ENGENHARIA`, pageHeight - 6);

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

  // Fixed Company Data
  const COMPANY = {
    name: "JV Mendes Junior Engenharia",
    cnpj: "61.950.902/0001-83",
    phone: "(33) 99903-2281",
    email: "marusanspc@gmail.com",
    address: "São João do Oriente/MG"
  };

  const aguardando = (val: any) => val || "[Aguardando]";

  // Consumption & Generation
  const consumption = parseFloat(proposal.energyConsumption || "500");
  const sysSize = parseFloat(proposal.systemSize || "7.5");
  
  // DYNAMIC FORMULA: Geração = kWp × HSP × 30 × PR
  const hsp = proposal.hsp || 5.14;
  const pr = proposal.pr || 0.82;
  const monthlyGen = sysSize * hsp * 30 * pr;

  // DYNAMIC FORMULA: Economia mensal = Geração × Tarifa
  const TARIFF = proposal.tariff || 0.89;
  const monthlySavings = monthlyGen * TARIFF;
  const annualSavings = monthlySavings * 12;

  // Investment
  const rawValue = proposal.value as any;
  const valNum = typeof rawValue === 'string' ? parseFloat(rawValue.replace(/[^\d.-]/g, "")) : (rawValue || 0);

  // NEW FORMULA: Payback = Investimento ÷ (Economia × 12)
  const paybackVal = annualSavings > 0 ? (valNum / annualSavings).toFixed(1) : "0.0";
  
  // NEW FORMULA: ROI 25 anos = ((Economia×12×25 - Invest.) / Invest.) × 100
  const totalSavings25 = annualSavings * 25;
  const roiVal = valNum > 0 ? `${(((totalSavings25 - valNum) / valNum) * 100).toFixed(0)}%` : "0%";

  // --- HEADER & COVER ---
  doc.setFillColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(primaryGold[0], primaryGold[1], primaryGold[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`PROPOSTA COMERCIAL – ${COMPANY.name}`, margin, 20);
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
  doc.text(aguardando(proposal.client || proposal.titular || "Cliente"), margin + 45, currentY);
  
  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const proposalDate = proposal.date ? (proposal.date.includes('T') ? new Date(proposal.date).toLocaleDateString('pt-BR') : proposal.date) : new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${proposalDate}`, margin, currentY);
  doc.text(`Validade da proposta: ${proposal.validityDays || 15} dias`, margin + 60, currentY);

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
      ["Nome completo", aguardando(proposal.client || proposal.titular || "Cliente")],
      ["CPF/CNPJ", proposal.cpfCnpj || "---.---.----00"],
      ["Endereço", proposal.endereco || "São João do Oriente - MG"],
      ["Telefone", proposal.telefone || proposal.phone || "(33) 99903-2281"],
      ["E-mail", proposal.email || "marusansp@gmail.com"]
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
      ["Razão Social", COMPANY.name],
      ["CNPJ", COMPANY.cnpj],
      ["Endereço", COMPANY.address],
      ["Telefone / WhatsApp", COMPANY.phone],
      ["E-mail", COMPANY.email],
      ["Contato", "Marusan Pinto – Gerente de Engenharia"]
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
      ["Potência instalada", `${sysSize.toFixed(2)} kWp`],
      ["Quantidade de módulos", proposal.panelQuantity || Math.round(sysSize / 0.55)],
      ["Inversor", proposal.inverterBrandModel || "Inversor String (Monitoramento Wifi)"],
      ["Consumo médio (kWh/mês)", `${consumption} kWh`],
      ["Geração média estimada (kWh/mês)", `${monthlyGen.toFixed(0)} kWh`],
      ["Cobertura estimada", `${Math.min(100, Math.round((monthlyGen / consumption) * 100))}%`]
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

  autoTable(doc, {
    startY: currentY + 8,
    body: [
      ["Equipamentos (Tier-1 Alta Performance)", formatCurrency(valNum * 0.7)],
      ["Projeto e Engenharia", formatCurrency(valNum * 0.1)],
      ["Instalação e Logística", formatCurrency(valNum * 0.2)],
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

  autoTable(doc, {
    startY: currentY + 8,
    body: [
      ["Economia média mensal", formatCurrency(monthlySavings)],
      ["Economia anual (1º ano)", formatCurrency(annualSavings)],
      ["Payback simples", `~${paybackVal} anos`],
      ["ROI (25 anos)", roiVal],
      ["Economia total em 25 anos", formatCurrency(totalSavings25)]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { fontStyle: 'bold', halign: 'right' } },
    margin: { left: margin + 2 }
  });

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text(`*Cálculos baseados em Tarifa de R$ ${TARIFF.toFixed(2)}/kWh e performance estimada dos equipamentos.`, margin + 2, (doc as any).lastAutoTable.finalY + 4);

  currentY = (doc as any).lastAutoTable.finalY + 12;

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
      ["Validade dos créditos", "60 meses (Lei 14.300/2022)"],
      ["Taxa mínima concessionária", proposal.disclaimerTaxaMinima || "Estimada R$ 100,00/mês"],
      ["Condição de Pagamento", proposal.paymentTerms || "A definir"]
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
  doc.text(COMPANY.name, pageWidth - margin - 80, currentY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`CNPJ: ${COMPANY.cnpj}`, pageWidth - margin - 80, currentY + 15);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin - 80, currentY + 20);

  return doc.output('datauristring');
};

