import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ConfidenceBar({ confidence = 0, label = '', showBand = true }) {
  const { t } = useTranslation();
  const confNum = typeof confidence === 'number' ? confidence : parseFloat(confidence) || 0;
  const percent = confNum <= 1.0 ? Number((confNum * 100).toFixed(1)) : Number(confNum.toFixed(1));
  const clampedPercent = Math.min(100, Math.max(0, percent));

  let colorClass = 'bg-emerald-600';
  let bandText = t('confidenceBands.high', 'High Confidence');

  if (clampedPercent < 60) {
    colorClass = 'bg-rose-500';
    bandText = t('confidenceBands.low', 'Low Confidence');
  } else if (clampedPercent < 80) {
    colorClass = 'bg-amber-500';
    bandText = t('confidenceBands.medium', 'Moderate Confidence');
  }

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-gray-700">{label || t('scan.confidence', 'Confidence')}</span>
        <div className="flex items-center gap-1.5">
          {showBand && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              {bandText}
            </span>
          )}
          <span className="font-black text-gray-900">{clampedPercent}%</span>
        </div>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden p-0.5 border border-gray-300/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass} shadow-xs`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
