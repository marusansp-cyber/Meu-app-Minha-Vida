import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';

export type NotificationType = 'lead_assigned' | 'proposal_status' | 'installation_update' | 'system' | 'deadline_reminder';

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: any;
  link?: string;
  metadata?: any;
}

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
  try {
    const colRef = collection(db, 'notifications');
    await addDoc(colRef, {
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    });
    
    // Simulate sending email if user has email notifications enabled
    console.log(`[SIMULATED EMAIL] To: ${notification.userId}, Title: ${notification.title}, Message: ${notification.message}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const notifyLeadAssigned = (leadName: string, representativeName: string, representativeId: string) => {
  return createNotification({
    userId: representativeId,
    title: 'Novo Lead Atribuído',
    message: `O lead "${leadName}" foi atribuído a você.`,
    type: 'lead_assigned',
    link: '/leads'
  });
};

export const notifyProposalStatusChange = (clientName: string, status: string, ownerId: string, proposalId: string) => {
  const statusLabels: Record<string, string> = {
    sent: 'Enviada',
    accepted: 'Aceita',
    expired: 'Expirada',
    declined: 'Recusada'
  };
  
  return createNotification({
    userId: ownerId,
    title: 'Status da Proposta Alterado',
    message: `A proposta para "${clientName}" agora está com o status: ${statusLabels[status] || status}.`,
    type: 'proposal_status',
    link: `/proposals?id=${proposalId}`
  });
};

export const notifyInstallationUpdate = (clientName: string, stage: string, ownerId: string, installationId: string) => {
  return createNotification({
    userId: ownerId,
    title: 'Atualização de Instalação',
    message: `O status da instalação de "${clientName}" foi atualizado para: ${stage}.`,
    type: 'installation_update',
    link: `/installations?id=${installationId}`
  });
};

export const syncNotifications = (userId: string, onUpdate: (notifications: Notification[]) => void) => {
  const colRef = collection(db, 'notifications');
  const q = query(
    colRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
    onUpdate(notifications);
  });
};
