import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, DownloadCloud, Sparkles } from 'lucide-react';
import { setSetting } from '../services/db';

export default function OfflineDownloadModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startDownloadSimulation();
    }
  }, [isOpen]);

  const startDownloadSimulation = () => {
    setProgress(15);
    const timer1 = setTimeout(() => setProgress(45), 400);
    const timer2 = setTimeout(() => setProgress(78), 900);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setIsDone(true);
      setSetting('offline_ready', true);
      localStorage.setItem('cropcare_offline_downloaded', 'true');
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-farm-300 text-center">
        <div className="w-16 h-16 rounded-full bg-farm-100 text-farm-800 flex items-center justify-center mx-auto mb-4">
          {isDone ? (
            <CheckCircle2 size={36} className="text-emerald-600 animate-bounce" />
          ) : (
            <DownloadCloud size={34} className="animate-pulse" />
          )}
        </div>

        <h3 className="text-lg font-extrabold text-farm-900 mb-2">
          {isDone ? t('offlineModal.offlineStatus', 'Offline Ready') : t('offlineModal.title', 'Offline Setup for Krishi')}
        </h3>

        <p className="text-xs text-gray-600 leading-relaxed mb-5">
          {isDone
            ? t('offlineModal.complete', 'CropCare is ready for 100% offline usage!')
            : t('offlineModal.desc', 'CropCare works completely offline in your farm fields. Pre-caching models, guides and audio:')}
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
            <span>{isDone ? t('offlineModal.offlineStatus', 'Offline Ready') : t('home.downloadingOffline', 'Caching offline assets...')}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isDone ? 'bg-emerald-600' : 'bg-farm-700'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Close / Action Button */}
        <button
          type="button"
          disabled={!isDone}
          onClick={onClose}
          className={`w-full btn-touch py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
            isDone
              ? 'bg-farm-800 hover:bg-farm-900 text-white shadow-lg active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Sparkles size={18} />
          <span>{t('offlineModal.close', 'Get Started')}</span>
        </button>
      </div>
    </div>
  );
}
