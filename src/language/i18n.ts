import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from '@/language/en/translate.json';
import frTranslations from '@/language/fr/translate.json';

export const LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Clé localStorage de la langue choisie (compatible avec l'ancienne détection i18next). */
export const LANGUAGE_STORAGE_KEY = 'i18nextLng';

// Démarrage toujours en français (comme le rendu serveur) pour éviter les écarts d'hydratation ;
// la langue préférée est appliquée après montage par I18nProvider.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      fr: { translation: frTranslations },
    },
    lng: 'fr',
    fallbackLng: 'fr',
    supportedLngs: [...LANGUAGES],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

/** Langue préférée : choix enregistré, sinon langue du navigateur (anglais → en). */
export function preferredLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch { /* stockage indisponible */ }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export function setLanguage(lng: Language) {
  try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng); } catch { /* stockage indisponible */ }
  i18n.changeLanguage(lng);
}

export default i18n;
