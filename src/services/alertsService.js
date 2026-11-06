/**
 * Village-Level Farmer Early Warning Alert Service
 * Generates actionable, bilingual alerts with 3-5 step preventive plans,
 * cost ranges from costs.json, WhatsApp share text, and voice playback.
 */

import villagesData from '../data/villages.json';
import costsConfig from '../data/costs.json';
import diseasesData from '../data/diseases.json';
import { evaluateVillageRisk, getDistanceKm } from './riskAssessment';
import { playAudio, playChime, stopAudio } from './voice';

// 3 to 5 step preventive agronomic protocols per disease
export const PREVENTIVE_PROTOCOLS = {
  tomato_late_blight: {
    stepsEn: [
      "Inspect plants daily in early morning for dark water-soaked leaf spots and white fungal mold under leaves.",
      "Prune and destroy infected lower leaves immediately; do not leave diseased foliage on the ground.",
      "Avoid overhead sprinkler watering; irrigate strictly at the soil base to keep foliage dry.",
      "Apply protective barrier spray: Mancozeb 75 WP (2.5 g/L) or Copper Oxychloride 50 WP (2.5 g/L).",
      "Establish a 50-meter buffer spray boundary around healthy tomato plots to prevent airborne spore arrival."
    ],
    stepsKn: [
      "ಪ್ರತಿದಿನ ಮುಂಜಾನೆ ಎಲೆಗಳ ಕೆಳಭಾಗದಲ್ಲಿ ಕಪ್ಪು ಅಥವಾ ನೀರಿನ ಕಲೆಗಳಿವೆಯೇ ಎಂದು ಎಚ್ಚರಿಕೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
      "ರೋಗಪೀಡಿತ ಕೆಳಭಾಗದ ಎಲೆಗಳನ್ನು ಕಿತ್ತು ತಕ್ಷಣ ಸುಟ್ಟುಹಾಕಿ ಅಥವಾ ಮಣ್ಣಿನಲ್ಲಿ ಆಳವಾಗಿ ಹೂತುಹಾಕಿ.",
      "ಎಲೆಗಳ ಮೇಲೆ ನೀರು ಬೀಳುವ ಸ್ಪ್ರಿಂಕ್ಲರ್ ನಿಲ್ಲಿಸಿ; ಕೇವಲ ಗಿಡದ ಬುಡಕ್ಕೆ ಮಾತ್ರ ನೀರು ಹಾಯಿಸಿ.",
      "ಮುಂಜಾಗ್ರತಾ ರಕ್ಷಣಾತ್ಮಕ ಸಿಂಪರಣೆ: ಮ್ಯಾಂಕೋಜೆಬ್ 75 WP (2.5 ಗ್ರಾಂ/ಲೀ) ಅಥವಾ ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ (2.5 ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ.",
      "ಗಾಳಿಯ ಮೂಲಕ ರೋಗ ಹರಡದಂತೆ ಆರೋಗ್ಯಕರ ಬೆಳೆಯ ಸುತ್ತಲೂ ೫೦ ಮೀಟರ್ ಬಫರ್ ರಕ್ಷಣಾ ಸಿಂಪರಣೆ ಮಾಡಿ."
    ]
  },
  tomato_early_blight: {
    stepsEn: [
      "Scout lower leaves for concentric brown rings (bullseye spots) and yellowing margins.",
      "Remove diseased bottom leaves up to 12 inches from the soil surface to improve air circulation.",
      "Apply organic mulch around tomato bases to prevent soil-borne fungal spores splashing onto leaves.",
      "Spray prophylactic bio-fungicide: Neem oil (3 ml/L) mixed with Copper Oxychloride 50 WP (2 g/L).",
      "Avoid high nitrogen fertilizers which produce excessive dense foliage susceptible to blight."
    ],
    stepsKn: [
      "ಕೆಳ ಎಲೆಗಳಲ್ಲಿ ಚಕ್ರದಂತಹ ಕಂದು ಕಲೆಗಳು (ಬುಲ್ಸ್‌ಐ) ಇವೆಯೇ ಎಂದು ಪರೀಕ್ಷಿಸಿ.",
      "ಗಾಳಿಯಾಡಲು ಅನುಕೂಲವಾಗುವಂತೆ ನೆಲದಿಂದ ೧ ಅಡಿ ಎತ್ತರದವರೆಗಿನ ಕೆಳ ಎಲೆಗಳನ್ನು ಸವರಿ ಸ್ವಚ್ಛಗೊಳಿಸಿ.",
      "ಮಣ್ಣಿನಲ್ಲಿರುವ ರೋಗಾಣುಗಳು ಎಲೆಗಳಿಗೆ ಚಿಮ್ಮದಂತೆ ಗಿಡಗಳ ಬುಡಕ್ಕೆ ಸಾವಯವ ರವದೆ (ಹೊದಿಕೆ) ಹಾಕಿ.",
      "ರಕ್ಷಣಾತ್ಮಕ ಸಿಂಪರಣೆ: ಬೇವಿನ ಎಣ್ಣೆ (೩ ಮಿ.ಲೀ/ಲೀ) ಜೊತೆಗೆ ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ (೨ ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ.",
      "ಹೆಚ್ಚು ಯೂರಿಯಾ ಗೊಬ್ಬರ ಹಾಕಬೇಡಿ; ಪೊಟ್ಯಾಷ್ ಗೊಬ್ಬರ ನೀಡಿ ಗಿಡದ ರೋಗನಿರೋಧಕ ಶಕ್ತಿ ಹೆಚ್ಚಿಸಿ."
    ]
  },
  rice_blast: {
    stepsEn: [
      "Check rice leaves and collar nodes for spindle-shaped diamond lesions with grey-ash centers.",
      "Drain standing stagnant field water for 24-48 hours to expose soil and aerate plant root systems.",
      "Temporarily suspend chemical urea nitrogen top-dressing to prevent rapid fungal spore proliferation.",
      "Apply prophylactic biocontrol: Foliar spray of Pseudomonas fluorescens (5 g/L) or Tricyclazole 75 WP (0.6 g/L).",
      "Maintain bund sanitation and eradicate alternate grassy weed hosts along canal borders."
    ],
    stepsKn: [
      "ಭತ್ತದ ಎಲೆಗಳ ಮೇಲೆ ಕಣ್ಣಿನ ಆಕಾರದ (ಬೆಂಕಿ ರೋಗದ) ಕಂದು ಬಣ್ಣದ ಕಲೆಗಳಿವೆಯೇ ಎಂದು ಸೂಕ್ಷ್ಮವಾಗಿ ಗಮನಿಸಿ.",
      "ಬೇರುಗಳಿಗೆ ಗಾಳಿಯಾಡಲು ಗದ್ದೆಯಲ್ಲಿ ನಿಂತಿರುವ ಹೆಚ್ಚುವರಿ ನೀರನ್ನು ೨೪ ರಿಂದ ೪೮ ಗಂಟೆಗಳ ಕಾಲ ಬಸಿದು ಹೊರಹಾಕಿ.",
      "ತಕ್ಷಣ ಯೂರಿಯಾ ಗೊಬ್ಬರ ಹಾಕುವುದನ್ನು ನಿಲ್ಲಿಸಿ; ಯೂರಿಯಾ ರೋಗವನ್ನು ವೇಗವಾಗಿ ಹರಡುತ್ತದೆ.",
      "ರಕ್ಷಣಾತ್ಮಕ ಸಿಂಪರಣೆ: ಸೂಡೋಮೊನಾಸ್ ಫ್ಲೋರೊಸೆನ್ಸ್ (೫ ಗ್ರಾಂ/ಲೀ) ಅಥವಾ ಟ್ರೈಸೈಕ್ಲೋಜೋಲ್ 75 WP (೦.೬ ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ.",
      "ವರಂಬುಗಳ ಮೇಲಿರುವ ಕಳೆಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ ಬೆಂಕಿರೋಗದ ಶಿಲೀಂಧ್ರ ಉಳಿಯದಂತೆ ನಿಗಾ ವಹಿಸಿ."
    ]
  },
  potato_early_blight: {
    stepsEn: [
      "Inspect older foliage for dark brown circular lesions and yellow halos.",
      "Avoid handling or cultivating potato foliage while wet from morning dew or recent rain.",
      "Ensure proper furrow drainage to eliminate standing moisture pools between ridges.",
      "Apply protective fungicide spray: Chlorothalonil 75 WP (2 g/L) or Mancozeb (2.5 g/L).",
      "Destroy and discard any cull potato tubers left near field margins."
    ],
    stepsKn: [
      "ಹಳೆಯ ಎಲೆಗಳ ಮೇಲೆ ಕಪ್ಪು ಕಂದು ಬಣ್ಣದ ದುಂಡಗಿನ ಕಲೆಗಳು ಮತ್ತು ಹಳದಿ ಅಂಚುಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ.",
      "ಮುಂಜಾನೆಯ ಇಬ್ಬನಿ ಅಥವಾ ಮಳೆಯಿಂದ ಎಲೆಗಳು ಒದ್ದೆಯಾಗಿದ್ದಾಗ ಹೊಲದಲ್ಲಿ ಕೆಲಸ ಮಾಡಬೇಡಿ.",
      "ಬಾತಿಗಳ ಮಧ್ಯೆ ನೀರು ನಿಲ್ಲದಂತೆ ಕಾಲುವೆಗಳನ್ನು ಸರಿಪಡಿಸಿ ತೇವಾಂಶ ನಿಯಂತ್ರಿಸಿ.",
      "ರಕ್ಷಣಾತ್ಮಕ ಸಿಂಪರಣೆ: ಕ್ಲೋರೋಥಲೋನಿಲ್ 75 WP (೨ ಗ್ರಾಂ/ಲೀ) ಅಥವಾ ಮ್ಯಾಂಕೋಜೆಬ್ (೨.೫ ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ.",
      "ಹೊಲದ ಬದಿಗಳಲ್ಲಿ ಬಿದ್ದಿರುವ ಕೊಳೆತ ಆಲೂಗಡ್ಡೆಗಳನ್ನು ತಕ್ಷಣ ವಿಲೇವಾರಿ ಮಾಡಿ."
    ]
  },
  maize_fall_armyworm: {
    stepsEn: [
      "Inspect maize whorls for pinhole feeding punctures and sawdust-like larval droppings (frass).",
      "Install pheromone traps (5 traps per acre) at crop canopy height for early adult moth surveillance.",
      "Apply fine sand mixed with neem seed powder (9:1 ratio) directly inside the leaf whorl cups.",
      "Spray whorl spray: Emamectin benzoate 5 SG (0.4 g/L) or Bacillus thuringiensis (Bt) (2 g/L).",
      "Intercrop with legumes or cowpea to attract beneficial predator insects."
    ],
    stepsKn: [
      "ಮೆಕ್ಕೆಜೋಳದ ಸುಳಿಯಲ್ಲಿ ಸಣ್ಣ ರಂಧ್ರಗಳು ಮತ್ತು ಮರದ ಪುಡಿಯಂತಹ ಹುಳುವಿನ ಹಿಕ್ಕೆ ಇವೆಯೇ ಎಂದು ನೋಡಿ.",
      "ಪ್ರತಿ ಎಕರೆಗೆ ೫ ಮೋಹಕ ಬಲೆಗಳನ್ನು (ಫೆರಮೋನ್ ಟ್ರ್ಯಾಪ್) ಬೆಳೆಯ ಎತ್ತರಕ್ಕೆ ಅಳವಡಿಸಿ ಪತಂಗಗಳ ನಿಗಾ ಇರಿಸಿ.",
      "ಬೇವಿನ ಹಿಂಡಿ ಮತ್ತು ಮರಳಿನ ಮಿಶ್ರಣವನ್ನು (೧:೯) ಗಿಡಗಳ ಸುಳಿಗೆ ಕೈಯಿಂದ ಉದುರಿಸಿ ಹುಳು ನಿಯಂತ್ರಿಸಿ.",
      "ಸುಳಿ ಸಿಂಪರಣೆ: ಎಮಾಮೆಕ್ಟಿನ್ ಬೆಂಜೊಯೆಟ್ 5 SG (೦.೪ ಗ್ರಾಂ/ಲೀ) ಅಥವಾ ಬ್ಯಾಸಿಲಸ್ ತುರಿಂಜಿಯೆನ್ಸಿಸ್ (೨ ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ.",
      "ಮಿಶ್ರ ಬೆಳೆಯಾಗಿ ಅಲಸಂದಿ ಬೆಳೆಸಿ ಮಿತ್ರ ಕೀಟಗಳನ್ನು ಆಕರ್ಷಿಸಿ."
    ]
  },
  chilli_leaf_curl: {
    stepsEn: [
      "Inspect terminal shoots and underside of leaves for upward leaf curling and whiteflies / thrips.",
      "Install yellow and blue sticky cards (20 sheets per acre) to trap flying insect vectors.",
      "Uproot and bury severely stunted viral infected chilli bushes in airtight bags.",
      "Spray organic vector deterrent: 5% Neem Seed Kernel Extract (NSKE) or Neem oil (3 ml/L).",
      "Apply targeted vector wash: Diafenthiuron 50 WP (1.2 g/L) during early morning hours."
    ],
    stepsKn: [
      "ಎಳೆಯ ಕುಡಿಗಳಲ್ಲಿ ಎಲೆಗಳು ಮೇಲ್ಮುಖವಾಗಿ ಸುರುಟಿಕೊಂಡಿವೆಯೇ ಮತ್ತು ಬಿಳಿನೊಣ/ನುಸಿ ಇವೆಯೇ ಎಂದು ಪರೀಕ್ಷಿಸಿ.",
      "ಕೀಟಗಳನ್ನು ಆಕರ್ಷಿಸಿ ಹಿಡಿಯಲು ಎಕರೆಗೆ ೨೦ ಹಳದಿ ಮತ್ತು ನೀಲಿ ಜಿಗುಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ.",
      "ತೀವ್ರವಾಗಿ ಮುರುಟಿದ ಗಿಡಗಳನ್ನು ತಕ್ಷಣ ಕಿತ್ತು ಪ್ಲಾಸ್ಟಿಕ್ ಚೀಲದಲ್ಲಿ ಹಾಕಿ ಆಳವಾಗಿ ಹೂತುಹಾಕಿ.",
      "ಬೇವಿನ ಕಷಾಯ ಅಥವಾ ಬೇವಿನ ಎಣ್ಣೆ (೩ ಮಿ.ಲೀ/ಲೀಟರ್) ಸಿಂಪಡಿಸಿ ರಸಹೀರುವ ಕೀಟಗಳನ್ನು ದೂರವಿಡಿ.",
      "ಮುಂಜಾನೆ ವೇಳೆಯಲ್ಲಿ ಡಯಾಫೆಂಥಿಯುರಾನ್ 50 WP (೧.೨ ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ ನುಸಿ ನಿಯಂತ್ರಿಸಿ."
    ]
  }
};

