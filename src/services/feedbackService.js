/**
 * Farmer Treatment Feedback Service
 * Manages the crowdsourced feedback loop, IndexedDB storage,
 * 7-day check reminders, and local treatment efficacy aggregation.
 */

import seedFeedbackData from '../data/seedFeedback.json';
import { db } from './db';

const STORAGE_KEY_FEEDBACK = 'krishi_user_feedback_v1';
const STORAGE_KEY_REMINDERS = 'krishi_check_reminders';

/**
 * Initializes and retrieves all feedback entries (seeded demo + user entries)
 */
export async function getAllFeedbackRecords() {
  let userEntries = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEEDBACK);
    if (raw) userEntries = JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading feedback from storage:', err);
  }

  const seeded = seedFeedbackData.feedback || [];
  return [...userEntries, ...seeded];
}

/**
 * Saves a new feedback entry submitted by a farmer
 */
export async function saveFeedbackRecord({
  scan_id = 'scan-manual',
  village = 'Mandya',
  district = 'Mandya',
  disease,
  treatment_used,
  outcome, // 'Improved' | 'No change' | 'Worse'
  days_since_treatment = 7,
  cost_spent_inr = null
}) {
  const newEntry = {
    id: `fb-user-${Date.now()}`,
    scan_id,
    village,
    district,
    disease,
    treatment_used,
    outcome,
    days_since_treatment: Number(days_since_treatment) || 7,
    cost_spent_inr: cost_spent_inr ? Number(cost_spent_inr) : null,
    timestamp: Date.now(),
    is_demo: false
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEEDBACK);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(list));
  } catch (err) {
    console.warn('Error saving user feedback:', err);
  }

  // Dismiss pending reminder for this scan or disease
  dismissReminderByDisease(disease);

  return newEntry;
}

/**
 * Aggregates feedback for a specific treatment and disease
 * Returns: { count, percentImproved, hasEnoughReports }
 * Rule: Only show percentage when N >= 5, otherwise 'Not enough reports yet'
 */
export async function getTreatmentEfficacy({ diseaseId, treatmentName, district = null }) {
  const allRecords = await getAllFeedbackRecords();

  const matching = allRecords.filter((rec) => {
    const matchDisease = rec.disease === diseaseId;
    const matchTreatment =
      rec.treatment_used === treatmentName ||
      rec.treatment_used.toLowerCase().includes(treatmentName.toLowerCase()) ||
      treatmentName.toLowerCase().includes(rec.treatment_used.toLowerCase());
    return matchDisease && matchTreatment;
  });

  const total = matching.length;
  if (total < 5) {
    return {
      count: total,
      percentImproved: null,
      hasEnoughReports: false
    };
  }

  const improvedCount = matching.filter((r) => r.outcome === 'Improved').length;
  const percentImproved = Math.round((improvedCount / total) * 100);

  return {
    count: total,
    percentImproved,
    hasEnoughReports: true
  };
}

/**
 * Ranks all treatments used for a disease by improvement rate
 * Used by the "What worked for farmers nearby" card
 */
export async function getRankedTreatmentsNearby({ diseaseId, district = null }) {
  const allRecords = await getAllFeedbackRecords();

  const diseaseRecords = allRecords.filter((r) => r.disease === diseaseId);
  if (diseaseRecords.length === 0) return [];

  // Group by treatment
  const grouped = {};
  diseaseRecords.forEach((r) => {
    const tName = r.treatment_used;
    if (!grouped[tName]) {
      grouped[tName] = {
        name: tName,
        totalReports: 0,
        improvedReports: 0,
        costs: []
      };
    }
    grouped[tName].totalReports += 1;
    if (r.outcome === 'Improved') grouped[tName].improvedReports += 1;
    if (r.cost_spent_inr && r.cost_spent_inr > 0) {
      grouped[tName].costs.push(r.cost_spent_inr);
    }
  });

  const ranked = Object.values(grouped).map((item) => {
    const rate = Math.round((item.improvedReports / item.totalReports) * 100);
    const avgCost =
      item.costs.length > 0
        ? Math.round(item.costs.reduce((a, b) => a + b, 0) / item.costs.length)
        : null;

    return {
      treatment: item.name,
      totalReports: item.totalReports,
      improvedReports: item.improvedReports,
      improvementRate: rate,
      avgCostSpent: avgCost,
      isDemo: true
    };
  });

  // Rank by improvementRate descending, then totalReports
  return ranked.sort((a, b) => b.improvementRate - a.improvementRate || b.totalReports - a.totalReports);
}

/**
 * 7-Day Reminder Management
 */
export function setSevenDayReminder({ scanId, diseaseId, diseaseName, crop, village = 'Mandya' }) {
  const reminder = {
    id: `rem-${Date.now()}`,
    scanId,
    diseaseId,
    diseaseName,
    crop,
    village,
    createdAt: Date.now(),
    dueTimestamp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days in future
    isDueNow: false
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(reminder);
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(list));
  } catch (err) {
    console.warn('Error saving reminder:', err);
  }

  return reminder;
}

/**
 * Triggers a reminder immediately for live demo verification without waiting 7 days
 */
export function triggerDemoReminderNow({ diseaseId = 'tomato_late_blight', diseaseName = 'Tomato Late Blight' }) {
  const reminder = {
    id: `rem-demo-${Date.now()}`,
    scanId: 'scan-demo',
    diseaseId,
    diseaseName,
    crop: 'tomato',
    village: 'Mandya, Maddur',
    createdAt: Date.now() - 7 * 86400000,
    dueTimestamp: Date.now() - 1000,
    isDueNow: true
  };

  try {
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify([reminder]));
  } catch (err) {
    console.warn('Error writing demo reminder:', err);
  }

  return reminder;
}

export function dismissReminderByDisease(diseaseId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (!raw) return;
    const list = JSON.parse(raw);
    const updated = list.filter((r) => r.diseaseId !== diseaseId);
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error dismissing reminder:', err);
  }
}
