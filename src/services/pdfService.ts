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

  // Colors
  const primaryColor = [242, 125, 38]; // #F27D26 (Orange)
  const secondaryColor = [20, 20, 20]; // Dark
  const lightGray = [245, 245, 245];

  // Helper for text centering
  const centerText = (text: string, y: number) => {
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // --- Page 1: Cover ---
  // Background accent
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Logo Placeholder / Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  centerText("VIEIRA'S SOLAR & ENGENHARIA", 45);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  centerText("Energia Inteligente para um Futuro Sustentável", 55);

  // Proposal Title
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  centerText("PROPOSTA COMERCIAL", 120);

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(2);
  doc.line(pageWidth / 4, 130, (3 * pageWidth) / 4, 130);

  // Client Info
  doc.setFontSize(16);
  doc.text("Cliente:", 30, 160);
  doc.setFont("helvetica", "normal");
  doc.text(proposal.client, 60, 160);

  doc.setFont("helvetica", "bold");
  doc.text("Data:", 30, 175);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(proposal.date).toLocaleDateString('pt-BR'), 60, 175);

  doc.setFont("helvetica", "bold");
  doc.text("Validade:", 30, 190);
  doc.setFont("helvetica", "normal");
  const expiryDate = proposal.expiryDate ? new Date(proposal.expiryDate).toLocaleDateString('pt-BR') : "30 dias";
  doc.text(expiryDate, 60, 190);

  // Footer
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  centerText("www.vieirassolar.com.br | (11) 99999-9999", pageHeight - 8);

  // --- Page 2: System Details ---
  doc.addPage();
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ESPECIFICAÇÕES DO SISTEMA", 20, 30);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(20, 35, 100, 35);

  // System Info Table-like structure
  const startY = 50;
  const rowHeight = 12;
  
  const drawRow = (label: string, value: string, y: number) => {
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(20, y - 8, pageWidth - 40, rowHeight, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label, 25, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 100, y);
  };

  drawRow("Potência do Sistema:", proposal.systemSize, startY);
  drawRow("Produção Mensal Estimada:", proposal.energyConsumption || "N/A", startY + rowHeight);
  drawRow("Número da UC:", proposal.ucNumber || "N/A", startY + (rowHeight * 2));
  drawRow("Consultor Responsável:", proposal.representative, startY + (rowHeight * 3));

  // Kit Details
  if (kit) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("EQUIPAMENTOS", 20, 110);
    doc.line(20, 112, 70, 112);

    let kitY = 125;
    kit.components.forEach((comp) => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${comp.quantity}x`, 25, kitY);
      doc.setFont("helvetica", "normal");
      doc.text(`${comp.name} ${comp.brand ? `(${comp.brand})` : ''}`, 40, kitY);
      kitY += 10;
    });
  }

  // Investment
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("INVESTIMENTO", 20, 180);
  doc.line(20, 182, 70, 182);

  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(proposal.value, 20, 200);

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Forma de Pagamento:", 20, 215);
  const paymentInfo = proposal.financingBank 
    ? `Financiamento via ${proposal.financingBank} em ${proposal.financingInstallments}x`
    : "À vista / Entrada + Parcelamento Próprio";
  doc.text(paymentInfo, 65, 215);

  // ROI / Payback
  if (proposal.payback || proposal.roi) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RETORNO FINANCEIRO", 20, 240);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    if (proposal.payback) doc.text(`Payback Estimado: ${proposal.payback}`, 20, 250);
    if (proposal.roi) doc.text(`ROI Estimado: ${proposal.roi}`, 20, 260);
  }

  // Final Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  centerText("Esta proposta tem caráter informativo e está sujeita a alteração após vistoria técnica.", pageHeight - 15);

  return doc.output('datauristring');
};
