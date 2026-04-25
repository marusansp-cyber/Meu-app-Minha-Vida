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

  // Colors
  const primaryGreen = [46, 125, 50];    // #2E7D32
  const electricBlue = [0, 180, 216];    // #00B4D8
  const solarOrange = [255, 140, 0];     // #FF8C00
  const bgWhite = [255, 255, 255];
  const textDark = [45, 45, 45];        // #2D2D2D
  const textGray = [102, 102, 102];      // #666666
  const borderLight = [226, 232, 240];

  const formatDate = (date: any) => {
    try {
      if (!date) return new Date().toLocaleDateString('pt-BR');
      const d = new Date(date);
      return isNaN(d.getTime()) ? new Date().toLocaleDateString('pt-BR') : d.toLocaleDateString('pt-BR');
    } catch {
      return new Date().toLocaleDateString('pt-BR');
    }
  };

  const drawHeaderFooter = (pageNumber: number) => {
    // Header - Sustainable Green bar
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("VIEIRA'S SOLAR & ENGENHARIA", marginLeft, headerHeight / 2 + 1.2);
    doc.text("CREA 256019D MG", pageWidth - marginRight, headerHeight / 2 + 1.2, { align: 'right' });

    // Footer - Electric Blue bar
    doc.setFillColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("www.vieirassolar.com.br", marginLeft, pageHeight - (footerHeight / 2) + 1.2);
    doc.text("Energia Renovável e Sustentabilidade", pageWidth - marginRight, pageHeight - (footerHeight / 2) + 1.2, { align: 'right' });

    // Page Number (subtle)
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`${pageNumber}`, pageWidth / 2, pageHeight - footerHeight - 2, { align: 'center' });
  };

  // Helper for drawing cards with 12px (3.2mm) radius
  const drawCard = (x: number, y: number, w: number, h: number, fillColor = bgWhite) => {
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.1);
    doc.roundedRect(x, y, w, h, 3.2, 3.2, 'FD');
  };

  // Helper for Section Titles
  const sectionTitle = (text: string, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.text(text, marginLeft, y);
    doc.setDrawColor(solarOrange[0], solarOrange[1], solarOrange[2]);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, y + 2, marginLeft + 20, y + 2);
  };

  // --- PAGE 1: CAPA PRINCIPAL ---
  drawHeaderFooter(1);
  
  // Cover Background
  doc.setFillColor(248, 250, 252); // Soft slate tint
  doc.rect(marginLeft, marginTop, pageWidth - marginLeft - marginRight, pageHeight - marginTop - marginBottom - 10, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text("ESTUDO DE", pageWidth / 2, 80, { align: 'center' });
  doc.text("VIABILIDADE SOLAR", pageWidth / 2, 95, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("Investimento inteligente para sua liberdade energética", pageWidth / 2, 110, { align: 'center' });

  // Big Highlight Card
  drawCard(marginLeft + 10, 130, pageWidth - (marginLeft + marginRight + 20), 40, bgWhite);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text("SUA CONTA DE LUZ", pageWidth / 2, 148, { align: 'center' });
  doc.text("PODE CAIR 95%", pageWidth / 2, 160, { align: 'center' });

  // Client Info box at bottom
  const infoY = 230;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`PARA: ${proposal.titular || proposal.client || "Cliente"}`, marginLeft + 10, infoY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`DATA: ${formatDate(proposal.date)}`, marginLeft + 10, infoY + 8);
  doc.text(`RESPONSÁVEL: ${proposal.representative || "Equipe Vieira's"}`, marginLeft + 10, infoY + 14);

  // --- PAGE 2: PROBLEMA x SOLUÇÃO + IMPACTO ---
  doc.addPage();
  drawHeaderFooter(2);
  sectionTitle("POR QUE MUDAR PARA O SOLAR?", 45);

  const cardW = (pageWidth - marginLeft - marginRight - 10) / 2;
  
  // Problem Card
  drawCard(marginLeft, 60, cardW, 60);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(solarOrange[0], solarOrange[1], solarOrange[2]);
  doc.text("! O CENÁRIO ATUAL", marginLeft + 5, 70);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const probText = "A inflação de energia no Brasil cresce acima da inflação oficial. Pagar a conta de luz é um custo sem retorno, sujeito a bandeiras tarifárias e reajustes sem controle.";
  doc.text(doc.splitTextToSize(probText, cardW - 10), marginLeft + 5, 80);

  // Solution Card
  drawCard(pageWidth - marginRight - cardW, 60, cardW, 60);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text("* A SOLUÇÃO VIEIRA'S", pageWidth - marginRight - cardW + 5, 70);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const solText = "Ao gerar sua própria energia, você trava o preço do seu kWh e gera créditos. Valorização imediata do imóvel e economia real por mais de 25 anos.";
  doc.text(doc.splitTextToSize(solText, cardW - 10), pageWidth - marginRight - cardW + 5, 80);

  // Impact Metrics
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("IMPACTO AMBIENTAL ESTIMADO (ANUAL)", marginLeft, 140);

  const impactW = (pageWidth - marginLeft - marginRight - 10) / 3;
  const sysSizeVal = parseFloat((proposal.systemSize || "0").replace(/[^0-9.]/g, '')) || 0;
  
  const drawMetric = (x: number, label: string, value: string, icon: string) => {
    drawCard(x, 150, impactW, 40);
    doc.setFontSize(12);
    doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.text(icon, x + impactW / 2, 162, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + impactW / 2, 175, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(label, x + impactW / 2, 182, { align: 'center' });
  };

  drawMetric(marginLeft, "CO2 EVITADO", `${(sysSizeVal * 80).toFixed(0)} kg`, "(Mundo)");
  drawMetric(marginLeft + impactW + 5, "ÁRVORES SALVAS", `${(sysSizeVal * 4).toFixed(0)} un`, "(Arvore)");
  drawMetric(marginLeft + (impactW * 2) + 10, "POTÊNCIA TOTAL", `${sysSizeVal} kWp`, "(Energia)");

  // --- PAGE 3: INVESTIMENTO E RETORNO ---
  doc.addPage();
  drawHeaderFooter(3);
  sectionTitle("INVESTIMENTO E RETORNO", 45);

  const invValue = proposal.value || 0;
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(electricBlue[0], electricBlue[1], electricBlue[2]);
  doc.text(`${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invValue)}`, pageWidth / 2, 75, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("Valor total do projeto instalado (Chave na Mão)", pageWidth / 2, 82, { align: 'center' });

  // Comparison
  const compY = 105;
  drawCard(marginLeft, compY, pageWidth - marginLeft - marginRight, 60);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("ECONOMIA MENSAL ESTIMADA", marginLeft + 10, compY + 12);

  const energyVal = parseFloat(proposal.energyConsumption || "1357");
  const currentBill = energyVal * 1.05; 
  const solarBill = 100; // Taxa de disponibilidade mínima
  const savings = currentBill - solarBill;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Conta Atual: R$ ${currentBill.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`, marginLeft + 10, compY + 25);
  doc.text(`Nova Conta: R$ ${solarBill.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`, marginLeft + 10, compY + 33);
  
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text(`- R$ ${savings.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`, pageWidth - marginRight - 15, compY + 30, { align: 'right' });
  doc.setFontSize(8);
  doc.text("ECONOMIA POR MÊS", pageWidth - marginRight - 15, compY + 38, { align: 'right' });

  // ROI Summary
  const roiY = 185;
  const roiW = (pageWidth - marginLeft - marginRight - 5) / 2;
  
  drawCard(marginLeft, roiY, roiW, 40);
  doc.setFontSize(10);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("TEMPO DE RETORNO (PAYBACK)", marginLeft + roiW / 2, roiY + 15, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(solarOrange[0], solarOrange[1], solarOrange[2]);
  doc.text(`${proposal.payback || "3.8"} ANOS`, marginLeft + roiW / 2, roiY + 30, { align: 'center' });

  drawCard(pageWidth - marginRight - roiW, roiY, roiW, 40);
  doc.setFontSize(10);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("ECONOMIA EM 25 ANOS", pageWidth - marginRight - roiW / 2, roiY + 15, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  
  const estimatedSavings25 = proposal.energyConsumption 
    ? (parseFloat(proposal.energyConsumption) * 1.05 - 100) * 12 * 25 
    : 450000;
  
  doc.text(`R$ ${estimatedSavings25.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}+`, pageWidth - marginRight - roiW / 2, roiY + 30, { align: 'center' });

  // --- PAGE 4: GARANTIAS E TECNOLOGIA ---
  doc.addPage();
  drawHeaderFooter(4);
  sectionTitle("GARANTIAS E TECNOLOGIA", 45);

  const guarantees = [
    { title: "MÓDULOS FOTOVOLTAICOS", time: "25 ANOS", desc: "Performance linear garantida de 80-90%." },
    { title: "INVERSOR SOLAR", time: "10-15 ANOS", desc: "Garantia de fábrica contra defeitos técnicos." },
    { title: "SERVIÇOS DE INSTALAÇÃO", time: "1 ANO", desc: "Cobertura total contra infiltrações e estrutural." },
    { title: "HOMOLOGAÇÃO E ART", time: "VITALÍCIO", desc: "Processo 100% legalizado junto à concessionária." }
  ];

  let guarY = 65;
  guarantees.forEach(g => {
    drawCard(marginLeft, guarY, pageWidth - marginLeft - marginRight, 22);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(g.title, marginLeft + 5, guarY + 8);
    doc.setTextColor(solarOrange[0], solarOrange[1], solarOrange[2]);
    doc.text(g.time, pageWidth - marginRight - 10, guarY + 8, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(g.desc, marginLeft + 5, guarY + 15);
    guarY += 28;
  });

  // Technical Specs Card
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("COMPOSIÇÃO DO SISTEMA", marginLeft, guarY + 10);
  
  drawCard(marginLeft, guarY + 18, pageWidth - marginLeft - marginRight, 45, [248, 250, 252]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const specs = [
    `• Painéis: ${proposal.panelQuantity || "24"} unidades ${proposal.panelBrandModel || "MAXEON 540 W"}`,
    `• Inversor: ${proposal.inverterBrandModel || "AUXSOL 7.5"} com Monitoramento Wi-Fi`,
    `• Estrutura: Alumínio Anodizado (específico para telhado)`,
    `• Cabeamento: Cabos solares resistentes a UV e String Box blindada`
  ];
  specs.forEach((s, i) => doc.text(s, marginLeft + 10, guarY + 30 + (i * 8)));

  // --- PAGE 5: CURVA DE GERAÇÃO + OPERAÇÃO ---
  doc.addPage();
  drawHeaderFooter(5);
  sectionTitle("EXPECTATIVA DE GERAÇÃO", 45);

  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const baseline = 1000;
  const mods = [1.2, 1.3, 1.45, 1.35, 1.05, 0.9, 0.85, 1.0, 1.15, 1.25, 1.35, 1.4];

  let barX = marginLeft + 15;
  const barYBase = 120;
  const maxBarH = 40;
  const barW = 12;

  months.forEach((m, i) => {
    const h = (mods[i] / 1.5) * maxBarH;
    doc.setFillColor(electricBlue[0], electricBlue[1], electricBlue[2]);
    doc.rect(barX, barYBase - h, barW - 2, h, 'F');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.setFontSize(7);
    doc.text(m, barX, barYBase + 5);
    barX += barW + 2;
  });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("* A geração pode variar conforme sazonalidade e incidência solar local.", marginLeft, 130);

  // O&M Section
  sectionTitle("OPERAÇÃO E MANUTENÇÃO", 155);
  drawCard(marginLeft, 165, pageWidth - marginLeft - marginRight, 70);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("VANTAGENS DO MONITORAMENTO ATIVO:", marginLeft + 5, 175);
  
  const omBullets = [
    "- Diagnóstico imediato via APP e Inteligência Artificial.",
    "- Antecipação de falhas de rede ou sujeira nos painéis.",
    "- Relatórios mensais de economia real comprovada.",
    "- Suporte técnico prioritário Vieira's Solar."
  ];
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  omBullets.forEach((b, i) => doc.text(b, marginLeft + 10, 188 + (i * 10)));

  // --- PAGE 6: CALL TO ACTION + ASSINATURA ---
  doc.addPage();
  drawHeaderFooter(6);
  
  drawCard(marginLeft + 10, 45, pageWidth - (marginLeft + marginRight + 20), 40, [255, 140, 0, 0.1] as any);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(solarOrange[0], solarOrange[1], solarOrange[2]);
  doc.text("! CONDIÇÃO EXCLUSIVA E LIMITADA", pageWidth / 2, 58, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Proposta válida até ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}`, pageWidth / 2, 70, { align: 'center' });
  doc.text("Reservamos apenas 4 vagas de instalação prioritária para este ciclo.", pageWidth / 2, 76, { align: 'center' });

  sectionTitle("ESCOLHA SUA LIBERDADE", 110);
  doc.setFontSize(12);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Ao assinar esta proposta, você inicia sua jornada para a independência energética", marginLeft, 122);
  doc.text("com a garantia de quem é referência em engenharia fotovoltaica.", marginLeft, 128);

  // Signatures
  const signY = 220;
  doc.setLineWidth(0.3);
  doc.setDrawColor(textGray[0], textGray[1], textGray[2]);
  doc.line(marginLeft + 15, signY, marginLeft + 85, signY);
  doc.line(pageWidth - marginRight - 85, signY, pageWidth - marginRight - 15, signY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${proposal.titular || proposal.client || "CONTRATANTE"}`, marginLeft + 15, signY + 6);
  doc.text("ENG. JOSÉ VIEIRA MENDES JUNIOR", pageWidth - marginRight - 85, signY + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Assinatura do Cliente", marginLeft + 15, signY + 12);
  doc.text("Responsável Técnico | CREA-MG 256019D", pageWidth - marginRight - 85, signY + 12);

  // Final small branding
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("* Esta proposta contempla projeto, instalação e acompanhamento completo.", pageWidth / 2, 275, { align: 'center' });

  return doc.output('datauristring');
};