/**
 * Generates alert for a given village
 */
export async function getVillageAlert(village, farmerAcres = 2.5) {
  const risk = await evaluateVillageRisk(village);
  const primaryDisease = village.primaryDiseaseRisk || 'tomato_late_blight';
  const diseaseMeta = diseasesData.find((d) => d.id === primaryDisease) || {
    name: { en: 'Crop Disease', kn: 'ಬೆಳೆ ರೋಗ' }
  };
  const costMeta = costsConfig.treatments[primaryDisease] || {
    costPerAcrePreventive: 1250,
    costPerAcreCurative: 2500
  };

  const isHighOrCritical = risk.riskLevel === 'High' || risk.riskLevel === 'Critical';
  const dist = risk.nearestHotspot ? risk.nearestHotspot.distanceKm : 12;

  const costLow = costMeta.costPerAcrePreventive;
  const costHigh = Math.round(costLow * 1.3);
  const farmerCostLow = Math.round(costLow * farmerAcres);
  const farmerCostHigh = Math.round(costHigh * farmerAcres);

  const protocol = PREVENTIVE_PROTOCOLS[primaryDisease] || PREVENTIVE_PROTOCOLS.tomato_late_blight;

  return {
    villageId: village.id,
    villageName: village.name,
    villageNameKn: village.nameKn,
    district: village.district,
    districtKn: village.districtKn,
    state: village.state,
    stateKn: village.stateKn,
    riskLevel: risk.riskLevel,
    isHighOrCritical,
    badgeColor: risk.badgeColor,
    diseaseId: primaryDisease,
    diseaseNameEn: diseaseMeta.name.en,
    diseaseNameKn: diseaseMeta.name.kn,
    distanceKm: dist,
    cases15km: village.recentConfirmedCases15km,
    reasonsEn: risk.reasonsEn,
    reasonsKn: risk.reasonsKn,
    stepsEn: protocol.stepsEn,
    stepsKn: protocol.stepsKn,
    costPerAcreText: `₹${costLow.toLocaleString('en-IN')} - ₹${costHigh.toLocaleString('en-IN')}`,
    farmerTotalCostText: `₹${farmerCostLow.toLocaleString('en-IN')} - ₹${farmerCostHigh.toLocaleString('en-IN')}`,
    kisanCallCentre: '1800-180-1551',
    disclaimerEn: 'Consult your local agriculture officer before applying any chemical.',
    disclaimerKn: 'ಯಾವುದೇ ರಾಸಾಯನಿಕ ಸಿಂಪಡಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.'
  };
}

