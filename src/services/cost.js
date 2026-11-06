import defaultPrices from '../data/prices.json';
import diseasesData from '../data/diseases.json';
import { getCustomPrices, saveCustomPrice, resetCustomPrices } from './db';

/**
 * Calculates solution costs for a specific disease and acreage
 */
export async function calculateTreatmentCosts(diseaseId, acres = 1) {
  const disease = diseasesData.find(d => d.id === diseaseId);
  if (!disease || !disease.solutions) {
    return [];
  }

  const customPrices = await getCustomPrices();
  const safeAcres = Math.max(0.1, Number(acres) || 1);

  const results = disease.solutions.map(sol => {
    // Resolve price configuration: custom price takes precedence over default
    const custom = customPrices[sol.id];
    const fallback = defaultPrices[sol.id] || {
      unit: 'unit',
      pricePerUnit: 250,
      unitsPerAcre: 1.0
    };

    const pricePerUnit = custom?.pricePerUnit !== undefined ? Number(custom.pricePerUnit) : fallback.pricePerUnit;
    const unitsPerAcre = custom?.unitsPerAcre !== undefined ? Number(custom.unitsPerAcre) : fallback.unitsPerAcre;
    const unit = custom?.unit || fallback.unit || 'unit';

    const costPerAcre = pricePerUnit * unitsPerAcre;
    const totalCost = costPerAcre * safeAcres;
    
    // Value metric: effectiveness points per rupee
    // Multiply by 1000 for readable floating comparison
    const valueRatio = totalCost > 0 ? (sol.effectiveness / totalCost) * 1000 : 0;

    return {
      ...sol,
      unit,
      pricePerUnit,
      unitsPerAcre,
      costPerAcre: Math.round(costPerAcre),
      totalCost: Math.round(totalCost),
      valueRatio,
      isCustomPrice: !!custom
    };
  });

  // Identify the highest value item
  let bestValueId = null;
  let maxRatio = -1;
  results.forEach(item => {
    if (item.valueRatio > maxRatio) {
      maxRatio = item.valueRatio;
      bestValueId = item.id;
    }
  });

  return results.map(item => ({
    ...item,
    isBestValue: item.id === bestValueId && results.length > 1
  }));
}

/**
 * Sorts solutions by specified mode:
 * 'cheapest' | 'effective' | 'value'
 */
export function sortSolutions(solutions, mode = 'cheapest') {
  const copy = [...solutions];
  switch (mode) {
    case 'effective':
      return copy.sort((a, b) => b.effectiveness - a.effectiveness || a.totalCost - b.totalCost);
    case 'value':
      return copy.sort((a, b) => b.valueRatio - a.valueRatio || a.totalCost - b.totalCost);
    case 'cheapest':
    default:
      return copy.sort((a, b) => a.totalCost - b.totalCost || b.effectiveness - a.effectiveness);
  }
}

export { defaultPrices, getCustomPrices, saveCustomPrice, resetCustomPrices };
