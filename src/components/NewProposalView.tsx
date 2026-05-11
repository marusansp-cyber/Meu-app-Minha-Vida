import React from 'react';
import { NewProposalModal } from './NewProposalModal';
import { Proposal, User, Lead, Client } from '../types';
import { createDocument } from '../firestoreUtils';

interface NewProposalViewProps {
  user: User | null;
  leads: Lead[];
  clients: Client[];
  initialData?: Proposal | null;
  onProposalAdded?: () => void;
  onCancel: () => void;
}

export const NewProposalView: React.FC<NewProposalViewProps> = ({
  user,
  leads,
  clients,
  initialData,
  onProposalAdded,
  onCancel
}) => {
  const handleAddProposal = async (data: Proposal) => {
    try {
      await createDocument('proposals', data);
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
    />
  );
};
