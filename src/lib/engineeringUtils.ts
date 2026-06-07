export interface CCAValidationResult {
  isValid: boolean;
  ratio: number;
  dcPowerKw: number;
  message: string;
  suggestedInverterPowerKw?: number;
  referenceLinks: string[];
}

/**
 * Valida a relação CC/CA (Oversizing) de um sistema fotovoltaico
 * de acordo com a norma brasileira (PRODIST Módulo 3 / NBR 16149).
 * Faixa normativa: 1,0 a 1,3.
 * 
 * @param panelQuantity Quantidade de módulos solares (unidades)
 * @param panelPowerWp Potência unitária do módulo em Watt-pico (Wp)
 * @param inverterPowerKw Potência nominal CA do inversor em Quilowatts (kW)
 * @returns CCAValidationResult contendo o status da avaliação e sugestões.
 */
export function validarRelacaoCCCA(
  quantidade_modulos: number, 
  potencia_modulo_Wp: number, 
  potencia_inversor_kW: number
): CCAValidationResult {
  // Normas da ANEEL referenciadas:
  // - PRODIST Módulo 3: https://antigo.aneel.gov.br/documents/656827/14866908/Modulo3_Revisao_11
  // - Nota Técnica 0088/2021: https://antigo.aneel.gov.br/documents/656827/15218406/Nota+T%C3%A9cnica+0088_2021
  const referenceLinks = [
    "https://antigo.aneel.gov.br/documents/656827/14866908/Modulo3_Revisao_11",
    "https://antigo.aneel.gov.br/documents/656827/15218406/Nota+T%C3%A9cnica+0088_2021"
  ];

  if (!quantidade_modulos || !potencia_modulo_Wp || !potencia_inversor_kW || potencia_inversor_kW <= 0) {
    return {
      isValid: false,
      ratio: 0,
      dcPowerKw: 0,
      message: "Dados de entrada incompletos para validação técnica.",
      referenceLinks
    };
  }

  const dcPowerKw = (quantidade_modulos * potencia_modulo_Wp) / 1000;
  const ratio = dcPowerKw / potencia_inversor_kW;
  
  if (ratio >= 1.0 && ratio <= 1.3) {
    return {
      isValid: true,
      ratio,
      dcPowerKw,
      message: "PROPOSTA VÁLIDA",
      referenceLinks
    };
  }

  const suggestedInverterPowerKw = dcPowerKw / 1.15;
  
  let explanation = "";
  if (ratio < 1.0) {
    explanation = "inversor superdimensionado (perda de eficiência em baixa irradiação)";
  } else {
    explanation = "inversor subdimensionado (clipping excessivo + veto normativo)";
  }

  return {
    isValid: false,
    ratio,
    dcPowerKw,
    message: `PROPOSTA INVÁLIDA: Relação CC/CA de ${ratio.toFixed(2)} (${explanation}). A faixa permitida é de 1.0 a 1.3.`,
    suggestedInverterPowerKw,
    referenceLinks
  };
}
