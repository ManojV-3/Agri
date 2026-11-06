import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Layers,
  Calculator,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Clock,
  ChevronRight
} from 'lucide-react';
import OfflineBadge from '../components/OfflineBadge';
import RiskBadge from '../components/RiskBadge';
import { getRecentScans } from '../services/db';
import { getLocalized, formatDate } from '../data/languages';
import diseasesData from '../data/diseases.json';

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    const list = await getRecentScans(3);
    setRecentScans(list);
  };

  const getDiseaseInfo = (diseaseId) => {
    return diseasesData.find(d => d.id === diseaseId);
  };

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-br from-farm-900 via-farm-800 to-farm-700 text-white rounded-3xl p-6 shadow-lg border border-farm-600 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 select-none pointer-events-none">
          🌾
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-farm-600/60 backdrop-blur-sm border border-farm-400/30 text-farm-100 text-xs font-semibold">
            <Sparkles size={14} className="text-amber-300" />
            <span>{t('home.offlineReadyBadge', '100% Offline Ready AI')}</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight leading-snug">
            {t('home.welcome', 'Namaskara, Farmer!')}
          </h1>

          <p className="text-xs text-farm-100/90 leading-relaxed max-w-xs font-medium">
            {t('home.heroSubtitle', 'Diagnose crop diseases instantly, compare treatment costs, and protect your harvest.')}
          </p>

          {/* Big Prominent "Scan Leaf" Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => navigate('/scan')}
              className="w-full btn-touch py-3.5 px-6 rounded-2xl bg-amberGold hover:bg-amberGold-hover text-white font-extrabold text-base shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              <Camera size={24} className="text-white drop-shadow" />
              <span>{t('home.scanLeafBtn', 'Scan Leaf Now')}</span>
              <ArrowRight size={20} className="ml-auto" />
            </button>
          </div>
        </div>
      </div>

      {/* Offline Readiness Card */}
      <OfflineBadge />

      {/* Quick Action Shortcuts */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider px-1">
          {t('home.quickActions', 'Quick Shortcuts')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="farm-card farm-card-interactive rounded-2xl p-4 text-left border border-farm-200 bg-white flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-farm-100 text-farm-800 flex items-center justify-center mb-2 shadow-inner">
              <Layers size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-farm-900 leading-tight">
                {t('home.myCrops', 'My Crops & Fields')}
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">{t('home.myCropsSubtitle', 'Field health tracker')}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/cost')}
            className="farm-card farm-card-interactive rounded-2xl p-4 text-left border border-farm-200 bg-white flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center mb-2 shadow-inner">
              <Calculator size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 leading-tight">
                {t('home.treatmentCost', 'Treatment Cost')}
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">{t('home.treatmentCostSubtitle', 'Compare farm budget')}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent 3 Scans Section */}
      <div className="farm-card rounded-3xl p-5 bg-white border border-farm-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-farm-800" />
            <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
              {t('home.recentScans', 'Recent Scans')}
            </h3>
          </div>
          {recentScans.length > 0 && (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-bold text-farm-800 hover:text-farm-900 flex items-center gap-0.5"
            >
              <span>{t('home.viewAll', 'View all')}</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {recentScans.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-2xl bg-farm-50/50 border border-dashed border-farm-200">
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              {t('home.noScansYet', 'No scans recorded yet. Tap below to inspect your first leaf!')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/scan')}
              className="btn-touch px-4 py-2 bg-farm-800 hover:bg-farm-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow"
            >
              <Camera size={16} />
              <span>{t('home.scanLeafBtn', 'Scan Leaf Now')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentScans.map((scan) => {
              const disease = getDiseaseInfo(scan.disease);
              const name = disease ? getLocalized(disease.name, i18n.language) : scan.disease;

              return (
                <div
                  key={scan.id}
                  onClick={() => navigate('/dashboard')}
                  className="p-3 rounded-2xl border border-gray-200 hover:border-farm-400 bg-gray-50/50 hover:bg-farm-50/30 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {scan.thumbnail ? (
                      <img
                        src={scan.thumbnail}
                        alt="Leaf scan"
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-farm-100 text-farm-800 flex items-center justify-center font-bold text-lg shrink-0">
                        🌿
                      </div>
                    )}
                    <div className="min-w-0">
                      <h5 className="text-xs font-extrabold text-gray-900 truncate">{name}</h5>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-farm-700 capitalize">
                          {t(`crops.${scan.crop}`, scan.crop)}
                        </span>
                        <span>•</span>
                        <span>{formatDate(scan.timestamp, i18n.language)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <RiskBadge risk={scan.risk} showIcon={false} className="text-[10px] px-2 py-0.5" />
                    <div className="text-[11px] font-bold text-gray-600 mt-1">
                      {Math.round((scan.confidence || 0) * 100)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaf Scanning Practical Tips */}
      <div className="farm-card rounded-3xl p-5 bg-white border border-farm-200 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-amber-600" />
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
            {t('home.tipsTitle', 'Tips for Best Leaf Scan')}
          </h3>
        </div>
        <ul className="space-y-2 text-xs text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-farm-700 font-bold shrink-0">•</span>
            <span>{t('home.tip1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-farm-700 font-bold shrink-0">•</span>
            <span>{t('home.tip2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-farm-700 font-bold shrink-0">•</span>
            <span>{t('home.tip3')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
