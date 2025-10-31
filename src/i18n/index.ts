import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

const LANGUAGE_KEY = 'appLanguage';

const resources = {
  vi: { translation: vi },
  en: { translation: en },
};

// Get saved language or use device language
const getInitialLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en')) {
      return savedLanguage;
    }
  } catch (error) {
    console.warn('Failed to get saved language:', error);
  }
  
  // Fallback to device language
  try {
    const locale = Localization.locale || Localization.getLocales()[0]?.languageCode || 'vi';
    const deviceLanguage = locale.split('-')[0]; // 'en-US' -> 'en'
    return deviceLanguage === 'vi' ? 'vi' : 'vi'; // Default to Vietnamese
  } catch (error) {
    console.warn('Failed to get device language:', error);
    return 'vi'; // Ultimate fallback
  }
};

// Initialize i18n
export const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'vi',
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

// Change language and save to AsyncStorage
export const changeLanguage = async (language: 'vi' | 'en') => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

export default i18n;

