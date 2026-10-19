'use client';

import { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/utilis/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Pied fixe (CTA) — reste visible au-dessus du contenu défilant. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Modale V2.1 : centrée sur desktop, bottom sheet sur mobile (dossier §4.1).
 * Focus piégé, Échap et clic extérieur gérés par Radix.
 */
export function Modal({ open, onOpenChange, title, description, children, footer, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40" />
        <Dialog.Content
          // Sans description, on le signale à Radix (sinon avertissement a11y en console).
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed z-50 bg-white flex flex-col shadow-xl outline-none',
            'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]',
            'md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:rounded-2xl md:pb-0',
            className,
          )}
        >
          <div className="md:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-slate-100">
            <div>
              <Dialog.Title className="text-base font-semibold text-navy">{title}</Dialog.Title>
              {description && <Dialog.Description className="text-xs text-slate-500 mt-0.5">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="w-8 h-8 -mr-2 flex items-center justify-center rounded-full text-slate-500 hover:bg-surface" aria-label="Fermer">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="px-5 py-3 border-t border-slate-100 bg-white">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
