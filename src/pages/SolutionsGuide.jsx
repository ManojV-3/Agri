import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Leaf, FlaskConical, Shield, DollarSign, Star, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import VoiceButton from '../components/VoiceButton';
import RiskBadge from '../components/RiskBadge';
import { getLocalized } from '../data/languages';
import diseasesData from '../data/diseases.json';

const CROPS = ['all', 'tomato', 'potato', 'maize', 'rice', 'chilli'];

export default function SolutionsGuide() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [selectedCrop, setSelectedCrop] = useState('all');
  const [expandedId, setExpandedId] = useState(diseasesData[0].id);

  const filteredDiseases = selectedCrop === 'all'
    ? diseasesData
    : diseasesData.filter(d => d.crop === selectedCrop);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleCalculateCost = (disease) => {
    navigate('/cost', {
      state: {
        crop: disease.crop,
        diseaseId: disease.id
      }
    });
  };

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
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
          {i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: 5. ರೋಗಗಳ ಕೋಶ' : 'Dedicated Page: 5. Crop Guide'}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-farm-900 leading-tight">
          {t('guide.title', 'Crop Disease & Treatment Guide')}
        </h1>
        <p className="text-xs md:text-sm text-gray-600 mt-1">
          {t('guide.subtitle', 'Browse comprehensive symptoms and remedies for all crops')}
        </p>
      </div>

      {/* Crop Filter Horizontal Scroll/Grid */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {CROPS.map(c => {
          const isSelected = selectedCrop === c;
          const label = c === 'all' ? t('guide.filterAll', 'All Crops') : t(`crops.${c}`, c);

          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCrop(c)}
              className={`btn-touch px-4 py-2 rounded-xl border text-xs md:text-sm font-bold shrink-0 transition-all ${
                isSelected
                  ? 'border-farm-800 bg-farm-800 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-farm-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Diseases Accordion List: 2-Column Responsive Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {filteredDiseases.map((d) => {
          const isExpanded = expandedId === d.id;
          const name = getLocalized(d.name, i18n.language);
          const symptoms = getLocalized(d.symptoms, i18n.language);
          const solutions = d.solutions || [];

          return (
            <div
              key={d.id}
              className="farm-card rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm transition-all"
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleExpand(d.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-farm-50/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] md:text-xs font-bold text-farm-700 uppercase tracking-wider bg-farm-100 px-2.5 py-0.5 rounded-md">
                      {t(`crops.${d.crop}`, d.crop)}
                    </span>
                    <RiskBadge risk={d.severity} showIcon={false} className="text-[10px] px-2 py-0.5" />
                  </div>
                  <h3 className="text-sm md:text-base font-black text-gray-900 mt-1 truncate">
                    {name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <VoiceButton
                    audioKey={`disease_${d.id}`}
                    textToSpeak={`${name}. ${symptoms}`}
                    size="sm"
                    variant="outline"
                  />
                  {isExpanded ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3 animate-fade-in">
                  {/* Symptoms */}
                  <div className="p-3 bg-farm-50/60 rounded-xl border border-farm-100 text-xs md:text-sm text-gray-700 leading-relaxed">
                    <span className="font-bold text-farm-900 block mb-0.5">{t('guide.symptoms')}:</span>
                    <p>{symptoms}</p>
                  </div>

                  {/* Solutions Breakdown */}
                  <div className="space-y-2.5">
                    {solutions.map((sol) => {
                      const solName = getLocalized(sol.name, i18n.language);
                      const solSteps = getLocalized(sol.steps, i18n.language);

                      return (
                        <div key={sol.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 text-xs md:text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-900 flex items-center gap-1.5">
                              {sol.type === 'organic' && <Leaf size={15} className="text-emerald-600" />}
                              {sol.type === 'chemical' && <FlaskConical size={15} className="text-sky-600" />}
                              {sol.type === 'preventive' && <Shield size={15} className="text-amber-600" />}
                              <span>{solName}</span>
                            </span>
                            <div className="flex text-amber-500 shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={13}
                                  className={i < sol.effectiveness ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-xs">{solSteps}</p>
                          <div className="text-[11px] md:text-xs font-bold text-farm-800 pt-0.5">
                            {t('scan.dosage')}: {sol.dosagePerAcre}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calculate Cost CTA */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleCalculateCost(d)}
                      className="w-full btn-touch py-2.5 px-3 bg-farm-800 hover:bg-farm-900 text-white font-bold text-xs md:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow"
                    >
                      <DollarSign size={16} />
                      <span>{t('guide.viewCost', 'Calculate Cost for this Issue')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
