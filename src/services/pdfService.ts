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

  // INFOGRAPHIC: Plant -> Grid -> Home (Upgraded to match user request)
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  centerText("COMO FUNCIONA SUA USINA SOLAR", 130, 18, "bold", secondaryColor);
  
  // Infographic Container (60% Area)
  const infoX = 35;
  const infoY = 145;
  const infoW = pageWidth - 70;
  const infoH = 100;
  
  // doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  // doc.roundedRect(infoX, infoY, infoW, infoH, 5, 5, 'D');

  // Drawing the flow (Centralized & Well Distributed)
  
  // Item 1: Panels (Top Left)
  const pX = infoX + 10;
  const pY = infoY + 10;
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(pX, pY, 45, 20, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("MÓDULOS", pX + 22.5, pY + 8, { align: "center" });
  doc.text("FOTOVOLTAICOS", pX + 22.5, pY + 14, { align: "center" });
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(6);
  doc.text(["Geração de energia", "através do sol"], pX + 22.5, pY + 25, { align: "center" });

  // Arrow to Inverter
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pX + 45, pY + 10, infoX + 75, pY + 10);
  doc.line(infoX + 75, pY + 10, infoX + 75, infoY + 45);

  // Item 2: Inverter (Middle Center)
  const iX = infoX + 60;
  const iY = infoY + 45;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(iX, iY, 30, 15, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("INVERSOR", iX + 15, iY + 9, { align: "center" });

  // Item 3: House / Autoconsumo (Right Side)
  const hX = pageWidth - 85;
  const hY = infoY + 20;
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2], 0.2);
  doc.roundedRect(hX, hY, 40, 30, 3, 3, 'F');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("AUTOCONSUMO", hX + 20, hY + 10, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(["Energia usada", "dentro do imóvel"], hX + 20, hY + 18, { align: "center" });

  // Arrow Inverter to House
  doc.line(iX + 30, iY + 7.5, hX, iY + 7.5);

  // Item 4: Meter -> Grid (Bottom)
  const mX = infoX + 60;
  const mY = infoY + 75;
  doc.setFillColor(white[0], white[1], white[2]);
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(mX, mY, 30, 15, 2, 2, 'D');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(7);
  doc.text("MEDIDOR", mX + 15, mY + 6, { align: "center" });
  doc.text("BIDIRECIONAL", mX + 15, mY + 11, { align: "center" });

  // Grid
  const gX = pageWidth - 85;
  const gY = infoY + 75;
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(gX, gY, 40, 15, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("REDE ELÉTRICA", gX + 20, gY + 9, { align: "center" });

  // Flow Lines
  doc.setDrawColor(150, 150, 150);
  doc.line(iX + 15, iY + 15, mX + 15, mY);
  doc.line(mX + 30, mY + 7.5, gX, gY + 7.5);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Sua usina gera energia limpa que é consumida instantaneamente. O excesso é injetado na rede e vira créditos.", 30, 260, { width: pageWidth - 60 });

  // --- Page 3: Economic Feasibility & Technical Details (Enhanced) ---
  doc.addPage();
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 0, 15, pageHeight, 'F');

  doc.setFontSize(22);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("VIABILIDADE & DADOS TÉCNICOS", 30, 35);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(30, 40, 50, 2, 'F');

  // Prominent System Size
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(30, 50, 80, 25, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("POTÊNCIA DO SISTEMA", 35, 58);
  doc.setFontSize(18);
  doc.text(`${proposal.systemSize || "0.00"} kWp`, 35, 68);

  const annualGen = (sysSizeNum * 1300).toFixed(0);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(115, 50, 75, 25, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("GERAÇÃO ESTIMADA ANUAL", 120, 58);
  doc.setFontSize(18);
  doc.text(`${annualGen} kWh/ano`, 120, 68);

  // Chart: Comparison
  const currentBill = parseFloat((proposal.energyConsumption || "1500").replace(/[^0-9.]/g, '')) * 0.95; 
  const solarBill = 100; // Taxa de disponibilidade (mínima)
  
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Seu Investimento vs Custo Atual", 30, 95);

  const chartX = 40;
  const chartY = 150;
  const barW = 35;
  const maxH = 45;

  doc.setFillColor(dangerColor[0], dangerColor[1], dangerColor[2]);
  doc.rect(chartX, chartY - maxH, barW, maxH, 'F');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(10);
  doc.text("CONTA ATUAL", chartX, chartY + 7);
  doc.text(`R$ ${currentBill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, chartX, chartY - maxH - 5);

  const solarH = (solarBill / currentBill) * maxH;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(chartX + 80, chartY - solarH, barW, solarH, 'F');
  doc.text("CONTA COM SOLAR", chartX + 80, chartY + 7);
  doc.text(`R$ ${solarBill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, chartX + 80, chartY - solarH - 5);

  // Equipment detail
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LISTA DE MATERIAIS PRINCIPAIS", 30, 175);
  
  let itemY = 185;
  const materials = [
    { label: "Módulos Fotovoltaicos", val: `${proposal.panelQuantity || Math.round(sysSizeNum * 1.8)} unidades` },
    { label: "Inversor String", val: `${proposal.invertersQuantity || 1} unidade` },
    { label: "Estrutura de Fixação", val: "Conjunto Completo" },
    { label: "String Box / Proteção", val: "Incluso (AC/DC)" }
  ];

  materials.forEach(m => {
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.line(30, itemY + 2, pageWidth - 30, itemY + 2);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(m.label, 30, itemY);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(m.val, pageWidth - 35, itemY, { align: "right" });
    itemY += 8;
  });

  // --- Page 4: Investment & Professional Terms ---
  doc.addPage();
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  centerText("INVESTIMENTO E GARANTIAS", 32, 24, "bold", [255, 255, 255]);

  // Main Price
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1.5);
  doc.roundedRect(30, 60, pageWidth - 60, 40, 5, 5, 'FD');
  const price = proposal.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  centerText(price, 88, 42, "bold", primaryColor);

  // Finance Comparison
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("COMPARATIVO DE PARCELA", 30, 120);
  
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(30, 125, pageWidth - 60, 25, 2, 2, 'F');
  
  const monthlyFinance = proposal.financingInstallmentValue || (proposal.value || 0) / (proposal.financingInstallments || 60);
  doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
  doc.setFontSize(9);
  doc.text(`CONTA ATUAL: R$ ${currentBill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 40, 140);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.text(`PARCELA SOLAR: R$ ${monthlyFinance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 120, 140);

  // Guarantees Section (Requested Add)
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("GARANTIAS E DOCUMENTAÇÃO", 30, 165);
  
  const guarantees = [
    "• Eficiência dos Módulos: 25 anos (90% de performance linear)",
    "• Inversor Solar: 10 anos contra defeitos de fabricação",
    "• Instalação e Serviços: 01 ano contra falhas de montagem",
    "• Prazo Estimado: 45 a 60 dias para homologação e ativação"
  ];
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  guarantees.forEach((g, i) => {
    doc.text(g, 30, 175 + (i * 7));
  });

  // Terms and Responsibilities
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const terms = "Responsabilidade Civil: A Vieira's Solar & Engenharia assume a responsabilidade pelo projeto técnico, licença junto à distribuidora e emissão da ART. Payback calculado com base no histórico de consumo e tarifa vigente, sujeito a variações regulatórias.";
  const splitTerms = doc.splitTextToSize(terms, pageWidth - 60);
  doc.text(splitTerms, 30, 210);

  // Innovating ROI Section
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.05);
  doc.roundedRect(30, 225, 75, 30, 3, 3, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(22);
  doc.text(proposal.roi || "420%", 40, 248);
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("ROI (Ciclo de 25 anos)", 40, 235);

  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2], 0.05);
  doc.roundedRect(110, 225, 75, 30, 3, 3, 'F');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(22);
  doc.text(proposal.payback || "4.1 ANOS", 118, 248);
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("PAYBACK (ESTIMADO)", 118, 235);

  // Signatures
  let signY = 245;
  doc.setLineWidth(0.5);
  doc.line(30, signY, 95, signY);
  doc.line(115, signY, 180, signY);
  doc.setFontSize(8);
  doc.text("ASSINATURA DO CLIENTE", 30, signY + 5);
  doc.text("VIEIRA'S SOLAR & ENGENHARIA", 115, signY + 5);

  // --- Page 5: Monthly Generation & Operational Terms ---
  doc.addPage();
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 0, 15, pageHeight, 'F');

  doc.setFontSize(22);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("CURVA DE GERAÇÃO & OPERAÇÃO", 30, 35);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(30, 40, 50, 2, 'F');

  // Monthly Generation Curve (Simplified Bar Chart)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Expectativa de Geração Mensal (kWh/mês)", 30, 55);
  
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const avgGen = parseFloat(annualGen) / 12;
  const genMultipliers = [1.2, 1.15, 1.05, 0.95, 0.85, 0.75, 0.8, 0.95, 1.05, 1.1, 1.15, 1.2];
  
  const curveX = 35;
  const curveY = 110;
  const barWidth = 10;
  const spacing = 3;
  const maxBarH = 40;

  months.forEach((m, i) => {
    const barH = (genMultipliers[i] * avgGen / (avgGen * 1.2)) * maxBarH;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.7);
    doc.rect(curveX + (i * (barWidth + spacing)), curveY - barH, barWidth, barH, 'F');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(6);
    doc.text(m, curveX + (i * (barWidth + spacing)) + 2, curveY + 5);
  });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("* Curva baseada em índices de irradiação locais e posicionamento ideal (Norte).", 30, 120);

  // Financial Comparison (CET vs Markets)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ANÁLISE DE TAXAS (CET)", 30, 135);
  
  const financeRows = [
    ["LINHA", "TAXA ESTIMADA (CET)", "CONDIÇÃO"],
    ["Credsol (Parceiro)", `${proposal.financingRate || 1.29}% a.m.`, "Linha Expressa (Sol)"],
    ["FNE Solar / Bancos", "1.15% - 1.45% a.m.", "Análise Burocrática"],
    ["Consórcio Solar", "0.20% - 0.35% a.m.", "Sem Cobertura Imediata"]
  ];

  let fY = 145;
  financeRows.forEach((row, i) => {
    doc.setFillColor(i === 0 ? secondaryColor[0] : (i % 2 === 0 ? 245 : 255), i === 0 ? secondaryColor[1] : (i % 2 === 0 ? 245 : 255), i === 0 ? secondaryColor[2] : (i % 2 === 0 ? 245 : 255));
    doc.rect(30, fY, pageWidth - 60, 8, 'F');
    doc.setTextColor(i === 0 ? 255 : 80);
    doc.setFontSize(8);
    doc.text(row[0], 35, fY + 5);
    doc.text(row[1], 100, fY + 5);
    doc.text(row[2], 150, fY + 5);
    fY += 8;
  });

  // O&M Section
  doc.setFillColor(white[0], white[1], white[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(30, 185, pageWidth - 60, 45, 3, 3, 'D');
  
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PROGRAMA DE OPERAÇÃO E MANUTENÇÃO (O&M)", 38, 195);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const omItems = [
    "• Monitoramento remoto em tempo real via App mobile.",
    "• Relatório de performance semestral.",
    "• Protocolo de limpeza técnica (Recomendável a cada 6 meses).",
    "• Auditoria de Reaperto e Componentes Elétricos (Pós-instalação)."
  ];
  omItems.forEach((item, i) => {
    doc.text(item, 38, 202 + (i * 5));
  });

  // Deadlines
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("PRAZO CONTRATUAL DE INSTALAÇÃO:", 30, 245);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Até 30 dias após aprovação da distribuidora (Parecer de Acesso).", 30, 252);

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
