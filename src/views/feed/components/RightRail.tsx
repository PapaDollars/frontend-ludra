'use client';

import { useEffect, useState } from 'react';
import { feedService } from '@/services/feed.service';
import type { Publisher, Universe } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';

const SAFETY_TIPS = [
  'Visitez le bien avant paiement',
  "Vérifiez l'identité du publieur",
  'Terrain : vérifiez le titre foncier',
];

export function SafetyCard() {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4">
      <h2 className="font-semibold text-navy mb-3">Sécurité avant tout</h2>
      <ul className="space-y-2">
        {SAFETY_TIPS.map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-trust shrink-0" />
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VerifiedAccountsCard({ universe }: { universe?: Universe }) {
  const [accounts, setAccounts] = useState<Publisher[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    feedService.getSuggestedAccounts(universe)
      .then((a) => { if (!cancelled) setAccounts(a); })
      .catch(() => { if (!cancelled) setAccounts([]); });
    return () => { cancelled = true; };
  }, [universe]);

  if (accounts && accounts.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4">
      <h2 className="font-semibold text-navy mb-3">Comptes vérifiés</h2>
      <ul className="space-y-3">
        {accounts === null
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2 animate-pulse">
                <span className="w-8 h-8 rounded-full bg-slate-100" />
                <span className="h-3 w-24 rounded bg-slate-100" />
              </li>
            ))
          : accounts.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <UserAvatar name={p.name} src={p.avatar} size="sm" />
                <span className="text-sm font-medium text-navy truncate flex-1">{p.name}</span>
                {p.verified && <Pill tone="trust-soft" className="!text-[9px]">Vérifié</Pill>}
              </li>
            ))}
      </ul>
    </section>
  );
}
