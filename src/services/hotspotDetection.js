/**
 * Hotspot Detection & Cluster Aggregation Engine
 *
 * Algorithm specifications:
 * 1. Groups disease cases of the same disease within 10 km (haversine) over the last 14 days.
 * 2. A location is a spreading hotspot ONLY IF:
 *    - it has 5 or more cases within 20 km in the last 7 days, OR
 *    - 3 or more cases with this week's count higher than last week's.
 * 3. Isolated cases that do not meet these criteria are filtered out (hidden).
 */

import casesData from '../data/cases.json';
import diseasesData from '../data/diseases.json';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculates geographic distance in kilometers using the Haversine formula
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Color mapping per disease for semi-transparent circles and markers
 */
export const DISEASE_COLORS = {
  tomato_late_blight: {
    stroke: '#DC2626', // Red
    fill: 'rgba(220, 38, 38, 0.35)',
    hex: '#DC2626',
    name: 'Tomato Late Blight',
    nameKn: 'ಟೊಮೇಟೊ ತಡವಾದ ಅಂಗಮಾರಿ'
  },
  tomato_early_blight: {
    stroke: '#EA580C', // Orange
    fill: 'rgba(234, 88, 12, 0.35)',
    hex: '#EA580C',
    name: 'Tomato Early Blight',
    nameKn: 'ಟೊಮೇಟೊ ಆರಂಭಿಕ ಅಂಗಮಾರಿ'
  },
  rice_blast: {
    stroke: '#D97706', // Amber / Gold
    fill: 'rgba(217, 119, 6, 0.35)',
    hex: '#D97706',
    name: 'Rice Blast',
    nameKn: 'ಭತ್ತದ ಬೆಂಕಿ ರೋಗ (ಬ್ಲಾಸ್ಟ್)'
  },
  maize_fall_armyworm: {
    stroke: '#9333EA', // Purple
    fill: 'rgba(147, 51, 234, 0.35)',
    hex: '#9333EA',
    name: 'Maize Fall Armyworm',
    nameKn: 'ಮೆಕ್ಕೆಜೋಳದ ಸೈನಿಕ ಹುಳು'
  },
  potato_early_blight: {
    stroke: '#059669', // Emerald
    fill: 'rgba(5, 150, 105, 0.35)',
    hex: '#059669',
    name: 'Potato Early Blight',
    nameKn: 'ಆಲೂಗಡ್ಡೆ ಆರಂಭಿಕ ಅಂಗಮಾರಿ'
  },
  chilli_leaf_curl: {
    stroke: '#2563EB', // Blue
    fill: 'rgba(37, 99, 235, 0.35)',
    hex: '#2563EB',
    name: 'Chilli Leaf Curl',
    nameKn: 'ಮೆಣಸಿನಕಾಯಿ ಮುರಡ ರೋಗ'
  },
  default: {
    stroke: '#E11D48', // Rose
    fill: 'rgba(225, 29, 72, 0.35)',
    hex: '#E11D48',
    name: 'Crop Disease',
    nameKn: 'ಬೆಳೆ ರೋಗ'
  }
};

/**
 * Agronomic tips per disease
 */
