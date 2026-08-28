import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  sr: {
    translation: {
      home: 'Početna',
      history: 'Istorija',
      stats: 'Statistika',
      goals: 'Ciljevi',
      settings: 'Podešavanja',
      language: 'Jezik',
      units: 'Mjerne jedinice',
      notifications: 'Notifikacije',
      kilometers: 'Kilometri (km)',
      miles: 'Milje (mi)',
    },
  },
  en: {
    translation: {
      home: 'Home',
      history: 'History',
      stats: 'Stats',
      goals: 'Goals',
      settings: 'Settings',
      language: 'Language',
      units: 'Units of measurement',
      notifications: 'Notifications',
      kilometers: 'Kilometers (km)',
      miles: 'Miles (mi)',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'sr',
  fallbackLng: 'sr',
  interpolation: { escapeValue: false },
});

export default i18n;