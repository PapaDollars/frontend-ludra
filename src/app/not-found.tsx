import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import URL from '@/utilis/url/url_front';

export const metadata: Metadata = { title: 'Page introuvable' };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <SearchX className="mx-auto mb-4 w-12 h-12 text-brand-200" />
      <h1 className="text-xl font-bold text-navy mb-2">Page introuvable</h1>
      <p className="text-sm text-slate-500 mb-6">Le lien est peut-être ancien ou l&apos;offre a été retirée.</p>
      <div className="flex justify-center gap-2">
        <Link href={URL.v2.feed} className="h-10 px-5 inline-flex items-center rounded-lg bg-brand text-white text-sm font-semibold">Retour au feed</Link>
        <Link href={URL.v2.search} className="h-10 px-5 inline-flex items-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-navy">Rechercher</Link>
      </div>
    </div>
  );
}