export const DISEASE_TIPS = {
  tomato_late_blight: {
    en: "Apply systemic barrier fungicide (Cymoxanil 8% + Mancozeb 64% WP). Prune lower diseased foliage and irrigate only at base.",
    kn: "ತಕ್ಷಣ ಸಿಸ್ಟಮಿಕ್ ಶಿಲೀಂಧ್ರನಾಶಕ (ಮ್ಯಾಂಕೋಜೆಬ್ + ಸೈಮೋಕ್ಸಾನಿಲ್) ಸಿಂಪಡಿಸಿ. ಕೆಳ ಎಲೆಗಳನ್ನು ಸವರಿ ಬುಡಕ್ಕೆ ಮಾತ್ರ ನೀರು ಹಾಯಿಸಿ."
  },
  tomato_early_blight: {
    en: "Spray Copper Oxychloride 50 WP @ 2.5g/L + Neem Oil. Apply organic straw mulch to stop spore rain splash.",
    kn: "ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ (೨.೫ ಗ್ರಾಂ/ಲೀ) ಜೊತೆಗೆ ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ. ಮಣ್ಣಿನಿಂದ ರೋಗಾಣು ಚಿಮ್ಮದಂತೆ ಹೊದಿಕೆ ಹಾಕಿ."
  },
  rice_blast: {
    en: "Drain standing water for 48 hrs. Spray Tricyclazole 75 WP (0.6g/L). Halt excessive urea nitrogen application.",
    kn: "ಗದ್ದೆಯ ನೀರನ್ನು ೪೮ ಗಂಟೆ ಬಸಿದು ಹೊರಹಾಕಿ. ಟ್ರೈಸೈಕ್ಲೋಜೋಲ್ (೦.೬ ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ. ಯೂರಿಯಾ ಗೊಬ್ಬರ ನಿಲ್ಲಿಸಿ."
  },
  maize_fall_armyworm: {
    en: "Apply Emamectin benzoate 5 SG @ 0.4g/L directly into leaf whorls. Set up pheromone traps (5/acre) for moth surveillance.",
    kn: "ಸುಳಿಗೆ ನೇರವಾಗಿ ಎಮಾಮೆಕ್ಟಿನ್ ಬೆಂಜೊಯೆಟ್ (೦.೪ ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ. ಎಕರೆಗೆ ೫ ಮೋಹಕ ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ."
  },
  potato_early_blight: {
    en: "Spray Chlorothalonil 75 WP (2g/L) prophylactic canopy wash. Ensure ridge furrows are properly drained.",
    kn: "ಕ್ಲೋರೋಥಲೋನಿಲ್ 75 WP (೨ ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ. ಸಾಲುಗಳಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ಬಸಿಗಾಲುವೆ ಮಾಡಿ."
  },
  chilli_leaf_curl: {
    en: "Install 20 yellow and blue sticky traps/acre. Spray Diafenthiuron 50 WP (1.2g/L) during cool morning hours.",
    kn: "ಎಕರೆಗೆ ೨೦ ಹಳದಿ ಮತ್ತು ನೀಲಿ ಜಿಗುಟು ಬಲೆಗಳನ್ನು ಹಾಕಿ. ಬೆಳಗಿನ ಜಾವ ಡಯಾಫೆಂಥಿಯುರಾನ್ ಸಿಂಪಡಿಸಿ ರಸಹೀರುವ ಕೀಟ ನಿಯಂತ್ರಿಸಿ."
  }
};

/**
 * Detects spreading hotspots from raw disease cases
 *
 * @param {Array} customCases Optional custom array of cases, defaults to casesData.cases
 * @param {Object} options { dateRangeDays: 14, diseaseFilter: 'all', referenceTime: null }
 * @returns {Array} List of qualified spreading hotspots
 */
