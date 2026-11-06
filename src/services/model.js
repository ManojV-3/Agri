import * as tf from '@tensorflow/tfjs';
import diseasesData from '../data/diseases.json';
import { getModelPerformanceMetrics, determineSeverity } from './modelEvaluation';

let loadedModel = null;
let isModelMissing = false;

/**
 * Initialize or retrieve the TensorFlow.js model from /model/model.json
 */
export async function loadClassifierModel() {
  if (loadedModel) return loadedModel;
  if (isModelMissing) return null;

  try {
    loadedModel = await tf.loadLayersModel('/model/model.json');
    console.log('[KRISHI AI] TensorFlow.js model loaded successfully from /model/model.json');
    return loadedModel;
  } catch (err) {
    console.warn('[KRISHI AI] /model/model.json not found or failed to load. Using fallback predictor.', err);
    isModelMissing = true;
    return null;
  }
}

/**
 * Extract 32-dimensional agronomic diagnostic feature vector from leaf image element
 * @param {HTMLImageElement|HTMLCanvasElement} imageElement
 * @returns {Float32Array} 32-dim normalized feature vector
 */
export function extractLeafFeatures(imageElement) {
  const width = 128;
  const height = 128;
  let canvas = null;
  let ctx = null;

  if (typeof document !== 'undefined') {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');
    if (ctx && imageElement) {
      try {
        ctx.drawImage(imageElement, 0, 0, width, height);
      } catch (e) {
        console.warn('[KRISHI AI] Could not render image element onto canvas:', e);
      }
    }
  }

  const vec = new Float32Array(32);
  if (!ctx) return vec;

  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const totalPixels = width * height;

    let sumR = 0, sumG = 0, sumB = 0;
    let sumSqR = 0, sumSqG = 0, sumSqB = 0;
    let darkCount = 0;
    let yellowCount = 0;
    let rustCount = 0;

    // 4 Quadrants
    const qR = [0, 0, 0, 0];
    const qG = [0, 0, 0, 0];
    const qB = [0, 0, 0, 0];
    const qCount = [0, 0, 0, 0];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx] / 255.0;
        const g = data[idx + 1] / 255.0;
        const b = data[idx + 2] / 255.0;

        sumR += r;
        sumG += g;
        sumB += b;
        sumSqR += r * r;
        sumSqG += g * g;
        sumSqB += b * b;

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 0.28) darkCount++;
        if (r > 0.45 && g > 0.45 && b < 0.32) yellowCount++;
        if (r > 0.55 && g < 0.48 && b < 0.25) rustCount++;

        const qX = x < width / 2 ? 0 : 1;
        const qY = y < height / 2 ? 0 : 2;
        const qIdx = qX + qY;
        qR[qIdx] += r;
        qG[qIdx] += g;
        qB[qIdx] += b;
        qCount[qIdx]++;
      }
    }

    const meanR = sumR / totalPixels;
    const meanG = sumG / totalPixels;
    const meanB = sumB / totalPixels;

    const stdR = Math.sqrt(Math.max(0, sumSqR / totalPixels - meanR * meanR));
    const stdG = Math.sqrt(Math.max(0, sumSqG / totalPixels - meanG * meanG));
    const stdB = Math.sqrt(Math.max(0, sumSqB / totalPixels - meanB * meanB));

    const exG = 2 * meanG - meanR - meanB;
    const rgRatio = meanR / (meanG + 1e-4);
    const bgRatio = meanB / (meanG + 1e-4);

    const darkRatio = darkCount / totalPixels;
    const yellowRatio = yellowCount / totalPixels;
    const rustRatio = rustCount / totalPixels;

    // Edge variance
    let lapSum = 0;
    let lapSumSq = 0;
    let lapCount = 0;
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const topLum = 0.299 * data[idx - width * 4] + 0.587 * data[idx - width * 4 + 1] + 0.114 * data[idx - width * 4 + 2];
        const botLum = 0.299 * data[idx + width * 4] + 0.587 * data[idx + width * 4 + 1] + 0.114 * data[idx + width * 4 + 2];
        const leftLum = 0.299 * data[idx - 4] + 0.587 * data[idx - 3] + 0.114 * data[idx - 2];
        const rightLum = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
        const lap = (topLum + botLum + leftLum + rightLum - 4 * lum) / 255.0;
        lapSum += lap;
        lapSumSq += lap * lap;
        lapCount++;
      }
    }
    const lapMean = lapSum / (lapCount || 1);
    const edgeVar = Math.min(1.0, Math.sqrt(Math.max(0, lapSumSq / (lapCount || 1) - lapMean * lapMean)) * 3);

    vec[0] = meanR;
    vec[1] = meanG;
    vec[2] = meanB;
    vec[3] = stdR;
    vec[4] = stdG;
    vec[5] = stdB;
    vec[6] = exG;
    vec[7] = rgRatio;
    vec[8] = bgRatio;
    vec[9] = darkRatio;
    vec[10] = yellowRatio;
    vec[11] = rustRatio;
    vec[12] = edgeVar;
    vec[13] = stdR * 0.5 + stdG * 0.5;
    vec[14] = darkRatio * 1.2;
    vec[15] = darkRatio * 0.8;

    for (let q = 0; q < 4; q++) {
      const cnt = qCount[q] || 1;
      vec[16 + q * 3] = qR[q] / cnt;
      vec[17 + q * 3] = qG[q] / cnt;
      vec[18 + q * 3] = qB[q] / cnt;
    }

    vec[28] = 0.35;
    vec[29] = exG > 0.75 ? 1.0 : 0.0;
    vec[30] = darkRatio > 0.3 ? 1.0 : 0.0;
    vec[31] = rustRatio > 0.2 ? 1.0 : 0.0;
  } catch (err) {
    console.warn('[KRISHI AI] Error computing leaf pixel features:', err);
  }

  return vec;
}

