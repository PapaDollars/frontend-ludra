'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, ChevronDown, Clock, Mail, MapPin, ShieldAlert } from 'lucide-react';

import { useRole } from '@/hooks/useRole';
import { supportService, type SupportSubject } from '@/services/support.service';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { Field, SelectInput, TextArea, TextInput, errorProps } from '@/components/ui/Form';

const FAQ: [string, string][] = [
  ['La messagerie est-elle payante ?', 'Non. Écrire à un publieur est gratuit. Seul l’affichage du téléphone / WhatsApp d’une annonce est payant (micro-paiement Mobile Money).'],
  ['J’ai payé mais le numéro ne s’affiche pas', 'Le numéro s’affiche dès que l’opérateur confirme le paiement. Si vous avez validé sur votre téléphone, patientez quelques minutes puis rouvrez l’annonce : vous ne serez jamais débité deux fois. Sinon, contactez-nous avec la référence de votre reçu (Mon compte › Paiements).'],
  ['Comment obtenir le badge « Vérifié » ?', 'Dans Mon compte › Certification, déposez votre pièce d’identité et les justificatifs demandés. Vos documents restent privés ; seul le badge est public.'],
  ['Un publieur me demande une avance avant la visite', 'Ne payez pas. Signalez l’annonce ou le compte (bouton « Signaler ») : notre équipe de modération intervient rapidement.'],
  ['Le salaire affiché d’un candidat est-il garanti ?', 'Non. Il s’agit d’une attente du candidat, utilisée pour le ciblage. LUDRA ne garantit aucun salaire.'],
  ['Comment supprimer mon compte ?', 'Mon compte › Paramètres › Mes données. Vous pouvez annuler la demande tant qu’elle n’a pas été traitée.'],
];

const SUBJECTS: [SupportSubject, string][] = [
  ['info', 'Demande d’information'], ['annonce', 'Problème avec une annonce'], ['paiement', 'Paiement / reçu'],
  ['compte', 'Mon compte / certification'], ['probleme', 'Signaler un problème technique'], ['autre', 'Autre'],
];

/** Aide & contact : FAQ + formulaire support (pages secondaires hors feed, §3.1). */
export default function HelpPage() {
  const { user } = useRole();
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', subject: '' as SupportSubject | '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Indiquez votre nom.';
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email)) errs.email = 'E-mail invalide.';
    if (!form.subject) errs.subject = 'Choisissez un sujet.';
    if (form.message.trim().length < 20) errs.message = '20 caractères minimum.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    setError(null);
    try {
      await supportService.send({ ...form, subject: form.subject as SupportSubject, message: form.message.trim() });
      setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Envoi impossible pour le moment.'); }
    finally { setSending(false); }
  };

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <h1 className="px-4 md:px-0 text-xl font-bold text-navy">Aide & contact</h1>

        <p className="mx-4 md:mx-0 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Arnaque ou demande d’avance ? Utilisez le bouton <strong>« Signaler »</strong> sur l’annonce, le profil ou la conversation : c’est le moyen le plus rapide.</span>
        </p>

        <section aria-labelledby="faq" className="mx-4 md:mx-0 rounded-2xl border border-slate-200 bg-white">
          <h2 id="faq" className="px-5 pt-4 pb-2 font-semibold text-navy">Questions fréquentes</h2>
          <ul className="divide-y divide-slate-100">
            {FAQ.map(([q, a]) => (
              <li key={q}>
                <details className="group px-5 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-navy">
                    {q}<ChevronDown className="w-4 h-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm text-slate-600">{a}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <div className="mx-4 md:mx-0 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section aria-labelledby="contact" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="contact" className="mb-4 font-semibold text-navy">Écrire au support</h2>
            {sent ? (
              <div className="py-6 text-center" role="status">
                <CheckCircle2 className="mx-auto mb-2 w-10 h-10 text-trust" />
                <p className="font-semibold text-navy">Message envoyé</p>
                <p className="text-sm text-slate-500">Nous vous répondons par e-mail, généralement sous 24 h ouvrées.</p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom" htmlFor="h-name" error={errors.name} required>
                  <TextInput {...errorProps('h-name', errors.name)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                </Field>
                <Field label="E-mail" htmlFor="h-email" error={errors.email} required>
                  <TextInput {...errorProps('h-email', errors.email)} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                </Field>
                <Field label="Sujet" htmlFor="h-subject" error={errors.subject} required className="sm:col-span-2">
                  <SelectInput {...errorProps('h-subject', errors.subject)} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value as SupportSubject })}>
                    <option value="">Choisir…</option>
                    {SUBJECTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Message" htmlFor="h-message" error={errors.message} required className="sm:col-span-2" hint="Pour un paiement, indiquez la référence du reçu.">
                  <TextArea {...errorProps('h-message', errors.message)} value={form.message} maxLength={2000} showCount onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </Field>
                {error && <p role="alert" className="sm:col-span-2 text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={sending} className="sm:col-span-2 justify-self-end h-10 px-6 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-60">
                  {sending ? 'Envoi…' : 'Envoyer'}
                </button>
              </form>
            )}
          </section>
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
            <h2 className="mb-3 font-semibold text-navy">Nous joindre</h2>
            <ul className="flex flex-col gap-3 text-slate-600">
              <li className="flex gap-2"><Mail className="w-4 h-4 text-brand shrink-0 mt-0.5" /><a href="mailto:contact@ludra.cm" className="hover:underline">contact@ludra.cm</a></li>
              <li className="flex gap-2"><Clock className="w-4 h-4 text-brand shrink-0 mt-0.5" />Lun – Sam, 8 h – 18 h</li>
              <li className="flex gap-2"><MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />Douala, Cameroun</li>
            </ul>
          </aside>
        </div>
      </div>
    </ShellColumns>
  );
}
