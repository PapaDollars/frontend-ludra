'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Loader2, ShieldCheck } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { formatClock } from '@/utilis/format';
import { ApiError } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { hasPermission } from '@/lib/adminPermissions';
import { publishService } from '@/services/publish.service';
import { searchService } from '@/services/search.service';
import type { PublishDraft, PublishResult, SearchOptions, Universe } from '@/types';
import { useToast } from '@/components/ui/Toast';

import { usePublishDraft, type SaveState } from './usePublishDraft';
import { type FieldErrors, firstInvalidStep, stepOfField, validateStep } from './schemas';
import { STEPS, Stepper } from './components/Stepper';
import { TypeStep } from './steps/TypeStep';
import { ProfileStep } from './steps/ProfileStep';
import { DetailsStep } from './steps/DetailsStep';
import { MediaStep } from './steps/MediaStep';
import { ReviewStep } from './steps/ReviewStep';

const STEP_TITLES = ['Que souhaitez-vous publier ?', 'Votre profil', 'Détails', 'Médias', 'Vérifier et publier'];

function SaveIndicator({ state, savedAt }: { state: SaveState; savedAt: string | null }) {
  if (state === 'idle') return null;
  return (
    <span className="text-[11px] text-slate-400" aria-live="polite">
      {state === 'saving' && 'Enregistrement…'}
      {state === 'saved' && savedAt && `Brouillon enregistré · ${formatClock(savedAt)}`}
      {state === 'error' && <span className="text-red-500">Brouillon non enregistré — nouvel essai à la prochaine modification</span>}
    </span>
  );
}

function PendingScreen({ result }: { result: PublishResult }) {
  const kyc = result.status === 'pending_kyc';
  return (
    <div className="mx-4 md:mx-auto max-w-lg bg-white rounded-2xl border border-slate-200 p-8 text-center">
      {result.status === 'published'
        ? <CheckCircle2 className="w-12 h-12 text-trust mx-auto mb-3" />
        : <Clock className="w-12 h-12 text-caution mx-auto mb-3" />}
      <h1 className="text-xl font-bold text-navy mb-2">
        {result.status === 'published' ? 'Votre profil est en ligne' : kyc ? 'Publication en attente de certification' : 'Publication en cours de vérification'}
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {result.status === 'published'
          ? 'Il apparaît maintenant dans le feed et les résultats de recherche.'
          : kyc
            ? 'Votre annonce sera visible dès que votre compte sera certifié. Vos documents restent privés : le public ne voit que le badge.'
            : 'Notre équipe la vérifie (généralement en moins de 24 h). Vous serez notifié(e).'}
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-2">
        {kyc && (
          <Link href={URL.v2.certification} className="inline-flex h-10 px-5 items-center justify-center gap-2 rounded-lg bg-brand text-white text-sm font-semibold">
            <ShieldCheck className="w-4 h-4" /> Faire certifier mon compte
          </Link>
        )}
        <Link href={URL.v2.account} className="inline-flex h-10 px-5 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-navy">Mon tableau de bord</Link>
        <Link href={URL.v2.feed} className="inline-flex h-10 px-5 items-center justify-center rounded-lg text-sm font-semibold text-brand">Retour au feed</Link>
      </div>
    </div>
  );
}

