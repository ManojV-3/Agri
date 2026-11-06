/**
 * KRISHI AI Model Performance & Evaluation Service
 * Evaluates the trained crop leaf classifier against a separate labelled test dataset.
 * Formula: Accuracy = (Correct Predictions / Total Test Images) × 100
 * No random or hardcoded values.
 */

let cachedEvaluation = null;

/**
 * Retrieve measured AI model performance metrics
 * @returns {Promise<Object>} Performance metrics or unevaluated state
 */
export async function getModelPerformanceMetrics() {
  if (cachedEvaluation) {
    return cachedEvaluation;
  }

  try {
    // Attempt loading pre-computed benchmark evaluation from static assets or bundled JSON
    let evaluationData = null;
    
    try {
      const resp = await fetch('/model/model-evaluation.json');
      if (resp.ok) {
        evaluationData = await resp.json();
      }
    } catch {
      // Fallback to local import if fetch is unavailable
    }

    if (!evaluationData) {
      try {
        const localModule = await import('../data/modelEvaluation.json');
        evaluationData = localModule.default || localModule;
      } catch {
        evaluationData = null;
      }
    }

    if (
      evaluationData &&
      evaluationData.evaluated &&
      evaluationData.metrics &&
      typeof evaluationData.metrics.overallAccuracy === 'number'
    ) {
      cachedEvaluation = evaluationData;
      return evaluationData;
    }

    return {
      evaluated: false,
      message: 'Model accuracy not yet evaluated'
    };
  } catch (err) {
    console.warn('[KRISHI AI] Could not load model evaluation:', err);
    return {
      evaluated: false,
      message: 'Model accuracy not yet evaluated'
    };
  }
}

/**
 * Retrieve the separate labelled test dataset
 * @returns {Promise<Array>} List of labelled test samples
 */
export async function getTestDataset() {
  try {
    try {
      const resp = await fetch('/model/test-dataset.json');
      if (resp.ok) {
        return await resp.json();
      }
    } catch {}

    const localModule = await import('../data/testDataset.json');
    return localModule.default || localModule;
  } catch (err) {
    console.warn('[KRISHI AI] Could not load test dataset:', err);
    return [];
  }
}

/**
 * Format severity level with agricultural guidance
 * Levels: Low, Medium, High, Critical
 */
export function determineSeverity(diseaseSeverity, confidence, diseaseId = '') {
  const normSeverity = (diseaseSeverity || 'medium').toLowerCase();
  
  if (diseaseId.includes('healthy')) {
    return 'Low';
  }

  // Critical conditions: high-threat diseases with high confidence
  const aggressiveThreats = ['tomato_late_blight', 'rice_blast', 'chilli_anthracnose', 'maize_fall_armyworm', 'potato_late_blight'];
  if (aggressiveThreats.includes(diseaseId) && confidence >= 0.80) {
    return 'Critical';
  }

  if (normSeverity === 'high') {
    return confidence >= 0.85 ? 'Critical' : 'High';
  }

  if (normSeverity === 'medium') {
    return confidence >= 0.70 ? 'Medium' : 'Low';
  }

  return 'Low';
}
