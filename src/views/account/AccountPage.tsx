'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck, Briefcase, ChevronRight, CreditCard, FileText, Heart, ListChecks, Loader2, LogOut, MessageCircle, Settings, Sparkles, Star,
} from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { formatAmount } from '@/utilis/format';
import { KYC_STATUS_LABEL } from '@/lib/kycRequirements';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useLogout } from '@/hooks/useLogout';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LanguageSwitcher } from '@/components/shell/LanguageSwitcher';
import { accountService } from '@/services/account.service';
import type { AccountOverview } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';

function Tile({ href, label, value, hint, tone }: { href: string; label: string; value: string; hint: string; tone: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand hover:shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', tone)}>{value}</p>
      <p className="text-[11px] text-slate-400">{hint}</p>
    </Link>
  );
}

function Row({ href, icon: Icon, label, value, onClick, danger }: {
  href?: string; icon: typeof Heart; label: string; value?: ReactNode; onClick?: () => void; danger?: boolean;
}) {
  const content = (
    <>
      <Icon className={cn('w-5 h-5', danger ? 'text-red-500' : 'text-slate-400')} />
      <span className={cn('flex-1 text-sm font-medium', danger ? 'text-red-600' : 'text-navy')}>{label}</span>
      {value && <span className="text-xs text-slate-500">{value}</span>}
      {!danger && <ChevronRight className="w-4 h-4 text-slate-300" />}
    </>
  );
  const cls = 'flex items-center gap-3 px-4 py-3 hover:bg-surface w-full text-left';
  return (
    <li>{href ? <Link href={href} className={cls}>{content}</Link> : <button type="button" onClick={onClick} className={cls}>{content}</button>}</li>
  );
}

/** Module 15 — Mon compte : centralise les éléments personnels (mobile : toutes les rubriques ici). */
export default function AccountPage() {
  const { ready, user } = useRequireAuth();
  const logout = useLogout();
  const { t } = useTranslation();
  const [o, setO] = useState<AccountOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    accountService.overview({ name: user?.name ?? undefined, email: user?.email ?? undefined, phone: user?.phone, city: user?.city })
      .then(setO).catch((e) => setError(e instanceof Error ? e.message : 'Compte indisponible.'));
  }, [ready, user?.name, user?.email, user?.phone, user?.city]);

  if (!ready || !o) {
    return <ShellColumns><div className="flex h-[50vh] items-center justify-center">{error ? <p className="text-sm text-red-600">{error}</p> : <Loader2 className="w-6 h-6 animate-spin text-brand" />}</div></ShellColumns>;
  }

  const sub = (aud: string) => o.subscriptions.find((s) => s.audience === aud);

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <section className="mx-4 md:mx-0 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <UserAvatar name={o.user.name} src={o.user.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-navy truncate">{o.user.name}</h1>
            {o.user.status === 'deletion_requested'
              ? <Pill tone="danger-soft">Suppression demandée</Pill>
              : <Pill tone="trust">Compte actif</Pill>}
            <p className="mt-1 text-xs text-slate-500">Mes annonces, favoris, paiements, vérification et paramètres.</p>
          </div>
          <Link href={URL.v2.settings} className="h-9 px-4 inline-flex items-center justify-center rounded-lg border border-brand text-brand text-sm font-semibold hover:bg-brand-50">
            Modifier le profil
          </Link>
        </section>

        <div className="mx-4 md:mx-0 grid grid-cols-2 gap-3">
          <Tile href={URL.v2.myItems} label="Mes annonces" value={String(o.items.total)} hint={`${o.items.active} active${o.items.active > 1 ? 's' : ''} · ${o.items.archived} archivée${o.items.archived > 1 ? 's' : ''}`} tone="text-brand" />
          <Tile href={URL.v2.favorites} label="Favoris" value={String(o.favorites)} hint="Biens et profils sauvegardés" tone="text-perso" />
          <Tile href={URL.v2.messages} label="Messages" value={String(o.messages.total)} hint={`${o.messages.unread} non lu${o.messages.unread > 1 ? 's' : ''}`} tone="text-trust" />
          <Tile href={URL.v2.payments} label="Paiements" value={formatAmount(o.payments.totalSpent).replace('FCFA', 'F')} hint="Historique & reçus" tone="text-caution" />
        </div>

        <ul className="mx-4 md:mx-0 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Row href={URL.v2.certification} icon={BadgeCheck} label="Vérification" value={KYC_STATUS_LABEL[o.kycStatus]} />
          <Row href={URL.v2.subscriptions} icon={Sparkles} label="Abonnement Propriétaire / Agent" value={sub('owner_agent')?.planName ?? 'Aucun'} />
          <Row href={URL.v2.candidatePlans} icon={Briefcase} label="Plan candidat" value={sub('candidate') ? `${sub('candidate')!.planName} · jusqu'au ${new Date(sub('candidate')!.expiresAt).toLocaleDateString('fr-FR')}` : 'Gratuit'} />
          <Row href={URL.v2.recruiterPlans} icon={ListChecks} label="Forfait recruteur" value={sub('recruiter')?.planName ?? 'Aucun'} />
          <Row href={URL.v2.myReviews} icon={Star} label="Mes avis" value={o.pendingReviews ? `${o.pendingReviews} à donner` : undefined} />
          <Row href={URL.v2.messages} icon={MessageCircle} label="Messages" value={o.messages.unread ? `${o.messages.unread} non lus` : undefined} />
          <Row href={URL.v2.payments} icon={CreditCard} label="Paiements & reçus" />
          <Row href={URL.v2.favorites} icon={Heart} label="Favoris" />
          <Row href={URL.v2.settings} icon={Settings} label="Paramètres" value="Compte & sécurité" />
          <Row href={URL.v2.help} icon={FileText} label="Aide & contact" />
          <li className="flex items-center gap-3 px-4 py-3">
            <Globe className="w-5 h-5 text-slate-400" />
            <span className="flex-1 text-sm font-medium text-navy">{t('shell.lang.label')}</span>
            <LanguageSwitcher />
          </li>
          <Row icon={LogOut} label="Se déconnecter" onClick={logout} danger />
        </ul>
      </div>
    </ShellColumns>
  );
}