/**
 * Builds a clean, formatted plain text message for WhatsApp sharing
 */
export function buildWhatsAppShareText(alert, lang = 'en', farmerAcres = 2.5) {
  const isKn = lang === 'kn';
  const village = isKn ? alert.villageNameKn : alert.villageName;
  const district = isKn ? alert.districtKn : alert.district;
  const disease = isKn ? alert.diseaseNameKn : alert.diseaseNameEn;
  const steps = isKn ? alert.stepsKn : alert.stepsEn;

  if (isKn) {
    return `🚨 *ಕೃಷಿ ಮುನ್ನೆಚ್ಚರಿಕೆ ಸಂದೇಶ - ${village} (${district})*

⚠️ *ರೋಗ ಬಾಧೆ:* ${disease}
📍 *ದೂರ:* ರೋಗ ಕೇಂದ್ರದಿಂದ ${alert.distanceKm} ಕಿ.ಮೀ ದೂರದಲ್ಲಿದೆ.
🔴 *ಅಪಾಯ ಮಟ್ಟ:* ${alert.riskLevel} (${alert.cases15km} ಸಕ್ರಿಯ ಪ್ರಕರಣಗಳು ೧೫ ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ).

📋 *ಮುಂದಿನ ೩ ದಿನಗಳಲ್ಲಿ ಮಾಡಬೇಕಾದ ಕ್ರಮಗಳು:*
${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

💰 *ಅಂದಾಜು ಮುಂಜಾಗ್ರತಾ ವೆಚ್ಚ:*
• ಎಕರೆಗೆ: ${alert.costPerAcreText}
• ನಿಮ್ಮ ${farmerAcres} ಎಕರೆಗೆ: ${alert.farmerTotalCostText}

📞 *ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್ ಸಹಾಯವಾಣಿ:* 1800-180-1551 (ಉಚಿತ ಕರೆ)
ℹ️ *ಸೂಚನೆ:* ಯಾವುದೇ ರಾಸಾಯನಿಕ ಸಿಂಪಡಿಸುವ ಮೊದಲು ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.
_ಕ್ರಾಪ್ ಕೇರ್ ಕೃಷಿ ಮುನ್ನೆಚ್ಚರಿಕೆ ವ್ಯವಸ್ಥೆ_`;
  }

  return `🚨 *KRISHI EARLY WARNING ALERT - ${village} (${district})*

⚠️ *Threat:* ${disease}
📍 *Distance:* ${alert.distanceKm} km from active disease epicenter
🔴 *Risk Level:* ${alert.riskLevel} (${alert.cases15km} confirmed cases within 15 km)

📋 *Action Plan for the Next 3 Days:*
${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

💰 *Estimated Preventive Treatment Cost:*
• Per Acre: ${alert.costPerAcreText}
• For your ${farmerAcres} acres: ${alert.farmerTotalCostText}

📞 *Kisan Call Centre Helpline:* 1800-180-1551 (Toll-Free)
ℹ️ *Disclaimer:* Consult your local agriculture officer before applying any chemical.
_Krishi Early Warning Advisory_`;
}

