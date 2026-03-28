import { jsPDF } from "jspdf";
import { Proposal, Kit } from "../types";

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
