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

  // Margins in mm (from cm requirements)
  const marginTop = 19.1;
  const marginBottom = 19.1;
  const marginLeft = 6.4;
  const marginRight = 6.4;
  const headerHeight = 7.6;
  const footerHeight = 7.6;

  // Colors - matching the screenshots more closely
  const primaryGreen = [57, 181, 74];   // #39B54A - Vibrant Energy Green
  const electricBlue = [0, 174, 239];   // #00AEEF - Electric Blue
  const textDark = [50, 50, 50];        // #323232
  const textGray = [120, 120, 120];     // #787878

  const drawHeaderFooter = (pageNumber: number) => {
    // Top Bar - Green
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(0, 0, pageWidth, 5, 'F');
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Energia Solar", marginLeft, 12);

    // Bottom Bar - Blue
    doc.setFillColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("Energia Solar", marginLeft, pageHeight - 1);
    doc.text("Energia Solar", pageWidth - marginRight, pageHeight - 1, { align: 'right' });
  };

  const drawGaugeIcon = (x: number, y: number) => {
    doc.setDrawColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.setLineWidth(3);
    // Outer circle (rim)
    doc.ellipse(x + 15, y + 15, 12, 12, 'S');
    // Needle
    doc.setLineWidth(1.5);
    doc.line(x + 15, y + 15, x + 25, y + 5);
    // Center point
    doc.setFillColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.circle(x + 15, y + 15, 2, 'F');
  };

  const drawPanelIcon = (x: number, y: number) => {
    doc.setDrawColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.setLineWidth(0.5);
    doc.rect(x, y, 6, 8);
    doc.line(x, y + 4, x + 6, y + 4);
    doc.line(x + 3, y, x + 3, y + 8);
  };

  const drawInverterIcon = (x: number, y: number) => {
    doc.setDrawColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.setLineWidth(0.5);
    doc.rect(x, y, 6, 8);
    doc.line(x + 1, y + 2, x + 5, y + 2);
    doc.circle(x + 3, y + 5, 2, 'S');
  };

  const energyCons = parseFloat(proposal.energyConsumption || "1357");
  const monthlyGen = parseFloat(proposal.monthlyGeneration || (parseFloat(proposal.systemSize || "0") * 108.34).toString()) || 550;
  const energyRate = 1.05; // As requested: R$ 1,05/kWh
  const minFee = 100; // As requested: R$ 100,00/mês
  
  const currentMonthlyBill = energyCons * energyRate;
  const projectedMonthlyBill = Math.max(minFee, (energyCons - monthlyGen) * energyRate + minFee);
  const monthlySavingsActual = Math.max(0, currentMonthlyBill - projectedMonthlyBill);
  const annualSavingsActual = monthlySavingsActual * 12;

  // Calculate total savings over 25 years with 5% annual inflation
  // Multiplier sum(1.05^n) for n=0 to 24 is approximately 47.727
  const estimatedSavings25 = annualSavingsActual * 47.727;

  // Constants for charts
  const chartX = marginLeft + 15;
  const chartW = pageWidth - marginLeft - marginRight - 30;
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const mBarW = (chartW / 12) * 0.4;

  const cfX = marginLeft + 15;
  const cfW = pageWidth - marginLeft - marginRight - 30;

  // --- PAGE 1: PROJETO E INSTALAÇÃO ---
  drawHeaderFooter(1);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text("Projeto e Instalação", pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const introText = "As características locais da propriedade onde será feita a instalação do sistema fotovoltaico são de extrema importância para a condução do projeto. É necessário realizar um estudo a fim de se verificar a presença de características indesejáveis para a instalação do sistema no local. A ocorrência de sombreamentos nos painéis fotovoltaicos acarreta na redução da energia gerada, e, portanto, compromete a eficiência do sistema fotovoltaico.";
  const splitIntro = doc.splitTextToSize(introText, pageWidth - marginLeft - marginRight - 10);
  doc.text(splitIntro, marginLeft + 5, 55);

  const statsY = 100;
  drawGaugeIcon(marginLeft + 15, statsY - 5);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  
  const energyConsVal = parseFloat(proposal.energyConsumption || "1357");
  const energyGenVal = monthlyGen; // Use the already calculated monthlyGen

  const leftX = marginLeft + 60;
  const rightX = pageWidth - marginRight - 20;

  doc.text("Consumo médio mensal de energia:", leftX, statsY);
  doc.text(`${energyConsVal.toLocaleString('pt-BR')} kWh/mês`, rightX, statsY, { align: 'right' });
  
  doc.text("Consumo médio anual de energia:", leftX, statsY + 12);
  doc.text(`${(energyConsVal * 12).toLocaleString('pt-BR')} kWh/ano`, rightX, statsY + 12, { align: 'right' });

  doc.text("Geração média mensal estimada:", leftX, statsY + 24);
  doc.text(`${energyGenVal.toLocaleString('pt-BR')} kWh/mês`, rightX, statsY + 24, { align: 'right' });

  doc.text("Geração média anual estimada:", leftX, statsY + 36);
  doc.text(`${(energyGenVal * 12).toLocaleString('pt-BR')} kWh/ano`, rightX, statsY + 36, { align: 'right' });

  doc.setFontSize(24);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text("Informações do Sistema", pageWidth / 2, 165, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("As principais informações do sistema proposto estão indicadas nesta seção.", pageWidth / 2, 172, { align: 'center' });

  const infoTableY = 185;
  const rowH = 8;
  const col1 = marginLeft + 30;
  const col2 = pageWidth - marginRight - 30;

  const sysSizeNum = parseFloat((proposal.systemSize || "0").replace(/[^0-9.]/g, '')) || 0;
  const infoRows = [
    { label: "Potência do sistema:", val: `${sysSizeNum.toFixed(2)} kWp`, color: electricBlue },
    { label: "Tarifa de referência:", val: "R$ 1,05/kWh" },
    { label: "Taxa mínima estimada:", val: "R$ 100,00/mês" },
    { label: "Área mínima requerida:", val: `${(sysSizeNum * 5.2).toFixed(2)} m²` },
    { label: "Geração anual estimada:", val: `${(energyGenVal * 12).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh/ano` },
    { label: "Vida útil do sistema:", val: "25 a 35 Anos" }
  ];

  infoRows.forEach((row, i) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row.label, col1, infoTableY + (i * rowH));
    if (row.color) {
      doc.setTextColor(row.color[0], row.color[1], row.color[2]);
    }
    doc.text(row.val, col2, infoTableY + (i * rowH), { align: 'right' });
  });

  // Regulatory Note
  doc.setFontSize(8);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.setFont("helvetica", "italic");
  const regNote = "⚠️ Nota regulatória: Novos sistemas enquadrados na GD III terão compensação gradualmente impactada pelo “custo do fio B”, com transição até 2029.";
  const splitRegNote = doc.splitTextToSize(regNote, pageWidth - marginLeft - marginRight - 20);
  doc.text(splitRegNote, pageWidth / 2, infoTableY + (infoRows.length * rowH) + 5, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Consumo X Geração", pageWidth / 2, 235, { align: 'center' });

  const chartY = 280;
  months.forEach((m, i) => {
    const x = chartX + (i * (chartW / 12));
    
    // Seasonal variation for consumption (higher in summer/winter)
    const consFactor = [1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 0.9, 0.9, 1.0, 1.1, 1.2][i];
    const genFactor = [0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8][i];

    const h1 = (energyConsVal / (energyConsVal * 2)) * 40 * consFactor;
    const h2 = (energyGenVal / (energyConsVal * 2)) * 40 * genFactor;

    doc.setFillColor(180, 180, 180);
    doc.rect(x, chartY - h1, mBarW, h1, 'F');
    // Geração - Blue
    doc.setFillColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.rect(x + mBarW, chartY - h2, mBarW, h2, 'F');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.setFontSize(7);
    doc.text(m, x + mBarW, chartY + 5, { align: 'center' });
  });

  // Legend
  doc.setFontSize(9);
  doc.setFillColor(180, 180, 180);
  doc.rect(pageWidth / 2 - 40, chartY + 12, 4, 4, 'F');
  doc.text("Consumo (kWh)", pageWidth / 2 - 34, chartY + 15.5);
  doc.setFillColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.rect(pageWidth / 2 + 10, chartY + 12, 4, 4, 'F');
  doc.text("Geração (kWh)", pageWidth / 2 + 16, chartY + 15.5);

  // --- PAGE 2: LISTA DE EQUIPAMENTOS ---
  doc.addPage();
  drawHeaderFooter(2);
  doc.setFontSize(28);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text("Lista de Equipamentos", pageWidth / 2, 45, { align: 'center' });

  const equipY = 70;
  const half = (pageWidth - marginLeft - marginRight) / 2;

  // Automate Kit components identification
  const moduleComp = kit?.components.find(c => c.name.toLowerCase().includes('módulo') || c.name.toLowerCase().includes('painel'));
  const inverterComp = kit?.components.find(c => c.name.toLowerCase().includes('inversor'));
  
  // Dynamic identification of quantities and brands
  const moduleName = proposal.panelBrandModel || moduleComp?.name || "Módulo Fotovoltaico de Alta Eficiência";
  const moduleBrand = moduleComp?.brand || (proposal.panelBrandModel?.split(' ')[0]) || "Premium Solar";
  const moduleCount = proposal.panelQuantity || moduleComp?.quantity || Math.ceil(parseFloat(proposal.systemSize || "5") * 1.8);

  const inverterName = proposal.inverterBrandModel || inverterComp?.name || "Inversor Solar Inteligente";
  const inverterBrand = inverterComp?.brand || (proposal.inverterBrandModel?.split(' ')[0]) || "EcoEnergy";
  const inverterCount = proposal.invertersQuantity || inverterComp?.quantity || 1;

  const additionalComps = kit?.components.filter(c => 
    !c.name.toLowerCase().includes('módulo') && 
    !c.name.toLowerCase().includes('painel') && 
    !c.name.toLowerCase().includes('inversor')
  ) || [];

  drawPanelIcon(marginLeft + 20, equipY);
  doc.setFontSize(14);
  doc.text("Módulo Fotovoltaico", marginLeft + 30, equipY + 6);
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  
  const modInfo = [
    { k: "Modelo:", v: moduleName },
    { k: "Fabricante:", v: moduleBrand },
    { k: "Quantidade:", v: `${moduleCount} Unidades` },
    { k: "Garantia:", v: "25 Anos de Desempenho" }
  ];
  modInfo.forEach((inf, i) => {
    doc.setFont("helvetica", "bold");
    doc.text(inf.k, marginLeft + 20, equipY + 20 + (i * 8));
    doc.setFont("helvetica", "normal");
    doc.text(inf.v, marginLeft + 60, equipY + 20 + (i * 8));
  });

  drawInverterIcon(marginLeft + half + 5, equipY);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.setFontSize(14);
  doc.text("Inversor", marginLeft + half + 15, equipY + 6);
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  const invInfo = [
    { k: "Modelo:", v: inverterName },
    { k: "Fabricante:", v: inverterBrand },
    { k: "Quantidade:", v: `${inverterCount} Unidade` },
    { k: "Monitoramento:", v: "Wi-Fi + App Mobile" }
  ];
  invInfo.forEach((inf, i) => {
    doc.setFont("helvetica", "bold");
    doc.text(inf.k, marginLeft + half + 5, equipY + 20 + (i * 8));
    doc.setFont("helvetica", "normal");
    doc.text(inf.v, marginLeft + half + 40, equipY + 20 + (i * 8));
  });

  // Additional Equipment Section
  const startY = equipY + 65;
  doc.setFontSize(14);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text("Resumo de Componentes Adicionais", marginLeft + 20, startY);
  
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  
  // Automate additional components list from kit or fallback
  const items = additionalComps.length > 0 ? additionalComps : [
    { name: "Estrutura de fixação para telhado", quantity: 1, brand: "" },
    { name: "Cabo Solar 6mm (Preto/Vermelho)", quantity: 1, brand: "" },
    { name: "Conectores MC4 Original", quantity: 1, brand: "" },
    { name: "String Box DC/AC Completa", quantity: 1, brand: "" }
  ];

  items.forEach((comp, idx) => {
    const col = idx % 2 === 0 ? marginLeft + 20 : marginLeft + half + 5;
    const row = startY + 10 + (Math.floor(idx / 2) * 8);
    
    if (row < pageHeight - 30) {
      doc.setFont("helvetica", "bold");
      const name = comp.name || "Componente";
      const truncatedName = name.length > 35 ? name.substring(0, 32) + '...' : name;
      doc.text(`• ${truncatedName}`, col, row);
    }
  });

  // --- PAGE 3: SERVIÇOS E FINANCEIRA ---
  doc.addPage();
  drawHeaderFooter(3);
  doc.setFontSize(28);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text("Serviços Inclusos", pageWidth / 2, 45, { align: 'center' });

  const servicesList = [
    "1. Vistoria técnica e projeto elétrico do sistema.",
    "2. Anotação da responsabilidade técnica (ART) do projeto e instalação.",
    "3. Obtenção das licenças junto à concessionária de energia local.",
    "4. Montagem dos módulos fotovoltaicos com estruturas apropriadas.",
    "5. Instalação e montagem elétrica do sistema.",
    "6. Gestão, supervisão e fiscalização da Obra de instalação.",
    "7. Frete incluso de todos equipamentos referentes ao sistema.",
    "8. Documentação personalizada do projeto fotovoltaico."
  ];
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  servicesList.forEach((s, i) => {
    doc.text(s, marginLeft + 15, 65 + (i * 10));
  });

  doc.setFontSize(24);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text("Análise Financeira", pageWidth / 2, 175, { align: 'center' });

  const finStatsY = 195;
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  // Specific values requested by user for adjustment and alignment
  const minFeeFin = 100;
  const energyRateFin = 1.05;
  const custoSemAno = energyConsVal * energyRateFin * 12;
  const valPosMês = minFeeFin + Math.max(0, energyConsVal - energyGenVal) * energyRateFin;
  const valPosAno = valPosMês * 12;
  const annualSavingsFin = Math.max(0, custoSemAno - valPosAno);
  const econMensal = annualSavingsFin / 12;
  const custoComAno = valPosAno;

  const finRows = [
    { label: "Valor médio mensal de energia após instalação:", val: `R$ ${valPosMês.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês` },
    { label: "Valor médio anual de energia:", val: `R$ ${valPosAno.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ano` },
    { label: "Custo estimado do primeiro ano SEM sistema instalado:", val: `R$ ${custoSemAno.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ano` },
    { label: "Custo estimado do primeiro ano COM sistema instalado:", val: `R$ ${custoComAno.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ano` },
    { label: "Economia média mensal estimada no primeiro ano:", val: `R$ ${econMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês` },
    { label: "Economia total estimada no primeiro ano:", val: `R$ ${annualSavingsFin.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ano` }
  ];

  finRows.forEach((row, i) => {
    doc.setDrawColor(240, 240, 240);
    doc.line(marginLeft + 5, finStatsY + (i * 12) + 2, pageWidth - marginRight - 5, finStatsY + (i * 12) + 2);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row.label, marginLeft + 5, finStatsY + (i * 12));
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.text(row.val, pageWidth - marginRight - 5, finStatsY + (i * 12), { align: 'right' });
  });


  // --- PAGE 4: FATURA E PAYBACK ---
  doc.addPage();
  drawHeaderFooter(4);
  doc.setFontSize(24);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text("Primeiro Ano da Fatura de Energia", pageWidth / 2, 45, { align: 'center' });

  const fatChartY = 90;
  months.forEach((m, i) => {
    const x = chartX + (i * (chartW / 12));
    
    const consFactor = [1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 0.9, 0.9, 1.0, 1.1, 1.2][i];
    const genFactor = [0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8][i];

    const h1 = 35 * consFactor;
    const h2 = Math.max(5, 35 * consFactor - (35 * (energyGenVal/energyConsVal) * genFactor));

    doc.setFillColor(180, 180, 180);
    doc.rect(x, fatChartY - h1, mBarW, h1, 'F');
    doc.setFillColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.rect(x + mBarW, fatChartY - h2, mBarW, h2, 'F');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.setFontSize(7);
    doc.text(m, x + mBarW, fatChartY + 5, { align: 'center' });
  });

  doc.setFontSize(24);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Valor do sistema:", marginLeft + 25, 125);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text(`${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.value || 0)}`, pageWidth - marginRight - 25, 125, { align: 'right' });

  doc.setFontSize(12);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Payback (tempo de retorno):", marginLeft + 25, 137);
  
  const realPayback = annualSavingsFin > 0 ? (proposal.value || 0) / annualSavingsFin : 0;
  const paybackStr = realPayback > 0 ? `${realPayback.toFixed(1)} Anos` : "N/A";
  doc.text(paybackStr, pageWidth - marginRight - 25, 137, { align: 'right' });
  
  doc.text("Economia total em 25 anos:", marginLeft + 25, 149);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`R$ ${estimatedSavings25.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, pageWidth - marginRight - 25, 149, { align: 'right' });

  doc.setFontSize(18);
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text("Fluxo de Caixa (Ano x R$)", pageWidth / 2, 175, { align: 'center' });
  const cfY = 240;
  for(let i=0; i<25; i++) {
    const x = cfX + (i * (cfW / 25));
    const h = 5 + (i * 2.2);
    doc.setFillColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.rect(x, cfY - h, (cfW / 25) * 0.7, h, 'F');
    if (i % 5 === 0 || i === 24) {
      doc.setFontSize(6);
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.text(`${i+1}`, x + (cfW/50), cfY + 5, { align: 'center' });
    }
  }

  const signY = 265;
  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft + 15, signY, marginLeft + 85, signY);
  doc.line(pageWidth - marginRight - 85, signY, pageWidth - marginRight - 15, signY);
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${proposal.titular || proposal.client || "Cliente Especial"}`, marginLeft + 50, signY + 6, { align: 'center' });
  doc.text("ENG. JOSÉ VIEIRA MENDES JUNIOR", pageWidth - marginRight - 50, signY + 6, { align: 'center' });
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("Assinatura do Cliente", marginLeft + 50, signY + 11, { align: 'center' });
  doc.text("Responsável Técnico | CREA-MG 256019D", pageWidth - marginRight - 50, signY + 11, { align: 'center' });

  return doc.output('datauristring');
};
