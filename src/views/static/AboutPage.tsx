import Link from 'next/link';
import { BadgeCheck, Briefcase, Building2, Lock, MessageCircle, Scale, ShieldCheck, Wrench } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { ShellColumns } from '@/components/shell/ShellColumns';

const UNIVERSES = [
  { icon: Building2, tone: 'bg-brand-50 text-brand', title: 'Immobilier', text: 'Location et vente de logements, terrains et locaux, publiés par des propriétaires et des agents.', href: URL.v2.immobilier },
  { icon: Briefcase, tone: 'bg-perso-50 text-perso', title: 'Placement du personnel', text: 'Chauffeurs, ménagères, cuisiniers, auxiliaires de vie : des profils vérifiés pour les familles et les entreprises.', href: URL.v2.personnel },
  { icon: Wrench, tone: 'bg-service-50 text-service', title: 'Autres services', text: 'Déménagement, plomberie, électricité, travaux… et un répertoire de professionnels habilités.', href: URL.v2.services },
];

const TRUST = [
  { icon: BadgeCheck, title: 'Comptes vérifiés', text: 'Pièce d’identité et justificatifs contrôlés par notre équipe. Le public ne voit que le badge, jamais les documents.' },
  { icon: MessageCircle, title: 'Messagerie gratuite', text: 'Échangez sans partager vos coordonnées : numéros et liens sont masqués automatiquement.' },
  { icon: Lock, title: 'Contact direct sécurisé', text: 'Le téléphone n’est révélé qu’après un micro-paiement Mobile Money confirmé par l’opérateur.' },
  { icon: Scale, title: 'Classement transparent', text: 'La pertinence passe avant tout. Une mise en avant payante est toujours signalée « Sponsorisé ».' },
];

const ROLES = [
  ['Visiteurs', 'Parcourent les offres librement, sans compte.'],
  ['Clients', 'Enregistrent leurs favoris, écrivent aux publieurs, débloquent un contact, laissent un avis.'],
  ['Propriétaires & agents', 'Publient plusieurs biens et lieux, se font certifier, choisissent un plan de visibilité.'],
  ['Candidats', 'Créent un profil professionnel gratuit, peuvent le mettre en avant.'],
  ['Recruteurs', 'Accèdent aux meilleurs profils, filtrent, présélectionnent avec un forfait.'],
  ['Prestataires', 'Présentent leurs services et reçoivent des demandes de devis.'],
];

/** À propos — page secondaire (hors feed), même identité LUDRA. */
export default function AboutPage() {
  return (
    <ShellColumns>
      <article className="flex flex-col gap-4 pt-3 md:pt-0">
        <header className="mx-4 md:mx-0 rounded-2xl bg-navy p-6 md:p-8 text-white">
          <p className="text-xs font-semibold tracking-widest text-brand-200">À PROPOS</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold">LUDRA, la confiance avant tout</h1>
          <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-200">
            Une plateforme sociale pour trouver un logement, du personnel de maison ou un prestataire au Cameroun —
            simple comme un fil d’actualité, sûre comme une agence.
          </p>
        </header>

        <section aria-labelledby="universes" className="mx-4 md:mx-0">
          <h2 id="universes" className="mb-3 text-lg font-bold text-navy">Trois univers, une même logique</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {UNIVERSES.map(({ icon: Icon, tone, title, text, href }) => (
              <Link key={title} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand">
                <span className={`mb-3 inline-flex w-10 h-10 items-center justify-center rounded-full ${tone}`}><Icon className="w-5 h-5" /></span>
                <h3 className="font-semibold text-navy">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="trust" className="mx-4 md:mx-0 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 id="trust" className="mb-4 flex items-center gap-2 text-lg font-bold text-navy"><ShieldCheck className="w-5 h-5 text-trust" /> Nos engagements de sécurité</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {TRUST.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <Icon className="w-5 h-5 shrink-0 text-brand" />
                <div><p className="font-semibold text-navy text-sm">{title}</p><p className="text-sm text-slate-600">{text}</p></div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="roles" className="mx-4 md:mx-0 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 id="roles" className="mb-3 text-lg font-bold text-navy">Pour qui ?</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {ROLES.map(([role, text]) => (
              <div key={role} className="rounded-xl bg-surface p-3">
                <dt className="font-semibold text-navy text-sm">{role}</dt>
                <dd className="text-sm text-slate-600">{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mx-4 md:mx-0 rounded-xl border border-amber-200 bg-caution-50 px-4 py-3 text-sm text-amber-900">
          <strong>Rappel :</strong> visitez toujours un bien avant de payer et ne versez jamais d’« avance de visite ». Pour un terrain, faites vérifier le titre foncier par un notaire.
          LUDRA met en relation et ne garantit pas les transactions entre utilisateurs.
        </p>

        <div className="mx-4 md:mx-0 flex flex-wrap gap-2">
          <Link href={URL.v2.feed} className="h-10 px-5 inline-flex items-center rounded-lg bg-brand text-white text-sm font-semibold">Découvrir les offres</Link>
          <Link href={URL.v2.help} className="h-10 px-5 inline-flex items-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-navy">Aide & contact</Link>
        </div>
      </article>
    </ShellColumns>
  );
}
