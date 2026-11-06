import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ArrowLeft
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { getAllScans, deleteScanRecord } from '../services/db';
import { getLocalized, formatDate } from '../data/languages';
import diseasesData from '../data/diseases.json';

export default function Analytics() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    setLoading(true);
    const list = await getAllScans();
    setScans(list);
    setLoading(false);
  };

  const handleDeleteScan = async (id) => {
    if (window.confirm(t('dashboard.deleteConfirmScan', 'Delete this scan log?'))) {
      await deleteScanRecord(id);
      await loadScans();
    }
  };

  // Metrics
  const totalScans = scans.length;
  const healthyCount = scans.filter(s => s.isHealthy || s.disease?.includes('healthy')).length;
  const diseasedCount = totalScans - healthyCount;

  const diseaseCounts = {};
  scans.forEach(s => {
    if (!s.isHealthy && !s.disease?.includes('healthy')) {
      diseaseCounts[s.disease] = (diseaseCounts[s.disease] || 0) + 1;
    }
  });

  let topDiseaseId = null;
  let topCount = 0;
  for (const [id, count] of Object.entries(diseaseCounts)) {
    if (count > topCount) {
      topCount = count;
      topDiseaseId = id;
    }
  }

  const topDiseaseObj = diseasesData.find(d => d.id === topDiseaseId);
  const topDiseaseName = topDiseaseObj
    ? getLocalized(topDiseaseObj.name, i18n.language)
    : t('dashboard.none', 'None');

  const chartData = Object.entries(diseaseCounts).map(([diseaseId, count]) => {
    const dis = diseasesData.find(d => d.id === diseaseId);
    const name = dis ? getLocalized(dis.name, i18n.language) : diseaseId;
    return {
      name: name.length > 14 ? name.substring(0, 14) + '...' : name,
      count
    };
  });

  const getDiseaseInfo = (id) => diseasesData.find(d => d.id === id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="btn-touch px-3.5 py-2 rounded-xl border border-farm-200 bg-white hover:bg-farm-50 text-farm-900 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>{i18n.language === 'kn' ? '← ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : '← Back to Home Menu'}</span>
        </button>
        <span className="text-[11px] font-bold text-farm-700 bg-farm-100 px-3 py-1 rounded-lg">
          {i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: 4. ಇತಿಹಾಸ & ಚಾರ್ಟ್' : 'Dedicated Page: 4. Analytics'}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-farm-900 leading-tight">
          {t('hub.analyticsCardTitle', 'Farm Health & History')}
        </h1>
        <p className="text-xs text-gray-600 mt-0.5">
          {t('hub.analyticsCardDesc', 'Interactive charts, scan logs and crop health trends')}
        </p>
      </div>

      {/* Summary Cards Grid (4 columns on desktop!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="farm-card rounded-3xl p-5 bg-white border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {t('dashboard.summaryCards.totalScans', 'Total Scans')}
          </span>
          <div className="text-3xl font-black text-farm-900 mt-1">{totalScans}</div>
          <div className="text-xs text-gray-500 mt-1">{t('dashboard.lifetimeLogs', 'Lifetime farm logs')}</div>
        </div>

        <div className="farm-card rounded-3xl p-5 bg-white border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {t('dashboard.summaryCards.healthyCount', 'Healthy Leaves')}
          </span>
          <div className="text-3xl font-black text-emerald-800 mt-1">{healthyCount}</div>
          <div className="text-xs text-gray-500 mt-1">{t('dashboard.cleanTissue', 'Clean plant tissue')}</div>
        </div>

        <div className="farm-card rounded-3xl p-5 bg-white border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
            {t('dashboard.summaryCards.diseasedCount', 'Diseased Leaves')}
          </span>
          <div className="text-3xl font-black text-rose-900 mt-1">{diseasedCount}</div>
          <div className="text-xs text-gray-500 mt-1">{t('dashboard.requiringTreatment', 'Requiring treatment')}</div>
        </div>

        <div className="farm-card rounded-3xl p-5 bg-white border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
            {t('dashboard.summaryCards.topDisease', 'Top Issue')}
          </span>
          <div className="text-sm font-black text-amber-950 mt-1 truncate" title={topDiseaseName}>
            {topDiseaseName}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {topCount > 0 ? t('dashboard.occurrences', { count: topCount }) : t('dashboard.none', 'None')}
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recharts Chart */}
        <div className="lg:col-span-6 space-y-4">
          <div className="farm-card rounded-3xl p-6 bg-white border border-farm-200 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
              {t('dashboard.chartTitle', 'Disease Detections Over Time')}
            </h3>
            <p className="text-xs text-gray-500 mb-2">{t('dashboard.chartSubtitle')}</p>

            {chartData.length > 0 ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4E342E' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4E342E' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #C5E1A5',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? '#2E7D32' : '#8D6E63'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-gray-400">
                No disease records to graph yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scan History Timeline */}
        <div className="lg:col-span-6 space-y-4">
          <div className="farm-card rounded-3xl p-6 bg-white border border-farm-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-farm-800" />
              <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                {t('dashboard.scanHistory', 'Field Scan History')}
              </h3>
            </div>

            {scans.length === 0 ? (
              <p className="text-xs text-gray-500 py-12 text-center">
                {t('dashboard.noHistory', 'No scan history recorded.')}
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                {scans.map((scan) => {
                  const dis = getDiseaseInfo(scan.disease);
                  const name = dis ? getLocalized(dis.name, i18n.language) : scan.disease;

                  return (
                    <div
                      key={scan.id}
                      className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-3 hover:border-farm-400 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {scan.thumbnail ? (
                          <img
                            src={scan.thumbnail}
                            alt="Leaf thumbnail"
                            className="w-13 h-13 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-xl bg-farm-100 text-farm-800 flex items-center justify-center font-bold text-lg shrink-0">
                            🌿
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{name}</h4>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            <span className="font-semibold text-farm-700 capitalize">
                              {t(`crops.${scan.crop}`, scan.crop)}
                            </span>
                            <span> • </span>
                            <span>{formatDate(scan.timestamp, i18n.language)}</span>
                          </div>
                          <div className="text-[10px] font-bold text-gray-600 mt-0.5">
                            {Math.round((scan.confidence || 0) * 100)}% {t('scan.confidence')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <RiskBadge risk={scan.risk} showIcon={false} className="text-[10px] px-2.5 py-0.5" />
                        <button
                          type="button"
                          onClick={() => handleDeleteScan(scan.id)}
                          className="btn-touch p-2 text-gray-400 hover:text-rose-600 rounded-xl"
                          title={t('dashboard.deleteScan', 'Delete scan')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
