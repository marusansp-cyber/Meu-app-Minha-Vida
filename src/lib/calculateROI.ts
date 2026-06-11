export function calculateROI(
  monthlyConsumptionKWh: number, 
  projectValue: number, 
  tensaoFornecimento: 'Monofásico' | 'Bifásico' | 'Trifásico' | string = 'Bifásico',
  energyTariff: number = 0.95,
  monthlyGeneration: number = 0
) {
  if (projectValue <= 0 || monthlyConsumptionKWh <= 0 || monthlyGeneration <= 0) {
    return { paybackMonths: 0, paybackYears: '0.0', monthlySavings: 0, annualSavings: 0, roiPercentage: '0%', totalSavings25Years: 0 };
  }

  const taxaKwh = tensaoFornecimento === 'Monofásico' ? 30 : tensaoFornecimento === 'Bifásico' ? 50 : 100;
  const taxaMinimaVal = taxaKwh * energyTariff;
  
  const generatedEconomy = Math.min(monthlyGeneration, monthlyConsumptionKWh) * energyTariff;
  const currentBill = monthlyConsumptionKWh * energyTariff;
  const remainingBill = Math.max(taxaMinimaVal, currentBill - generatedEconomy);
  const monthlySavings = currentBill - remainingBill;
  const annualSavings = monthlySavings * 12;
  
  const paybackYears = annualSavings > 0 ? (projectValue / annualSavings).toFixed(1) : '0';

  let totalSavings25 = 0;
  const degradacaoLinearAnual = 0.005; // 0.5%
  const reajusteTarifarioAnual = 0.05; // 5%
  const inflacaoEstimadaBr = 0.04;
  let currentTariff = energyTariff;

  for (let year = 1; year <= 25; year++) {
    const genYear = monthlyGeneration * 12 * Math.pow(1 - degradacaoLinearAnual, year - 1);
    const valYear = Math.min(genYear, monthlyConsumptionKWh * 12) * currentTariff;
    let netYearSavings = valYear - (taxaKwh * 12 * currentTariff);
    if (netYearSavings < 0) netYearSavings = 0;
    
    if (year === 13) {
      netYearSavings -= (projectValue * 0.15) * Math.pow(1 + inflacaoEstimadaBr, year-1);
    }
    
    totalSavings25 += netYearSavings;
    currentTariff *= (1 + reajusteTarifarioAnual);
  }
  
  const roiPercentage = `${(((totalSavings25 - projectValue) / projectValue) * 100).toFixed(0)}%`;

  return {
    paybackMonths: annualSavings > 0 ? (projectValue / monthlySavings) : 0,
    paybackYears,
    monthlySavings,
    annualSavings,
    roiPercentage,
    totalSavings25Years: parseFloat(totalSavings25.toFixed(2))
  };
}
