import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Volume2,
  Share2,
  Check,
  ArrowLeft,
  PhoneCall,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import villagesData from '../data/villages.json';
import { getFarmerProfile } from '../services/db';
import {
  getVillageAlert,
  buildWhatsAppShareText,
  speakAlertOutLoud
} from '../services/alertsService';
import { stopAudio } from '../services/voice';

export default function VillageAlerts() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState(null);
  const [selectedVillageId, setSelectedVillageId] = useState(villagesData.villages[0].id);
  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all' | 'Critical' | 'High' | 'Medium'
  const [filterState, setFilterState] = useState('all');
  const [alertsList, setAlertsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const prof = await getFarmerProfile();
    setFarmer(prof);

    const farmerAcres = prof?.acres || 2.5;

    // Generate alerts for all villages
    const list = [];
    for (const v of villagesData.villages) {
      const alertObj = await getVillageAlert(v, farmerAcres);
      list.push(alertObj);
    }
    setAlertsList(list);

    // Auto-select village if matches farmer profile
    if (prof?.village) {
      const match = villagesData.villages.find((v) =>
        prof.village.toLowerCase().includes(v.name.toLowerCase()) ||
        v.nameKn?.includes(prof.village) ||
        prof.village.toLowerCase().includes(v.district.toLowerCase())
      );
      if (match) setSelectedVillageId(match.id);
    }

    setLoading(false);
  };

  const handleReadAloud = (alert) => {
    stopAudio();
    setSpeakingId(alert.villageId);
    speakAlertOutLoud(alert, i18n.language, () => {
      setSpeakingId(null);
    });
  };

  const handleShare = async (alert) => {
    const text = buildWhatsAppShareText(alert, i18n.language, farmer?.acres || 2.5);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedId(alert.villageId);
        setTimeout(() => setCopiedId(null), 3000);
      } else {
        // Fallback share
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // Filter alerts by state and severity
  const filteredAlerts = alertsList.filter((a) => {
    const matchState = filterState === 'all' || a.state === filterState;
    const matchSeverity = filterSeverity === 'all' || a.riskLevel === filterSeverity;
    return matchState && matchSeverity;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Return to Home */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-farm-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="btn-touch p-2.5 rounded-2xl bg-white border border-farm-200 text-farm-800 hover:bg-farm-50 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-bold"
            title="Return to Home Menu"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t('nav.home', 'Home Menu')}</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                {t('alerts.villageAlerts', 'Village-Level Farmer Alerts')}
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                ℹ️ {t('villages.sampleDataBadge', 'Sample data for demo')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {i18n.language === 'kn' ? 'ಗ್ರಾಮ ಮಟ್ಟದ ಬೆಳೆ ರೋಗ ಎಚ್ಚರಿಕೆಗಳು' : 'Village-Level Early Warning Alerts'}
            </h1>
          </div>
        </div>

        {/* View on Map Link */}
        <button
          type="button"
          onClick={() => navigate('/outbreaks')}
          className="btn-touch px-3.5 py-2 rounded-2xl bg-white border border-farm-200 text-farm-900 font-bold text-xs shadow-2xs hover:bg-farm-50 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <MapPin size={15} className="text-rose-600" />
          <span>{i18n.language === 'kn' ? 'ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ' : 'View on Outbreak Map'}</span>
        </button>
      </div>

      {/* FILTER CONTROLS: State & Severity */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-farm-200 shadow-2xs">
        {/* State Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-gray-500 uppercase">{i18n.language === 'kn' ? 'ರಾಜ್ಯ:' : 'State:'}</span>
          {['all', 'Karnataka', 'Maharashtra', 'Punjab'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterState(st)}
              className={`btn-touch px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                filterState === st
                  ? 'border-farm-800 bg-farm-800 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-farm-400'
              }`}
            >
              {st === 'all' ? t('villages.allStates', 'All States') : st}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500 uppercase">{i18n.language === 'kn' ? 'ತೀವ್ರತೆ:' : 'Severity:'}</span>
          {[
            { id: 'all', label: i18n.language === 'kn' ? 'ಎಲ್ಲಾ' : 'All' },
            { id: 'Critical', label: '🔴 ' + t('villages.riskCritical', 'Critical') },
            { id: 'High', label: '🟠 ' + t('villages.riskHigh', 'High') },
            { id: 'Medium', label: '🟡 ' + t('villages.riskMedium', 'Med') }
          ].map((sv) => (
            <button
              key={sv.id}
              type="button"
              onClick={() => setFilterSeverity(sv.id)}
              className={`btn-touch px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                filterSeverity === sv.id
                  ? 'border-farm-800 bg-farm-800 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-farm-400'
              }`}
            >
              {sv.label}
            </button>
          ))}
        </div>
      </div>

      {/* ALERTS CARDS LIST */}
      <div className="space-y-5">
        {filteredAlerts.length === 0 ? (
          <div className="farm-card p-8 rounded-3xl bg-white border border-gray-200 text-center space-y-2">
            <span className="text-3xl">🌾</span>
            <h3 className="text-base font-bold text-gray-800">{t('alerts.noActiveAlerts', 'No active alerts matching your filter.')}</h3>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isSpeaking = speakingId === alert.villageId;
            const isCopied = copiedId === alert.villageId;
            const isCritical = alert.riskLevel === 'Critical';
            const isHigh = alert.riskLevel === 'High';

            const borderTheme = isCritical
              ? 'border-red-400 bg-gradient-to-br from-white via-rose-50/20 to-red-50/30'
              : isHigh
              ? 'border-orange-300 bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30'
              : 'border-farm-200 bg-white';

            return (
              <div
                key={alert.villageId}
                className={`farm-card rounded-3xl p-5 sm:p-6 border-2 shadow-sm space-y-4 transition-all hover:shadow-md ${borderTheme}`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-farm-100 text-farm-900 px-2 py-0.5 rounded-md">
                        {alert.state} • {alert.district}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${alert.badgeColor}`}>
                        {isCritical && '🔴 CRITICAL ALERT'}
                        {isHigh && '🟠 HIGH RISK'}
                        {!isCritical && !isHigh && '🟡 MEDIUM RISK'}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-snug">
                      {i18n.language === 'kn'
                        ? `${alert.villageNameKn} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ${alert.diseaseNameKn} ರೋಗ ಎಚ್ಚರಿಕೆ!`
                        : `${alert.diseaseNameEn} Spreading near ${alert.villageName}!`}
                    </h2>

                    {/* How near & How serious */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-1 flex-wrap font-medium">
                      <span className="flex items-center gap-1 font-bold text-rose-800">
                        <MapPin size={13} />
                        <span>{t('alerts.howNear', { dist: alert.distanceKm })}</span>
                      </span>
                      <span>•</span>
                      <span>{t('alerts.howSerious', { severity: alert.riskLevel })}</span>
                      <span>•</span>
                      <span>{alert.cases15km} {i18n.language === 'kn' ? 'ಪ್ರಕರಣಗಳು' : 'confirmed cases'}</span>
                    </div>
                  </div>

                  {/* Top Action Buttons (Read Aloud & WhatsApp Share) */}
                  <div className="flex items-center gap-2 shrink-0 self-start">
                    <button
                      type="button"
                      onClick={() => handleReadAloud(alert)}
                      className={`btn-touch px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${
                        isSpeaking
                          ? 'bg-rose-700 text-white border-rose-800 animate-pulse'
                          : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 shadow-2xs'
                      }`}
                      title="Read aloud alert"
                    >
                      <Volume2 size={15} className={isSpeaking ? 'text-white' : 'text-rose-700'} />
                      <span>{isSpeaking ? (i18n.language === 'kn' ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Reading...') : t('alerts.readAloud', 'Read Aloud')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShare(alert)}
                      className={`btn-touch px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${
                        isCopied
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-2xs'
                      }`}
                      title="Share to WhatsApp"
                    >
                      {isCopied ? <Check size={15} /> : <Share2 size={15} />}
                      <span>{isCopied ? t('alerts.shareCopied', 'Copied!') : t('alerts.shareWhatsApp', 'Share')}</span>
                    </button>
                  </div>
                </div>

                {/* 3 TO 5 NUMBERED ACTION STEPS PREVENTIVE PLAN */}
                <div className="p-4 rounded-2xl bg-white/90 border border-farm-200 space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-farm-900 block flex items-center gap-1.5">
                    <Calendar size={14} className="text-farm-700" />
                    <span>{t('alerts.whatToDo', 'Action Plan for the Next 3 Days')}:</span>
                  </span>

                  <ol className="space-y-2 text-xs text-gray-800 font-medium">
                    {(i18n.language === 'kn' ? alert.stepsKn : alert.stepsEn).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-farm-800 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* ESTIMATED PREVENTIVE COST RANGE BOX */}
                <div className="p-3.5 rounded-2xl bg-farm-50/80 border border-farm-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-600 block text-[11px]">
                      {t('alerts.costRange', 'Estimated preventive cost')}:
                    </span>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-extrabold text-farm-900 text-sm">
                        {alert.costPerAcreText} / {t('villages.acresUnit', 'acre')}
                      </span>
                      <span className="text-gray-400 font-bold">•</span>
                      <span className="text-farm-800 font-bold">
                        {i18n.language === 'kn' ? `ನಿಮ್ಮ ${farmer?.acres || 2.5} ಎಕರೆಗೆ: ` : `For your ${farmer?.acres || 2.5} acres: `}
                        <b>{alert.farmerTotalCostText}</b>
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded-md border border-gray-200 shrink-0 self-start sm:self-center">
                    source: costs.json
                  </span>
                </div>

                {/* HELPLINE & MANDATORY DISCLAIMER FOOTER */}
                <div className="pt-2 border-t border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <PhoneCall size={13} className="text-emerald-700" />
                    <span>{t('alerts.kisanCallCentre', 'Kisan Call Centre Helpline: 1800-180-1551 (Toll-Free)')}</span>
                  </div>

                  <div className="text-[10px] text-gray-500 italic">
                    ⚠️ {t('alerts.disclaimer', 'Consult your local agriculture officer before applying any chemical.')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
