import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin, Sprout, Compass, Sparkles, ArrowRight, ArrowLeft, Globe } from 'lucide-react';
import { saveFarmerProfile, saveCrop } from '../services/db';

const AVATARS = ['👨‍🌾', '👩‍🌾', '🌾', '🚜', '🌱', '🍅'];
const CROPS = ['tomato', 'potato', 'maize', 'rice', 'chilli'];

export default function Login({ onLoginSuccess }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('tomato');
  const [acres, setAcres] = useState('2.0');
  const [avatar, setAvatar] = useState('👨‍🌾');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const profileData = {
      name: name.trim(),
      phone: phone.trim() || '9876543210',
      village: village.trim() || 'Mandya, Maddur',
      primaryCrop: primaryCrop || 'tomato',
      acres: parseFloat(acres) || 2.0,
      avatar: avatar || '👨‍🌾',
      registeredAt: Date.now()
    };

    await saveFarmerProfile(profileData);

    // Also auto-create first field plot in crops table
    await saveCrop({
      name: `${profileData.village.split(',')[0]} Main Plot`,
      crop: profileData.primaryCrop,
      acres: profileData.acres,
      sowingDate: new Date().toISOString().split('T')[0]
    });

    if (onLoginSuccess) {
      onLoginSuccess(profileData);
    }
    navigate('/home');
  };

  const handleQuickDemo = async () => {
    const demoData = {
      name: i18n.language === 'kn' ? 'ಬಸವರಾಜ್ ಗೌಡ' : 'Basavaraj Gowda',
      phone: '9845012345',
      village: i18n.language === 'kn' ? 'ಮಂಡ್ಯ, ಮದ್ದೂರು' : 'Mandya, Maddur',
      primaryCrop: 'tomato',
      acres: 2.5,
      avatar: '👨‍🌾',
      registeredAt: Date.now()
    };

    await saveFarmerProfile(demoData);
    await saveCrop({
      name: i18n.language === 'kn' ? 'ಮಂಡ್ಯ ಬಾವಿ ಹೊಲ' : 'Mandya Bavi Plot',
      crop: 'tomato',
      acres: 2.5,
      sowingDate: new Date().toISOString().split('T')[0]
    });

    if (onLoginSuccess) {
      onLoginSuccess(demoData);
    }
    navigate('/home');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-6 animate-fade-in">
      <div className="max-w-xl mx-auto w-full farm-card rounded-3xl p-6 sm:p-8 bg-white border border-farm-200 shadow-xl space-y-6">
        {/* Step Indicator & Back to Welcome */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/welcome')}
            className="btn-touch px-3 py-1.5 rounded-xl border border-farm-200 bg-farm-50/80 hover:bg-farm-100 text-farm-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={15} />
            <span>{i18n.language === 'kn' ? '← ಹಂತ ೧: ಭಾಷೆ ಆಯ್ಕೆ' : '← Step 1: Language'}</span>
          </button>

          <span className="text-[11px] font-black text-farm-800 bg-farm-100 px-3 py-1 rounded-full uppercase tracking-wider">
            {i18n.language === 'kn' ? 'ಹಂತ ೨ / ೩: ರೈತರ ಪ್ರವೇಶ' : 'Step 2 of 3: Login'}
          </span>
        </div>

        {/* Header Badge & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-farm-100 text-farm-800 flex items-center justify-center mx-auto text-3xl shadow-inner border border-farm-200">
            {avatar}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-farm-900 leading-tight">
            {t('login.title', 'Farmer Login & Setup')}
          </h1>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
            {t('login.subtitle', 'Enter your basic farming details to get personalized offline advice')}
          </p>
        </div>

        {/* Avatar Picker */}
        <div>
          <label className="block text-[11px] md:text-xs font-bold text-gray-700 uppercase tracking-wider text-center mb-2">
            {t('login.avatarLabel', 'Select Farm Icon')}
          </label>
          <div className="flex justify-center gap-2.5">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`btn-touch w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2 transition-transform ${
                  avatar === emoji
                    ? 'border-farm-800 bg-farm-100 scale-110 shadow-sm'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Farmer Full Name */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <User size={15} className="text-farm-700" />
              <span>{t('login.nameLabel', "Farmer's Full Name")} *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('login.namePlaceholder', 'e.g., Basavaraj Gowda')}
              className="w-full btn-touch px-3.5 py-2.5 text-xs md:text-sm font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-farm-700"
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
              placeholder={t('login.phonePlaceholder', 'e.g., 9876543210')}
              className="w-full btn-touch px-3.5 py-2.5 text-xs md:text-sm font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-farm-700"
            />
          </div>

          {/* Village / Taluk / District */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <MapPin size={15} className="text-farm-700" />
              <span>{t('login.villageLabel', 'Village / Taluk / District')}</span>
            </label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder={t('login.villagePlaceholder', 'e.g., Mandya, Maddur')}
              className="w-full btn-touch px-3.5 py-2.5 text-xs md:text-sm font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-farm-700"
            />
          </div>

          {/* Primary Crop & Farm Size in 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Sprout size={15} className="text-farm-700" />
                <span>{t('login.cropLabel', 'Primary Crop')}</span>
              </label>
              <select
                value={primaryCrop}
                onChange={(e) => setPrimaryCrop(e.target.value)}
                className="w-full btn-touch px-3 py-2.5 text-xs md:text-sm font-bold border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-farm-700 capitalize"
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
                className="w-full btn-touch px-3 py-2.5 text-xs md:text-sm font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-farm-700"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full btn-touch py-3.5 px-4 rounded-2xl bg-farm-800 hover:bg-farm-900 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span>{t('login.submitBtn', 'Login to CropCare')}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>

        {/* Quick Demo Login Option */}
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="btn-touch w-full py-2.5 px-3 rounded-xl border border-dashed border-farm-500 bg-farm-50/70 text-farm-900 text-xs md:text-sm font-bold hover:bg-farm-100 flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles size={16} className="text-amber-600" />
            <span>{t('login.demoBtn', 'Quick Demo Login')} (Basavaraj Gowda, Mandya)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
