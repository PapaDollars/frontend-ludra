'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { adminService } from '@/services/admin.service';
import type { AdminSettings, PlanAudience } from '@/types';
import { NumberInput } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { AdminCard, AdminGate, AdminHeader, EmptyRow, useAdminGuard } from '@/components/admin/AdminParts';

const AUDIENCE: Record<PlanAudience, string> = { owner_agent: 'Propriétaire / Agent', candidate: 'Candidats', recruiter: 'Recruteurs' };

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn('relative w-9 h-5 rounded-full transition shrink-0', checked ? 'bg-trust' : 'bg-slate-300')}>
      <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition', checked ? 'left-[18px]' : 'left-0.5')} />
    </button>
  );
}

/** Paramètres produit (M16) : aucun prix critique codé en dur côté front. */
export default function AdminSettingsPage() {
  const guard = useAdminGuard(['manage_settings']);
  const [s, setS] = useState<AdminSettings | null>(null);
  const [saved, setSaved] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { show: showToast, node: toastNode } = useToast();

  useEffect(() => {
    if (guard.allowed) adminService.settings().then((x) => { setS(x); setSaved(JSON.stringify(x)); }).catch(() => setError('Paramètres indisponibles.'));
  }, [guard.allowed]);

  if (!s) return <AdminGate guard={guard}><AdminHeader title="Paramètres" /><AdminCard><EmptyRow>{error ?? 'Chargement…'}</EmptyRow></AdminCard></AdminGate>;

  const dirty = JSON.stringify(s) !== saved;
  const unlockOut = s.contactUnlock.price < s.contactUnlock.min || s.contactUnlock.price > s.contactUnlock.max;

  const setPlan = (code: string, patch: Partial<AdminSettings['plans'][number]>) =>
    setS({ ...s, plans: s.plans.map((p) => (p.code === code ? { ...p, ...patch } : p)) });

  const setRecommended = (audience: PlanAudience, code: string) =>
    setS({ ...s, plans: s.plans.map((p) => (p.audience === audience ? { ...p, recommended: p.code === code } : p)) });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const next = await adminService.saveSettings(guard.actor, s);
      setS(next);
      setSaved(JSON.stringify(next));
      showToast('Paramètres enregistrés (journalisés). Appliqués sans redéploiement.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  };

  const audiences = Object.keys(AUDIENCE) as PlanAudience[];

  return (
    <AdminGate guard={guard}>
      <AdminHeader
        title="Paramètres produit"
        subtitle="Prix, plans, classement et catégories : appliqués immédiatement côté site."
        actions={<button type="button" onClick={save} disabled={!dirty || saving || unlockOut} className="h-10 px-5 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-40">{saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}</button>}
      />
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminCard title="Déblocage contact">
          <label htmlFor="unlock-price" className="text-xs font-medium text-slate-500">Prix par annonce (FCFA)</label>
          <div className="mt-1 flex items-center gap-3">
            <NumberInput id="unlock-price" value={s.contactUnlock.price} step={50} onValueChange={(v) => setS({ ...s, contactUnlock: { ...s.contactUnlock, price: v ?? 0 } })}
              aria-invalid={unlockOut || undefined} aria-describedby="unlock-help" className="!w-32" />
            <span id="unlock-help" className={cn('text-xs', unlockOut ? 'text-red-600' : 'text-slate-500')}>Fourchette autorisée : {s.contactUnlock.min}–{s.contactUnlock.max} FCFA</span>
          </div>
        </AdminCard>

        <AdminCard title="Classement & visibilité (§11)">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="organic" className="text-xs font-medium text-slate-500">Quota de résultats organiques (%)</label>
              <NumberInput id="organic" value={s.ranking.organicQuotaPercent} min={50} max={100} onValueChange={(v) => setS({ ...s, ranking: { ...s.ranking, organicQuotaPercent: v ?? 0 } })} />
            </div>
            <div>
              <label htmlFor="boost" className="text-xs font-medium text-slate-500">Bonus max d&apos;un plan (%)</label>
              <NumberInput id="boost" value={s.ranking.maxPlanBoostPercent} min={0} max={50} onValueChange={(v) => setS({ ...s, ranking: { ...s.ranking, maxPlanBoostPercent: v ?? 0 } })} />
            </div>
          </div>
          <p className="mt-2 flex gap-1.5 text-[11px] text-slate-500"><Info className="w-3.5 h-3.5 shrink-0" /> Un plan payant reste un bonus borné : il ne fait jamais passer un contenu non pertinent devant.</p>
        </AdminCard>

        <AdminCard title="Plans & abonnements" className="lg:col-span-2">
          <div className="flex flex-col gap-5">
            {audiences.map((aud) => (
              <div key={aud}>
                <h3 className="mb-2 text-sm font-semibold text-navy">{AUDIENCE[aud]}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead><tr className="text-left text-xs text-slate-500"><th className="py-1 font-medium">Plan</th><th className="font-medium">Prix (FCFA)</th><th className="font-medium">Durée</th><th className="font-medium">Conseillé</th><th className="font-medium">Actif</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {s.plans.filter((p) => p.audience === aud).map((p) => (
                        <tr key={p.code}>
                          <td className="py-2 font-medium text-navy">{p.name}</td>
                          <td>
                            {p.rank === 0 ? <span className="text-slate-400">Gratuit</span> : (
                              <NumberInput aria-label={`Prix ${p.name} ${AUDIENCE[aud]}`} value={p.price} step={500} onValueChange={(v) => setPlan(p.code, { price: v ?? 0 })} className="!w-28 h-9" />
                            )}
                          </td>
                          <td className="text-slate-500">{p.rank === 0 ? '—' : p.period === 'month' ? 'Mensuel' : `${p.durationDays} jours`}</td>
                          <td><input type="radio" name={`reco-${aud}`} aria-label={`${p.name} conseillé`} checked={p.recommended} onChange={() => setRecommended(aud, p.code)} /></td>
                          <td>{p.rank === 0 ? <span className="text-xs text-slate-400">Toujours</span> : <Switch label={`${p.name} actif`} checked={p.active} onChange={(v) => setPlan(p.code, { active: v })} />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Catégories « Autres services »" className="lg:col-span-2">
          <ul className="grid gap-2 sm:grid-cols-2">
            {s.serviceCategories.map((c) => (
              <li key={c.code} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="text-navy">{c.label} <span className="text-xs text-slate-400">· {c.providerCount} prestataire(s){c.regulated && ' · réglementé'}</span></span>
                <Switch label={`Catégorie ${c.label} active`} checked={c.active} onChange={(v) => setS({ ...s, serviceCategories: s.serviceCategories.map((x) => (x.code === c.code ? { ...x, active: v } : x)) })} />
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
      {toastNode}
    </AdminGate>
  );
}
