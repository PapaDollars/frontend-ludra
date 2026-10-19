'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Wrench } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { servicesService } from '@/services/services.service';
import type { ServiceCategory } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { CategoryBadge, NotGuaranteedNote, RegulatedNote, ServicesSafetyCard } from './components/ServiceParts';

/** Module 14 — Catalogue « Autres services » (catégories activables en back-office). */
export default function ServicesCatalogPage() {
  const [categories, setCategories] = useState<ServiceCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    servicesService.categories().then(setCategories).catch((e) => setError(e instanceof Error ? e.message : 'Catalogue indisponible.'));
  }, []);

  return (
    <ShellColumns right={<ServicesSafetyCard />}>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <header className="px-4 md:px-0">
          <h1 className="text-xl font-bold text-navy">Autres services liés à l&apos;immobilier</h1>
          <p className="text-sm text-slate-500">Catalogue extensible, même logique de cartes et de confiance.</p>
        </header>

        {error && <p role="alert" className="mx-4 md:mx-0 text-sm text-red-600">{error}</p>}

        <ul className="mx-4 md:mx-0 grid grid-cols-2 lg:grid-cols-4 gap-3" aria-busy={!categories}>
          {(categories ?? Array.from({ length: 8 }, () => null)).map((c, i) => (
            <li key={c?.code ?? i}>
              {c ? (
                <Link
                  href={URL.v2.serviceCategory(c.code)}
                  className="group flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={c} />
                    <span className="font-semibold text-navy text-sm leading-tight">{c.label}</span>
                  </div>
                  <span className="text-xs text-slate-500 flex-1">{c.description}</span>
                  <span className="text-[11px] text-slate-400">{c.providerCount} prestataire{c.providerCount > 1 ? 's' : ''}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    Voir les prestataires <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ) : (
                <div className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse" />
              )}
            </li>
          ))}
        </ul>

        <div className="mx-4 md:mx-0 flex flex-wrap items-center gap-2 rounded-xl bg-service-50 px-4 py-3 text-sm text-service">
          <Wrench className="w-4 h-4 shrink-0" />
          <span className="flex-1 min-w-[200px]">Vous êtes prestataire ? Publiez votre service gratuitement.</span>
          <Link href={URL.v2.publish} className="font-semibold underline">Publier mon service</Link>
        </div>

        <RegulatedNote className="mx-4 md:mx-0" />
        <NotGuaranteedNote className="mx-4 md:mx-0" />
      </div>
    </ShellColumns>
  );
}
