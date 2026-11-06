import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../data/languages';
import { setSetting } from '../services/db';
import { Check } from 'lucide-react';

export default function LanguagePicker({ isOpen, onClose }) {
  const { i18n, t } = useTranslation();

  if (!isOpen) return null;

  const handleSelectLanguage = async (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('cropcare_lang', code);
    await setSetting('preferred_language', code);
    await setSetting('language_chosen', true);
    if (onClose) onClose(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-farm-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-farm-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <span className="text-3xl">🌾</span>
          </div>
          <h2 className="text-xl font-bold text-farm-900 leading-tight">
            Choose Your Language<br />
            <span className="text-lg font-medium text-farm-700">ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ</span>
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            Select your preferred language. You can change this anytime from the top bar.
          </p>
        </div>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full btn-touch px-5 py-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                  isSelected
                    ? 'border-farm-800 bg-farm-50 text-farm-900 shadow-md ring-2 ring-farm-500/20'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-farm-400'
                }`}
              >
                <div>
                  <div className="text-lg font-bold">{lang.nativeLabel}</div>
                  <div className="text-xs text-gray-500">{lang.label}</div>
                </div>
                {isSelected && (
                  <div className="w-7 h-7 rounded-full bg-farm-800 text-white flex items-center justify-center">
                    <Check size={18} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
