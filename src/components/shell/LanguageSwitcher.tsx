'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/utilis/utils';
import { LANGUAGES, setLanguage, type Language } from '@/language/i18n';

/** Bascule FR / EN (interface de navigation ; les contenus restent en français). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const current = (i18n.language?.startsWith('en') ? 'en' : 'fr') as Language;

  return (
    <div role="group" aria-label={t('shell.lang.switch')} className={cn('inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5', className)}>
      <Globe className="w-3.5 h-3.5 mx-1 text-slate-400" aria-hidden="true" />
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          lang={lng}
          aria-pressed={current === lng}
          aria-label={t(`shell.lang.${lng}`)}
          onClick={() => setLanguage(lng)}
          className={cn('h-6 px-2 rounded-full text-[11px] font-semibold uppercase', current === lng ? 'bg-brand text-white' : 'text-slate-500 hover:text-navy')}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}
