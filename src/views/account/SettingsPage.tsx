'use client';

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Loader2, LogOut, ShieldAlert } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useLogout } from '@/hooks/useLogout';
import { accountService } from '@/services/account.service';
import { searchService } from '@/services/search.service';
import type { AccountProfile, NotificationPreferences, SearchOptions } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Field, SelectInput, TextInput, errorProps } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { normalizeCmPhone } from '@/components/payment/MobileMoneyCheckout';

function Card({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-4 md:mx-0 rounded-2xl border border-slate-200 bg-white p-4 md:p-5 scroll-mt-20">
      <h2 id={`${id}-title`} className="font-semibold text-navy">{title}</h2>
      {description && <p className="text-xs text-slate-500 mb-3">{description}</p>}
      <div className={description ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 text-sm text-navy cursor-pointer">
      {label}
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative w-10 h-6 rounded-full transition shrink-0', checked ? 'bg-brand' : 'bg-slate-300')}
      >
        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition', checked ? 'left-[18px]' : 'left-0.5')} />
      </button>
    </label>
  );
}

/** Paramètres : profil public, coordonnées privées, notifications, sécurité, données (M15). */
export default function SettingsPage() {
  const { ready, user } = useRequireAuth();
  const logout = useLogout();
  const fallback = useMemo(() => ({ name: user?.name ?? undefined, email: user?.email ?? undefined, phone: user?.phone, city: user?.city }), [user?.name, user?.email, user?.phone, user?.city]);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [form, setForm] = useState({ name: '', city: '', phone: '', whatsapp: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [options, setOptions] = useState<SearchOptions | null>(null);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { show: showToast, node: toastNode } = useToast();

  useEffect(() => {
    if (!ready) return;
    accountService.profile(fallback).then((p) => {
      setProfile(p);
      setForm({ name: p.name, city: p.city ?? '', phone: p.phone ?? '', whatsapp: p.whatsapp ?? '' });
    }).catch(() => showToast('Profil indisponible'));
    accountService.preferences().then(setPrefs).catch(() => undefined);
    searchService.getOptions().then(setOptions).catch(() => undefined);
  }, [ready, fallback, showToast]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Indiquez votre nom.';
    if (form.phone && !normalizeCmPhone(form.phone)) errs.phone = 'Numéro invalide (ex. 6 77 12 34 56).';
    if (form.whatsapp && !normalizeCmPhone(form.whatsapp)) errs.whatsapp = 'Numéro WhatsApp invalide.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving('profile');
    try {
      setProfile(await accountService.updateProfile(fallback, {
        name: form.name.trim(), city: form.city || undefined,
        phone: form.phone ? `+237${normalizeCmPhone(form.phone)}` : undefined,
        whatsapp: form.whatsapp ? `+237${normalizeCmPhone(form.whatsapp)}` : null,
      }));
      showToast('Profil enregistré');
    } catch (err) { showToast(err instanceof Error ? err.message : 'Enregistrement impossible'); }
    finally { setSaving(null); }
  };

  const onAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return showToast('Photo JPG/PNG/WebP, 5 Mo maximum.');
    try { setProfile(await accountService.uploadAvatar(fallback, file)); showToast('Photo mise à jour'); } catch { showToast('Envoi impossible'); }
  };

  const savePrefs = async (next: NotificationPreferences) => {
    setPrefs(next);
    try { await accountService.setPreferences(next); } catch { showToast('Préférences non enregistrées'); }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwd.next.length < 8) return setPwdError('8 caractères minimum.');
    if (pwd.next !== pwd.confirm) return setPwdError('Les deux mots de passe ne correspondent pas.');
    setPwdError(null);
    setSaving('pwd');
    try { await accountService.changePassword(pwd.current, pwd.next); setPwd({ current: '', next: '', confirm: '' }); showToast('Mot de passe modifié'); }
    catch (err) { setPwdError(err instanceof Error ? err.message : 'Modification impossible'); }
    finally { setSaving(null); }
  };

  const logoutAll = async () => {
    try { await accountService.logoutAll(); showToast('Déconnecté de tous les appareils'); await logout(); } catch { showToast('Action impossible'); }
  };

  const toggleDeletion = async (requested: boolean) => {
    try { setProfile(await accountService.setDeletionRequested(fallback, requested)); setDeleteOpen(false); showToast(requested ? 'Demande de suppression enregistrée' : 'Demande annulée'); }
    catch { showToast('Action impossible'); }
  };

  if (!ready || !profile) return <ShellColumns><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>{toastNode}</ShellColumns>;

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <h1 className="px-4 md:px-0 text-xl font-bold text-navy">Paramètres</h1>

        <Card id="profil" title="Profil" description="Nom, ville et photo sont visibles sur vos publications.">
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={profile.name} src={profile.avatar} size="lg" />
              <button type="button" onClick={() => fileInput.current?.click()} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-navy"><Camera className="w-4 h-4" /> Changer la photo</button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={onAvatar} className="hidden" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nom affiché" htmlFor="s-name" error={errors.name} required>
                <TextInput {...errorProps('s-name', errors.name)} value={form.name} maxLength={60} onChange={set('name')} />
              </Field>
              <Field label="Ville" htmlFor="s-city">
                <SelectInput id="s-city" value={form.city} onChange={set('city')}>
                  <option value="">—</option>
                  {options?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </SelectInput>
              </Field>
            </div>
            <h3 className="text-sm font-semibold text-navy">Coordonnées privées</h3>
            <p className="-mt-3 text-xs text-slate-500">Jamais affichées publiquement : votre téléphone n&apos;est révélé qu&apos;après un déblocage payé sur vos annonces.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="E-mail" htmlFor="s-email" hint="Contactez le support pour le modifier.">
                <TextInput id="s-email" value={profile.email} disabled />
              </Field>
              <Field label="Téléphone" htmlFor="s-phone" error={errors.phone}>
                <TextInput {...errorProps('s-phone', errors.phone)} type="tel" value={form.phone} onChange={set('phone')} placeholder="6 77 12 34 56" />
              </Field>
              <Field label="WhatsApp" htmlFor="s-whatsapp" error={errors.whatsapp}>
                <TextInput {...errorProps('s-whatsapp', errors.whatsapp)} type="tel" value={form.whatsapp} onChange={set('whatsapp')} placeholder="Facultatif" />
              </Field>
            </div>
            <button type="submit" disabled={saving === 'profile'} className="self-end h-10 px-5 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-60">
              {saving === 'profile' ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </Card>

        {prefs && (
          <Card id="notifications" title="Notifications" description="Choisissez ce que LUDRA peut vous envoyer.">
            <div className="divide-y divide-slate-100">
              <Toggle label="Nouveaux messages" checked={prefs.newMessages} onChange={(v) => savePrefs({ ...prefs, newMessages: v })} />
              <Toggle label="Alertes de recherches sauvegardées" checked={prefs.searchAlerts} onChange={(v) => savePrefs({ ...prefs, searchAlerts: v })} />
              <Toggle label="Avis reçus" checked={prefs.reviews} onChange={(v) => savePrefs({ ...prefs, reviews: v })} />
              <Toggle label="Paiements et reçus" checked={prefs.payments} onChange={(v) => savePrefs({ ...prefs, payments: v })} />
              <Toggle label="Nouveautés et offres LUDRA" checked={prefs.marketing} onChange={(v) => savePrefs({ ...prefs, marketing: v })} />
            </div>
            <p className="mt-3 mb-1 text-xs font-medium text-slate-500">Canaux</p>
            <div className="divide-y divide-slate-100">
              <Toggle label="Notifications sur l'appareil" checked={prefs.channels.push} onChange={(v) => savePrefs({ ...prefs, channels: { ...prefs.channels, push: v } })} />
              <Toggle label="E-mail" checked={prefs.channels.email} onChange={(v) => savePrefs({ ...prefs, channels: { ...prefs.channels, email: v } })} />
              <Toggle label="SMS" checked={prefs.channels.sms} onChange={(v) => savePrefs({ ...prefs, channels: { ...prefs.channels, sms: v } })} />
            </div>
          </Card>
        )}

        <Card id="securite" title="Sécurité">
          <form onSubmit={changePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <Field label="Mot de passe actuel" htmlFor="pwd-current">
              <TextInput id="pwd-current" type="password" autoComplete="current-password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} required />
            </Field>
            <Field label="Nouveau mot de passe" htmlFor="pwd-next">
              <TextInput id="pwd-next" type="password" autoComplete="new-password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} required />
            </Field>
            <Field label="Confirmation" htmlFor="pwd-confirm">
              <TextInput id="pwd-confirm" type="password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} required />
            </Field>
            {pwdError && <p role="alert" className="sm:col-span-3 text-xs text-red-600">{pwdError}</p>}
            <button type="submit" disabled={saving === 'pwd'} className="sm:col-span-3 justify-self-end h-10 px-5 rounded-lg border border-brand text-brand text-sm font-semibold disabled:opacity-60">Modifier le mot de passe</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={logoutAll} className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-navy">Se déconnecter de tous les appareils</button>
            <button type="button" onClick={logout} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-navy text-white text-sm font-semibold"><LogOut className="w-4 h-4" /> Se déconnecter</button>
          </div>
        </Card>

        <Card id="donnees" title="Mes données">
          {profile.deletionRequestedAt ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <ShieldAlert className="w-4 h-4" />
              <span className="flex-1">Suppression demandée le {new Date(profile.deletionRequestedAt).toLocaleDateString('fr-FR')}. Elle sera traitée par notre équipe.</span>
              <button type="button" onClick={() => toggleDeletion(false)} className="h-9 px-3 rounded-lg border border-red-300 bg-white font-semibold">Annuler la demande</button>
            </div>
          ) : (
            <button type="button" onClick={() => setDeleteOpen(true)} className="h-9 px-3 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50">Demander la suppression de mon compte</button>
          )}
        </Card>
      </div>

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer mon compte ?"
        description="Vos annonces seront retirées et vos données supprimées selon la politique de rétention. Les reçus de paiement sont conservés pour obligation légale."
        footer={(
          <div className="flex gap-2">
            <button type="button" onClick={() => setDeleteOpen(false)} className="flex-1 h-11 rounded-lg border border-slate-200 text-sm font-semibold text-navy">Annuler</button>
            <button type="button" onClick={() => toggleDeletion(true)} className="flex-1 h-11 rounded-lg bg-red-600 text-white text-sm font-semibold">Confirmer la demande</button>
          </div>
        )}
      >
        <p className="text-sm text-slate-600">Vous pourrez annuler la demande tant qu&apos;elle n&apos;a pas été traitée.</p>
      </Modal>
      {toastNode}
    </ShellColumns>
  );
}