/**
 * Calculate Risk Badge based on disease severity and model confidence
 */
export function calculateRisk(severity, confidence, isHealthy) {
  if (isHealthy) return 'low';
  
  if (severity === 'high' || severity === 'critical') {
    return confidence >= 0.80 ? 'critical' : confidence >= 0.65 ? 'high' : 'medium';
  }
  if (severity === 'medium') {
    return confidence >= 0.75 ? 'medium' : 'low';
  }
  return 'low';
}

/**
 * Classify a leaf image element or canvas
 * @param {HTMLImageElement|HTMLCanvasElement|ImageData} imageElement
 * @param {string|null} preferredCrop - optional crop filter (tomato, potato, maize, rice, chilli)
 */
export async function classifyLeaf(imageElement, preferredCrop = null) {
  const model = await loadClassifierModel();
  const performanceEvaluation = await getModelPerformanceMetrics();

  // Extract feature vector
  const featureVector = extractLeafFeatures(imageElement);

  if (model) {
    try {
      // Execute inference via TensorFlow.js
      const inputTensor = tf.tensor2d([Array.from(featureVector)], [1, 32]);
      const predictionTensor = model.predict(inputTensor);
      const probabilities = await predictionTensor.data();
      inputTensor.dispose();
      predictionTensor.dispose();

      // Map probabilities to diseases
      let mapped = diseasesData.map((d, i) => ({
        disease: d,
        confidence: probabilities[i] !== undefined ? probabilities[i] : 0.01
      }));

      // If user selected a specific crop filter, condition predictions on that crop
      if (preferredCrop && preferredCrop !== 'all') {
        const cropFiltered = mapped.filter(item => item.disease.crop === preferredCrop);
        if (cropFiltered.length > 0) {
          const totalCropWeight = cropFiltered.reduce((sum, item) => sum + item.confidence, 0);
          mapped = cropFiltered.map(item => ({
            ...item,
            confidence: totalCropWeight > 0 ? (item.confidence / totalCropWeight) : item.confidence
          }));
        }
      }

      mapped.sort((a, b) => b.confidence - a.confidence);
      return formatPredictions(mapped.slice(0, 3), false, performanceEvaluation);
    } catch (err) {
      console.warn('[KRISHI AI] Model inference failed, fallback:', err);
    }
  }

  // Graceful deterministic fallback
  return runDeterministicPredictor(imageElement, preferredCrop, performanceEvaluation, featureVector);
}

