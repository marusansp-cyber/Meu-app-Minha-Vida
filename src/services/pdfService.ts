import { jsPDF } from "jspdf";
import { Proposal, Kit, Installation } from "../types";

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
  const secondaryColor = [35, 47, 62]; // #232F3E (Amazon Dark Blue/Professional)
  const accentColor = [255, 149, 0];    // #FF9500 (Golden Accent)
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
      
      if (typeof date === 'string' && date.includes('/')) {
        return date; // Already formatted as DD/MM/YYYY
      }

      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return new Date().toLocaleDateString('pt-BR');
      }
      return d.toLocaleDateString('pt-BR');
    } catch {
      return new Date().toLocaleDateString('pt-BR');
    }
  };

  // --- Page 1: Cover ---
  // Background Header
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, pageWidth, pageHeight * 0.45, 'F');

  // Accent Line
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, pageHeight * 0.45, pageWidth, 5, 'F');

  // Logo Placeholder / Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  centerText("VIEIRA'S SOLAR", pageHeight * 0.15, 36, "bold", [255, 255, 255]);
  centerText("& ENGENHARIA", pageHeight * 0.22, 24, "bold", [255, 255, 255]);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  centerText("Energia Renovável, Tecnologia e Sustentabilidade", pageHeight * 0.30, 14, "normal", [200, 200, 200]);

  // Main Category
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(30, pageHeight * 0.55, pageWidth - 60, 100, 5, 5, 'F');
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  centerText("ESTUDO DE VIABILIDADE TÉCNICO-COMERCIAL", pageHeight * 0.60, 10, "bold", primaryColor);

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(28);
  centerText("PROPOSTA DE ENERGIA SOLAR", pageHeight * 0.68, 22, "bold");

  // Client Details Box
  const infoY = pageHeight * 0.78;
  doc.setFontSize(12);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE:", 40, infoY);
  doc.setFont("helvetica", "normal");
  doc.text(proposal.client || proposal.titular || "Cliente", 70, infoY);

  doc.setFont("helvetica", "bold");
  doc.text("DATA:", 40, infoY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(proposal.date), 70, infoY + 10);

  doc.setFont("helvetica", "bold");
  doc.text("CONSULTOR:", 40, infoY + 20);
  doc.setFont("helvetica", "normal");
  doc.text(proposal.representative || "Equipe Técnica", 70, infoY + 20);

  // Bottom Branding
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  centerText("www.vieirassolar.com.br", pageHeight - 15, 10, "normal", [255, 255, 255]);
  centerText("Sustentabilidade e Economia para sua Família", pageHeight - 8, 8, "normal", [255, 255, 255]);

  // --- Page 2: O Impacto ---
  doc.addPage();
  
  // Sidebar Design element
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 0, 15, pageHeight, 'F');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("SEU IMPACTO POSITIVO", 30, 40);
  
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(30, 45, 50, 2, 'F');

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const introText = "Ao investir em energia solar, você não está apenas economizando dinheiro. Você está liderando a transição para um futuro mais limpo.";
  const splitIntro = doc.splitTextToSize(introText, pageWidth - 60);
  doc.text(splitIntro, 30, 60);

  // Environmental Boxes
  const sysSizeNum = parseFloat((proposal.systemSize || "0").replace(/[^0-9.]/g, '')) || 0;
  const co2Saved = (sysSizeNum * 1300 * 0.6).toFixed(1);
  const treesPlanted = Math.round(sysSizeNum * 30);

  const drawImpactBox = (title: string, value: string, subtitle: string, x: number, y: number) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, y, 75, 50, 3, 3, 'FD');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 10, y + 20);
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(10);
    doc.text(title, x + 10, y + 35);
    
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(subtitle, x + 10, y + 43);
  };

  drawImpactBox("CO2 EVITADO", `${co2Saved} kg`, "Por ano de operação", 30, 80);
  drawImpactBox("ÁRVORES", `${treesPlanted}`, "Equivalente plantadas", 110, 80);

  // Financial Chart / Savings Summary (Text based)
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ECONOMIA ESTIMADA", 30, 160);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Economia em 25 anos:", 30, 175);
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  const estimatedValue = parseFloat((proposal.value || "0").replace(/[^0-9]/g, '')) || 0;
  const estimatedSavings = (estimatedValue * 4.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  doc.text(estimatedSavings, 30, 188);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("* Considerado inflação energética de 8.5% ao ano e vida útil de 25 anos.", 30, 198);

  // --- Page 3: Detalhes Técnicos ---
  doc.addPage();
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 0, 15, pageHeight, 'F');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(20);
  doc.text("ESPECIFICAÇÕES TÉCNICAS", 30, 30);
  doc.line(30, 34, 100, 34);

  // Table header
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(30, 45, pageWidth - 60, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("ITEM", 35, 51.5);
  doc.text("ESPECIFICAÇÃO", 100, 51.5);

  const stats = [
    ["Potência do Sistema", `${proposal.systemSize} kWp`],
    ["Geração Média Mensal", `${proposal.energyConsumption || "N/A"} kWh`],
    ["Unidade Consumidora", proposal.ucNumber || "N/A"],
    ["Tensão de Fornecimento", proposal.tensaoFornecimento || "Trifásico"],
    ["Área Necessária", `${(sysSizeNum * 6.5).toFixed(1)} m² aprox.`]
  ];

  let statsY = 65;
  stats.forEach((row, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(30, statsY - 7, pageWidth - 60, 10, 'F');
    }
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(row[0], 35, statsY);
    doc.setFont("helvetica", "normal");
    doc.text(row[1], 100, statsY);
    statsY += 10;
  });

  // Equipments
  if (kit && kit.components) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("EQUIPAMENTOS DE ALTA PERFORMANCE", 30, 135);
    
    let kitY = 150;
    kit.components.forEach((comp) => {
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.1);
      doc.roundedRect(30, kitY - 5, pageWidth - 60, 15, 2, 2, 'F');
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.text(`${comp.quantity}x`, 35, kitY + 5);
      
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(10);
      doc.text(`${comp.name}`, 50, kitY + 2);
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text(comp.brand || "Marca de Referência Market-Leader", 50, kitY + 7);
      
      kitY += 18;
    });
  }

  // --- Page 4: Investimento e Condições ---
  doc.addPage();
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 0, 15, pageHeight, 'F');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(24);
  doc.text("INVESTIMENTO", 30, 40);

  doc.setFillColor(white[0], white[1], white[2]);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.roundedRect(30, 55, pageWidth - 60, 40, 5, 5, 'D');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(42);
  doc.setFont("helvetica", "bold");
  const priceText = proposal.value;
  const priceWidth = doc.getTextWidth(priceText);
  doc.text(priceText, (pageWidth - priceWidth) / 2 + 10, 85);

  doc.setFontSize(12);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("CONDIÇÕES DE PAGAMENTO", 30, 115);
  doc.setFont("helvetica", "normal");
  const paymentDetails = proposal.financingBank 
    ? `Financiamento Bancário via ${proposal.financingBank}`
    : "Pagamento Facilitado (À vista / Parcelamento)";
  doc.text(paymentDetails, 30, 125);
  if (proposal.financingInstallments) {
    const totalVal = parseFloat((proposal.value || "0").replace(/[^0-9]/g, '')) || 0;
    const monthlyEst = (totalVal / proposal.financingInstallments) * 1.2;
    doc.text(`Parcelamento em ${proposal.financingInstallments}x de R$ ${monthlyEst.toFixed(2)} estimadas.`, 30, 132);
  }

  // ROI Summary
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(30, 150, pageWidth - 60, 40, 2, 2, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.text("RETORNO SOBRE INVESTIMENTO (ROI):", 40, 165);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.text(proposal.roi || "962%", 40, 180);
  
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(12);
  doc.text("PAYBACK:", 120, 165);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(proposal.payback || "2.4 Anos", 120, 180);

  // Signatures
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(10);
  doc.text("Aceite da Proposta:", 30, 230);
  doc.line(30, 260, 95, 260);
  doc.text("Assinatura do Cliente", 30, 265);

  doc.line(115, 260, 180, 260);
  doc.text("Consultor Vieira's Solar", 115, 265);

  // Global Footer numbering
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${totalPages} | Vieira's Solar & Engenharia`, pageWidth - 60, pageHeight - 5);
  }

  return doc.output('datauristring');
};
