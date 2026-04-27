import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ExtractedLeadData {
  name?: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  address?: string;
  cep?: string;
  ucNumber?: string;
  averageConsumption?: number;
  averageBillValue?: number;
  consumptionHistory?: { month: string; value: number }[];
}

export const extractLeadFromPdf = async (base64Pdf: string): Promise<ExtractedLeadData> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: `Extraia os dados deste documento de conta de energia ou relatório técnico para criar um lead de energia solar. 
            Ignore avisos de corte ou propagandas. Foque nos dados do cliente e histórico de consumo.
            Se houver um histórico de consumo de 12 meses, extraia-o.
            Retorne os dados no formato JSON especificado.`
          },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nome completo do cliente" },
          email: { type: Type.STRING, description: "E-mail de contato" },
          phone: { type: Type.STRING, description: "Telefone ou celular com DDD" },
          cpfCnpj: { type: Type.STRING, description: "CPF ou CNPJ do titular" },
          address: { type: Type.STRING, description: "Endereço completo da instalação" },
          cep: { type: Type.STRING, description: "CEP da instalação" },
          ucNumber: { type: Type.STRING, description: "Número da Unidade Consumidora (UC)" },
          averageConsumption: { type: Type.NUMBER, description: "Consumo médio mensal em kWh" },
          averageBillValue: { type: Type.NUMBER, description: "Valor médio da fatura em R$" },
          consumptionHistory: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING, description: "Mês/Ano (ex: Jan/24)" },
                value: { type: Type.NUMBER, description: "Consumo em kWh" }
              }
            }
          }
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Falha na extração: Resposta vazia do modelo.");
    return JSON.parse(text) as ExtractedLeadData;
  } catch (error) {
    console.error("Erro ao analisar JSON da extração:", error);
    throw new Error("Não foi possível processar os dados do PDF.");
  }
};
