import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function RiskBadge({ risk = 'low', className = '', showIcon = true }) {
  const { t } = useTranslation();
  const normalized = (risk || 'low').toLowerCase();

  const configs = {
    low: {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: ShieldCheck,
      label: t('riskLevels.low', 'Low Risk')
    },
    medium: {
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: AlertTriangle,
      label: t('riskLevels.medium', 'Medium Risk')
    },
    high: {
      bg: 'bg-rose-100 text-rose-900 border-rose-300',
      icon: AlertOctagon,
      label: t('riskLevels.high', 'High Risk')
    },
    critical: {
      bg: 'bg-red-700 text-white border-red-800 shadow-sm',
      icon: AlertOctagon,
      label: t('riskLevels.critical', 'Critical')
    }
  };

  const current = configs[normalized] || configs.low;
  const IconComponent = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${current.bg} ${className}`}
    >
      {showIcon && <IconComponent size={14} className="shrink-0" />}
      <span>{current.label}</span>
    </span>
  );
}