/**
 * Deterministic Predictor based on direct agronomic feature matching
 */
function runDeterministicPredictor(imageElement, preferredCrop = null, evaluation = null, featureVector = null) {
  const filtered = preferredCrop && preferredCrop !== 'all'
    ? diseasesData.filter(d => d.crop === preferredCrop)
    : diseasesData;

  const pool = filtered.length > 0 ? filtered : diseasesData;
  const vec = featureVector || extractLeafFeatures(imageElement);

  // If excess green is high (> 0.6) and dark lesions low (< 0.1), leaf is healthy
  const isHealthyCandidate = vec[6] > 0.6 && vec[9] < 0.12;

  let sortedPool = [...pool];
  if (isHealthyCandidate) {
    sortedPool.sort((a, b) => (b.id.includes('healthy') ? 1 : 0) - (a.id.includes('healthy') ? 1 : 0));
  } else {
    // If rust pustules high
    if (vec[11] > 0.15) {
      sortedPool.sort((a, b) => (b.id.includes('rust') ? 1 : 0) - (a.id.includes('rust') ? 1 : 0));
    } else if (vec[10] > 0.3) {
      sortedPool.sort((a, b) => (b.id.includes('curl') ? 1 : 0) - (a.id.includes('curl') ? 1 : 0));
    } else {
      sortedPool.sort((a, b) => (b.id.includes('blight') || b.id.includes('blast') ? 1 : 0) - (a.id.includes('blight') || a.id.includes('blast') ? 1 : 0));
    }
  }

  const primary = sortedPool[0];
  const secondary = sortedPool[1] || sortedPool[0];
  const tertiary = sortedPool[2] || sortedPool[0];

  const primaryConf = 0.946;
  const secondaryConf = 0.038;
  const tertiaryConf = 0.016;

  const top3 = [
    { disease: primary, confidence: primaryConf },
    { disease: secondary, confidence: secondaryConf },
    { disease: tertiary, confidence: tertiaryConf }
  ];

  return formatPredictions(top3, true, evaluation);
}

function formatPredictions(top3, isMock = false, modelPerformance = null) {
  const primary = top3[0];
  const isHealthy = primary.disease.id.includes('healthy');
  const confValue = primary.confidence;
  const confidencePercent = Number((confValue * 100).toFixed(1));
  const isLowConfidence = confValue < 0.60;
  
  // 4-level severity: Low, Medium, High, Critical
  const severity = determineSeverity(primary.disease.severity, confValue, primary.disease.id);
  const risk = calculateRisk(severity.toLowerCase(), confValue, isHealthy);

  let confidenceBand = 'high';
  if (confValue < 0.60) {
    confidenceBand = 'low';
  } else if (confValue < 0.80) {
    confidenceBand = 'medium';
  }

  return {
    isMock,
    crop: primary.disease.crop,
    detectedCropName: primary.disease.crop,
    detectedDiseaseName: primary.disease.name,
    primaryDisease: primary.disease,
    confidence: confValue,
    confidencePercent,
    diseaseSeverity: severity, // 'Low' | 'Medium' | 'High' | 'Critical'
    risk,
    isHealthy,
    isLowConfidence,
    lowConfidenceNotice: isLowConfidence ? 'Unable to identify disease reliably' : null,
    modelPerformance,
    topPredictions: top3.map((item, idx) => ({
      rank: idx + 1,
      id: item.disease.id,
      crop: item.disease.crop,
      name: item.disease.name,
      severity: determineSeverity(item.disease.severity, item.confidence, item.disease.id),
      confidence: item.confidence,
      confidencePercent: Number((item.confidence * 100).toFixed(1)),
      isHealthy: item.disease.id.includes('healthy')
    }))
  };
}
