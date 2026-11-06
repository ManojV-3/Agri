import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';

export default function OfflineBadge({ compact = false }) {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCached, setIsCached] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check offline cache status
    checkCacheStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkCacheStatus = async () => {
    setChecking(true);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        // Look for workbox or precache entries
        const hasAppCache = keys.some(k => k.includes('cropcare') || k.includes('precache') || k.includes('workbox'));
        setIsCached(hasAppCache || ('serviceWorker' in navigator && !!navigator.serviceWorker.controller));
      } else {
        setIsCached(true);
      }
    } catch {
      setIsCached(true);
    } finally {
      setChecking(false);
    }
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
          isOnline
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-amber-100 text-amber-900 border-amber-300'
        }`}
      >
        {isOnline ? <Wifi size={13} className="text-emerald-700" /> : <WifiOff size={13} className="text-amber-700" />}
        <span>{isOnline ? t('app.onlineBadge', 'Online') : t('app.offlineBadge', 'Offline')}</span>
      </div>
    );
  }

  return (
    <div className="farm-card rounded-2xl p-4 bg-white border border-farm-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isCached ? 'bg-emerald-100 text-emerald-700' : 'bg-farm-100 text-farm-800'
          }`}>
            {isCached ? <CheckCircle2 size={22} /> : <RefreshCw size={20} className={checking ? 'animate-spin' : ''} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              {t('home.offlineReadiness', 'Offline Readiness')}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">
              {isCached
                ? t('home.readyForOffline', 'Ready for offline use! All guides, models & audio are cached.')
                : t('home.downloadingOffline', 'Caching offline assets...')}
            </p>
          </div>
        </div>

        <button
          onClick={checkCacheStatus}
          className="btn-touch p-2 text-farm-700 hover:bg-farm-50 rounded-xl"
          title="Refresh cache check"
        >
          <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
