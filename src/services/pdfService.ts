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

export const generateInstallationReportPDF = async (installation: Installation, signatureDataUrl?: string): Promise<string> => {
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
  doc.rect(20, 125, pageWidth - 40, 55, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Técnico Responsável:", 30, 140);
  doc.setFont("helvetica", "normal");
  doc.text(installation.technician?.name || "Técnico Responsável", 80, 140);

  doc.setFont("helvetica", "bold");
  doc.text("Data de Início:", 30, 150);
  doc.setFont("helvetica", "normal");
  doc.text(installation.startDate ? new Date(installation.startDate).toLocaleDateString('pt-BR') : "N/A", 80, 150);

  doc.setFont("helvetica", "bold");
  doc.text("Progresso Atual:", 30, 160);
  doc.setFont("helvetica", "normal");
  doc.text(`${installation.progress}%`, 80, 160);

  doc.setFont("helvetica", "bold");
  doc.text("Potência do Sistema:", 30, 170);
  doc.setFont("helvetica", "normal");
  doc.text(installation.systemPower ? `${installation.systemPower} kWp` : "N/A", 80, 170);

  // --- Equipamentos ---
  let currentY = 195;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("RESUMO DE EQUIPAMENTOS", 20, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    body: [
      ["Inversor Instalado", installation.inverterInfo || "Não especificado"],
      ["Módulos Solares (Painéis)", installation.panelInfo || "Não especificado"]
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
    margin: { left: 20 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- Cronograma de Etapas ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("CRONOGRAMA DE ETAPAS", 20, currentY);

  const stagesData = (installation.stages || []).map((s, i) => [
    `Etapa ${i+1}`,
    s.name,
    s.status === 'completed' ? 'CONCLUÍDO' : s.status === 'in-progress' ? 'EM CURSO' : 'PENDENTE',
    s.assignedTechnician || installation.technician?.name || '-',
    s.progress ? `${s.progress}%` : '-'
  ]);

  if (stagesData.length > 0) {
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Etapa', 'Descrição da Etapa', 'Status', 'Técnico Atribuído', 'Progresso']],
      body: stagesData,
      headStyles: {
        fillColor: secondaryColor as any,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: lightGray as any },
      margin: { left: 20, right: 20 }
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Nenhuma etapa cadastrada no cronograma.", 20, currentY + 10);
  }

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

  if (signatureDataUrl) {
    doc.addPage();
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Aceite e Assinatura", 20, 25);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const declaration = `Eu atesto que o relatório técnico de instalação para "${installation.name}" foi revisado e representa os serviços prestados até o presente momento.`;
    const splitDeclaration = doc.splitTextToSize(declaration, pageWidth - 40);
    doc.text(splitDeclaration, 20, 70);

    doc.addImage(signatureDataUrl, 'PNG', 20, 100, 100, 50);
    
    doc.setLineWidth(0.5);
    doc.line(20, 150, 120, 150);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Assinatura do Cliente`, 20, 160);
    doc.setFont("helvetica", "normal");
    doc.text(`${installation.name}`, 20, 165);
    doc.text(`${new Date().toLocaleDateString('pt-BR')}`, 20, 170);

    // Footer
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} | JV MENDES JUNIOR ENGENHARIA`, (pageWidth - doc.getTextWidth(`Gerado em ${new Date().toLocaleDateString('pt-BR')} | JV MENDES JUNIOR ENGENHARIA`)) / 2, pageHeight - 4);
  }

  return doc.output('datauristring');
};

export const generateProposalPDF = async (
  proposal: Proposal, 
  kit?: Kit,
  options: {
    autoLayout?: boolean;
    margin?: number;
    fontSize?: number;
    themeColor?: 'navy' | 'emerald' | 'amber' | 'slate';
    compactSpacing?: boolean;
    showComponents?: boolean;
  } = {}
): Promise<string> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;
  
  // Custom layout margins and styles
  const margin = options.margin !== undefined ? options.margin : 15;
  const compact = options.compactSpacing === true;
  const fontSize = options.fontSize || 9;
  const autoLayoutActive = options.autoLayout !== false;

  // Setup theme colors dynamically
  let primaryGold = [253, 182, 18];  // Classic Amber/Gold
  let secondaryNavy = [0, 74, 97];    // Classic Navy
  
  if (options.themeColor === 'emerald') {
    primaryGold = [16, 185, 129];     // Emerald Green
    secondaryNavy = [6, 78, 59];      // Forest Green
  } else if (options.themeColor === 'amber') {
    primaryGold = [245, 158, 11];     // Deep Amber
    secondaryNavy = [115, 115, 115];  // Dark Charcoal
  } else if (options.themeColor === 'slate') {
    primaryGold = [71, 85, 105];      // Slate gray
    secondaryNavy = [15, 23, 42];      // Carbon Slate
  } else if (options.themeColor === 'navy') {
    primaryGold = [253, 182, 18];     // Solar Yellow
    secondaryNavy = [15, 23, 42];      // Deep Midnight
  }

  const textDark = [35, 29, 15];       // #231d0f
  const textLight = [110, 110, 110];
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

  // Dynamic Page-breaking logic
  let currentY = 55;
  const checkPageBreak = (neededHeight: number) => {
    if (!autoLayoutActive) return false;
    const limit = pageHeight - margin - neededHeight;
    if (currentY > limit) {
      doc.addPage();
      currentY = margin + 10;
      return true;
    }
    return false;
  };

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
  doc.text(`Proposta ${proposal.proposalNumber || "2601"}`, pageWidth - margin - 45, 25);

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

  currentY += compact ? 8 : 12;

  // --- CLIENT DATA ---
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", margin + 2, currentY + (compact ? 4.5 : 5.5));
  
  autoTable(doc, {
    startY: currentY + (compact ? 6 : 8),
    body: [
      ["Nome completo", aguardando(proposal.client || proposal.titular || "Cliente")],
      ["CPF/CNPJ", proposal.cpfCnpj || "---.---.----00"],
      ["Endereço", proposal.endereco || "São João do Oriente - MG"],
      ["Telefone", proposal.telefone || proposal.phone || "(33) 99903-2281"],
      ["E-mail", proposal.email || "marusansp@gmail.com"]
    ],
    theme: 'plain',
    styles: { fontSize: fontSize, cellPadding: compact ? 1.5 : 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 130 } },
    margin: { left: margin + 1 }
  });

  currentY = (doc as any).lastAutoTable.finalY + (compact ? 6 : 10);

  // --- INTEGRATOR DATA ---
  checkPageBreak(35);
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DA EMPRESA INTEGRADORA", margin + 2, currentY + (compact ? 4.5 : 5.5));

  autoTable(doc, {
    startY: currentY + (compact ? 6 : 8),
    body: [
      ["Razão Social", COMPANY.name],
      ["CNPJ", COMPANY.cnpj],
      ["Endereço", COMPANY.address],
      ["Telefone / WhatsApp", COMPANY.phone],
      ["E-mail", COMPANY.email],
      ["Contato", "Marusan Pinto – Gerente de Engenharia"]
    ],
    theme: 'plain',
    styles: { fontSize: fontSize, cellPadding: compact ? 1.5 : 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 130 } },
    margin: { left: margin + 1 }
  });

  currentY = (doc as any).lastAutoTable.finalY + (compact ? 6 : 10);

  // --- SYSTEM SUMMARY ---
  checkPageBreak(38);
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO DO SISTEMA", margin + 2, currentY + (compact ? 4.5 : 5.5));

  autoTable(doc, {
    startY: currentY + (compact ? 6 : 8),
    body: [
      ["Potência instalada", `${sysSize.toFixed(2)} kWp`],
      ["Quantidade de módulos", proposal.panelQuantity || Math.round(sysSize / 0.55)],
      ["Inversor", proposal.inverterBrandModel || "Inversor String (Monitoramento Wifi)"],
      ["Consumo médio (kWh/mês)", `${consumption} kWh`],
      ["Geração média estimada (kWh/mês)", `${monthlyGen.toFixed(0)} kWh`],
      ["Cobertura estimada", `${Math.min(100, Math.round((monthlyGen / consumption) * 100))}%`]
    ],
    theme: 'plain',
    styles: { fontSize: fontSize, cellPadding: compact ? 1.5 : 1.8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    margin: { left: margin + 1 }
  });

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(textLight[0], textLight[1], textLight[2]);
  doc.text("*Estimativa para região de São João do Oriente - MG, considerando inclinação e orientação ideais.", margin + 2, (doc as any).lastAutoTable.finalY + 4);

  currentY = (doc as any).lastAutoTable.finalY + (compact ? 8 : 10);

  // --- COMPONENT DETAIL TABLE (Optimized by AutoLayout) ---
  const showComponents = options.showComponents !== false;
  if (showComponents) {
    checkPageBreak(65);
    doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
    doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
    doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
    doc.setFont("helvetica", "bold");
    doc.text("COMPOSIÇÃO DETALHADA DO KIT E EQUIPAMENTOS", margin + 2, currentY + (compact ? 4.5 : 5.5));

    const extraRows: any[] = [];
    
    // Solar Panel Info
    extraRows.push([
      "Módulos Solares (Painéis)",
      proposal.panelBrandModel || kit?.panelBrandModel || "Módulos de Alta Eficiência Monocristalinos Tier-1",
      `${proposal.panelQuantity || Math.round(sysSize / 0.55)} un`,
      "25 Anos de Garantia"
    ]);

    // Inverter Info
    extraRows.push([
      "Inversor / Microinversor",
      proposal.inverterBrandModel || kit?.inverterBrandModel || "Inversor String Inteligente c/ Monitoramento WiFi",
      `${proposal.invertersQuantity || 1} un`,
      "10 Anos de Garantia"
    ]);

    // Kit custom components or solid templates
    if (kit?.components && kit.components.length > 0) {
      kit.components.forEach(item => {
        extraRows.push([
          item.name,
          item.brand ? `${item.brand} ${item.model || ''}` : "Estruturas, Proteções e Logística do Kit",
          `${item.quantity} un`,
          item.notes || "Garantia de Fábrica"
        ]);
      });
    } else {
      extraRows.push(["Estruturas de Fixação", "Perfis de Alumínio Anodizado (Telhado/Solo)", "1 conj", "Garantia Vitalícia Corrosão"]);
      extraRows.push(["Cabos e Conectores", "Cabos Solares Flexíveis XLPE 6mm + Conectores MC4", "1 conj", "Proteção Anti-UV"]);
      extraRows.push(["String Box / Proteção", "Disjuntores CC + DPS (Supressores de Surto) Classe II", "1 un", "Segurança Integrada"]);
    }

    autoTable(doc, {
      startY: currentY + (compact ? 6 : 8),
      head: [['Equipamento / Componente', 'Especificações e Modelos', 'Quantidade', 'Garantia / Notas']],
      body: extraRows,
      theme: 'striped',
      styles: { fontSize: fontSize - 0.5, cellPadding: compact ? 1.5 : 2, overflow: 'linebreak' },
      headStyles: {
        fillColor: secondaryNavy as any,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 60 },
        2: { halign: 'center', cellWidth: 25 },
        3: { cellWidth: 'auto', fontSize: fontSize - 1.5 }
      },
      margin: { left: margin + 1, right: margin + 1 },
      rowPageBreak: 'avoid'
    });

    currentY = (doc as any).lastAutoTable.finalY + (compact ? 6 : 10);
  }

  // --- INVESTMENT ---
  checkPageBreak(35);
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("INVESTIMENTO", margin + 2, currentY + (compact ? 4.5 : 5.5));

  autoTable(doc, {
    startY: currentY + (compact ? 6 : 8),
    body: [
      ["Equipamentos (Tier-1 Alta Performance)", formatCurrency(valNum * 0.7)],
      ["Projeto, Homologação e Engenharia", formatCurrency(valNum * 0.1)],
      ["Instalação, Comissionamento e Logística", formatCurrency(valNum * 0.2)],
      ["TOTAL DO INVESTIMENTO", formatCurrency(valNum)]
    ],
    theme: 'striped',
    styles: { fontSize: fontSize, cellPadding: compact ? 1.5 : 2 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: margin + 1 },
    didParseCell: (data) => {
      if (data.row.index === 3) {
        data.cell.styles.fillColor = primaryGold as any;
        data.cell.styles.textColor = [0,0,0];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + (compact ? 6 : 10);

  // --- FINANCIAL INDICATORS ---
  checkPageBreak(35);
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("INDICADORES FINANCEIROS (REALISTAS)", margin + 2, currentY + (compact ? 4.5 : 5.5));

  autoTable(doc, {
    startY: currentY + (compact ? 6 : 8),
    body: [
      ["Economia média mensal", formatCurrency(monthlySavings)],
      ["Economia anual (1º ano)", formatCurrency(annualSavings)],
      ["Payback simples", `~${paybackVal} anos`],
      ["ROI (Retorno do Investimento - 25 anos)", roiVal],
      ["Economia líquida total em 25 anos", formatCurrency(totalSavings25)]
    ],
    theme: 'plain',
    styles: { fontSize: fontSize, cellPadding: compact ? 1.5 : 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 85 }, 1: { fontStyle: 'bold', halign: 'right' } },
    margin: { left: margin + 1 }
  });

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text(`*Cálculos baseados em Tarifa de R$ ${TARIFF.toFixed(2)}/kWh e performance estimada dos equipamentos.`, margin + 2, (doc as any).lastAutoTable.finalY + 4);

  currentY = (doc as any).lastAutoTable.finalY + (compact ? 8 : 12);

  // --- ENVIRONMENTAL ---
  checkPageBreak(25);
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("BENEFÍCIOS AMBIENTAIS", margin + 2, currentY + (compact ? 4.5 : 5.5));

  autoTable(doc, {
    startY: currentY + (compact ? 6 : 8),
    body: [
      ["Redução de CO2 por ano", "~950 kg/ano"],
      ["Árvores equivalentes salvas", "~43 árvores/ano"],
      ["Energia limpa gerada em 25 anos", proposal.monthlyGeneration ? `~${(parseFloat(proposal.monthlyGeneration) * 12 * 25).toLocaleString('pt-BR')} kWh` : "~345.000 kWh"]
    ],
    theme: 'plain',
    styles: { fontSize: fontSize, cellPadding: compact ? 1.5 : 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 85 } },
    margin: { left: margin + 1 }
  });

  currentY = (doc as any).lastAutoTable.finalY + (compact ? 6 : 10);

  // --- WARRANTIES ---
  checkPageBreak(35);
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("GARANTIAS", margin + 2, currentY + (compact ? 4.5 : 5.5));

  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const warranties = [
    "• Módulos fotovoltaicos: 25 anos de performance linear (80% da potência)",
    "• Inversor / Microinversor: 10 anos de garantia (padrão de fábrica de alta durabilidade)",
    "• Estrutura de alumínio: Garantia vitalícia contra corrosão estrutural",
    "• Serviço de instalação e as-built: 12 meses de engenharia e mão de obra dedicada"
  ];
  warranties.forEach((w, i) => doc.text(w, margin + 2, currentY + (compact ? 10 : 13) + (i * (compact ? 5 : 6))));

  currentY += compact ? 30 : 40;

  // --- COMMERCIAL CONDITIONS ---
  checkPageBreak(30);
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CONDIÇÕES COMERCIAIS", margin + 2, currentY + (compact ? 4.5 : 5.5));

  autoTable(doc, {
    startY: currentY + (compact ? 6 : 8),
    body: [
      ["Validade dos créditos energeticos", "60 meses (sob termos da Lei Federal 14.300/2022)"],
      ["Taxa mínima estimada da concessionária", proposal.disclaimerTaxaMinima || "Estimada R$ 100,00/mês"],
      ["Condição de Pagamento e Financiamentos", proposal.paymentTerms || "A definir / Conforme simulação"]
    ],
    theme: 'plain',
    styles: { fontSize: fontSize, cellPadding: compact ? 1.5 : 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 85 } },
    margin: { left: margin + 1 }
  });

  currentY = (doc as any).lastAutoTable.finalY + (compact ? 8 : 12);

  // --- NEXT STEPS ---
  checkPageBreak(50);
  doc.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
  doc.rect(margin, currentY, pageWidth - (margin * 2), compact ? 6 : 8, 'F');
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text("PRÓXIMOS PASSOS", margin + 2, currentY + (compact ? 4.5 : 5.5));

  const steps = [
    "1. Assinatura da proposta e contratação formal",
    "2. Envio de documentações do cliente para parecer de acesso (CPF, RG, Conta de Energia)",
    "3. Vistoria técnica dedicada ao local para verificação elétrica in-situ (até 5 dias úteis)",
    "4. Elaboração de projetos elétricos e engenharia e entrada na concessionária (até 10 dias)",
    "5. Instalação física do sistema de forma segura (prazo médio: 15 a 20 dias úteis)",
    "6. Teste de conformidade, comissionamento e troca do medidor bidirecional"
  ];
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  steps.forEach((s, i) => doc.text(s, margin + 2, currentY + (compact ? 10 : 13) + (i * (compact ? 5 : 6))));

  currentY += compact ? 42 : 55;

  // --- SIGNATURES ---
  checkPageBreak(50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DECLARAÇÃO E ASSINATURAS", margin, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Declaro que li e concordo com os termos desta proposta, incluindo condições de pagamento, garantias e prazo de validade.", margin, currentY);
  
  currentY += compact ? 15 : 25;
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

  // Running header and dynamic footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    
    // Draw running header on page > 1
    if (i > 1) {
      doc.setFillColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
      doc.rect(margin, margin - 10, pageWidth - (margin * 2), 1.5, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.text(`PROPOSTA COMERCIAL | Nº ${proposal.proposalNumber || "2601"}`, margin, margin - 4);
      doc.setFont("helvetica", "normal");
      doc.text(aguardando(proposal.client || proposal.titular), pageWidth - margin - 50, margin - 4, { align: 'right' });
    }
    
    // Bottom page count
    doc.text(
      `JV Mendes Junior Engenharia | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - (margin - 5),
      { align: 'center' }
    );
  }

  return doc.output('datauristring');
};

