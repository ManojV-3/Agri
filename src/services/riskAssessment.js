/**
 * Village-Level Agricultural Risk Assessment and Economic Rupee Loss Calculator
 * Uses agronomic loss models from loss_config.json, costs from costs.json,
 * and live/offline weather parameters from weather.js.
 */

import lossConfig from '../data/loss_config.json';
import costsConfig from '../data/costs.json';
import outbreaksData from '../data/outbreaks.json';
import { getVillageWeather, calculateDiseaseWeatherSuitability } from './weather';

/**
 * Calculates geographic distance in kilometers using the Haversine formula
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds the nearest regional outbreak hotspot for a given village
 */
export function findNearestHotspot(village) {
  let nearest = null;
  let minDistance = Infinity;

  outbreaksData.forEach((outbreak) => {
    const dist = getDistanceKm(village.lat, village.lng, outbreak.lat, outbreak.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = { ...outbreak, distanceKm: dist };
    }
  });

  return nearest;
}

/**
 * Evaluates comprehensive risk level for a village:
 * Returns: { riskScore, riskLevel, reasonsEn, reasonsKn, weather, nearestHotspot }
 */
export async function evaluateVillageRisk(village, diseaseOverride = null) {
  const nearestHotspot = findNearestHotspot(village);
  const primaryDisease = diseaseOverride || village.primaryDiseaseRisk || 'tomato_late_blight';
  const weather = await getVillageWeather(village.lat, village.lng, village.id);
  const weatherSuitability = calculateDiseaseWeatherSuitability(primaryDisease, weather);

  // 1. Proximity score to confirmed cases (0 to 35 points)
  const cases15km = village.recentConfirmedCases15km || 0;
  let casesScore = Math.min(35, cases15km * 3.8);
  if (village.recentCasesSeverity === 'high') casesScore *= 1.25;

  // 2. Proximity to nearest regional hotspot (0 to 30 points)
  const hotspotDist = nearestHotspot ? nearestHotspot.distanceKm : 999;
  let hotspotScore = 0;
  if (hotspotDist <= 15) {
    hotspotScore = 30;
  } else if (hotspotDist <= 35) {
    hotspotScore = Math.max(8, 30 - (hotspotDist - 15) * 1.1);
  } else if (hotspotDist <= 60) {
    hotspotScore = Math.max(3, 15 - (hotspotDist - 35) * 0.4);
  }

  // 3. Weather suitability factor (0 to 35 points)
  const weatherScore = Math.round(weatherSuitability * 35);

  // Total raw score (0 - 100)
  const rawScore = Math.min(100, Math.round(casesScore + hotspotScore + weatherScore));

  // Categorize risk level
  let riskLevel = 'Low';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let hexColor = '#10B981';

  if (rawScore >= 78) {
    riskLevel = 'Critical';
    badgeColor = 'bg-red-100 text-red-900 border-red-400';
    hexColor = '#DC2626';
  } else if (rawScore >= 52) {
    riskLevel = 'High';
    badgeColor = 'bg-orange-100 text-orange-900 border-orange-300';
    hexColor = '#EA580C';
  } else if (rawScore >= 28) {
    riskLevel = 'Medium';
    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    hexColor = '#D97706';
  }

  // Plain-language reasons in English & Kannada
  const reasonsEn = [];
  const reasonsKn = [];

  if (cases15km > 0) {
    reasonsEn.push(`${cases15km} confirmed infection cases reported within 15 km radius (${village.recentCasesSeverity} severity).`);
    reasonsKn.push(`೧೫ ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ${cases15km} ದೃಢಪಟ್ಟ ರೋಗ ಪ್ರಕರಣಗಳು ವರದಿಯಾಗಿವೆ (${village.recentCasesSeverity === 'high' ? 'ತೀವ್ರ' : 'ಮಧ್ಯಮ'} ಗಂಭೀರತೆ).`);
  } else {
    reasonsEn.push(`No active confirmed infections within immediate 15 km border.`);
    reasonsKn.push(`೧೫ ಕಿ.ಮೀ ಗಡಿ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ರೋಗ ಪ್ರಕರಣಗಳಿಲ್ಲ.`);
  }

  if (nearestHotspot) {
    reasonsEn.push(`Nearest active disease epicenter: ${nearestHotspot.district} (${nearestHotspot.distanceKm} km away).`);
    reasonsKn.push(`ಹತ್ತಿರದ ರೋಗ ಕೇಂದ್ರ: ${nearestHotspot.districtKn} (${nearestHotspot.distanceKm} ಕಿ.ಮೀ ದೂರದಲ್ಲಿದೆ).`);
  }

  if (weather.relativeHumidity >= 75) {
    reasonsEn.push(`High ambient humidity (${weather.relativeHumidity}%) accelerates spore multiplication.`);
    reasonsKn.push(`ಹೆಚ್ಚಿನ ಆರ್ದ್ರತೆ (${weather.relativeHumidity}%) ರೋಗಾಣುಗಳ ಸಂತಾನೋತ್ಪತ್ತಿಗೆ ಪೂರಕವಾಗಿದೆ.`);
  } else {
    reasonsEn.push(`Favorable dry/moderate humidity (${weather.relativeHumidity}%) suppresses rapid mold spread.`);
    reasonsKn.push(`ಸಾಧಾರಣ ಆರ್ದ್ರತೆ (${weather.relativeHumidity}%) ಶಿಲೀಂಧ್ರ ವೇಗವಾಗಿ ಹರಡುವುದನ್ನು ತಡೆಯುತ್ತದೆ.`);
  }

  return {
    rawScore,
    riskLevel,
    badgeColor,
    hexColor,
    reasonsEn,
    reasonsKn,
    weather,
    nearestHotspot,
    cases15km
  };
}

