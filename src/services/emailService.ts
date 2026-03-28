export interface EmailParams {
  to: string;
  subject?: string;
  body?: string;
  pdfBase64: string;
  fileName?: string;
}

export const sendProposalEmail = async (params: EmailParams): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/proposals/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
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
