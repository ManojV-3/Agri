import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Star,
  Award,
  Zap,
  Tag,
  ArrowUpDown,
  Edit3,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { getLocalized, formatCurrency } from '../data/languages';
import VoiceButton from './VoiceButton';

export default function CostTable({
  solutions = [],
  acres = 1,
  sortMode = 'cheapest',
  onSortChange,
  onOpenPriceEditor
}) {
  const { t, i18n } = useTranslation();

  if (!solutions || solutions.length === 0) {
    return (
      <div className="farm-card rounded-2xl p-6 text-center text-gray-500 text-xs">
        {t('cost.noSolutions', 'No solutions available for the selected disease.')}
      </div>
    );
  }

  // Find cheapest solution for the voice button
  const cheapestOption = [...solutions].sort((a, b) => a.totalCost - b.totalCost)[0];
  const cheapestAudioText = cheapestOption
    ? `${t('cost.cheapestTag')}: ${getLocalized(cheapestOption.name, i18n.language)}. ${t('cost.totalCost', { acres })}: ${formatCurrency(cheapestOption.totalCost, i18n.language)}`
    : '';

  return (
    <div className="space-y-4">
      {/* Voice read cheapest option + Sort bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <VoiceButton
          audioKey="cost_cheapest"
          textToSpeak={cheapestAudioText}
          label={t('cost.voiceCheapest', 'Listen to Best Option')}
          size="sm"
          variant="secondary"
          className="w-full sm:w-auto"
        />

        {/* Sorting Dropdown/Buttons */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => onSortChange('cheapest')}
            className={`btn-touch px-2.5 py-1.5 rounded-lg font-bold transition-all text-xs flex-1 ${
              sortMode === 'cheapest'
                ? 'bg-farm-800 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('cost.sortCheapest', 'Cheapest')}
          </button>
          <button
            type="button"
            onClick={() => onSortChange('effective')}
            className={`btn-touch px-2.5 py-1.5 rounded-lg font-bold transition-all text-xs flex-1 ${
              sortMode === 'effective'
                ? 'bg-farm-800 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('cost.sortEffective', 'Effective')}
          </button>
          <button
            type="button"
            onClick={() => onSortChange('value')}
            className={`btn-touch px-2.5 py-1.5 rounded-lg font-bold transition-all text-xs flex-1 ${
              sortMode === 'value'
                ? 'bg-farm-800 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('cost.sortBestValue', 'Best Value')}
          </button>
        </div>
      </div>

      {/* Solutions Cards */}
      <div className="space-y-3">
        {solutions.map((sol, index) => {
          const isCheapest = sol.id === cheapestOption?.id && solutions.length > 1;
          const solName = getLocalized(sol.name, i18n.language);

          return (
            <div
              key={sol.id}
              className={`farm-card rounded-2xl p-4 transition-all relative overflow-hidden border ${
                sol.isBestValue
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Badges Bar: Best Value / Cheapest Tag */}
              <div className="flex items-center gap-2 mb-2">
                {sol.isBestValue && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-600 text-white tracking-wider shadow-sm">
                    <Award size={12} />
                    {t('cost.bestValueTag', 'Best Value')}
                  </span>
                )}
                {isCheapest && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-farm-800 text-white tracking-wider shadow-sm">
                    <Tag size={12} />
                    {t('cost.cheapestTag', 'Cheapest')}
                  </span>
                )}
                <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md ml-auto">
                  {t(`solutionTypes.${sol.type}`, sol.type)}
                </span>
              </div>

              {/* Title & Stars */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-extrabold text-gray-900 leading-snug">
                  {solName}
                </h4>

                <div className="flex items-center text-amber-500 shrink-0" title={`${sol.effectiveness}/5 Stars`}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < sol.effectiveness ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
              </div>

              {/* Price Calculation Details */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-end justify-between">
                <div>
                  <div className="text-[11px] text-gray-500">
                    {formatCurrency(sol.pricePerUnit, i18n.language)} / {sol.unit} × {sol.unitsPerAcre} {sol.unit}s
                  </div>
                  <div className="text-xs font-semibold text-gray-700">
                    {formatCurrency(sol.costPerAcre, i18n.language)} {t('cost.perAcre', 'per acre')}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {t('cost.totalCost', { acres })}
                  </div>
                  <div className="text-xl font-black text-farm-900 leading-none mt-0.5">
                    {formatCurrency(sol.totalCost, i18n.language)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Prices Button */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={onOpenPriceEditor}
          className="btn-touch px-4 py-2 text-xs font-bold text-farm-800 hover:text-farm-900 bg-farm-100/70 hover:bg-farm-200/80 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <Edit3 size={14} />
          <span>{t('cost.editPrices', 'Edit Local Market Prices')}</span>
        </button>
      </div>
    </div>
  );
}
