import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Calculator,
  Layers,
  Activity,
  BookOpen,
  User,
  Globe,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Sparkles,
  ChevronRight,
  Radio,
  Volume2,
  Share2,
  PhoneCall,
  Check,
  BellRing,
  AlertTriangle,
  Calendar,
  MessageSquareHeart,
  ChevronDown
} from 'lucide-react';
import { getFarmerProfile } from '../services/db';
import OfflineBadge from '../components/OfflineBadge';
import villagesData from '../data/villages.json';
import {
  getVillageAlert,
  buildWhatsAppShareText,
  speakAlertOutLoud
} from '../services/alertsService';
import { stopAudio } from '../services/voice';

export default function HomeHub() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState(null);
  const [selectedVillageId, setSelectedVillageId] = useState(villagesData.villages[0].id);
  const [activeAlert, setActiveAlert] = useState(null);
  const [isSpeakingAlert, setIsSpeakingAlert] = useState(false);
  const [isCopiedAlert, setIsCopiedAlert] = useState(false);
  const [dueReminder, setDueReminder] = useState(null);

  useEffect(() => {
    loadData();
    checkDueReminders();
  }, []);

  const loadData = async () => {
    const profile = await getFarmerProfile();
    setFarmer(profile);

    // Match village with farmer profile
    let initialVillageId = villagesData.villages[0].id;
    if (profile?.village) {
      const match = villagesData.villages.find((v) =>
        profile.village.toLowerCase().includes(v.name.toLowerCase()) ||
        v.nameKn?.includes(profile.village) ||
        profile.village.toLowerCase().includes(v.district.toLowerCase())
      );
      if (match) initialVillageId = match.id;
    }
    setSelectedVillageId(initialVillageId);
    loadAlertForVillage(initialVillageId, profile?.acres || 2.5);
  };

  const loadAlertForVillage = async (villageId, acres = 2.5) => {
    const village = villagesData.villages.find((v) => v.id === villageId) || villagesData.villages[0];
    const alert = await getVillageAlert(village, acres);
    setActiveAlert(alert);
  };

  const handleVillageChange = (newVillageId) => {
    setSelectedVillageId(newVillageId);
    loadAlertForVillage(newVillageId, farmer?.acres || 2.5);
  };

  const checkDueReminders = () => {
    try {
      const raw = localStorage.getItem('krishi_check_reminders');
      if (raw) {
        const reminders = JSON.parse(raw);
        const now = Date.now();
        // Check if any reminder is 7 days old or flagged as due
        const due = reminders.find((r) => now >= r.dueTimestamp || r.isDueNow);
        if (due) setDueReminder(due);
      }
    } catch (err) {
      console.warn('Error reading reminders:', err);
    }
  };

  const handleReadAloud = () => {
    if (!activeAlert) return;
    stopAudio();
    setIsSpeakingAlert(true);
    speakAlertOutLoud(activeAlert, i18n.language, () => {
      setIsSpeakingAlert(false);
    });
  };

  const handleShareWhatsApp = async () => {
    if (!activeAlert) return;
    const text = buildWhatsAppShareText(activeAlert, i18n.language, farmer?.acres || 2.5);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setIsCopiedAlert(true);
        setTimeout(() => setIsCopiedAlert(false), 3000);
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const farmerName = farmer?.name || (i18n.language === 'kn' ? 'ಬಸವರಾಜ್ ಗೌಡ' : 'Basavaraj Gowda');
  const farmerVillage = farmer?.village || (i18n.language === 'kn' ? 'ಮಂಡ್ಯ, ಮದ್ದೂರು' : 'Mandya, Maddur');
  const farmerCrop = farmer?.primaryCrop || 'tomato';
  const farmerAcres = farmer?.acres || 2.5;
  const farmerAvatar = farmer?.avatar || '👨‍🌾';

  // The distinct features, presented LINE BY LINE as separate sub-page options
  const featureList = [
    {
      to: '/scan',
      number: '1',
      title: i18n.language === 'kn' ? 'ಎಲೆ ರೋಗ ಪತ್ತೆ ಸ್ಕ್ಯಾನರ್' : 'Leaf Disease Scanner',
      subtitle: i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: /scan' : 'Dedicated Page: /scan',
      desc: i18n.language === 'kn'
        ? 'ಕ್ಯಾಮೆರಾ ಫೋಟೋ ಸ್ಕ್ಯಾನ್, ಮಸುಕು ಮತ್ತು ಕತ್ತಲೆ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷೆ, ಆನ್-ಡಿವೈಸ್ AI ರೋಗ ಪತ್ತೆ ಮತ್ತು ಸಾವಯವ & ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆಗಳು.'
        : 'Live camera or photo upload, blur and darkness quality checks, on-device AI neural disease detection, and organic & chemical spray recipes.',
      badge: i18n.language === 'kn' ? 'ಕ್ಯಾಮೆರಾ & AI' : 'Camera & AI Scanner',
      icon: Camera,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      iconBg: 'bg-emerald-600 text-white',
      btnText: i18n.language === 'kn' ? 'ಸ್ಕ್ಯಾನರ್ ಪುಟ ತೆರೆಯಿರಿ' : 'Open Leaf Scanner Page'
    },
    {
      to: '/cost',
      number: '2',
      title: i18n.language === 'kn' ? 'ಔಷಧ ಚಿಕಿತ್ಸಾ ವೆಚ್ಚ ಲೆಕ್ಕಾಚಾರ' : 'Treatment Cost Calculator',
      subtitle: i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: /cost' : 'Dedicated Page: /cost',
      desc: i18n.language === 'kn'
        ? 'ನಿಮ್ಮ ಜಮೀನಿನ ಎಕರೆಗೆ ಸಾವಯವ ಮತ್ತು ರಾಸಾಯನಿಕ ಔಷಧಿ ವೆಚ್ಚ ಲೆಕ್ಕಾಚಾರ, ಬೆಲೆ ತಿದ್ದುಪಡಿ ಮತ್ತು ಅತಿ ಕಡಿಮೆ ವೆಚ್ಚದ ಆಯ್ಕೆ ವಿಂಗಡಣೆ.'
        : 'Calculate total treatment expenses per acre for any crop disease, edit local market pesticide prices, and sort by cheapest or best value.',
      badge: i18n.language === 'kn' ? 'ವೆಚ್ಚ & ಬಜೆಟ್' : 'Cost & Budget Calculator',
      icon: Calculator,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      iconBg: 'bg-amber-600 text-white',
      btnText: i18n.language === 'kn' ? 'ವೆಚ್ಚ ಲೆಕ್ಕ ಪುಟ ತೆರೆಯಿರಿ' : 'Open Cost Calculator Page'
    },
    {
      to: '/fields',
      number: '3',
      title: i18n.language === 'kn' ? 'ನನ್ನ ಬೆಳೆಗಳು ಮತ್ತು ಜಮೀನು' : 'My Crop Fields & Plots',
      subtitle: i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: /fields' : 'Dedicated Page: /fields',
      desc: i18n.language === 'kn'
        ? 'ನಿಮ್ಮ ಕೃಷಿ ಜಮೀನುಗಳನ್ನು ನೋಂದಾಯಿಸಿ, ಎಕರೆ ವಿಸ್ತೀರ್ಣ, ಬೆಳೆಯ ಹೆಸರು ಮತ್ತು ಬಿತ್ತನೆ ದಿನಾಂಕಗಳನ್ನು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ನಿರ್ವಹಿಸಿ.'
        : 'Register and manage your farm plots, acreage size, crop varieties, and sowing dates completely offline.',
      badge: i18n.language === 'kn' ? 'ಜಮೀನು ನಿರ್ವಹಣೆ' : 'Field Plots Manager',
      icon: Layers,
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      iconBg: 'bg-teal-700 text-white',
      btnText: i18n.language === 'kn' ? 'ಜಮೀನು ಪುಟ ತೆರೆಯಿರಿ' : 'Open Fields Manager Page'
    },
    {
      to: '/analytics',
      number: '4',
      title: i18n.language === 'kn' ? 'ಆರೋಗ್ಯ ಇತಿಹಾಸ ಮತ್ತು ಚಾರ್ಟ್' : 'Health History & Analytics',
      subtitle: i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: /analytics' : 'Dedicated Page: /analytics',
      desc: i18n.language === 'kn'
        ? 'ರೋಗಗಳ ಕಾಲಾನುಕ್ರಮದ Recharts ಬಾರ್ ಚಾರ್ಟ್, ಜೀವಿತಾವಧಿ ಸ್ಕ್ಯಾನ್ ದಾಖಲೆಗಳು, ಆರೋಗ್ಯಕರ vs ರೋಗಗ್ರಸ್ತ ಎಲೆಗಳ ಅಂಕಿಅಂಶಗಳು.'
        : 'Interactive Recharts disease occurrence trends over time, lifetime farm scan statistics, and healthy vs diseased leaf logs.',
      badge: i18n.language === 'kn' ? 'ವರದಿ & ಚಾರ್ಟ್' : 'Charts & Health History',
      icon: Activity,
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      iconBg: 'bg-indigo-700 text-white',
      btnText: i18n.language === 'kn' ? 'ಇತಿಹಾಸ ಪುಟ ತೆರೆಯಿರಿ' : 'Open Analytics & History Page'
    },
    {
      to: '/solutions',
      number: '5',
      title: i18n.language === 'kn' ? 'ಬೆಳೆ ರೋಗಗಳ ಮಾಹಿತಿ ಕೋಶ' : 'Crop Disease Encyclopedia Guide',
      subtitle: i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: /solutions' : 'Dedicated Page: /solutions',
      desc: i18n.language === 'kn'
        ? 'ಟೊಮೇಟೊ, ಆಲೂಗಡ್ಡೆ, ಮೆಕ್ಕೆಜೋಳ, ಭತ್ತ ಮತ್ತು ಮೆಣಸಿನಕಾಯಿ ಬೆಳೆಗಳ ರೋಗ ಲಕ್ಷಣಗಳು, ತಡೆಗಟ್ಟುವ ಕ್ರಮಗಳು ಮತ್ತು ಸಾವಯವ ಔಷಧಗಳು.'
        : 'Searchable offline dictionary of 16 common crop diseases, leaf symptom photos, preventive measures, and university spray schedules.',
      badge: i18n.language === 'kn' ? 'ಮಾಹಿತಿ ಕೋಶ' : 'Disease Encyclopedia',
      icon: BookOpen,
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      iconBg: 'bg-blue-700 text-white',
      btnText: i18n.language === 'kn' ? 'ಮಾಹಿತಿ ಪುಟ ತೆರೆಯಿರಿ' : 'Open Encyclopedia Page'
    },
    {
      to: '/profile',
      number: '6',
      title: i18n.language === 'kn' ? 'ರೈತರ ವಿವರ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್ಸ್' : 'Farmer Profile & Offline Settings',
      subtitle: i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: /profile' : 'Dedicated Page: /profile',
      desc: i18n.language === 'kn'
        ? 'ರೈತರ ಹೆಸರು, ಮೊಬೈಲ್, ಗ್ರಾಮ, ಮುಖ್ಯ ಬೆಳೆ ಮತ್ತು 100% ಆಫ್‌ಲೈನ್ IndexedDB ಡೇಟಾಬೇಸ್ ಮೆಮೊರಿ ನಿರ್ವಹಣೆ.'
        : 'Edit personal farm parameters, phone, village, primary crop, and review 100% offline IndexedDB database storage.',
      badge: i18n.language === 'kn' ? 'ಖಾತೆ ವಿವರಗಳು' : 'Farmer Account',
      icon: User,
      badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
      iconBg: 'bg-slate-700 text-white',
      btnText: i18n.language === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಪುಟ ತೆರೆಯಿರಿ' : 'Open Profile Page'
    },
    {
      to: '/welcome',
      number: '7',
      title: i18n.language === 'kn' ? 'ಭಾಷೆ ಆಯ್ಕೆ ಪ್ರಾರಂಭಿಕ ಪುಟ' : 'Language Selection Starting Page',
      subtitle: i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: /welcome' : 'Dedicated Page: /welcome',
      desc: i18n.language === 'kn'
        ? 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ಭಾಷೆಯ ನಡುವೆ ಬದಲಿಸಿ, ಧ್ವನಿ ಮಾದರಿಗಳನ್ನು ಆಲಿಸಿ ಮತ್ತು ಆಪ್ ಪ್ರಾರಂಭಿಕ ಪುಟವನ್ನು ವೀಕ್ಷಿಸಿ.'
        : 'Switch between Kannada (ಕನ್ನಡ) and English, test spoken voice greeting samples, and view the initial welcome starting page.',
      badge: i18n.language === 'kn' ? 'ಭಾಷೆ & ಧ್ವನಿ' : 'Language & Voice',
      icon: Globe,
      badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      iconBg: 'bg-emerald-800 text-white',
      btnText: i18n.language === 'kn' ? 'ಭಾಷೆ ಪುಟ ತೆರೆಯಿರಿ' : 'Open Language Page'
    },
    {
      to: '/outbreaks',
      number: '8',
      title: i18n.language === 'kn' ? 'ಪ್ರಾದೇಶಿಕ ರೋಗ ಹರಡುವಿಕೆ & ಎಚ್ಚರಿಕೆ ನಕ್ಷೆ' : 'Regional Outbreaks & Early Warning Map',
      subtitle: i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: /outbreaks' : 'Dedicated Page: /outbreaks',
      desc: i18n.language === 'kn'
        ? 'ನೆರೆಹೊರೆಯ ಜಿಲ್ಲೆಗಳಿಂದ ಹರಡುತ್ತಿರುವ ರೋಗಗಳ ಲೈವ್ ನಕ್ಷೆ, ಗ್ರಾಮ ಮಟ್ಟದ ಅಪಾಯ & ಆರ್ಥಿಕ ನಷ್ಟ ಲೆಕ್ಕಾಚಾರ, ಸುತ್ತಮುತ್ತಲಿನ ರೈತರಿಗೆ ತುರ್ತು ಎಚ್ಚರಿಕೆ.'
        : 'Interactive regional outbreak map, village-level risk layer with Rupee loss calculations, and neighboring farmer spread alerts.',
      badge: i18n.language === 'kn' ? 'ರೋಗ ಹರಡುವಿಕೆ & ನಕ್ಷೆ' : 'Village Risk & Map',
      icon: Radio,
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      iconBg: 'bg-rose-600 text-white',
      btnText: i18n.language === 'kn' ? 'ಎಚ್ಚರಿಕೆ ನಕ್ಷೆ ತೆರೆಯಿರಿ' : 'Open Outbreaks Map Page'
    },
    {
      to: '/alerts',
      number: '9',
      title: i18n.language === 'kn' ? 'ಗ್ರಾಮ ಮಟ್ಟದ ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳು & ಔಷಧ ವೆಚ್ಚ' : 'Village Early Warning Alerts & Plans',
      subtitle: i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: /alerts' : 'Dedicated Page: /alerts',
      desc: i18n.language === 'kn'
        ? 'ಸ್ಥಳೀಯ ಭಾಷೆಯಲ್ಲಿ ಗ್ರಾಮ ರೋಗ ಎಚ್ಚರಿಕೆಗಳು, ಮುಂದಿನ ೩ ದಿನಗಳ ಮುನ್ನೆಚ್ಚರಿಕೆ ಕ್ರಮಗಳು, ಔಷಧ ವೆಚ್ಚ ಮತ್ತು ವಾಟ್ಸಾಪ್ ಹಂಚಿಕೆ.'
        : 'Localized village disease alerts, 3-day emergency preventive spray plans, cost calculators per acre, and WhatsApp sharing.',
      badge: i18n.language === 'kn' ? 'ಎಚ್ಚರಿಕೆ & ಪರಿಹಾರ' : 'Village Alerts & Plan',
      icon: BellRing,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      iconBg: 'bg-amber-700 text-white',
      btnText: i18n.language === 'kn' ? 'ಎಚ್ಚರಿಕೆ ಪುಟ ತೆರೆಯಿರಿ' : 'Open Village Alerts Page'
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-farm-100 text-farm-900 border border-farm-200 text-xs font-black shadow-sm uppercase tracking-wider">
          <Sparkles size={13} className="text-amber-600" />
          <span>{i18n.language === 'kn' ? 'ಹಂತ ೩ / ೩: ಮುಖ್ಯ ಪುಟ (Main Dashboard)' : 'Step 3 of 3: Main Dashboard'}</span>
        </span>

        <button
          type="button"
          onClick={() => navigate('/welcome')}
          className="btn-touch px-3 py-1 rounded-xl border border-farm-300 bg-white hover:bg-farm-50 text-farm-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Globe size={13} className="text-farm-700" />
          <span>{i18n.language === 'kn' ? 'ಭಾಷೆ ಬದಲಿಸಿ / Welcome Page' : 'Change Language / Welcome Page'}</span>
        </button>
      </div>

      {/* Top Personalized Farmer Hero Banner */}
      <div className="farm-card rounded-3xl p-6 bg-gradient-to-br from-farm-900 via-farm-800 to-farm-700 text-white shadow-xl border border-farm-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {farmerAvatar}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-farm-200 bg-farm-950/50 px-2.5 py-0.5 rounded-full border border-farm-600/50">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>{t('hub.farmerBadge', 'Verified Farmer')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 leading-snug">
                {t('hub.greeting', { name: farmerName })}
              </h1>
              <div className="flex items-center gap-2 text-xs text-farm-100 mt-1 flex-wrap">
                <MapPin size={13} className="text-amber-300 shrink-0" />
                <span>{farmerVillage}</span>
                <span>•</span>
                <span className="capitalize">{t(`crops.${farmerCrop}`, farmerCrop)}</span>
                <span>•</span>
                <span>{farmerAcres} {t('cost.acres', 'acres')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => navigate('/scan')}
              className="btn-touch px-4 py-2.5 rounded-xl bg-amberGold hover:bg-amberGold-hover text-white text-xs font-black shadow flex items-center gap-1.5"
            >
              <Camera size={16} />
              <span>{t('home.scanLeafBtn', 'Quick Scan')}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="btn-touch px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-bold"
            >
              {t('login.editProfile', 'Edit')}
            </button>
          </div>
        </div>
      </div>

      {/* FEATURE 3: 7-DAY TREATMENT CHECK DUE REMINDER BANNER (If Due) */}
      {dueReminder && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <MessageSquareHeart size={22} className="animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                ⏰ {t('feedback.reminderDue', '7-Day Treatment Check Due!')}
              </span>
              <h3 className="text-base font-black text-amber-950 mt-1">
                {t('feedback.reminderDueDesc', { disease: dueReminder.diseaseName || 'Crop Disease' })}
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {i18n.language === 'kn'
                  ? 'ನಿಮ್ಮ ಚಿಕಿತ್ಸೆಯ ಫಲಿತಾಂಶವನ್ನು ದಾಖಲಿಸಿ ಮತ್ತು ಹತ್ತಿರದ ಇತರ ರೈತರಿಗೆ ನೆರವಾಗಿ.'
                  : 'Record how your crop responded to help build treatment recommendations for farmers nearby.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/scan')}
            className="btn-touch px-4 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs shadow hover:bg-amber-900 shrink-0 self-start sm:self-center"
          >
            {t('feedback.giveFeedback', 'Record Treatment Outcome')}
          </button>
        </div>
      )}

      {/* FEATURE 2: VILLAGE SELECTION & EARLY WARNING ALERT CARD */}
      <div className="space-y-3">
        {/* Village Picker Pill */}
        <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-farm-200 shadow-2xs flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-rose-600" />
            <span className="text-xs font-bold text-gray-700">
              {t('alerts.selectVillagePrompt', 'Choose your village to see localized alerts:')}
            </span>
          </div>

          <select
            value={selectedVillageId}
            onChange={(e) => handleVillageChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-farm-300 bg-farm-50 text-xs font-extrabold text-farm-900 focus:outline-hidden focus:ring-2 focus:ring-farm-600 cursor-pointer"
          >
            {villagesData.villages.map((v) => (
              <option key={v.id} value={v.id}>
                {i18n.language === 'kn' ? v.nameKn : v.name} ({v.district}, {v.state})
              </option>
            ))}
          </select>
        </div>

        {/* ACTIVE VILLAGE ALERT CARD (Shown when village has High or Critical Risk) */}
        {activeAlert && (
          <div
            className={`rounded-3xl p-5 sm:p-6 border-2 shadow-lg space-y-4 animate-fade-in ${
              activeAlert.riskLevel === 'Critical'
                ? 'bg-gradient-to-br from-rose-950 via-rose-900 to-red-900 text-white border-rose-500'
                : activeAlert.riskLevel === 'High'
                ? 'bg-gradient-to-br from-amber-950 via-orange-900 to-amber-900 text-white border-orange-500'
                : 'bg-white text-gray-900 border-farm-200'
            }`}
          >
            {/* Alert Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/20 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md">
                    {activeAlert.riskLevel === 'Critical' && '🔴 CRITICAL EARLY WARNING'}
                    {activeAlert.riskLevel === 'High' && '🟠 HIGH RISK SPREAD ALERT'}
                    {activeAlert.riskLevel !== 'Critical' && activeAlert.riskLevel !== 'High' && '🟡 MODERATE MONITORING'}
                  </span>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md">
                    {t('villages.sampleDataBadge', 'Sample data for demo')}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black leading-snug">
                  {i18n.language === 'kn'
                    ? `${activeAlert.villageNameKn} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ${activeAlert.diseaseNameKn} ರೋಗ ಹರಡುತ್ತಿದೆ!`
                    : `${activeAlert.diseaseNameEn} Spreading near ${activeAlert.villageName}!`}
                </h3>

                <p className="text-xs opacity-90 font-medium">
                  {t('alerts.howNear', { dist: activeAlert.distanceKm })} • {t('alerts.howSerious', { severity: activeAlert.riskLevel })} • {activeAlert.cases15km} {i18n.language === 'kn' ? 'ಪ್ರಕರಣಗಳು' : 'confirmed cases within 15 km'}
                </p>
              </div>

              {/* Read Aloud & Share WhatsApp Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-start">
                <button
                  type="button"
                  onClick={handleReadAloud}
                  className="btn-touch px-3 py-1.5 rounded-xl bg-white text-gray-900 font-bold text-xs flex items-center gap-1.5 shadow hover:bg-gray-100 transition-colors"
                  title="Read aloud alert in chosen language"
                >
                  <Volume2 size={15} className={`text-rose-700 ${isSpeakingAlert ? 'animate-pulse' : ''}`} />
                  <span>{isSpeakingAlert ? (i18n.language === 'kn' ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Reading...') : t('alerts.readAloud', 'Read Aloud')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="btn-touch px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow hover:bg-emerald-700 transition-colors"
                  title="Share formatted alert on WhatsApp"
                >
                  {isCopiedAlert ? <Check size={15} /> : <Share2 size={15} />}
                  <span>{isCopiedAlert ? t('alerts.shareCopied', 'Copied!') : t('alerts.shareWhatsApp', 'Share')}</span>
                </button>
              </div>
            </div>

            {/* PREVENTIVE ACTION PLAN (3 TO 5 NUMBERED STEPS) */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider block flex items-center gap-1.5 text-amber-200">
                <Calendar size={14} />
                <span>{t('alerts.whatToDo', 'Action Plan for the Next 3 Days')}:</span>
              </span>

              <ol className="space-y-1.5 text-xs opacity-95">
                {(i18n.language === 'kn' ? activeAlert.stepsKn : activeAlert.stepsEn).map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-white/30 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* ESTIMATED PREVENTIVE COST RANGE & FARM AREA TOTAL */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] opacity-80 block font-bold">
                  {t('alerts.costRange', 'Estimated preventive cost')}:
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-extrabold text-sm text-amber-200">
                    {activeAlert.costPerAcreText} / {t('villages.acresUnit', 'acre')}
                  </span>
                  <span className="opacity-60">•</span>
                  <span className="font-bold">
                    {i18n.language === 'kn' ? `ನಿಮ್ಮ ${farmer?.acres || 2.5} ಎಕರೆಗೆ: ` : `For your ${farmer?.acres || 2.5} acres: `}
                    <b className="text-white">{activeAlert.farmerTotalCostText}</b>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => navigate('/outbreaks')}
                  className="btn-touch px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold"
                >
                  {i18n.language === 'kn' ? 'ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ' : 'View on Map'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/alerts')}
                  className="btn-touch px-3 py-1.5 rounded-xl bg-white text-gray-950 font-bold text-xs"
                >
                  {t('alerts.viewAllAlerts', 'View All Village Alerts')}
                </button>
              </div>
            </div>

            {/* KISAN HELPLINE & MANDATORY ADVISORY DISCLAIMER */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] opacity-80">
              <div className="flex items-center gap-1.5 font-bold">
                <PhoneCall size={13} className="text-amber-300" />
                <span>{t('alerts.kisanCallCentre', 'Kisan Call Centre Helpline: 1800-180-1551 (Toll-Free)')}</span>
              </div>
              <div className="italic text-[10px]">
                ⚠️ {t('alerts.disclaimer', 'Consult your local agriculture officer before applying any chemical.')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Directory Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-farm-900 tracking-tight">
            {i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಸೇವಾ ಪುಟಗಳು (Dedicated Pages)' : 'Dedicated Feature Pages (Line by Line)'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            {i18n.language === 'kn'
              ? 'ಪ್ರತಿಯೊಂದು ವೈಶಿಷ್ಟ್ಯಕ್ಕೂ ತನ್ನದೇ ಆದ ಪ್ರತ್ಯೇಕ ಪುಟವಿದೆ. ಕೆಳಗಿನ ಯಾವುದೇ ಪುಟವನ್ನು ತೆರೆಯಿರಿ:'
              : 'Every feature has its own distinct separate page. Select any module below to open its dedicated screen:'}
          </p>
        </div>
        <OfflineBadge compact={true} />
      </div>

      {/* LINE BY LINE FEATURE DIRECTORY */}
      <div className="space-y-4">
        {featureList.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={feature.number}
              className="farm-card rounded-3xl p-5 sm:p-6 bg-white border border-farm-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                  <IconComponent size={28} />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-farm-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {feature.number}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 group-hover:text-farm-800 transition-colors">
                      {feature.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${feature.badgeColor}`}>
                      {feature.badge}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-farm-700">
                    {feature.subtitle}
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
                    {feature.desc}
                  </p>
                </div>
              </div>

              <div className="md:self-center shrink-0 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={() => navigate(feature.to)}
                  className="btn-touch w-full md:w-auto px-5 py-2.5 rounded-xl bg-farm-800 hover:bg-farm-900 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 group-hover:bg-farm-950 transition-all"
                >
                  <span>{feature.btnText}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
