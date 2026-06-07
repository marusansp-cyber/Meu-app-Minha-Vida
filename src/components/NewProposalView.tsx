import React from 'react';
import { NewProposalModal } from './NewProposalModal';
import { Proposal, User, Lead, Client } from '../types';
import { createDocument } from '../firestoreUtils';
import { validarRelacaoCCCA } from '../lib/engineeringUtils';

interface NewProposalViewProps {
  user: User | null;
  leads: Lead[];
  clients: Client[];
  initialData?: Proposal | null;
  onProposalAdded?: () => void;
  onCancel: () => void;
  proposals?: Proposal[];
}

export const NewProposalView: React.FC<NewProposalViewProps> = ({
  user,
  leads,
  clients,
  initialData,
  onProposalAdded,
  onCancel,
  proposals = []
}) => {
  const handleAddProposal = async (data: Proposal) => {
    try {
      const qt = parseInt(data.panelInfo?.split('x')[0] || data.systemSize) || 0; // fallback if we don't have separate fields
      // Actually we have them if we extract from systemSize or if we can rely on standard data
      // For this implementation, let's use the explicit data if it's there or extracted
      const inverterKwFromData = parseFloat(data.inverterInfo?.match(/(\d+(?:\.\d+)?)/)?.[0] || '0');
      const panelQuantityFromData = parseInt(data.panelInfo?.match(/(\d+)/)?.[0] || '0');
      const panelWpFromData = parseInt(data.panelInfo?.match(/(\d{3,4})W/)?.[1] || '0');
      
      const validation = validarRelacaoCCCA(panelQuantityFromData, panelWpFromData, inverterKwFromData);

      const enrichedData = {
        ...data,
        auditLogs: [
          ...(data.auditLogs || []),
          {
            timestamp: new Date().toISOString(),
            action: 'VALIDATION_CCCA',
            user: user?.name || 'Sistema',
            details: `Validação Relação CC/CA: ${validation.isValid ? 'Aprovado' : 'Reprovado'} - Relação: ${validation.ratio.toFixed(2)}. Mensagem: ${validation.message}`
          }
        ]
      };

      await createDocument('proposals', enrichedData);
      if (onProposalAdded) onProposalAdded();
    } catch (error) {
      console.error('Error adding proposal:', error);
    }
  };

  return (
    <NewProposalModal
      isOpen={true}
      isFullScreen={true}
      onClose={onCancel}
      onAdd={handleAddProposal}
      initialData={initialData}
      user={user}
      leads={leads}
      clients={clients}
      proposals={proposals}
    />
  );
};
