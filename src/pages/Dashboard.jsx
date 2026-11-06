import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  X
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
import {
  getCrops,
  saveCrop,
  deleteCrop,
  getAllScans,
  deleteScanRecord
} from '../services/db';
import { getLocalized, formatDate } from '../data/languages';
import diseasesData from '../data/diseases.json';

const CROPS_LIST = ['tomato', 'potato', 'maize', 'rice', 'chilli'];

export default function Dashboard() {
  const { t, i18n } = useTranslation();

  const [crops, setCrops] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Field Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCropId, setEditingCropId] = useState(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldCrop, setFieldCrop] = useState('tomato');
  const [fieldAcres, setFieldAcres] = useState(1.5);
  const [fieldSowingDate, setFieldSowingDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const [cropsList, scansList] = await Promise.all([
      getCrops(),
      getAllScans()
    ]);
    setCrops(cropsList);
    setScans(scansList);
    setLoading(false);
  };

  const openAddField = () => {
    setEditingCropId(null);
    setFieldName('');
    setFieldCrop('tomato');
    setFieldAcres(1.0);
    setFieldSowingDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditField = (crop) => {
    setEditingCropId(crop.id);
    setFieldName(crop.name || '');
    setFieldCrop(crop.crop || 'tomato');
    setFieldAcres(crop.acres || 1.0);
    setFieldSowingDate(crop.sowingDate || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    if (!fieldName.trim()) return;

    await saveCrop({
      id: editingCropId,
      name: fieldName.trim(),
      crop: fieldCrop,
      acres: Number(fieldAcres),
      sowingDate: fieldSowingDate
    });

    setIsModalOpen(false);
    await loadDashboardData();
  };

  const handleDeleteField = async (id) => {
    if (window.confirm(t('dashboard.deleteConfirmCrop'))) {
      await deleteCrop(id);
      await loadDashboardData();
    }
  };

  const handleDeleteScan = async (id) => {
    if (window.confirm(t('dashboard.deleteConfirmScan'))) {
      await deleteScanRecord(id);
      await loadDashboardData();
    }
  };

  // Metrics computation
  const totalScans = scans.length;
  const healthyCount = scans.filter(s => s.isHealthy || s.disease?.includes('healthy')).length;
  const diseasedCount = totalScans - healthyCount;

  // Most common disease
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

  // Compute trend per crop (improving, same, worsening)
  const computeCropTrend = (cropName) => {
    const cropScans = scans.filter(s => s.crop === cropName);
    if (cropScans.length < 2) return 'same';

    // Risk points: high = 3, medium = 2, low = 1
    const riskScore = (r) => (r === 'high' ? 3 : r === 'medium' ? 2 : 1);
    const newest = riskScore(cropScans[0].risk);
    const previous = riskScore(cropScans[1].risk);

    if (newest < previous) return 'improving';
    if (newest > previous) return 'worsening';
    return 'same';
  };

  // Chart Data: Frequency of disease occurrences
  const chartData = Object.entries(diseaseCounts).map(([diseaseId, count]) => {
    const dis = diseasesData.find(d => d.id === diseaseId);
    const name = dis ? getLocalized(dis.name, i18n.language) : diseaseId;
    return {
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      count
    };
  });

  const getDiseaseInfo = (id) => diseasesData.find(d => d.id === id);

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      {/* Page Title & Add Field CTA */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-farm-900 leading-tight">
            {t('dashboard.title', 'Farm Health Dashboard')}
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            {t('dashboard.subtitle', 'Track field conditions and scan records')}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddField}
          className="btn-touch px-3.5 py-2 rounded-xl bg-farm-800 hover:bg-farm-900 text-white font-bold text-xs flex items-center gap-1.5 shadow"
        >
          <Plus size={16} />
          <span>{t('dashboard.addCropBtn', '+ Add Field')}</span>
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="farm-card rounded-2xl p-3.5 bg-white border border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {t('dashboard.summaryCards.totalScans', 'Total Scans')}
          </span>
          <div className="text-2xl font-black text-farm-900 mt-1">{totalScans}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{t('dashboard.lifetimeLogs', 'Lifetime farm logs')}</div>
        </div>

        <div className="farm-card rounded-2xl p-3.5 bg-white border border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {t('dashboard.summaryCards.healthyCount', 'Healthy Leaves')}
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{healthyCount}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{t('dashboard.cleanTissue', 'Clean plant tissue')}</div>
        </div>

        <div className="farm-card rounded-2xl p-3.5 bg-white border border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
            {t('dashboard.summaryCards.diseasedCount', 'Diseased Leaves')}
          </span>
          <div className="text-2xl font-black text-rose-900 mt-1">{diseasedCount}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{t('dashboard.requiringTreatment', 'Requiring treatment')}</div>
        </div>

        <div className="farm-card rounded-2xl p-3.5 bg-white border border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
            {t('dashboard.summaryCards.topDisease', 'Top Issue')}
          </span>
          <div className="text-xs font-black text-amber-950 mt-1 truncate" title={topDiseaseName}>
            {topDiseaseName}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {topCount > 0 ? t('dashboard.occurrences', { count: topCount }) : t('dashboard.none', 'None')}
          </div>
        </div>
      </div>

      {/* Recharts Disease Occurrence Frequency */}
      {chartData.length > 0 && (
        <div className="farm-card rounded-3xl p-4 bg-white border border-farm-200">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1">
            {t('dashboard.chartTitle', 'Disease Detections Over Time')}
          </h3>
          <p className="text-[11px] text-gray-500 mb-3">{t('dashboard.chartSubtitle')}</p>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4E342E' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#4E342E' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #C5E1A5',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
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
        </div>
      )}

      {/* Registered Fields & Health Trend */}
      <div className="farm-card rounded-3xl p-5 bg-white border border-farm-200 space-y-3">
        <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
          {t('dashboard.myFields', 'My Registered Fields')}
        </h3>

        {crops.length === 0 ? (
          <div className="text-center py-6 px-4 bg-farm-50/50 rounded-2xl border border-dashed border-farm-200">
            <p className="text-xs text-gray-500 mb-3">
              {t('dashboard.noFields', 'No fields registered yet. Tap below to add your first plot!')}
            </p>
            <button
              type="button"
              onClick={openAddField}
              className="btn-touch px-4 py-2 bg-farm-800 hover:bg-farm-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow"
            >
              <Plus size={16} />
              <span>{t('dashboard.addCropBtn', '+ Add Field')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {crops.map((field) => {
              const trend = computeCropTrend(field.crop);
              return (
                <div
                  key={field.id}
                  className="p-3.5 rounded-2xl border border-gray-200 bg-farm-50/30 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-gray-900 truncate">
                        {field.name}
                      </h4>
                      <span className="text-[10px] font-bold text-farm-800 bg-farm-100 px-2 py-0.5 rounded-md capitalize shrink-0">
                        {t(`crops.${field.crop}`, field.crop)}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2">
                      <span>{field.acres} {t('cost.acres', 'acres')}</span>
                      <span>•</span>
                      <span>{t('dashboard.sownOn', { date: field.sowingDate })}</span>
                    </div>

                    {/* Trend Indicator */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 font-semibold">
                        {t('dashboard.trend')}:
                      </span>
                      {trend === 'improving' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <TrendingUp size={12} />
                          {t('dashboard.trends.improving', 'Improving')}
                        </span>
                      )}
                      {trend === 'worsening' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                          <TrendingDown size={12} />
                          {t('dashboard.trends.worsening', 'Needs Attention')}
                        </span>
                      )}
                      {trend === 'same' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full">
                          <Minus size={12} />
                          {t('dashboard.trends.same', 'Stable')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditField(field)}
                      className="btn-touch p-2 text-gray-600 hover:text-farm-800 rounded-xl"
                      title={t('dashboard.editField', 'Edit Field')}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      className="btn-touch p-2 text-gray-400 hover:text-rose-600 rounded-xl"
                      title={t('dashboard.deleteField', 'Delete Field')}
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

      {/* Field Scan History Timeline */}
      <div className="farm-card rounded-3xl p-5 bg-white border border-farm-200 space-y-3">
        <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
          {t('dashboard.scanHistory', 'Field Scan History')}
        </h3>

        {scans.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">
            {t('dashboard.noHistory', 'No scan history recorded.')}
          </p>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => {
              const dis = getDiseaseInfo(scan.disease);
              const name = dis ? getLocalized(dis.name, i18n.language) : scan.disease;

              return (
                <div
                  key={scan.id}
                  className="p-3 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {scan.thumbnail ? (
                      <img
                        src={scan.thumbnail}
                        alt="Leaf thumbnail"
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-farm-100 text-farm-800 flex items-center justify-center font-bold text-lg shrink-0">
                        🌿
                      </div>
                    )}
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-gray-900 truncate">{name}</h5>
                      <div className="text-[10px] text-gray-500 mt-0.5">
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
                    <RiskBadge risk={scan.risk} showIcon={false} className="text-[10px] px-2 py-0.5" />
                    <button
                      type="button"
                      onClick={() => handleDeleteScan(scan.id)}
                      className="btn-touch p-2 text-gray-400 hover:text-rose-600 rounded-xl"
                      title={t('dashboard.deleteScan', 'Delete scan')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Field Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveField}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-farm-300 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <h3 className="text-base font-extrabold text-farm-900">
                {editingCropId ? t('dashboard.fieldModal.titleEdit') : t('dashboard.fieldModal.titleAdd')}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-touch p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Field Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('dashboard.fieldModal.fieldName')}
              </label>
              <input
                type="text"
                required
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder={t('dashboard.fieldModal.fieldNamePlaceholder')}
                className="w-full btn-touch px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
              />
            </div>

            {/* Crop Select */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('dashboard.fieldModal.crop')}
              </label>
              <select
                value={fieldCrop}
                onChange={(e) => setFieldCrop(e.target.value)}
                className="w-full btn-touch px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
              >
                {CROPS_LIST.map(c => (
                  <option key={c} value={c}>
                    {t(`crops.${c}`, c)}
                  </option>
                ))}
              </select>
            </div>

            {/* Acres */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('dashboard.fieldModal.acres')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={fieldAcres}
                onChange={(e) => setFieldAcres(e.target.value)}
                className="w-full btn-touch px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
              />
            </div>

            {/* Sowing Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('dashboard.fieldModal.sowingDate')}
              </label>
              <input
                type="date"
                required
                value={fieldSowingDate}
                onChange={(e) => setFieldSowingDate(e.target.value)}
                className="w-full btn-touch px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
              />
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-touch py-2.5 px-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50"
              >
                {t('dashboard.fieldModal.cancel')}
              </button>
              <button
                type="submit"
                className="btn-touch py-2.5 px-3 rounded-xl bg-farm-800 hover:bg-farm-900 text-white font-bold text-xs shadow"
              >
                {t('dashboard.fieldModal.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
