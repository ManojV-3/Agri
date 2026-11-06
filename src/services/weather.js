/**
 * Weather Service for Krishi Disease Outbreak & Village Risk Modeling
 * Connects to Open-Meteo API when online, with deterministic offline fallbacks.
 */

const WEATHER_CACHE = new Map();

/**
 * Deterministic offline fallback weather per region/latitude
 */
function getOfflineFallbackWeather(lat, lng, villageId = '') {
  // Deterministic seed variation based on latitude
  const latOffset = Math.sin(lat * 12.34) * 2;
  const lngOffset = Math.cos(lng * 15.67) * 4;

  let baseTemp = 28.0;
  let baseHumidity = 76.0;
  let baseRain = 3.5;
  let baseWind = 12.0;
  let windDir = 240; // South-Westerly monsoon breeze

  // Regional baselines
  if (lat > 28) {
    // Punjab / Northern plains
    baseTemp = 26.5;
    baseHumidity = 72.0;
    baseRain = 2.0;
    baseWind = 10.0;
    windDir = 310;
  } else if (lat > 17) {
    // Maharashtra / Deccan
    baseTemp = 29.5;
    baseHumidity = 68.0;
    baseRain = 1.8;
    baseWind = 15.0;
    windDir = 260;
  } else {
    // Karnataka / Cauvery basin
    baseTemp = 27.8;
    baseHumidity = 81.0;
    baseRain = 5.2;
    baseWind = 13.0;
    windDir = 235;
  }

  const temperature = Math.round((baseTemp + latOffset) * 10) / 10;
  const relativeHumidity = Math.min(96, Math.max(45, Math.round(baseHumidity + lngOffset)));
  const precipitation = Math.max(0, Math.round((baseRain + latOffset * 0.8) * 10) / 10);
  const windSpeed = Math.round((baseWind + Math.abs(lngOffset * 0.5)) * 10) / 10;

  return {
    temperature,
    relativeHumidity,
    precipitation,
    windSpeed,
    windDirection: windDir,
    isLive: false,
    source: 'Deterministic agronomic offline model',
    condition: precipitation > 2 ? 'Rain & High Humidity' : relativeHumidity > 75 ? 'Humid & Overcast' : 'Warm & Breezy',
    timestamp: Date.now()
  };
}

/**
 * Fetches current weather for given coordinates from Open-Meteo
 * Falls back safely to offline values if disconnected or API fails.
 */
export async function getVillageWeather(lat, lng, villageId = '') {
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = WEATHER_CACHE.get(cacheKey);

  // Return cached value if younger than 30 minutes
  if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m&timezone=auto`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const current = data.current || {};
      const weather = {
        temperature: current.temperature_2m ?? 27.5,
        relativeHumidity: current.relative_humidity_2m ?? 75,
        precipitation: current.precipitation ?? 0,
        windSpeed: current.wind_speed_10m ?? 12,
        windDirection: current.wind_direction_10m ?? 230,
        isLive: true,
        source: 'Open-Meteo Live API',
        condition: (current.precipitation ?? 0) > 0.5 ? 'Rain Showers' : (current.relative_humidity_2m ?? 75) > 75 ? 'Humid' : 'Clear / Partly Cloudy',
        timestamp: Date.now()
      };
      WEATHER_CACHE.set(cacheKey, weather);
      return weather;
    }
  } catch (err) {
    // Network offline, timed out, or sandbox boundary — normal fallback
  }

  const fallback = getOfflineFallbackWeather(lat, lng, villageId);
  WEATHER_CACHE.set(cacheKey, fallback);
  return fallback;
}

/**
 * Calculates disease weather suitability index (0.0 to 1.0)
 * Higher suitability means current ambient weather speeds up disease germination.
 */
export function calculateDiseaseWeatherSuitability(diseaseId, weather) {
  const { temperature, relativeHumidity, precipitation } = weather;

  // Fungal Blights & Blast (thrive in moisture & moderate warmth)
  if (diseaseId.includes('blight') || diseaseId.includes('blast') || diseaseId.includes('rust') || diseaseId.includes('anthracnose')) {
    let score = 0.3; // baseline
    if (relativeHumidity >= 80) score += 0.45;
    else if (relativeHumidity >= 70) score += 0.3;
    else if (relativeHumidity >= 60) score += 0.15;

    if (temperature >= 18 && temperature <= 28) score += 0.2;
    else if (temperature > 28 && temperature <= 32) score += 0.1;

    if (precipitation > 1.0) score += 0.15;
    return Math.min(1.0, Math.round(score * 100) / 100);
  }

  // Pests / Armyworm (thrives in warm, tropical climates)
  if (diseaseId.includes('armyworm')) {
    let score = 0.35;
    if (temperature >= 24 && temperature <= 33) score += 0.4;
    if (relativeHumidity >= 50 && relativeHumidity <= 85) score += 0.2;
    return Math.min(1.0, Math.round(score * 100) / 100);
  }

  // Viral Leaf Curl & Whitefly vector (thrives in warm, dry/moderate weather)
  if (diseaseId.includes('curl')) {
    let score = 0.3;
    if (temperature >= 27 && temperature <= 36) score += 0.4;
    if (relativeHumidity < 70) score += 0.25;
    return Math.min(1.0, Math.round(score * 100) / 100);
  }

  // Default baseline
  return 0.4;
}
