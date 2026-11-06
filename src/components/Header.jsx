import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import {
  Mic,
  Globe,
  Sparkles,
  Home,
  Camera,
  Calculator,
  Layers,
  Activity,
  BookOpen,
  User,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import OfflineBadge from './OfflineBadge';
import VoiceAssistantModal from './VoiceAssistantModal';
import { subscribeVoiceNotice } from '../services/voice';
import { setSetting, getFarmerProfile } from '../services/db';

export default function Header({ onOpenLanguagePicker }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [micNotice, setMicNotice] = useState(null);
  const [farmer, setFarmer] = useState(null);

  useEffect(() => {
    loadFarmer();
    const unsubscribe = subscribeVoiceNotice(({ text }) => {
      showNotice(text, 5000);
    });
    return () => {
      unsubscribe();
    };
  }, [location.pathname]);

  const loadFarmer = async () => {
    const p = await getFarmerProfile();
    setFarmer(p);
  };

  const showNotice = (msg, duration = 4000) => {
    setMicNotice(msg);
    setTimeout(() => {
      setMicNotice(null);
    }, duration);
  };

  const handleLanguageToggle = async () => {
    const newLang = i18n.language === 'en' ? 'kn' : 'en';
    await i18n.changeLanguage(newLang);
    localStorage.setItem('cropcare_lang', newLang);
    await setSetting('preferred_language', newLang);
  };

  const isAuthOrWelcomePage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/welcome' || location.pathname === '/language';

  const desktopNavLinks = [
    { to: '/home', label: t('nav.home', 'Home'), icon: Home },
    { to: '/scan', label: t('nav.scan', 'Scan Leaf'), icon: Camera },
    { to: '/cost', label: t('nav.cost', 'Cost Calc'), icon: Calculator },
    { to: '/fields', label: t('nav.fields', 'My Fields'), icon: Layers },
    { to: '/analytics', label: t('nav.analytics', 'Analytics'), icon: Activity },
    { to: '/solutions', label: t('nav.solutions', 'Crop Guide'), icon: BookOpen },
    { to: '/outbreaks', label: t('nav.outbreaks', 'Outbreak Map'), icon: ShieldAlert },
    { to: '/welcome', label: t('nav.welcome', 'Language'), icon: Globe },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-farm-900 text-white shadow-lg border-b border-farm-700/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => navigate(farmer ? '/home' : '/welcome')}
            className="flex items-center gap-3 cursor-pointer shrink-0 select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-farm-600 to-farm-700 border border-farm-400/40 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-2xl">🌱</span>
            </div>
            <div>
              <div className="font-black text-lg tracking-wide text-farm-50 leading-tight">
                {t('app.name', 'CropCare')}
              </div>
              <div className="text-[11px] text-farm-200 font-medium hidden sm:block">
                {t('app.tagline', 'Offline Leaf Doctor & Cost Advisor for Farmers')}
              </div>
            </div>
          </div>

          {/* Desktop Full Navigation Menu (Visible on tablet & desktop) */}
          {!isAuthOrWelcomePage && farmer && (
            <nav className="hidden md:flex items-center gap-1 bg-farm-950/60 p-1.5 rounded-2xl border border-farm-800">
              {desktopNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isActive
                          ? 'bg-farm-700 text-white shadow-sm ring-1 ring-farm-500/40'
                          : 'text-farm-200 hover:text-white hover:bg-farm-800/60'
                      }`
                    }
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          )}

          {/* Controls: Online Badge, Voice Mic, Profile & Language Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Online/Offline status badge */}
            <OfflineBadge compact={true} />

            {/* Voice Assistant Mic Button */}
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="btn-touch px-3 py-2 rounded-xl bg-farm-800 hover:bg-farm-700 active:bg-farm-600 text-farm-100 border border-farm-700 flex items-center gap-1.5 transition-all shadow-sm"
              title="Voice Assistant / ಧ್ವನಿ ಸಹಾಯಕ"
              aria-label="Voice Assistant"
            >
              <Mic size={17} className="text-amber-300 animate-pulse" />
              <span className="text-xs font-bold hidden lg:inline">Voice</span>
            </button>

            {/* Farmer Profile Button */}
            {!isAuthOrWelcomePage && farmer && (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="btn-touch px-3 py-1.5 rounded-xl bg-farm-800 hover:bg-farm-700 border border-farm-600 flex items-center gap-2 transition-all shadow-sm"
                title={t('nav.profile', 'Profile')}
              >
                <span className="text-base">{farmer.avatar || '👨‍🌾'}</span>
                <span className="text-xs font-bold text-farm-100 hidden lg:inline truncate max-w-[120px]">
                  {farmer.name}
                </span>
              </button>
            )}

            {/* Language Switcher Pill */}
            <button
              type="button"
              onClick={handleLanguageToggle}
              className="btn-touch px-3 py-2 rounded-xl bg-farm-800 hover:bg-farm-700 border border-farm-600 text-farm-50 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              title="Switch Language / ಭಾಷೆ ಬದಲಿಸಿ"
              aria-label="Switch Language"
            >
              <Globe size={14} className="text-farm-300" />
              <span>{i18n.language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Voice Notice Toast Bar */}
        {micNotice && (
          <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold text-center border-t border-amber-600 animate-slide-down flex items-center justify-center gap-2">
            <Sparkles size={14} className="shrink-0" />
            <span>{micNotice}</span>
          </div>
        )}
      </header>

      {/* Interactive Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </>
  );
}
