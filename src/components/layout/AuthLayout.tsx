import { ReactNode } from 'react';
import { BadgeCheck, Lock, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/shell/Logo';

interface AuthLayoutProps {
  children: ReactNode;
}

const PROMISES = [
  { icon: BadgeCheck, text: 'Publieurs vérifiés : identité contrôlée, documents jamais publics.' },
  { icon: MessageCircle, text: 'Messagerie gratuite, sans partager vos coordonnées.' },
  { icon: Lock, text: 'Contact direct sécurisé par Mobile Money, après confirmation.' },
];

/** Cadre V2.1 des écrans d'authentification : panneau d'identité (desktop) + formulaire. */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden lg:flex flex-col justify-between bg-navy p-10 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand/40" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-brand/20" aria-hidden="true" />
        <div className="relative">
          <Logo variant="light" imageClassName="md:h-8" />
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">Immobilier, personnel et services.<br />En confiance.</h2>
          <ul className="mt-8 flex flex-col gap-4">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-slate-200">
                <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center"><Icon className="w-4 h-4 text-brand-200" /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} LUDRA · Ne payez jamais avant une visite.</p>
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="lg:hidden flex items-center justify-center bg-white border-b border-slate-200 h-14"><Logo /></header>
        <div className="flex flex-1 items-start lg:items-center justify-center px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
