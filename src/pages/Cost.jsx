import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, Calculator, Layers, AlertCircle, ArrowLeft } from 'lucide-react';
import CostTable from '../components/CostTable';
import PriceEditorModal from '../components/PriceEditorModal';
import { calculateTreatmentCosts, sortSolutions } from '../services/cost';
import { getLocalized } from '../data/languages';
import diseasesData from '../data/diseases.json';

const CROPS = ['tomato', 'potato', 'maize', 'rice', 'chilli'];

export default function Cost() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const initialCrop = location.state?.crop || 'tomato';
  const initialDiseaseId = location.state?.diseaseId || diseasesData.find(d => d.crop === initialCrop)?.id || diseasesData[0].id;

  const [selectedCrop, setSelectedCrop] = useState(initialCrop);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState(initialDiseaseId);
  const [acres, setAcres] = useState(1);
  const [sortMode, setSortMode] = useState('cheapest');
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPriceEditorOpen, setIsPriceEditorOpen] = useState(false);

  const availableDiseases = diseasesData.filter(d => d.crop === selectedCrop);

  useEffect(() => {
    const exists = availableDiseases.some(d => d.id === selectedDiseaseId);
    if (!exists && availableDiseases.length > 0) {
      setSelectedDiseaseId(availableDiseases[0].id);
    }
  }, [selectedCrop]);

  useEffect(() => {
    loadCosts();
  }, [selectedDiseaseId, acres]);

  const loadCosts = async () => {
    setLoading(true);
    const list = await calculateTreatmentCosts(selectedDiseaseId, acres);
    const sorted = sortSolutions(list, sortMode);
    setSolutions(sorted);
    setLoading(false);
  };

  const handleSortChange = (newMode) => {
    setSortMode(newMode);
    setSolutions(prev => sortSolutions(prev, newMode));
  };

  const adjustAcres = (delta) => {
    setAcres(prev => {
      const next = Math.max(0.5, Math.round((prev + delta) * 10) / 10);
      return next;
    });
  };

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
          {i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: 2. ಔಷಧ ವೆಚ್ಚ' : 'Dedicated Page: 2. Cost Calc'}
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-farm-900 leading-tight">
          {t('cost.title', 'Treatment Cost Calculator')}
        </h1>
        <p className="text-xs text-gray-600 mt-0.5">
          {t('cost.subtitle', 'Compare organic vs chemical options for your land size')}
        </p>
      </div>

      {/* Full Responsive 2-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Farm & Disease Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="farm-card rounded-3xl p-6 bg-white border border-farm-200 shadow-sm space-y-5">
            {/* Crop Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {t('cost.selectCrop', 'Crop')}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {CROPS.map(c => {
                  const isSelected = selectedCrop === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCrop(c)}
                      className={`btn-touch py-2 px-1 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-farm-800 bg-farm-800 text-white font-extrabold shadow-sm'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-farm-300 font-medium'
                      }`}
                    >
                      <span className="text-xs truncate block capitalize">
                        {t(`crops.${c}`, c)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Disease Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {t('cost.selectDisease', 'Disease / Issue')}
              </label>
              <select
                value={selectedDiseaseId}
                onChange={(e) => setSelectedDiseaseId(e.target.value)}
                className="w-full btn-touch px-3.5 py-3 rounded-xl border-2 border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-farm-700 shadow-xs"
              >
                {availableDiseases.map(d => (
                  <option key={d.id} value={d.id}>
                    {getLocalized(d.name, i18n.language)}
                  </option>
                ))}
              </select>
            </div>

            {/* Land Area Stepper */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {t('cost.landSize', 'Land Size (Acres)')}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustAcres(-0.5)}
                  className="btn-touch w-12 h-12 rounded-2xl border-2 border-farm-700 bg-farm-50 text-farm-900 flex items-center justify-center font-black active:scale-90 transition-transform"
                  title="Decrease acres"
                >
                  <Minus size={20} />
                </button>

                <div className="flex-1 bg-farm-50/70 border border-farm-200 rounded-2xl py-2 px-3 text-center">
                  <span className="text-3xl font-black text-farm-900">{acres}</span>
                  <span className="text-xs font-bold text-farm-700 ml-1.5">{t('cost.acres', 'acres')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustAcres(0.5)}
                  className="btn-touch w-12 h-12 rounded-2xl border-2 border-farm-700 bg-farm-50 text-farm-900 flex items-center justify-center font-black active:scale-90 transition-transform"
                  title="Increase acres"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Statutory AI Disclaimer */}
          <div className="p-4 bg-amber-50/80 border border-amber-300/60 rounded-3xl text-xs text-amber-900 leading-relaxed font-medium">
            ⚠️ {t('app.disclaimer', 'AI suggestion for guidance. Confirm with a local agriculture expert before spraying.')}
          </div>
        </div>

        {/* Right Column: Calculated Cost Cards */}
        <div className="lg:col-span-7 space-y-4">
          <CostTable
            solutions={solutions}
            acres={acres}
            sortMode={sortMode}
            onSortChange={handleSortChange}
            onOpenPriceEditor={() => setIsPriceEditorOpen(true)}
          />
        </div>
      </div>

      {/* Custom Price Editor Modal */}
      <PriceEditorModal
        isOpen={isPriceEditorOpen}
        onClose={() => setIsPriceEditorOpen(false)}
        onPricesUpdated={loadCosts}
      />
    </div>
  );
}
