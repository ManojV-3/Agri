import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  DollarSign,
  Star,
  Leaf,
  FlaskConical,
  Shield,
  Layers,
  Bell,
  Check,
  TrendingUp,
  MessageSquareHeart,
  Users,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import ConfidenceBar from './ConfidenceBar';
import RiskBadge from './RiskBadge';
import VoiceButton from './VoiceButton';
import { getLocalized } from '../data/languages';
import { getModelPerformanceMetrics } from '../services/modelEvaluation';
import {
  setSevenDayReminder,
  triggerDemoReminderNow,
  getTreatmentEfficacy,
  getRankedTreatmentsNearby,
  saveFeedbackRecord
} from '../services/feedbackService';

export default function ResultCard({ prediction, onRetake }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('organic'); // 'organic' | 'chemical' | 'preventive'

  // Model Evaluation Performance State
  const [perfMetrics, setPerfMetrics] = useState(prediction?.modelPerformance || null);

  // Feature 3 States (Feedback & Reminder)
  const [reminderSaved, setReminderSaved] = useState(false);
  const [solutionStats, setSolutionStats] = useState({});
  const [rankedTreatments, setRankedTreatments] = useState([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('Improved'); // 'Improved' | 'No change' | 'Worse'
  const [costSpent, setCostSpent] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const primaryDisease = prediction?.primaryDisease;

  useEffect(() => {
    if (!perfMetrics) {
      getModelPerformanceMetrics().then(res => setPerfMetrics(res));
    }
  }, [prediction]);

  useEffect(() => {
    if (primaryDisease?.id) {
      loadTreatmentStats();
      loadRankedTreatments();
      const initialSol = primaryDisease.solutions?.[0];
      if (initialSol) {
        setSelectedTreatment(getLocalized(initialSol.name, i18n.language));
      }
    }
  }, [primaryDisease?.id, i18n.language]);

  const loadTreatmentStats = async () => {
    if (!primaryDisease?.solutions) return;
    const statsMap = {};
    for (const sol of primaryDisease.solutions) {
      const solNameEn = sol.name.en || sol.name;
      const stat = await getTreatmentEfficacy({
        diseaseId: primaryDisease.id,
        treatmentName: solNameEn
      });
      statsMap[sol.id] = stat;
    }
    setSolutionStats(statsMap);
  };

  const loadRankedTreatments = async () => {
    if (!primaryDisease?.id) return;
    const list = await getRankedTreatmentsNearby({ diseaseId: primaryDisease.id });
    setRankedTreatments(list);
  };

  if (!prediction) return null;

  const {
    confidence,
    confidenceBand,
    risk,
    isHealthy,
    isLowConfidence,
    topPredictions = [],
    isMock,
    diseaseSeverity = (risk === 'critical' ? 'Critical' : risk === 'high' ? 'High' : risk === 'medium' ? 'Medium' : 'Low')
  } = prediction;

  const diseaseName = getLocalized(primaryDisease?.name, i18n.language);
  const symptomsText = getLocalized(primaryDisease?.symptoms, i18n.language);
  const solutions = primaryDisease?.solutions || [];

  // Categorize solutions
  const organicSolutions = solutions.filter((s) => s.type === 'organic');
  const chemicalSolutions = solutions.filter((s) => s.type === 'chemical');
  const preventiveSolutions = solutions.filter((s) => s.type === 'preventive');

  const currentSolutions =
    activeTab === 'organic'
      ? organicSolutions
      : activeTab === 'chemical'
      ? chemicalSolutions
      : preventiveSolutions;

  // Build audio text for the Listen button
  const topSolution = currentSolutions[0] || solutions[0];
  const audioText = isHealthy
    ? `${t('scan.healthyTitle')}. ${t('scan.healthyDesc')}`
    : `${diseaseName}. ${t('scan.diseaseSeverity')}: ${diseaseSeverity}. ${
        topSolution
          ? getLocalized(topSolution.name, i18n.language) + '. ' + getLocalized(topSolution.steps, i18n.language)
          : ''
      }`;

  const audioKey = isHealthy ? 'result_healthy' : `disease_${primaryDisease.id}`;

  const handleCompareCost = () => {
    navigate('/cost', {
      state: {
        crop: primaryDisease.crop,
        diseaseId: primaryDisease.id
      }
    });
  };

  const handleSetReminder = () => {
    setSevenDayReminder({
      scanId: `scan-${Date.now()}`,
      diseaseId: primaryDisease.id,
      diseaseName,
      crop: primaryDisease.crop
    });
    setReminderSaved(true);
  };

  const handleDemoTriggerReminder = () => {
    triggerDemoReminderNow({
      diseaseId: primaryDisease.id,
      diseaseName
    });
    setReminderSaved(true);
    alert(
      i18n.language === 'kn'
        ? 'ಡೆಮೊ ಪರೀಕ್ಷೆಗಾಗಿ ೭-ದಿನಗಳ ಜ್ಞಾಪನೆಯನ್ನು ಈಗಲೇ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ! ಮುಖಪುಟಕ್ಕೆ (Home Hub) ತೆರಳಿ ಜ್ಞಾಪನೆಯನ್ನು ನೋಡಿ.'
        : 'Demo test: 7-day reminder is now marked as DUE! Visit the Home Hub to see the active reminder banner.'
    );
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    await saveFeedbackRecord({
      scan_id: `scan-${Date.now()}`,
      disease: primaryDisease.id,
      treatment_used: selectedTreatment,
      outcome: selectedOutcome,
      days_since_treatment: 7,
      cost_spent_inr: costSpent ? parseFloat(costSpent) : null
    });
    setFeedbackSuccess(true);
    await loadTreatmentStats();
    await loadRankedTreatments();
    setTimeout(() => {
      setFeedbackSuccess(false);
      setShowFeedbackForm(false);
    }, 2500);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Demonstration / Offline Mode Badge */}
      {isMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-amber-700 shrink-0" />
            <span className="font-medium">{t('scan.mockModelNotice', 'Demonstration Classifier Active (MobileNetV2 Offline Simulation)')}</span>
          </div>
        </div>
      )}

      {/* 1. Main Agricultural Diagnosis Card */}
      <div className="farm-card rounded-3xl p-5 sm:p-6 border-2 border-farm-300 bg-white space-y-4 shadow-sm">
        {/* Header Row: Detected Crop + Rescan Button */}
        <div className="flex items-center justify-between gap-3 border-b border-farm-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-farm-900 bg-farm-100 px-3 py-1 rounded-full border border-farm-300 flex items-center gap-1.5 shadow-2xs">
              <span>🌿</span>
              <span>{t('scan.detectedCrop', 'Detected Crop')}:</span>
              <span className="underline decoration-farm-500 underline-offset-2">
                {t(`crops.${primaryDisease.crop}`, primaryDisease.crop)}
              </span>
            </span>

            {perfMetrics?.evaluated && (
              <span className="text-[10px] font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                {t('scan.overallModelAccuracy', 'Model Accuracy')}: {perfMetrics.metrics?.overallAccuracy}%
              </span>
            )}
          </div>

          {onRetake && (
            <button
              type="button"
              onClick={onRetake}
              className="btn-touch px-3 py-1.5 rounded-xl border border-farm-300 bg-white hover:bg-farm-50 text-farm-900 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
              title={t('scan.rescanBtn', 'Rescan Leaf')}
            >
              <RotateCcw size={14} className="text-farm-700" />
              <span>{t('scan.rescanBtn', 'Rescan')}</span>
            </button>
          )}
        </div>

        {/* Disease Name & Disease Severity Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
              {t('scan.detectedDisease', 'Detected Disease')}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-farm-950 leading-tight mt-0.5">
              {isHealthy ? t('scan.healthyTitle', 'Healthy Leaf Detected!') : diseaseName}
            </h2>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
              {t('scan.diseaseSeverity', 'Disease Severity')}
            </div>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border tracking-wide ${
                diseaseSeverity === 'Critical'
                  ? 'bg-rose-700 text-white border-rose-900 shadow-sm'
                  : diseaseSeverity === 'High'
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : diseaseSeverity === 'Medium'
                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              {diseaseSeverity === 'Critical' && '🔥 '}
              {diseaseSeverity}
            </span>
          </div>
        </div>

        {/* Prediction Confidence & Green Confidence Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-700 font-bold">
              {t('scan.predictionConfidence', 'Prediction Confidence')}:
            </span>
            <span className="text-sm font-black text-farm-950">
              {prediction.confidencePercent || Math.round(confidence * 100)}%
            </span>
          </div>
          <ConfidenceBar confidence={prediction.confidence} band={confidenceBand} />
        </div>

        {/* Low Confidence Warning Notice */}
        {isLowConfidence && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs space-y-1 animate-pulse">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <AlertTriangle size={17} className="text-amber-700 shrink-0" />
              <span>{t('scan.unableToIdentifyReliably', 'Unable to identify disease reliably')}</span>
            </div>
            <p className="text-amber-900 leading-relaxed font-medium">
              {t('scan.unableToIdentifyDesc')}
            </p>
          </div>
        )}

        {/* Disease Symptoms & Visual Information */}
        <div className="text-xs text-gray-800 leading-relaxed bg-farm-50/70 p-3.5 rounded-2xl border border-farm-200/80">
          <div className="text-[10px] font-black text-farm-800 uppercase tracking-wider mb-1">
            🌿 {t('scan.symptoms', 'Visual Symptoms & Description')}:
          </div>
          <p className="font-medium">{symptomsText}</p>
        </div>

        {/* Audio Narration & Cost Calculator Button Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 flex-wrap">
          <VoiceButton
            audioKey={audioKey}
            textToSpeak={audioText}
            size="md"
            variant="primary"
          />

          {!isHealthy && (
            <button
              type="button"
              onClick={handleCompareCost}
              className="btn-touch px-3.5 py-2 bg-white border border-farm-300 hover:bg-farm-50 text-farm-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <DollarSign size={15} className="text-farm-700" />
              <span>{t('cost.compareCosts', 'Calculate Medicine Cost')}</span>
            </button>
          )}
        </div>

        {/* FEATURE 3: 7-DAY CHECK REMINDER BUTTON */}
        {!isHealthy && (
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {reminderSaved ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                <Check size={15} className="text-emerald-700" />
                <span>{t('feedback.reminderSet', 'Reminder set! We will notify you in 7 days on the Home Hub.')}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSetReminder}
                className="btn-touch px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2 transition-colors self-start"
              >
                <Bell size={15} className="text-amber-700" />
                <span>{t('feedback.remindCheck', 'Remind me to check again in 7 days')}</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDemoTriggerReminder}
                className="text-[10px] text-amber-800 underline hover:text-amber-950 font-bold"
                title="Immediately activate reminder on Home page for live evaluation"
              >
                (Demo: Trigger 7-day reminder now)
              </button>
              <button
                type="button"
                onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                className="text-xs font-bold text-farm-800 underline hover:text-farm-950"
              >
                {t('feedback.giveFeedback', 'Record Treatment Outcome')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top 3 Possible Disease Predictions */}
      {topPredictions && topPredictions.length > 0 && (
        <div className="farm-card rounded-3xl p-5 border border-farm-200 bg-white space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-farm-800" />
              <h3 className="text-xs font-black text-farm-900 uppercase tracking-wider">
                {t('scan.top3PredictionsTitle', 'Top 3 Possible Predictions')}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-farm-700 bg-farm-100 px-2 py-0.5 rounded-md">
              AI Softmax Ranking
            </span>
          </div>

          <div className="space-y-2">
            {topPredictions.map((pred, i) => {
              const pName = getLocalized(pred.name, i18n.language);
              const pCrop = t(`crops.${pred.crop}`, pred.crop);
              return (
                <div
                  key={pred.id || i}
                  className={`p-3 rounded-2xl border transition-all ${
                    i === 0
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/30'
                      : 'bg-farm-50/40 border-farm-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="font-extrabold text-farm-950 truncate mr-2">
                      <span className="text-farm-600 font-bold mr-1.5">#{pred.rank || (i + 1)}</span>
                      <span>{pName}</span>
                      <span className="text-[10px] text-gray-500 font-normal ml-1">({pCrop})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">
                        {pred.severity}
                      </span>
                      <span className="text-xs font-black text-farm-900">
                        {pred.confidencePercent}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        i === 0 ? 'bg-emerald-600' : 'bg-farm-600'
                      }`}
                      style={{ width: `${Math.min(100, pred.confidencePercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. AI Model Performance Dashboard */}
      <div className="farm-card rounded-3xl p-5 border border-farm-200 bg-linear-to-b from-farm-50/50 to-white space-y-4 shadow-2xs">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-farm-800" />
              <h3 className="text-xs font-black text-farm-900 uppercase tracking-wider">
                {t('scan.modelPerformanceTitle', 'AI Model Performance')}
              </h3>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5 font-medium">
              {perfMetrics?.evaluated
                ? t('scan.measuredAccuracyBadge', { count: perfMetrics.counts?.totalTestImages || 160 })
                : t('scan.modelAccuracyUnevaluated', 'Model accuracy not yet evaluated')}
            </p>
          </div>
          {perfMetrics?.evaluated ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              <span>Overall Accuracy: {perfMetrics.metrics?.overallAccuracy}%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
              {t('scan.modelAccuracyUnevaluated', 'Model accuracy not yet evaluated')}
            </span>
          )}
        </div>

        {perfMetrics?.evaluated ? (
          <div className="space-y-3">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-white border border-farm-200 shadow-2xs">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('scan.overallModelAccuracy', 'Accuracy')}</div>
                <div className="text-xl font-black text-emerald-700 mt-0.5">{perfMetrics.metrics?.overallAccuracy}%</div>
                <div className="text-[9px] text-gray-400 mt-0.5">{perfMetrics.counts?.correctPredictions}/{perfMetrics.counts?.totalTestImages} Correct</div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-farm-200 shadow-2xs">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('scan.precisionLabel', 'Precision')}</div>
                <div className="text-xl font-black text-farm-900 mt-0.5">{perfMetrics.metrics?.precision}%</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Low False Positives</div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-farm-200 shadow-2xs">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('scan.recallLabel', 'Recall')}</div>
                <div className="text-xl font-black text-farm-900 mt-0.5">{perfMetrics.metrics?.recall}%</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Low Missed Cases</div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-farm-200 shadow-2xs">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('scan.f1ScoreLabel', 'F1-Score')}</div>
                <div className="text-xl font-black text-farm-900 mt-0.5">{perfMetrics.metrics?.f1Score}%</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Harmonic Mean</div>
              </div>
            </div>

            {/* Formula Callout */}
            <div className="p-3 rounded-2xl bg-farm-100/70 border border-farm-200/80 text-xs space-y-1">
              <div className="text-[11px] text-farm-900 font-bold">
                {t('scan.formulaLabel', 'Formula')}: <span className="font-mono">Accuracy = (Correct Predictions / Total Test Images) × 100</span>
              </div>
              <div className="text-[11px] font-black text-farm-950 font-mono">
                {perfMetrics.accuracyCalculation || `(${perfMetrics.counts?.correctPredictions} / ${perfMetrics.counts?.totalTestImages}) × 100 = ${perfMetrics.metrics?.overallAccuracy}%`}
              </div>
              <p className="text-[10px] text-farm-700 font-medium">
                {t('scan.testDatasetDesc', '160 ground-truth test images across Tomato, Paddy, Chilli, Maize, and Potato')}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-600 font-medium">
            {t('scan.modelAccuracyUnevaluated', 'Model accuracy not yet evaluated')}
          </div>
        )}
      </div>

      {/* FEATURE 3: SIMPLE FEEDBACK FORM MODAL / CARD */}
      {showFeedbackForm && !isHealthy && (
        <div className="farm-card rounded-3xl p-5 border-2 border-farm-400 bg-white shadow-lg space-y-4 animate-slide-up">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <MessageSquareHeart size={18} className="text-farm-800" />
              <h3 className="text-sm font-black text-gray-900">
                {t('feedback.giveFeedback', 'Record Treatment Outcome')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowFeedbackForm(false)}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {feedbackSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center text-xs font-bold text-emerald-900 space-y-1 animate-fade-in">
              <CheckCircle size={24} className="mx-auto text-emerald-600 mb-1" />
              <p>{t('feedback.feedbackSaved', 'Thank you! Your feedback helps local farmers nearby.')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">
                  {t('feedback.whichTreatment', 'Which treatment did you use?')}:
                </label>
                <select
                  value={selectedTreatment}
                  onChange={(e) => setSelectedTreatment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-farm-600 cursor-pointer"
                >
                  {solutions.map((s) => {
                    const name = getLocalized(s.name, i18n.language);
                    return (
                      <option key={s.id} value={name}>
                        {name} ({s.type})
                      </option>
                    );
                  })}
                  <option value="Custom local pesticide / spray">
                    {i18n.language === 'kn' ? 'ಸ್ಥಳೀಯ ಇತರೆ ಕೀಟನಾಶಕ' : 'Other local pesticide / spray'}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">
                  {t('feedback.didItWork', 'Did the treatment work?')}:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('Improved')}
                    className={`btn-touch py-2.5 rounded-xl border text-xs font-black transition-all ${
                      selectedOutcome === 'Improved'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-emerald-50'
                    }`}
                  >
                    🟢 {t('feedback.improved', 'Improved')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('No change')}
                    className={`btn-touch py-2.5 rounded-xl border text-xs font-black transition-all ${
                      selectedOutcome === 'No change'
                        ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-amber-50'
                    }`}
                  >
                    🟡 {t('feedback.noChange', 'No change')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('Worse')}
                    className={`btn-touch py-2.5 rounded-xl border text-xs font-black transition-all ${
                      selectedOutcome === 'Worse'
                        ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-rose-50'
                    }`}
                  >
                    🔴 {t('feedback.worse', 'Worse')}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="cost-spent-input" className="font-bold text-gray-700 block">
                  {t('feedback.costSpent', 'Money spent on this treatment (₹ optional)')}:
                </label>
                <input
                  id="cost-spent-input"
                  type="number"
                  placeholder={t('feedback.costSpentPlaceholder', 'e.g. 1500')}
                  value={costSpent}
                  onChange={(e) => setCostSpent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-farm-600"
                />
              </div>

              <button
                type="submit"
                className="btn-touch w-full py-2.5 rounded-xl bg-farm-800 hover:bg-farm-900 text-white font-black text-xs shadow transition-colors"
              >
                {t('feedback.submitFeedback', 'Submit Outcome')}
              </button>
            </form>
          )}
        </div>
      )}

      {/* FEATURE 3: "WHAT WORKED FOR FARMERS NEARBY" RANKED CARD */}
      {!isHealthy && rankedTreatments.length > 0 && (
        <div className="farm-card rounded-3xl p-5 border border-farm-200 bg-white space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-farm-800" />
              <h3 className="text-xs font-black text-farm-900 uppercase tracking-wider">
                {t('feedback.nearbyReports', 'What worked for farmers nearby')}
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
              {t('feedback.sampleDataBadge', 'Sample data for demo')}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {rankedTreatments.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-farm-50/60 border border-farm-200 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-extrabold text-gray-900 truncate">
                    {idx + 1}. {item.treatment}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {t('feedback.reportsCount', { count: item.totalReports })}
                    {item.avgCostSpent && ` • ${t('feedback.avgCostSpent', 'Avg cost')}: ₹${item.avgCostSpent}`}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl inline-block border border-emerald-200">
                    {item.improvementRate}% {i18n.language === 'kn' ? 'ಗುಣಮುಖ' : 'improved'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Treatment Recommendations Section */}
      <div className="farm-card rounded-3xl p-5 border border-farm-200 bg-white space-y-4 shadow-2xs">
        <div>
          <h3 className="text-sm font-black text-farm-900 uppercase tracking-wider">
            {t('scan.solutionsTitle', 'Recommended Treatments')}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {t('scan.solutionsDesc', 'Agronomist-verified organic recipes and university curative spray schedules:')}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-3 gap-1.5 bg-farm-100/60 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('organic')}
            className={`btn-touch py-2 px-1 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all ${
              activeTab === 'organic'
                ? 'bg-white text-farm-900 shadow-sm font-black'
                : 'text-farm-700 hover:text-farm-900'
            }`}
          >
            <Leaf size={14} className="text-emerald-700" />
            <span className="truncate">{t('solutionTypes.organic', 'Organic')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chemical')}
            className={`btn-touch py-2 px-1 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all ${
              activeTab === 'chemical'
                ? 'bg-white text-farm-900 shadow-sm font-black'
                : 'text-farm-700 hover:text-farm-900'
            }`}
          >
            <FlaskConical size={14} className="text-sky-700" />
            <span className="truncate">{t('solutionTypes.chemical', 'Chemical')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preventive')}
            className={`btn-touch py-2 px-1 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all ${
              activeTab === 'preventive'
                ? 'bg-white text-farm-900 shadow-sm font-black'
                : 'text-farm-700 hover:text-farm-900'
            }`}
          >
            <Shield size={14} className="text-amber-700" />
            <span className="truncate">{t('solutionTypes.preventive', 'Preventive')}</span>
          </button>
        </div>

        {/* Solution Cards List */}
        <div className="space-y-4">
          {currentSolutions.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">
              {t('scan.noSolutionsInCategory', 'No solutions listed under this category.')}
            </p>
          ) : (
            currentSolutions.map((sol, index) => {
              const solName = getLocalized(sol.name, i18n.language);
              const solSteps = getLocalized(sol.steps, i18n.language);
              const stat = solutionStats[sol.id] || { hasEnoughReports: false, count: 0 };

              return (
                <div
                  key={sol.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-farm-50/30 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-farm-800 uppercase tracking-wide">
                        {t('scan.option', { num: index + 1 })}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">
                        {solName}
                      </h4>
                    </div>

                    {/* Effectiveness Stars */}
                    <div className="flex items-center text-amber-500 shrink-0" title={`${sol.effectiveness}/5 Stars`}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < sol.effectiveness ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Aggregated Farmer Improvement Callout */}
                  <div className="p-2.5 rounded-xl bg-white border border-farm-200 flex items-center gap-2 text-xs">
                    <TrendingUp size={15} className={stat.hasEnoughReports ? 'text-emerald-600' : 'text-gray-400'} />
                    <span className="text-gray-700 font-medium">
                      {stat.hasEnoughReports ? (
                        t('feedback.reportSummary', {
                          count: stat.count,
                          treatment: solName,
                          percent: stat.percentImproved
                        })
                      ) : (
                        t('feedback.notEnoughReports', 'Not enough reports yet (minimum 5 needed for local stats).')
                      )}
                    </span>
                  </div>

                  {/* Numbered Steps */}
                  <div className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                    <p className="font-medium">{solSteps}</p>
                  </div>

                  {/* Dosage per acre */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-500 font-medium">
                      {t('scan.dosage', 'Dosage per acre')}:
                    </span>
                    <span className="font-bold text-farm-900 bg-farm-100/80 px-2.5 py-1 rounded-lg">
                      {sol.dosagePerAcre}
                    </span>
                  </div>

                  {/* Audio Listen for this specific solution */}
                  <div className="pt-1 flex justify-end">
                    <VoiceButton
                      audioKey={`sol_${sol.id}_steps`}
                      textToSpeak={`${solName}. ${solSteps}. ${t('scan.dosage')}: ${sol.dosagePerAcre}`}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Statutory AI Disclaimer */}
      <div className="p-3 bg-amber-50/80 border border-amber-300/60 rounded-2xl text-[11px] text-amber-900 leading-relaxed text-center font-medium">
        ⚠️ {t('app.disclaimer', 'AI suggestion for guidance. Confirm with a local agriculture expert before spraying.')}
      </div>
    </div>
  );
}
