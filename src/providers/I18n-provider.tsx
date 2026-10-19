'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n, { preferredLanguage } from '@/language/i18n';
import { I18nProviderProps } from '@/types/i18Type';

export default function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    const sync = (lng: string) => { document.documentElement.lang = lng; };
    i18n.on('languageChanged', sync);
    const lng = preferredLanguage();
    if (lng !== i18n.language) i18n.changeLanguage(lng);
    else sync(lng);
    return () => { i18n.off('languageChanged', sync); };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
