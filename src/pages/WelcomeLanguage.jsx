import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ArrowRight,
  Volume2,
  Sparkles,
  Camera,
  Calculator,
  Layers,
  Activity,
  BookOpen,
  User,
  ShieldCheck
} from 'lucide-react';
import { setSetting } from '../services/db';
import { playAudio, playChime, stopAudio } from '../services/voice';

export default function WelcomeLanguage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'kn');
  const [isPlayingAudio, setIsPlayingAudio] = useState(null);

  const handleSelectLanguage = async (code) => {
    setSelectedLang(code);
    await i18n.changeLanguage(code);
    localStorage.setItem('cropcare_lang', code);
    localStorage.setItem('cropcare_lang_chosen', 'true');
    await setSetting('preferred_language', code);
    await setSetting('language_chosen', true);

    playChime('mic-success');

    // Step 1 complete -> Go to Step 2: Login Page
    navigate('/login');
  };

  const handlePlayPreview = (e, langCode) => {
    e.stopPropagation();
    stopAudio();
    setIsPlayingAudio(langCode);

    if (langCode === 'kn') {
      playAudio(
        'welcome_kn',
        'ಕ್ರಾಪ್ ಕೇರ್ ಗೆ ಸುಸ್ವಾಗತ. ನಿಮ್ಮ ಬೆಳೆ ರೋಗ ಪತ್ತೆ ಮತ್ತು ಔಷಧ ವೆಚ್ಚ ಲೆಕ್ಕಾಚಾರ ಇಲ್ಲಿದೆ.',
        'kn'
      );
    } else {
      playAudio(
        'welcome_en',
        'Welcome to CropCare. Your offline leaf doctor and treatment cost advisor.',
        'en'
      );
    }

    setTimeout(() => {
      setIsPlayingAudio(null);
    }, 4500);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-6 animate-fade-in max-w-4xl mx-auto">
      {/* Step Indicator Header */}
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-farm-100 text-farm-900 border border-farm-200 text-xs font-black shadow-sm uppercase tracking-wider">
          <Sparkles size={13} className="text-amber-600" />
          <span>{i18n.language === 'kn' ? 'ಹಂತ ೧ / ೩: ಭಾಷೆ ಆಯ್ಕೆ' : 'Step 1 of 3: Choose Language'}</span>
        </span>
      </div>

      {/* Main Welcome Hero */}
      <div className="text-center space-y-3 mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-farm-600 to-farm-800 text-white flex items-center justify-center mx-auto text-4xl shadow-xl border-2 border-white">
          🌱
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-farm-900 leading-tight">
          Welcome to CropCare
          <span className="block text-2xl sm:text-3xl text-farm-700 font-bold mt-1 font-kannada">
            ಕ್ರಾಪ್ ಕೇರ್ ಗೆ ಸುಸ್ವಾಗತ
          </span>
        </h1>

        <p className="text-xs sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          {i18n.language === 'kn'
            ? 'ಆಫ್‌ಲೈನ್ ಎಲೆ ರೋಗ ಪತ್ತೆ, ಔಷಧಿ ವೆಚ್ಚ ಮತ್ತು ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:'
            : 'Select your preferred language to get started with offline leaf diagnosis, medicine cost calculation, and voice advice:'}
        </p>
      </div>

      {/* Two Large Language Cards (English & Kannada) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-8">
        {/* Card 1: Kannada (ಕನ್ನಡ) */}
        <div
          onClick={() => handleSelectLanguage('kn')}
          className={`cursor-pointer rounded-3xl p-6 sm:p-8 border-3 transition-all flex flex-col justify-between relative shadow-lg ${
            selectedLang === 'kn'
              ? 'border-farm-800 bg-gradient-to-br from-farm-50 via-white to-emerald-50 ring-4 ring-farm-600/20 scale-[1.02]'
              : 'border-gray-200 bg-white hover:border-farm-400 hover:shadow-xl'
          }`}
        >
          {selectedLang === 'kn' && (
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-farm-800 text-white flex items-center justify-center shadow-md">
              <Check size={20} strokeWidth={3} />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🌾</span>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-farm-950 font-kannada">
                  ಕನ್ನಡ
                </h2>
                <span className="text-xs font-bold text-farm-700 uppercase tracking-wider">
                  Kannada Language
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed font-kannada">
              ಕರ್ನಾಟಕದ ರೈತರಿಗಾಗಿ ಸಂಪೂರ್ಣ ಕನ್ನಡ ತಂತ್ರಾಂಶ, ಧ್ವನಿ ಸೌಲಭ್ಯ ಮತ್ತು ಸಾವಯವ & ರಾಸಾಯನಿಕ ಔಷಧ ಸಲಹೆಗಳು.
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] sm:text-xs font-bold bg-farm-100 text-farm-800 px-2.5 py-1 rounded-lg">
                ⚡ 100% ಆಫ್‌ಲೈನ್
              </span>
              <span className="text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                🔊 ಧ್ವನಿ ಸೌಲಭ್ಯ
              </span>
              <span className="text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">
                💰 ರೂಪಾಯಿ (₹)
              </span>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            {/* Audio Preview Button */}
            <button
              type="button"
              onClick={(e) => handlePlayPreview(e, 'kn')}
              className="w-full btn-touch py-2.5 px-3 rounded-xl border border-farm-300 bg-white hover:bg-farm-50 text-farm-900 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Volume2 size={16} className={isPlayingAudio === 'kn' ? 'animate-pulse text-amber-600' : 'text-farm-700'} />
              <span>{isPlayingAudio === 'kn' ? 'ಧ್ವನಿ ನುಡಿಯುತ್ತಿದೆ...' : 'ಧ್ವನಿ ಮಾದರಿ ಆಲಿಸಿ (Voice Preview)'}</span>
            </button>

            {/* Select Button */}
            <button
              type="button"
              onClick={() => handleSelectLanguage('kn')}
              className="w-full btn-touch py-4 px-4 rounded-2xl bg-farm-800 hover:bg-farm-900 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 group transition-all"
            >
              <span>ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯಿರಿ</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2: English */}
        <div
          onClick={() => handleSelectLanguage('en')}
          className={`cursor-pointer rounded-3xl p-6 sm:p-8 border-3 transition-all flex flex-col justify-between relative shadow-lg ${
            selectedLang === 'en'
              ? 'border-farm-800 bg-gradient-to-br from-farm-50 via-white to-emerald-50 ring-4 ring-farm-600/20 scale-[1.02]'
              : 'border-gray-200 bg-white hover:border-farm-400 hover:shadow-xl'
          }`}
        >
          {selectedLang === 'en' && (
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-farm-800 text-white flex items-center justify-center shadow-md">
              <Check size={20} strokeWidth={3} />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🇮🇳</span>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
                  English
                </h2>
                <span className="text-xs font-bold text-farm-700 uppercase tracking-wider">
                  Indian Farmer Edition
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
              Complete guidance for Indian farmers with metric measurements, Rupee (₹) pricing, and acreage dosages.
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] sm:text-xs font-bold bg-farm-100 text-farm-800 px-2.5 py-1 rounded-lg">
                ⚡ 100% Offline Ready
              </span>
              <span className="text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                🔊 Voice Assistance
              </span>
              <span className="text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">
                💰 Acre Cost in ₹
              </span>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            {/* Audio Preview Button */}
            <button
              type="button"
              onClick={(e) => handlePlayPreview(e, 'en')}
              className="w-full btn-touch py-2.5 px-3 rounded-xl border border-farm-300 bg-white hover:bg-farm-50 text-farm-900 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Volume2 size={16} className={isPlayingAudio === 'en' ? 'animate-pulse text-amber-600' : 'text-farm-700'} />
              <span>{isPlayingAudio === 'en' ? 'Speaking audio...' : 'Listen Audio Sample (English)'}</span>
            </button>

            {/* Select Button */}
            <button
              type="button"
              onClick={() => handleSelectLanguage('en')}
              className="w-full btn-touch py-4 px-4 rounded-2xl bg-farm-800 hover:bg-farm-900 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 group transition-all"
            >
              <span>Continue in English</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Sequential Flow Indicator */}
      <div className="farm-card rounded-2xl p-4 bg-white border border-farm-200 text-center shadow-sm">
        <span className="text-xs font-bold text-gray-500">
          {i18n.language === 'kn'
            ? 'ಮುಂದಿನ ಹಂತ: ೨. ರೈತರ ಪ್ರವೇಶ & ಜಮೀನು ವಿವರಗಳು (Farmer Login & Plot Setup) → ೩. ಮುಖ್ಯ ಪುಟ (Main Dashboard)'
            : 'Next Steps: Step 2. Farmer Login & Plot Setup → Step 3. Main Dashboard'}
        </span>
      </div>
    </div>
  );
}