/**
 * Calculates money figures in INR for a given crop, disease, riskLevel, and acreage
 * a) Estimated loss if untreated (₹)
 * b) Estimated loss if treated early (₹)
 * c) Estimated treatment cost (₹)
 * d) Estimated savings = (a) - (b) - (c)
 */
export function calculateVillageFinancialLoss({
  crop,
  diseaseId,
  riskLevel = 'Medium',
  acres = 1
}) {
  const cropKey = crop || 'tomato';
  const cropConfig = lossConfig.crops[cropKey] || lossConfig.crops.tomato;
  const treatmentCostData = costsConfig.treatments[diseaseId] || {
    costPerAcrePreventive: 1200,
    costPerAcreCurative: 2500,
    laborCostPerAcre: 400
  };

  const levelKey = riskLevel.toLowerCase(); // 'low', 'medium', 'high', 'critical'
  const untreatedPct = cropConfig.lossPercentUntreated[levelKey] || 40;
  const treatedPct = cropConfig.lossPercentTreatedEarly[levelKey] || 10;

  const yieldPerAcre = cropConfig.averageYieldQuintalsPerAcre;
  const pricePerQuintal = cropConfig.marketPricePerQuintalInr;

  // Gross crop expected value per acre
  const grossValuePerAcre = yieldPerAcre * pricePerQuintal;
  const totalGrossValue = grossValuePerAcre * acres;

  // a) Estimated loss if untreated
  const untreatedLossInr = Math.round(totalGrossValue * (untreatedPct / 100));

  // b) Estimated loss if treated early
  const treatedLossInr = Math.round(totalGrossValue * (treatedPct / 100));

  // c) Estimated treatment cost (preventive/curative depending on risk severity)
  const costPerAcre = levelKey === 'critical' || levelKey === 'high'
    ? treatmentCostData.costPerAcreCurative
    : treatmentCostData.costPerAcrePreventive;
  const treatmentCostInr = Math.round(costPerAcre * acres);

  // d) Estimated savings = (a) - (b) - (c)
  const savingsInr = Math.max(0, untreatedLossInr - treatedLossInr - treatmentCostInr);

  return {
    acres,
    grossValuePerAcre,
    totalGrossValue,
    untreatedLossInr,
    untreatedPct,
    treatedLossInr,
    treatedPct,
    treatmentCostInr,
    costPerAcre,
    savingsInr,
    yieldPerAcre,
    pricePerQuintal,
    lastUpdated: lossConfig.last_updated,
    disclaimer: lossConfig._disclaimer
  };
}