/** Module 06 — Wizard de publication : type → profil → détails → médias → validation. */
export default function PublishPage() {
  const router = useRouter();
  const { ready, user } = useRequireAuth();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draft');
  // Publication pour le compte d'un utilisateur (admin, permission add_property — contrôlée côté serveur)
  const forUserId = searchParams.get('for');
  const onBehalfOf = forUserId && hasPermission(user, 'add_property') ? { userId: forUserId, name: searchParams.get('forName') ?? forUserId } : undefined;
  const pd = usePublishDraft(draftId, ready);
  const { draft } = pd;
  const { show: showToast, node: toastNode } = useToast();

  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<SearchOptions | null>(null);
  const [drafts, setDrafts] = useState<PublishDraft[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [certified, setCertified] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  useEffect(() => { searchService.getOptions().then(setOptions).catch(() => showToast('Listes indisponibles pour le moment')); }, [showToast]);
  useEffect(() => { if (ready) publishService.listDrafts().then(setDrafts).catch(() => undefined); }, [ready]);

  // Reprise : on revient à l'étape enregistrée
  useEffect(() => { if (!pd.loading) setStep(draft.id ? draft.step : 0); }, [pd.loading, draft.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientErrors = useMemo(() => validateStep(draft, step), [draft, step]);
  const visibleErrors = useMemo(() => {
    const out: FieldErrors = {};
    for (const [k, v] of Object.entries(clientErrors)) if (attempted || touched.has(k)) out[k] = v;
    return { ...serverErrors, ...out };
  }, [clientErrors, attempted, touched, serverErrors]);

  const goTo = useCallback((s: number) => {
    setStep(s);
    setAttempted(false);
    setTouched(new Set());
    if (draft.id && s > draft.step) pd.update({ step: s });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [draft.id, draft.step, pd]);

  const onBlur = useCallback((field: string) => setTouched((t) => new Set(t).add(field)), []);

  const onData = useCallback((patch: Record<string, unknown>) => {
    pd.updateData(patch);
    setServerErrors((e) => {
      const keys = Object.keys(patch).filter((k) => k in e);
      if (!keys.length) return e;
      const next = { ...e };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  }, [pd]);

  /** Focus sur le premier champ en erreur présent à l'écran (les groupes de puces n'ont pas d'id). */
  const focusFirstError = (errs: FieldErrors) => {
    requestAnimationFrame(() => {
      const el = Object.keys(errs).map((k) => document.getElementById(`f-${k}`)).find(Boolean)
        ?? document.querySelector<HTMLElement>('section [role=alert]');
      el?.focus?.();
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const onSelectType = async (type: Universe) => {
    if (draft.sourceItemId && type !== draft.type) {
      showToast('Le type d’une publication existante ne peut pas changer.');
      return;
    }
    try {
      if (!draft.id) {
        const created = await pd.create(type, onBehalfOf);
        router.replace(`${URL.v2.publish}?draft=${created.id}`, { scroll: false });
        setStep(1);
      } else {
        if (type !== draft.type) pd.update({ type, step: 1 });
        goTo(1);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Impossible de créer le brouillon.');
    }
  };

  const next = () => {
    if (Object.keys(clientErrors).length) {
      setAttempted(true);
      focusFirstError(clientErrors);
      return;
    }
    goTo(step + 1);
  };

  const publish = async () => {
    const invalid = firstInvalidStep(draft);
    if (invalid !== null) {
      goTo(invalid);
      setAttempted(true);
      return;
    }
    if (!certified) { setAttempted(true); return; }
    setPublishing(true);
    try {
      await pd.flush();
      const res = await publishService.publish(draft.id);
      if (res.status === 'published' && res.universe === 'immobilier') {
        router.push(`${URL.v2.listing(res.itemId)}?${draft.sourceItemId ? 'updated' : 'published'}=1`);
        return;
      }
      setResult(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422 && e.errors?.length) {
        const errs: FieldErrors = {};
        e.errors.forEach((x) => { const f = x.field ?? x.path; if (f) errs[f] = x.message ?? x.msg ?? 'Valeur invalide'; });
        setServerErrors(errs);
        const target = Math.min(...Object.keys(errs).map((f) => stepOfField(draft, f)));
        goTo(target);
        setAttempted(true);
        focusFirstError(errs);
      }
      showToast(e instanceof Error ? e.message : 'Publication impossible pour le moment.');
    } finally {
      setPublishing(false);
    }
  };

  const onDeleteDraft = async (d: PublishDraft) => {
    setDrafts((list) => list.filter((x) => x.id !== d.id));
    try { await publishService.deleteDraft(d.id); } catch { showToast('Suppression impossible'); }
  };

  if (!ready || pd.loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  }
  if (result) return <div className="pt-6"><PendingScreen result={result} /></div>;
  if (pd.notFound) {
    return (
      <div className="mx-4 md:mx-auto mt-6 max-w-lg bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <h1 className="text-lg font-bold text-navy mb-2">Brouillon introuvable</h1>
        <p className="text-sm text-slate-500 mb-4">Il a peut-être déjà été publié ou supprimé.</p>
        <Link href={URL.v2.publish} className="inline-flex h-10 px-5 items-center rounded-lg bg-brand text-white text-sm font-semibold">Nouvelle publication</Link>
      </div>
    );
  }

  const stepProps = { draft, errors: visibleErrors, options, onData, onBlur };
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-[760px] md:px-4 pt-3 md:pt-6">
      <div className="bg-white md:rounded-2xl md:border md:border-slate-200">
        <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-slate-100">
          <h1 className="text-lg md:text-xl font-bold text-navy mb-4">{draft.sourceItemId ? 'Modifier ma publication' : 'Publier une offre'}</h1>
          {(draft.onBehalfOf ?? onBehalfOf) && (
            <p className="-mt-2 mb-4 rounded-lg bg-caution-50 px-3 py-2 text-xs text-amber-900">
              Publication pour le compte de <strong>{(draft.onBehalfOf ?? onBehalfOf)!.name}</strong> (action administrateur journalisée).
            </p>
          )}
          <Stepper current={step} reached={draft.id ? Math.max(draft.step, step) : 0} onGo={goTo} />
        </div>

        <section aria-labelledby="step-title" className="px-4 md:px-6 py-5">
          <h2 id="step-title" className="sr-only">{STEP_TITLES[step]}</h2>
          {step === 0 && (
            <TypeStep selected={draft.type} onSelect={onSelectType} drafts={drafts} currentDraftId={draft.id}
              onResume={(id) => router.push(`${URL.v2.publish}?draft=${id}`)} onDelete={onDeleteDraft} error={visibleErrors.type} />
          )}
          {step === 1 && <ProfileStep {...stepProps} />}
          {step === 2 && <DetailsStep {...stepProps} />}
          {step === 3 && <MediaStep draft={draft} error={visibleErrors.media} onChange={(media) => { pd.update({ media }); setServerErrors(({ media: _m, ...rest }) => rest); }} />}
          {step === 4 && (
            <ReviewStep draft={draft} options={options} userName={user?.name ?? ''} certified={certified} onCertifiedChange={setCertified}
              certifyError={attempted && !certified ? 'Cochez cette case pour publier.' : undefined} onEdit={goTo} />
          )}
        </section>

        {/* Navigation : au-dessus de la nav basse sur mobile (§4.1) */}
        {step > 0 && (
          <div className="sticky bottom-16 md:static z-10 flex items-center gap-3 border-t border-slate-100 bg-white px-4 md:px-6 py-3 md:rounded-b-2xl">
            <button type="button" onClick={() => goTo(step - 1)} className="h-10 px-4 rounded-lg text-sm font-semibold text-slate-600 hover:bg-surface">Retour</button>
            <span className="flex-1 text-center hidden sm:block"><SaveIndicator state={pd.saveState} savedAt={pd.savedAt} /></span>
            <button
              type="button"
              onClick={isLast ? publish : next}
              disabled={publishing}
              className={cn('ml-auto h-10 px-6 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-60', isLast ? 'bg-accent hover:bg-accent-600' : 'bg-brand hover:bg-brand-700')}
            >
              {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLast ? (publishing ? 'Publication…' : draft.sourceItemId ? 'Enregistrer les modifications' : 'Publier') : 'Continuer'}
            </button>
          </div>
        )}
      </div>
      <p className="sm:hidden mt-2 text-center"><SaveIndicator state={pd.saveState} savedAt={pd.savedAt} /></p>
      {toastNode}
    </div>
  );
}
