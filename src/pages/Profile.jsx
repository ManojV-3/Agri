import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin, Sprout, Compass, Globe, LogOut, Save, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getFarmerProfile, saveFarmerProfile, logoutFarmer, setSetting } from '../services/db';
import { LANGUAGES } from '../data/languages';

const CROPS = ['tomato', 'potato', 'maize', 'rice', 'chilli'];
const AVATARS = ['👨‍🌾', '👩‍🌾', '🌾', '🚜', '🌱', '🍅'];

export default function Profile({ onProfileUpdated, onLogout }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('tomato');
  const [acres, setAcres] = useState(2.0);
  const [avatar, setAvatar] = useState('👨‍🌾');
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const prof = await getFarmerProfile();
    if (prof) {
      setName(prof.name || '');
      setPhone(prof.phone || '');
      setVillage(prof.village || '');
      setPrimaryCrop(prof.primaryCrop || 'tomato');
      setAcres(prof.acres || 2.0);
      setAvatar(prof.avatar || '👨‍🌾');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const updated = {
      name: name.trim(),
      phone: phone.trim(),
      village: village.trim(),
      primaryCrop,
      acres: Number(acres),
      avatar
    };

    await saveFarmerProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleLanguageChange = async (langCode) => {
    await i18n.changeLanguage(langCode);
    localStorage.setItem('cropcare_lang', langCode);
    await setSetting('preferred_language', langCode);
  };

  const handleLogout = async () => {
    if (window.confirm(t('profile.logoutConfirm', 'Are you sure you want to logout?'))) {
      await logoutFarmer();
      if (onLogout) onLogout();
      navigate('/login');
    }
  };

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="btn-touch px-3.5 py-2 rounded-xl border border-farm-200 bg-white hover:bg-farm-50 text-farm-900 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>{i18n.language === 'kn' ? '← ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : '← Back to Home Menu'}</span>
        </button>
        <span className="text-[11px] font-bold text-farm-700 bg-farm-100 px-3 py-1 rounded-lg">
          {i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: 6. ಪ್ರೊಫೈಲ್' : 'Dedicated Page: 6. Profile'}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-farm-900 leading-tight">
          {t('profile.title', 'Farmer Profile')}
        </h1>
        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
          {t('profile.subtitle', 'Manage your offline account and farm parameters')}
        </p>
      </div>

      {saveToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{t('login.profileSaved', 'Farmer profile saved to offline storage!')}</span>
        </div>
      )}

      {/* Responsive 2-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Edit Profile Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 farm-card rounded-3xl p-6 bg-white border border-farm-200 shadow-sm space-y-4">
          <h3 className="text-xs md:text-sm font-black text-gray-800 uppercase tracking-wider">
            {t('profile.personalDetails', 'Personal Farm Details')}
          </h3>

          {/* Avatar Picker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-2">
              {t('login.avatarLabel', 'Farm Icon')}
            </label>
            <div className="flex gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`btn-touch w-11 h-11 rounded-xl text-xl flex items-center justify-center border-2 transition-transform ${
                    avatar === emoji ? 'border-farm-800 bg-farm-100 scale-105 shadow-sm' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <User size={15} className="text-farm-700" />
              <span>{t('login.nameLabel', "Farmer's Full Name")}</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full btn-touch px-3.5 py-2.5 text-xs md:text-sm font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Phone size={15} className="text-farm-700" />
              <span>{t('login.phoneLabel', 'Mobile Number')}</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full btn-touch px-3.5 py-2.5 text-xs md:text-sm font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
            />
          </div>

          {/* Village */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <MapPin size={15} className="text-farm-700" />
              <span>{t('login.villageLabel', 'Village / Taluk / District')}</span>
            </label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full btn-touch px-3.5 py-2.5 text-xs md:text-sm font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
            />
          </div>

          {/* Crop & Acres */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Sprout size={15} className="text-farm-700" />
                <span>{t('login.cropLabel', 'Primary Crop')}</span>
              </label>
              <select
                value={primaryCrop}
                onChange={(e) => setPrimaryCrop(e.target.value)}
                className="w-full btn-touch px-3 py-2.5 text-xs md:text-sm font-bold border border-gray-300 rounded-xl capitalize"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>
                    {t(`crops.${c}`, c)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Compass size={15} className="text-farm-700" />
                <span>{t('login.acresLabel', 'Land (Acres)')}</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={acres}
                onChange={(e) => setAcres(e.target.value)}
                className="w-full btn-touch px-3 py-2.5 text-xs md:text-sm font-bold border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-touch py-3 rounded-xl bg-farm-800 hover:bg-farm-900 text-white font-extrabold text-xs md:text-sm shadow flex items-center justify-center gap-2"
          >
            <Save size={16} />
            <span>{t('login.saveProfile', 'Save Details')}</span>
          </button>
        </form>

        {/* Right: Language Switch & Settings */}
        <div className="lg:col-span-5 space-y-4">
          {/* Language Switch Card */}
          <div className="farm-card rounded-3xl p-6 bg-white border border-farm-200 shadow-sm space-y-3">
            <h3 className="text-xs md:text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={16} className="text-farm-700" />
              <span>{t('profile.switchLang', 'Change Language')}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLanguageChange(l.code)}
                  className={`btn-touch p-3 rounded-2xl border text-center transition-all ${
                    i18n.language === l.code
                      ? 'border-farm-800 bg-farm-100 text-farm-900 font-bold shadow-sm ring-2 ring-farm-600/30'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm md:text-base font-bold">{l.nativeLabel}</div>
                  <div className="text-[11px] text-gray-500">{l.label}</div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('/welcome')}
              className="w-full btn-touch py-2 px-3 rounded-xl border border-farm-200 bg-farm-50/60 hover:bg-farm-100 text-farm-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Globe size={14} className="text-farm-700" />
              <span>{i18n.language === 'kn' ? 'ಭಾಷೆ ಆಯ್ಕೆ ಪ್ರಾರಂಭಿಕ ಪುಟ (Starting Page)' : 'Open Language Starting Page'}</span>
            </button>
          </div>

          {/* Offline Security & Storage Card */}
          <div className="farm-card rounded-3xl p-5 bg-farm-50/70 border border-farm-200 text-xs text-farm-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-farm-800">
              <ShieldCheck size={18} />
              <span>100% Offline Storage (IndexedDB)</span>
            </div>
            <p className="text-gray-600 leading-relaxed text-[11px]">
              All farm data, crop records, and diagnosis history are kept securely on this device. No personal data is transmitted to external cloud servers.
            </p>
          </div>

          {/* Logout / Switch Account */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full btn-touch py-3 rounded-2xl border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <LogOut size={16} />
              <span>{t('login.logout', 'Logout / Switch Account')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