/**
 * Reads the alert out loud using Web SpeechSynthesis
 */
export function speakAlertOutLoud(alert, lang = 'en', onDone = () => {}) {
  stopAudio();
  playChime('listen');

  const isKn = lang === 'kn';
  const village = isKn ? alert.villageNameKn : alert.villageName;
  const disease = isKn ? alert.diseaseNameKn : alert.diseaseNameEn;
  const stepOne = isKn ? alert.stepsKn[0] : alert.stepsEn[0];
  const stepFour = isKn ? alert.stepsKn[3] : alert.stepsEn[3];

  const speechText = isKn
    ? `ಎಚ್ಚರಿಕೆ! ${village} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ${disease} ರೋಗ ಹರಡುವ ಸಾಧ್ಯತೆ ಹೆಚ್ಚಿದೆ. ರೋಗ ಕೇಂದ್ರದಿಂದ ${alert.distanceKm} ಕಿಲೋಮೀಟರ್ ದೂರದಲ್ಲಿದೆ. ಮೊದಲ ಕ್ರಮ: ${stepOne}. ನಾಲ್ಕನೇ ಕ್ರಮ: ${stepFour}. ಎಕರೆಗೆ ಅಂದಾಜು ವೆಚ್ಚ: ${alert.costPerAcreText}. ಸಹಾಯಕ್ಕಾಗಿ 1800-180-1551 ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್‌ಗೆ ಕರೆ ಮಾಡಿ.`
    : `Warning! High risk of ${disease} spreading near ${village}. Active epicenter is ${alert.distanceKm} kilometers away. Step one: ${stepOne}. Recommended action: ${stepFour}. Estimated cost is ${alert.costPerAcreText} per acre. For free advice, call Kisan Call Centre at 1800-180-1551.`;

  playAudio('village_alert', speechText, lang);
  setTimeout(onDone, 9000);
}
