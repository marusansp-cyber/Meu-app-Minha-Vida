import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Kit, Lead } from "../types";
import { createDocument, getCollectionData } from "../firestoreUtils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const queryKitsDeclaration: FunctionDeclaration = {
  name: "queryKits",
  description: "Busca kits fotovoltaicos disponíveis no sistema.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      searchTerm: {
        type: Type.STRING,
        description: "Termo de busca (marca, potência, nome do kit)."
      }
    }
  }
};

const scheduleSurveyDeclaration: FunctionDeclaration = {
  name: "scheduleSurvey",
  description: "Agenda uma vistoria técnica criando um novo Lead.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Nome do cliente" },
      email: { type: Type.STRING, description: "E-mail do cliente" },
      phone: { type: Type.STRING, description: "Telefone do cliente" },
      address: { type: Type.STRING, description: "Endereço do cliente" }
    },
    required: ["name", "email", "phone", "address"]
  }
};

export async function chatWithAI(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: message,
    config: {
      systemInstruction: `Você é o Consultor Solar da System Solar. Seu objetivo é ajudar clientes a entenderem sobre energia solar, kits disponíveis, economia estimada e agendar vistorias técnicas.
Seja profissional, amigável e focado em vendas. Use o tom da marca System Solar.
Para informações sobre kits, use a ferramenta 'queryKits'.
Ao agendar uma vistoria, use 'scheduleSurvey' passando os dados do cliente.
Se o cliente perguntar sobre economia, peça o consumo médio mensal dele em kWh e explique que a economia pode chegar a 95% na conta de luz.`,
      tools: [{ functionDeclarations: [queryKitsDeclaration, scheduleSurveyDeclaration] }],
    },
    // We don't use chats.create yet to be safer with tool responses in this turn
    // but the system instruction and tools are passed directly
  });

  if (response.functionCalls) {
    const call = response.functionCalls[0];
    let result;

    if (call.name === "queryKits") {
      const kits = await getCollectionData<Kit>('kits');
      const searchTerm = (call.args as any).searchTerm?.toLowerCase() || '';
      const filtered = kits.filter((k: Kit) => 
        k.name.toLowerCase().includes(searchTerm) || 
        (k.description || '').toLowerCase().includes(searchTerm) ||
        (k.panelBrand || '').toLowerCase().includes(searchTerm) ||
        (k.inverterBrand || '').toLowerCase().includes(searchTerm)
      ).slice(0, 5);
      
      result = { kits: filtered.map(k => ({ name: k.name, power: k.power, price: k.price })) };
    } else if (call.name === "scheduleSurvey") {
      const args = call.args as any;
      const leadData: Omit<Lead, 'id'> = {
        name: args.name,
        email: args.email,
        phone: args.phone,
        whatsapp: args.phone,
        address: args.address,
        status: 'new',
        createdAt: new Date().toISOString(),
        systemSize: '0',
        value: '0'
      };
      await createDocument('leads', leadData);
      result = { success: true, message: "Vistoria agendada com sucesso. Um consultor entrará em contato." };
    }

    const secondResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ functionCall: call }] },
        { role: 'user', parts: [{ functionResponse: { name: call.name, response: result } }] }
      ]
    });
    return secondResponse.text;
  }

  return response.text;
}
