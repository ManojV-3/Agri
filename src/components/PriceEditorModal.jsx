import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, RotateCcw } from 'lucide-react';
import { getLocalized, formatCurrency } from '../data/languages';
import { defaultPrices, getCustomPrices, saveCustomPrice, resetCustomPrices } from '../services/cost';
import diseasesData from '../data/diseases.json';

export default function PriceEditorModal({ isOpen, onClose, onPricesUpdated }) {
  const { t, i18n } = useTranslation();
  const [editedPrices, setEditedPrices] = useState({});
  const [loading, setLoading] = useState(true);

  // Collect all solutions across all diseases
  const allSolutions = [];
  diseasesData.forEach(d => {
    (d.solutions || []).forEach(s => {
      if (!allSolutions.some(existing => existing.id === s.id)) {
        allSolutions.push(s);
      }
    });
  });

  useEffect(() => {
    if (isOpen) {
      loadPrices();
    }
  }, [isOpen]);

  const loadPrices = async () => {
    setLoading(true);
    const custom = await getCustomPrices();
    const map = {};
    allSolutions.forEach(s => {
      const def = defaultPrices[s.id] || { pricePerUnit: 250, unitsPerAcre: 1, unit: 'unit' };
      map[s.id] = {
        pricePerUnit: custom[s.id]?.pricePerUnit !== undefined ? custom[s.id].pricePerUnit : def.pricePerUnit,
        unitsPerAcre: def.unitsPerAcre,
        unit: def.unit
      };
    });
    setEditedPrices(map);
    setLoading(false);
  };

  const handlePriceChange = (solutionId, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setEditedPrices(prev => ({
      ...prev,
      [solutionId]: {
        ...prev[solutionId],
        pricePerUnit: num
      }
    }));
  };

  const handleSave = async () => {
    for (const [solId, config] of Object.entries(editedPrices)) {
      await saveCustomPrice(solId, config);
    }
    if (onPricesUpdated) onPricesUpdated();
    onClose();
  };

  const handleReset = async () => {
    await resetCustomPrices();
    await loadPrices();
    if (onPricesUpdated) onPricesUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-farm-300">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-farm-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold">{t('cost.priceModalTitle', 'Custom Price Editor')}</h3>
            <p className="text-xs text-farm-200 mt-0.5">{t('cost.priceModalDesc')}</p>
          </div>
          <button
            onClick={onClose}
            className="btn-touch w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 no-scrollbar">
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500">{t('cost.loading', 'Loading prices...')}</div>
          ) : (
            allSolutions.map((sol) => {
              const current = editedPrices[sol.id] || { pricePerUnit: 0, unit: 'unit' };
              const solName = getLocalized(sol.name, i18n.language);

              return (
                <div key={sol.id} className="p-3 bg-farm-50/50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-gray-900 truncate">{solName}</h5>
                    <span className="text-[10px] text-gray-500">{t('cost.unitLabel', { unit: current.unit })}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-gray-700">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={current.pricePerUnit}
                      onChange={(e) => handlePriceChange(sol.id, e.target.value)}
                      className="w-24 px-2 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-farm-600"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="btn-touch px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <RotateCcw size={14} />
            <span>{t('cost.resetPrices', 'Reset to Defaults')}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-touch px-5 py-2.5 bg-farm-800 hover:bg-farm-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
          >
            <Save size={15} />
            <span>{t('cost.savePrices', 'Save Custom Rates')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
