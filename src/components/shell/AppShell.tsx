'use client';

import { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';

/**
 * Coque V2.1 : top bar sticky + nav basse mobile.
 * Les rails gauche/droit sont posés par chaque page via <ShellColumns>.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface print:bg-white">
      <TopBar />
      {/* pb mobile : les CTA restent au-dessus de la nav basse (§4.1) */}
      <main className="pt-14 md:pt-16 pb-20 md:pb-8 print:p-0">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
