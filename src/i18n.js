import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './data/locales/en.json';
import kn from './data/locales/kn.json';

const savedLang = localStorage.getItem('cropcare_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      kn: { translation: kn }
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
