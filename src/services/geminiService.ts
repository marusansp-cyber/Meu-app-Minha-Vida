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

export const parseProposalFromText = async (text: string): Promise<any> => {
  const response = await ai.models.generateContent({ 
    model: "gemini-3-flash-preview",
    contents: `Você é um Especialista em Automação de Propostas Fotovoltaicas e Estruturação de Dados JSON. Sua única tarefa é extrair informações técnicas, financeiras e cadastrais do texto fornecido e gerar APENAS um objeto JSON válido, estritamente formatado para alimentar um pipeline automatizado de geração de PDF.

📏 REGRAS CRÍTICAS DE SAÍDA:
1. Responda APENAS com o JSON bruto. NUNCA use markdown, crases, explicações ou texto antes/depois do JSON.
2. Moeda: Formate TODOS os valores financeiros como strings no padrão brasileiro: "X.XXX,XX".
3. Listas: Converta serviços e componentes em strings HTML prontas (<ol> ou <ul>).
4. Tipos: Mantenha números puros para kWh, kWp, m² e quantidades. Use strings para textos, moedas e garantias.
5. Faltas: Se um dado não existir no input, use null ou "N/A". NUNCA invente valores.
6. Mídia: Se não houver URLs ou imagens no input, mantenha os placeholders exatos: "https://placeholder.com/logo.png" e "image/png;base64,placeholder".

📐 ESTRUTURA JSON OBRIGATÓRIA:
{
  "cliente": { "nome": "string" },
  "consumo": { "mensal_kwh": number, "anual_kwh": number },
  "geracao": { "mensal_kwh": number, "anual_kwh": number },
  "sistema": {
    "potencia_kwp": number,
    "tarifa_kwh": number,
    "taxa_minima": number,
    "area_m2": number,
    "vida_util": "string",
    "nota_regulatoria": "string"
  },
  "equipamentos": {
    "modulos": { "modelo": "string", "fabricante": "string", "quantidade": number, "garantia": "string" },
    "inversor": { "modelo": "string", "fabricante": "string", "quantidade": number, "monitoramento": "string" },
    "componentes_adicionais_html": "<ul><li>...</li></ul>"
  },
  "servicos_html": "<ol><li>...</li></ol>",
  "financeiro": {
    "conta_mensal_pos": "string",
    "custo_anual_sem": "string",
    "custo_anual_com": "string",
    "economia_mensal_1ano": "string",
    "economia_1ano": "string",
    "valor_sistema": "string",
    "payback_anos": "string",
    "economia_25anos": "string"
  },
  "responsavel": { "nome": "string", "crea": "string" },
  "midia": { "logo_url": "string", "foto_telhado_base64": "string" }
}

📥 INPUT DE DADOS:
${text}`
  });

  try {
    const rawText = response.text?.replace(/```json\n?/, '').replace(/```/, '').trim() || '';
    return JSON.parse(rawText);
  } catch (error) {
    console.error("Erro ao analisar JSON da extração de proposta:", error);
    throw new Error("Não foi possível processar os dados técnicos. Certifique-se de que o texto contém informações válidas.");
  }
};
