import { getDocument } from '../firestoreUtils';
import { SMTPSettings } from '../types';

export interface EmailParams {
  to: string;
  subject?: string;
  body?: string;
  pdfBase64: string;
  fileName?: string;
  smtpConfig?: SMTPSettings;
}

export const sendProposalEmail = async (params: EmailParams): Promise<{ success: boolean; message: string }> => {
  try {
    let finalParams = { ...params };

    // If smtpConfig is not provided, try to fetch from Firestore
    if (!finalParams.smtpConfig) {
      const settings = await getDocument<SMTPSettings>('settings', 'smtp');
      if (settings) {
        finalParams.smtpConfig = settings;
      }
    }

    const response = await fetch('/api/proposals/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalParams),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao enviar e-mail.');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro no serviço de e-mail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar e-mail.',
    };
  }
};
