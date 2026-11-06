/**
 * Deterministic Rule-Based Agricultural Spread Simulation Engine
 * Uses spread_config.json, village coordinates, and live/offline Open-Meteo weather.
 */

import spreadConfig from '../data/spread_config.json';
import villagesData from '../data/villages.json';
import outbreaksData from '../data/outbreaks.json';
import { getDistanceKm, findNearestHotspot } from './riskAssessment';
import { getVillageWeather, calculateDiseaseWeatherSuitability } from './weather';

/**
 * Calculates bearing angle between two geographic coordinates
 */
function getBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Calculates simulated forecast for a single village on a given day (0 to 7)
 */
export async function simulateVillageForecast(village, diseaseId, day = 0) {
  const weather = await getVillageWeather(village.lat, village.lng, village.id);
  const nearestHotspot = findNearestHotspot(village);
  const dist = nearestHotspot ? nearestHotspot.distanceKm : 99;

  // Disease dispersion parameters
  const multObj = spreadConfig.disease_dispersion_multipliers[diseaseId] || {
    rateMultiplier: 1.15
  };
  const dispersionRate = multObj.rateMultiplier;

  // Weather suitability factor (0.3 to 1.0)
  const weatherSuitability = calculateDiseaseWeatherSuitability(diseaseId, weather);

  // Wind factor: evaluate if village is downwind of the nearest outbreak
  let windFactor = 1.0;
  if (nearestHotspot && weather.windDirection) {
    const bearingFromHotspot = getBearing(nearestHotspot.lat, nearestHotspot.lng, village.lat, village.lng);
    const angleDiff = Math.abs((bearingFromHotspot - weather.windDirection + 180) % 360 - 180);
    if (angleDiff < 55) {
      windFactor = spreadConfig.simulation_constants.wind_drift_bonus; // Wind pushes spores towards village
    }
  }

  // Base proximity score (Day 0)
  const initialCasesScore = Math.min(35, (village.recentConfirmedCases15km || 0) * 4);
  const initialHotspotScore = dist <= 15 ? 30 : Math.max(0, 30 - (dist - 15) * 0.9);
  const initialWeatherScore = Math.round(weatherSuitability * 30);
  const baseScore = Math.min(85, initialCasesScore + initialHotspotScore + initialWeatherScore);

  // Daily incremental score progression (deterministic)
  const dailyProgression = Math.round(
    day * (weatherSuitability * dispersionRate * 5.8 * windFactor)
  );

  const finalScore = Math.min(100, Math.max(5, baseScore + dailyProgression));

  // Thresholds mapping
  const thresholds = spreadConfig.risk_score_thresholds;
  let riskLevel = 'Low';
  let hexColor = '#10B981';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (finalScore >= thresholds.critical_min) {
    riskLevel = 'Critical';
    hexColor = '#DC2626';
    badgeColor = 'bg-red-100 text-red-900 border-red-400';
  } else if (finalScore > thresholds.medium_max) {
    riskLevel = 'High';
    hexColor = '#EA580C';
    badgeColor = 'bg-orange-100 text-orange-900 border-orange-300';
  } else if (finalScore > thresholds.low_max) {
    riskLevel = 'Medium';
    hexColor = '#D97706';
    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
  }

  // Daily caption explaining key reason
  let captionEn = '';
  let captionKn = '';

  if (day === 0) {
    captionEn = `Current baseline: ${village.recentConfirmedCases15km || 0} active cases within 15 km. Ambient humidity is ${weather.relativeHumidity}%.`;
    captionKn = `ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ: ೧೫ ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ${village.recentConfirmedCases15km || 0} ಸಕ್ರಿಯ ಪ್ರಕರಣಗಳು. ಸ್ಥಳೀಯ ಆರ್ದ್ರತೆ ${weather.relativeHumidity}%.`;
  } else if (day <= 3) {
    if (weather.relativeHumidity >= 75) {
      captionEn = `Day +${day}: High relative humidity (${weather.relativeHumidity}%) and winds accelerating spore travel from ${nearestHotspot?.district || 'hotspot'}.`;
      captionKn = `ದಿನ +${day}: ಹೆಚ್ಚಿನ ಆರ್ದ್ರತೆ (${weather.relativeHumidity}%) ಮತ್ತು ಗಾಳಿಯ ದಿಕ್ಕು ರೋಗಾಣುಗಳ ಹರಡುವಿಕೆಯನ್ನು ಹೆಚ್ಚಿಸುತ್ತಿದೆ.`;
    } else {
      captionEn = `Day +${day}: Moderate weather conditions. Spores advancing slowly at ~${spreadConfig.simulation_constants.daily_spread_speed_km} km/day.`;
      captionKn = `ದಿನ +${day}: ಸಾಧಾರಣ ಹವಾಮಾನ. ರೋಗಾಣುಗಳು ದಿನಕ್ಕೆ ಅಂದಾಜು ೪.೫ ಕಿ.ಮೀ ವೇಗದಲ್ಲಿ ಹರಡುತ್ತಿವೆ.`;
    }
  } else {
    if (riskLevel === 'Critical' || riskLevel === 'High') {
      captionEn = `Day +${day}: Spore load reaches high-density threshold. Surrounding crops need emergency barrier spray.`;
      captionKn = `ದಿನ +${day}: ರೋಗದ ಸಾಂದ್ರತೆ ತೀವ್ರ ಹಂತವನ್ನು ತಲುಪಿದೆ. ತಕ್ಷಣ ರಕ್ಷಣಾತ್ಮಕ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪರಣೆ ಅಗತ್ಯ.`;
    } else {
      captionEn = `Day +${day}: Infection remains contained at ${riskLevel.toLowerCase()} risk due to favorable field ventilation.`;
      captionKn = `ದಿನ +${day}: ಸೂಕ್ತ ತೇವಾಂಶ ನಿರ್ವಹಣೆಯಿಂದಾಗಿ ರೋಗ ಬಾಧೆ ${riskLevel === 'Medium' ? 'ಮಧ್ಯಮ' : 'ಕಡಿಮೆ'} ಹಂತದಲ್ಲಿ ನಿಯಂತ್ರಣದಲ್ಲಿದೆ.`;
    }
  }

  return {
    day,
    villageId: village.id,
    villageName: village.name,
    villageNameKn: village.nameKn,
    district: village.district,
    score: finalScore,
    riskLevel,
    hexColor,
    badgeColor,
    captionEn,
    captionKn,
    weather,
    nearestHotspot,
    windFactor
  };
}

/**
 * Simulates all villages for a specific day
 */
export async function simulateAllVillagesForDay(diseaseId, day = 0) {
  const results = {};
  for (const v of villagesData.villages) {
    results[v.id] = await simulateVillageForecast(v, diseaseId, day);
  }
  return results;
}

/**
 * Returns villages that move from Low/Medium on Day 0 to High/Critical by Day 7
 */
export async function getVillagesAtRiskIn7Days(diseaseId) {
  const day0Map = await simulateAllVillagesForDay(diseaseId, 0);
  const day7Map = await simulateAllVillagesForDay(diseaseId, 7);

  const atRiskList = [];
  villagesData.villages.forEach((v) => {
    const d0 = day0Map[v.id];
    const d7 = day7Map[v.id];

    // Check if village transitions to High or Critical by Day 7
    if ((d0.riskLevel === 'Low' || d0.riskLevel === 'Medium') && (d7.riskLevel === 'High' || d7.riskLevel === 'Critical')) {
      atRiskList.push({
        village: v,
        initialRisk: d0.riskLevel,
        finalRisk: d7.riskLevel,
        finalScore: d7.score,
        reasonEn: d7.captionEn,
        reasonKn: d7.captionKn
      });
    }
  });

  return atRiskList;
}