export function detectSpreadingHotspots(customCases = null, options = {}) {
  const rawList = customCases || casesData.cases || [];
  const {
    dateRangeDays = 14,
    diseaseFilter = 'all',
    referenceTime = null
  } = options;

  // Determine reference time (now or latest case timestamp)
  const maxCaseTime = rawList.reduce((max, c) => Math.max(max, c.timestamp || 0), 0);
  const now = referenceTime || Math.max(maxCaseTime, Date.now());

  const cutoff14Days = now - 14 * DAY_MS;
  const cutoff7Days = now - 7 * DAY_MS;
  const customCutoff = now - dateRangeDays * DAY_MS;

  // Step 1: Filter cases within last 14 days and by disease filter if specified
  const validCases = rawList.filter((c) => {
    if (!c.lat || !c.lng || !c.disease) return false;
    const in14Days = c.timestamp >= cutoff14Days && c.timestamp >= customCutoff;
    const matchesDisease = diseaseFilter === 'all' || c.disease === diseaseFilter;
    return in14Days && matchesDisease;
  });

  // Step 2: Group cases of the SAME DISEASE within 10 km (connected components)
  const diseaseGroups = {};
  validCases.forEach((c) => {
    if (!diseaseGroups[c.disease]) diseaseGroups[c.disease] = [];
    diseaseGroups[c.disease].push(c);
  });

  const hotspots = [];

  Object.entries(diseaseGroups).forEach(([disease, casesOfDisease]) => {
    const visited = new Set();
    const clusters = [];

    // Connected components clustering: any cases within 10 km are linked
    for (let i = 0; i < casesOfDisease.length; i++) {
      if (visited.has(casesOfDisease[i].id)) continue;

      const cluster = [];
      const queue = [casesOfDisease[i]];
      visited.add(casesOfDisease[i].id);

      while (queue.length > 0) {
        const current = queue.shift();
        cluster.push(current);

        for (let j = 0; j < casesOfDisease.length; j++) {
          const neighbor = casesOfDisease[j];
          if (!visited.has(neighbor.id)) {
            const dist = haversineDistanceKm(current.lat, current.lng, neighbor.lat, neighbor.lng);
            if (dist <= 10.0) { // within 10 km
              visited.add(neighbor.id);
              queue.push(neighbor);
            }
          }
        }
      }

      clusters.push(cluster);
    }

    // Step 3: Evaluate each cluster against spreading hotspot criteria
    clusters.forEach((cluster, idx) => {
      // Calculate centroid
      const centroidLat = cluster.reduce((sum, c) => sum + c.lat, 0) / cluster.length;
      const centroidLng = cluster.reduce((sum, c) => sum + c.lng, 0) / cluster.length;

      // Count cases within 20 km of centroid in last 7 days ("this week") vs 7-14 days ("last week")
      let casesThisWeek = 0;
      let casesLastWeek = 0;
      let minTs = Infinity;
      let maxTs = -Infinity;
      let maxDistFromCentroid = 0;

      // Check all valid cases of this disease within 20 km of centroid
      casesOfDisease.forEach((c) => {
        const distToCentroid = haversineDistanceKm(centroidLat, centroidLng, c.lat, c.lng);
        if (distToCentroid <= 20.0) {
          if (c.timestamp >= cutoff7Days) {
            casesThisWeek++;
          } else if (c.timestamp >= cutoff14Days) {
            casesLastWeek++;
          }
          if (c.timestamp < minTs) minTs = c.timestamp;
          if (c.timestamp > maxTs) maxTs = c.timestamp;
          if (distToCentroid > maxDistFromCentroid) {
            maxDistFromCentroid = distToCentroid;
          }
        }
      });

      const totalCasesInCluster = cluster.length;
      const totalCases20km = casesThisWeek + casesLastWeek;

      // SPREAD DETECTION CRITERIA:
      // A location is a spreading hotspot ONLY IF:
      // 1. It has 5 or more cases within 20 km in the last 7 days, OR
      // 2. 3 or more cases with this week's count higher than last week's.
      const condition1 = casesThisWeek >= 5;
      const condition2 = totalCases20km >= 3 && casesThisWeek > casesLastWeek;

      const isSpreadingHotspot = condition1 || condition2;

      // Do NOT show isolated cases: If not a spreading hotspot, skip completely!
      if (!isSpreadingHotspot) {
        return;
      }

      // Determine trend
      const isRising = casesThisWeek > casesLastWeek;
      const trend = isRising ? 'rising' : casesThisWeek === casesLastWeek ? 'stable' : 'declining';

      // Determine representative village name
      const villageCounts = {};
      cluster.forEach((c) => {
        if (c.village) {
          villageCounts[c.village] = (villageCounts[c.village] || 0) + 1;
        }
      });
      const topVillage = Object.entries(villageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Agricultural Zone';

      // Radius in km: based on dispersion of cases (min 4 km, up to 16 km)
      const radiusKm = Math.min(18.0, Math.max(5.0, Math.round((maxDistFromCentroid + 2.5) * 10) / 10));

      const diseaseColor = DISEASE_COLORS[disease] || DISEASE_COLORS.default;
      const tipObj = DISEASE_TIPS[disease] || {
        en: "Inspect foliage regularly. Consult local agricultural extension officer for approved fungicides.",
        kn: "ಎಲೆಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ. ಅಧಿಕೃತ ಶಿಲೀಂಧ್ರನಾಶಕಗಳಿಗಾಗಿ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ."
      };

      const diseaseMeta = diseasesData.find((d) => d.id === disease);

      hotspots.push({
        id: `hotspot-${disease}-${idx + 1}`,
        lat: round(centroidLat, 5),
        lng: round(centroidLng, 5),
        centroid: [centroidLat, centroidLng],
        disease,
        diseaseNameEn: diseaseMeta?.name?.en || diseaseColor.name,
        diseaseNameKn: diseaseMeta?.name?.kn || diseaseColor.nameKn,
        crop: cluster[0].crop || 'Crop',
        village: topVillage,
        casesTotal: totalCases20km,
        casesThisWeek,
        casesLastWeek,
        isRising,
        trend, // 'rising' | 'stable' | 'declining'
        radiusKm,
        radiusMeters: radiusKm * 1000,
        firstSeen: minTs !== Infinity ? new Date(minTs).toISOString().split('T')[0] : 'N/A',
        lastSeen: maxTs !== -Infinity ? new Date(maxTs).toISOString().split('T')[0] : 'N/A',
        color: diseaseColor,
        tip: tipObj,
        cases: cluster
      });
    });
  });

  // Sort active hotspots by case count descending
  return hotspots.sort((a, b) => b.casesTotal - a.casesTotal || b.casesThisWeek - a.casesThisWeek);
}

function round(val, dec) {
  return Number(Math.round(val + 'e' + dec) + 'e-' + dec);
}
