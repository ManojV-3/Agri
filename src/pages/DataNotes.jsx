import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  FileText,
  Database,
  Calculator,
  ShieldAlert,
  Edit3,
  Calendar,
  CheckCircle2,
  Info,
  ExternalLink,
  Code2
} from 'lucide-react';
import lossConfig from '../data/loss_config.json';
import costsConfig from '../data/costs.json';
import spreadConfig from '../data/spread_config.json';
import seedFeedback from '../data/seedFeedback.json';

export default function DataNotes() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isKn = i18n.language === 'kn';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Breadcrumb & Return to Home */}
      <div className="flex items-center justify-between border-b border-farm-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="btn-touch p-2.5 rounded-2xl bg-white border border-farm-200 text-farm-800 hover:bg-farm-50 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-bold"
            title="Return to Home Menu"
          >
            <ArrowLeft size={16} />
            <span>{t('nav.home', 'Home Menu')}</span>
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-farm-800 bg-farm-100 px-2 py-0.5 rounded-md">
              {t('dataNotes.title', 'Data Notes & Agronomic Assumptions')}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {isKn ? 'ಮಾಹಿತಿ ಟಿಪ್ಪಣಿಗಳು & ಕೃಷಿ ಸೂತ್ರಗಳ ಪಾರದರ್ಶಕತೆ' : 'Data Transparency, Assumptions & Config Guide'}
            </h1>
          </div>
        </div>
      </div>

      {/* SECTION 1: WHICH DATA IS SAMPLE FOR DEMO */}
      <div className="farm-card rounded-3xl p-6 bg-white border border-farm-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-farm-900 border-b border-gray-100 pb-2">
          <Database size={20} className="text-farm-700" />
          <h2 className="text-base font-black uppercase tracking-wider">
            1. {isKn ? 'ಡೆಮೊಗಾಗಿ ಬಳಸಲಾದ ಮಾದರಿ ಮಾಹಿತಿ (Sample Data)' : 'Which Data is Sample for Demo'}
          </h2>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed font-medium">
          {isKn
            ? 'ಕ್ರಾಪ್ ಕೇರ್ (Krishi) ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ಕೆಳಗಿನ ದತ್ತಾಂಶಗಳನ್ನು ಮಾದರಿ ಮಾಹಿತಿ (Simulated Data) ರೂಪದಲ್ಲಿ ಸೇರಿಸಲಾಗಿದೆ. ಇವುಗಳನ್ನು ನೈಜ ವಿಸ್ತರಣಾ ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಲೈವ್ ಕೃಷಿ ಇಲಾಖೆ API ಗಳೊಂದಿಗೆ ಬದಲಾಯಿಸಬಹುದು:'
            : 'For demonstration and regional evaluation, the following datasets are seeded as realistic sample data. In production deployments, these are replaced with live state agriculture department feeds and APMC APIs:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="font-extrabold text-amber-950 block">📍 <code>villages.json</code> (26 Villages)</span>
            <p className="text-gray-700 text-[11px] leading-relaxed">
              {isKn
                ? 'ಕರ್ನಾಟಕ, ಮಹಾರಾಷ್ಟ್ರ ಮತ್ತು ಪಂಜಾಬ್‌ನ ೨೬ ಗ್ರಾಮಗಳ ಸಾಗುವಳಿ ವಿಸ್ತೀರ್ಣ, ಬೆಳೆಗಳು ಮತ್ತು ಸಕ್ರಿಯ ರೋಗ ಪ್ರಕರಣಗಳ ಸಂಖ್ಯೆ ಡೆಮೊಗಾಗಿ ಸಿದ್ಧಪಡಿಸಿದ ಮಾದರಿಯಾಗಿದೆ.'
                : 'Sample coordinates, crop acreages, and initial active case counts across Karnataka, Maharashtra, and Punjab.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="font-extrabold text-amber-950 block">💬 <code>seedFeedback.json</code> (60 Reports)</span>
            <p className="text-gray-700 text-[11px] leading-relaxed">
              {isKn
                ? '೬೦ ಸ್ಥಳೀಯ ರೈತರ ಔಷಧ ಚಿಕಿತ್ಸಾ ಫಲಿತಾಂಶಗಳು ಮತ್ತು ಸರಾಸರಿ ಖರ್ಚು ವರದಿಗಳು ಸ್ಥಳೀಯ ಅಂಕಿಅಂಶ ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಸೀಡ್ ಮಾಡಲಾಗಿದೆ.'
                : '60 crowdsourced farmer treatment outcomes and money spent records to demonstrate local treatment efficacy ranking.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: WHERE DO ASSUMPTIONS COME FROM */}
      <div className="farm-card rounded-3xl p-6 bg-white border border-farm-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-farm-900 border-b border-gray-100 pb-2">
          <Calculator size={20} className="text-farm-700" />
          <h2 className="text-base font-black uppercase tracking-wider">
            2. {isKn ? 'ಕೃಷಿ ಸೂತ್ರಗಳು ಮತ್ತು ಬೆಲೆಗಳ ಮೂಲ (Where Assumptions Come From)' : 'Where Each Assumption Comes From'}
          </h2>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse border border-gray-200 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-farm-100 text-farm-950 font-black">
                <th className="p-3 border-b border-gray-200">Crop / Parameter</th>
                <th className="p-3 border-b border-gray-200">Assumed Yield</th>
                <th className="p-3 border-b border-gray-200">Market Price</th>
                <th className="p-3 border-b border-gray-200">Source Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
              {Object.entries(lossConfig.crops).map(([key, item]) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="p-3 font-bold capitalize text-farm-900">{isKn ? item.cropName.kn : item.cropName.en}</td>
                  <td className="p-3">{item.averageYieldQuintalsPerAcre} Q/Acre</td>
                  <td className="p-3">₹{item.marketPricePerQuintalInr.toLocaleString('en-IN')} / Q</td>
                  <td className="p-3 text-[11px] text-gray-500">AGMARKNET Modal Rate & UAS Bangalore Extension Index</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-farm-50 rounded-2xl border border-farm-200 text-xs space-y-1.5">
          <span className="font-bold text-farm-900 block">🌤️ Weather Intelligence:</span>
          <p className="text-gray-700 text-[11px] leading-relaxed">
            Ambient temperature, relative humidity, precipitation, and wind speeds are queried live via the <b>Open-Meteo API</b>. When offline, deterministic regional baselines (Cauvery basin, Deccan, Northern plains) ensure uninterrupted farmer advisory without network dependence.
          </p>
        </div>
      </div>

      {/* SECTION 3: HOW TO UPDATE CONFIG FILES */}
      <div className="farm-card rounded-3xl p-6 bg-white border border-farm-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-farm-900 border-b border-gray-100 pb-2">
          <Code2 size={20} className="text-farm-700" />
          <h2 className="text-base font-black uppercase tracking-wider">
            3. {isKn ? 'ಕಾನ್ಫಿಗ್ ಫೈಲ್‌ಗಳನ್ನು ಹೇಗೆ ನವೀಕರಿಸುವುದು (How to Update Config Files)' : 'How to Update Configuration Files'}
          </h2>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed font-medium">
          {isKn
            ? 'ಎಲ್ಲಾ ಕೃಷಿ ಬೆಲೆಗಳು, ಇಳುವರಿಗಳು ಮತ್ತು ರೋಗ ಹರಡುವಿಕೆಯ ನಿಯತಾಂಕಗಳನ್ನು ನೇರವಾಗಿ ಕೆಳಗಿನ JSON ಫೈಲ್‌ಗಳಲ್ಲಿ ತಿದ್ದಬಹುದು. ಪ್ರತಿಯೊಂದು ಫೈಲ್‌ನಲ್ಲಿ "last_updated" ದಿನಾಂಕ ಮತ್ತು ವಿವರಣಾತ್ಮಕ ಕಾಮೆಂಟ್‌ಗಳಿವೆ:'
            : 'All agronomic assumptions, retail input rates, and spread constants reside in editable JSON config files with mandatory "last_updated" timestamps:'}
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-farm-900 font-mono">src/data/loss_config.json</span>
              <span className="text-[10px] text-gray-500">last_updated: {lossConfig.last_updated}</span>
            </div>
            <p className="text-[11px] text-gray-600">
              Edit <code>averageYieldQuintalsPerAcre</code>, <code>marketPricePerQuintalInr</code>, and percentage loss curves (<code>lossPercentUntreated</code> vs <code>lossPercentTreatedEarly</code>).
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-farm-900 font-mono">src/data/costs.json</span>
              <span className="text-[10px] text-gray-500">last_updated: {costsConfig.last_updated}</span>
            </div>
            <p className="text-[11px] text-gray-600">
              Edit <code>costPerAcrePreventive</code>, <code>costPerAcreCurative</code>, and sprayer labor expenses per crop disease.
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-farm-900 font-mono">src/data/spread_config.json</span>
              <span className="text-[10px] text-gray-500">last_updated: {spreadConfig.last_updated}</span>
            </div>
            <p className="text-[11px] text-gray-600">
              Adjust <code>daily_spread_speed_km</code>, <code>wind_drift_bonus</code>, and disease-specific transmission multipliers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
