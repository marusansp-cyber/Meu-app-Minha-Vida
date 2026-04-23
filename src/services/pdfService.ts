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
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kit.price),
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
  doc.text(installation.technician.name, 80, 145);

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
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors - Premium Palette
  const primaryColor = [0, 168, 107]; // #00A86B (Modern Solar Green)
  const secondaryColor = [35, 47, 62]; // #232F3E (Professional Dark)
  const accentColor = [253, 182, 18];    // #FDB612 (Solar Yellow/Gold)
  const dangerColor = [239, 68, 68];    // Red for comparisons
  const lightBg = [248, 250, 252];      // Slate 50
  const borderGray = [226, 232, 240];   // Slate 200
  const white = [255, 255, 255];

  // Helper for text formatting
  const centerText = (text: string, y: number, fontSize = 12, style = "normal", color = secondaryColor) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  const formatDate = (date: any) => {
    try {
      if (!date) return new Date().toLocaleDateString('pt-BR');
      if (typeof date === 'string' && date.includes('/')) return date;
      const d = new Date(date);
      if (isNaN(d.getTime())) return new Date().toLocaleDateString('pt-BR');
      return d.toLocaleDateString('pt-BR');
    } catch {
      return new Date().toLocaleDateString('pt-BR');
    }
  };

  // --- Page 1: Cover (Repaginated & Centralized) ---
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, pageWidth, pageHeight * 0.45, 'F');

  // Accent Green Line
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, pageHeight * 0.45, pageWidth, 5, 'F');

  // Company Logo / Title
  centerText("VIEIRA'S SOLAR", pageHeight * 0.12, 36, "bold", [255, 255, 255]);
  centerText("& ENGENHARIA", pageHeight * 0.20, 26, "bold", [255, 255, 255]);
  centerText("Energia Renovável, Tecnologia e Sustentabilidade", pageHeight * 0.28, 14, "normal", [200, 200, 200]);

  // Responsible Engineer (Requested Change)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  centerText("Eng. José Vieira Mendes Junior", pageHeight * 0.35, 12, "bold", primaryColor);
  doc.setTextColor(255, 255, 255);
  centerText("Engenheiro Eletricista (CREA: 256019D MG)", pageHeight * 0.39, 10, "normal", [255, 255, 255]);

  // Proposal Box Container
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(30, pageHeight * 0.55, pageWidth - 60, 100, 5, 5, 'F');
  
  centerText("ESTUDO DE VIABILIDADE TÉCNICO-COMERCIAL", pageHeight * 0.61, 10, "bold", primaryColor);
  centerText("PROPOSTA DE ENERGIA SOLAR", pageHeight * 0.70, 24, "bold", secondaryColor);

  // Centralized Info
  const labelsY = pageHeight * 0.80;
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // Slate 500
  centerText(`CLIENTE: ${proposal.client || proposal.titular || "Cliente"}`, labelsY, 13, "bold");
  centerText(`DATA: ${formatDate(proposal.date)}`, labelsY + 10, 11, "normal");
  centerText(`CONSULTOR: ${proposal.representative || "Equipe Técnica"}`, labelsY + 20, 11, "normal");

  // Foot Branding
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
  centerText("www.vieirassolar.com.br", pageHeight - 15, 10, "bold", [255, 255, 255]);
  centerText("Sustentabilidade e Economia para sua Família", pageHeight - 8, 8, "normal", [255, 255, 255]);

  // --- Page 2: Impact & Infographic ---
  doc.addPage();
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 0, 15, pageHeight, 'F');

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("SEU IMPACTO POSITIVO", 30, 35);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(30, 40, 50, 2, 'F');

  // Environment boxes
  const sysSizeNum = parseFloat((proposal.systemSize || "0").replace(/[^0-9.]/g, '')) || 0;
  const co2Saved = (sysSizeNum * 1300 * 0.6).toFixed(1);
  const treesPlanted = Math.round(sysSizeNum * 30);

  const drawBox = (x: number, y: number, w: number, h: number, title: string, value: string, iconColor: number[]) => {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, y, w, h, 3, 3, 'D');
    
    doc.setTextColor(iconColor[0], iconColor[1], iconColor[2]);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 10, y + 25);
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(10);
    doc.text(title, x + 10, y + 40);
  };

  drawBox(30, 55, 75, 55, "CO2 EVITADO / ANO", `${co2Saved} kg`, primaryColor);
  drawBox(115, 55, 75, 55, "ÁRVORES PLANTADAS", `${treesPlanted}`, accentColor);

  // INFOGRAPHIC: Plant -> Grid -> Home (Requested Change)
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(16);
  doc.text("COMO FUNCIONA SUA USINA", 30, 135);
  
  const infoX = 30;
  const infoY = 150;
  const itemW = 40;
  
  // Icon 1: Panels
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(infoX, infoY, itemW, 30, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("PAINÉIS SOLARES", infoX + 5, infoY + 15, { align: "left" });
  doc.setFontSize(7);
  doc.text("Capta a Luz", infoX + 5, infoY + 22);

  // Arrow
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(1);
  doc.line(infoX + itemW + 2, infoY + 15, infoX + itemW + 8, infoY + 15);

  // Icon 2: Inverter
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(infoX + 50, infoY, itemW, 30, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("INVERSOR", infoX + 55, infoY + 15);
  doc.setFontSize(7);
  doc.text("Converte Energia", infoX + 55, infoY + 22);

  // Arrow
  doc.line(infoX + 50 + itemW + 2, infoY + 15, infoX + 50 + itemW + 8, infoY + 15);

  // Icon 3: Grid/House
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(infoX + 100, infoY, itemW + 10, 30, 2, 2, 'F');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(8);
  doc.text("REDE & CONSUMO", infoX + 104, infoY + 15);
  doc.setFontSize(7);
  doc.text("Créditos e Uso", infoX + 104, infoY + 22);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("A usina gera energia, o inversor converte e o excedente vai para a rede elétrica gerando créditos.", 30, 195);

  // --- Page 3: Economic Feasibility (Requested Change: Charts) ---
  doc.addPage();
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 0, 15, pageHeight, 'F');

  doc.setFontSize(20);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("VIABILIDADE ECONÔMICA", 30, 35);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(30, 40, 50, 2, 'F');

  // Chart: Comparison (Simple bar chart using rectangles)
  const currentBill = parseFloat((proposal.energyConsumption || "500").replace(/[^0-9.]/g, '')) * 0.95; // estimation
  const solarBill = 100; // minimum availability fee
  
  doc.setFontSize(14);
  doc.text("Sua Conta de Energia: Com vs Sem Solar", 30, 60);

  const chartX = 40;
  const chartY = 120;
  const barW = 30;
  const maxH = 50;

  // Bar 1: Without Solar
  doc.setFillColor(dangerColor[0], dangerColor[1], dangerColor[2]);
  doc.rect(chartX, chartY - maxH, barW, maxH, 'F');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(10);
  doc.text("SEM USINA", chartX, chartY + 7);
  doc.setFontSize(12);
  doc.text(`R$ ${currentBill.toFixed(2)}`, chartX, chartY - maxH - 5);

  // Bar 2: With Solar
  const solarH = (solarBill / currentBill) * maxH;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(chartX + 60, chartY - solarH, barW, solarH, 'F');
  doc.setFontSize(10);
  doc.text("COM USINA", chartX + 60, chartY + 7);
  doc.setFontSize(12);
  doc.text(`R$ ${solarBill.toFixed(2)}`, chartX + 60, chartY - solarH - 5);

  // Economics Table
  let tableY = 150;
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(30, tableY, pageWidth - 60, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text("COMPARATIVO DE CUSTOS", 35, tableY + 6.5);
  
  tableY += 10;
  const rows = [
    ["Custo Mensal Estimado", `R$ ${currentBill.toFixed(2)}`, `R$ ${solarBill.toFixed(2)}`],
    ["Economia Mensal", "-", `R$ ${(currentBill - solarBill).toFixed(2)}`],
    ["Economia Anual", "-", `R$ ${((currentBill - solarBill) * 12).toFixed(2)}`]
  ];

  rows.forEach((row, i) => {
    doc.setFillColor(i % 2 === 0 ? 255 : 245, i % 2 === 0 ? 255 : 245, i % 2 === 0 ? 255 : 245);
    doc.rect(30, tableY, pageWidth - 60, 10, 'F');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "normal");
    doc.text(row[0], 35, tableY + 6.5);
    doc.text(row[1], 100, tableY + 6.5);
    doc.setFont("helvetica", "bold");
    doc.text(row[2], 150, tableY + 6.5);
    tableY += 10;
  });

  // --- Page 4: Investment & Innovation (Repaginated & Innovated) ---
  doc.addPage();
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  centerText("INVESTIMENTO E RETORNO", 32, 24, "bold", [255, 255, 255]);

  // Main Price Tag
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1.5);
  doc.roundedRect(30, 65, pageWidth - 60, 45, 5, 5, 'FD');
  
  const price = proposal.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  centerText(price, 95, 46, "bold", primaryColor);

  // Financial details
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(14);
  doc.text("PLANO DE PAGAMENTO", 30, 130);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const method = proposal.financingBank ? `Crédito Solar via ${proposal.financingBank}` : "Condição Especial à Vista";
  doc.text(method, 30, 138);

  if (proposal.financingInstallments) {
    const installments = proposal.financingInstallments;
    const monthly = proposal.financingInstallmentValue || (proposal.value || 0) / installments;
    doc.setFont("helvetica", "bold");
    doc.text(`${installments}x de R$ ${monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 30, 146);
  }

  // Innovating ROI Section
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.05);
  doc.roundedRect(30, 165, 75, 45, 3, 3, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(28);
  doc.text(proposal.roi || "420%", 40, 195);
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("RETORNO ESTIMADO (ROI)", 40, 180);

  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2], 0.05);
  doc.roundedRect(110, 165, 75, 45, 3, 3, 'F');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(28);
  doc.text(proposal.payback || "4.1 ANOS", 118, 195);
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("PAYBACK (RECUPERAÇÃO)", 118, 180);

  // Signatures
  let signY = 245;
  doc.setLineWidth(0.5);
  doc.line(30, signY, 95, signY);
  doc.line(115, signY, 180, signY);
  doc.setFontSize(8);
  doc.text("ASSINATURA DO CLIENTE", 30, signY + 5);
  doc.text("VIEIRA'S SOLAR & ENGENHARIA", 115, signY + 5);

  // Footer Numbering
  const totalPag = doc.getNumberOfPages();
  for (let i = 1; i <= totalPag; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${totalPag} | Vieira's Solar & Engenharia`, pageWidth - 60, pageHeight - 5);
  }

  return doc.output('datauristring');
};
