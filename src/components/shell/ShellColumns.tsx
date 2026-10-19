import { ReactNode } from 'react';
import { cn } from '@/utilis/utils';
import { LeftRail } from './LeftRail';

interface ShellColumnsProps {
  children: ReactNode;
  /** Contenu du rail droit (sécurité, comptes vérifiés…). Masqué sous 1200 px. */
  right?: ReactNode;
  /** Afficher le rail gauche (≥ 1200 px). */
  leftRail?: boolean;
  className?: string;
}

/**
 * Grille desktop 3 colonnes (rail gauche · contenu · rail droit) ;
 * une seule colonne sur tablette et mobile.
 */
export function ShellColumns({ children, right, leftRail = true, className }: ShellColumnsProps) {
  return (
    <div
      className={cn(
        'mx-auto max-w-[1320px] px-0 md:px-4 pt-0 md:pt-6 grid gap-6',
        leftRail && right && 'desk:grid-cols-[220px_minmax(0,1fr)_300px]',
        leftRail && !right && 'desk:grid-cols-[220px_minmax(0,1fr)]',
        !leftRail && right && 'desk:grid-cols-[minmax(0,1fr)_300px]',
        className,
      )}
    >
      {leftRail && (
        <aside className="hidden desk:block">
          <LeftRail />
        </aside>
      )}
      <div className="min-w-0 w-full max-w-[680px] mx-auto desk:max-w-none">{children}</div>
      {right && (
        <aside className="hidden desk:block">
          <div className="sticky top-20 flex flex-col gap-4">{right}</div>
        </aside>
      )}
    </div>
  );
}
