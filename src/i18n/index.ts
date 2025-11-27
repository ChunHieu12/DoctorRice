import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import vi from "./locales/vi.json";

const LANGUAGE_KEY = "appLanguage";
const SUPPORTED_LANGUAGES = ["vi", "en"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  vi: { translation: vi },
  en: { translation: en },
};

const resolveDeviceLanguage = (): SupportedLanguage => {
  try {
    const locale =
      Localization.locale || Localization.getLocales()[0]?.languageCode || "vi";
    const normalized = locale.split("-")[0];
    if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
      return normalized as SupportedLanguage;
    }
    return "vi";
  } catch (error) {
    console.warn("Failed to get device language:", error);
    return "vi";
  }
};

// Get saved language or use device language
const getInitialLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (
      savedLanguage &&
      SUPPORTED_LANGUAGES.includes(savedLanguage as SupportedLanguage)
    ) {
      return savedLanguage as SupportedLanguage;
    }
  } catch (error) {
    console.warn("Failed to get saved language:", error);
  }

  // Fallback to device language (default to Vietnamese)
  return resolveDeviceLanguage();
};

// Initialize i18n
export const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: "vi",
    compatibilityJSON: "v3",
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
export const changeLanguage = async (language: "vi" | "en") => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error("Failed to change language:", error);
  }
};

export default i18n;
