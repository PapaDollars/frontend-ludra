'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ImagePlus, Send, ShieldAlert, X } from 'lucide-react';

import {
  IMAGE_TYPES, MESSAGE_MAX_LENGTH, detectContactInfo, hasContactInfo, validateImage,
} from '@/lib/messageSafety';

interface ComposerProps {
  /** Renvoie un message d'erreur lisible, ou null si envoyé. */
  onSend: (text: string, image?: File) => Promise<string | null>;
}

/** Zone de saisie : texte + image contrôlée ; avertit avant d'envoyer des coordonnées. */
export function Composer({ onSend }: ComposerProps) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) { setPreview(null); return; }
    const url = globalThis.URL.createObjectURL(image);
    setPreview(url);
    return () => globalThis.URL.revokeObjectURL(url);
  }, [image]);

  // Hauteur auto (max ~5 lignes)
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    el.style.overflowY = el.scrollHeight > 120 ? 'auto' : 'hidden';
  }, [text]);

  const found = detectContactInfo(text);
  const warn = hasContactInfo(found);
  const canSend = (text.trim().length > 0 || image) && text.length <= MESSAGE_MAX_LENGTH;

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    const t = text.trim();
    const img = image ?? undefined;
    setText('');
    setImage(null);
    setError(null);
    const err = await onSend(t, img);
    if (err) setError(err);
    textarea.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Entrée = envoyer sur desktop ; Maj+Entrée = nouvelle ligne
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(min-width: 768px)').matches) {
      e.preventDefault();
      submit();
    }
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const invalid = validateImage(file);
    if (invalid) return setError(invalid);
    setError(null);
    setImage(file);
  };

  return (
    <form onSubmit={submit} className="border-t border-slate-100 bg-white p-3">
      {warn && (
        <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-caution-50 px-3 py-2 text-xs text-amber-900">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {found.link
            ? 'Les liens sont retirés automatiquement pour votre sécurité.'
            : 'Les numéros et e-mails sont masqués dans la messagerie. Utilisez le contact direct sécurisé de l’annonce.'}
        </p>
      )}
      {preview && (
        <div className="relative mb-2 inline-block">
          <img src={preview} alt="Image à envoyer" className="h-20 rounded-lg object-cover" />
          <button type="button" onClick={() => setImage(null)} aria-label="Retirer l'image" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {error && <p role="alert" className="mb-2 text-xs text-red-600">{error}</p>}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label="Joindre une image"
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:bg-surface"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} onChange={onPick} className="hidden" />
        <label className="flex-1">
          <span className="sr-only">Écrire un message</span>
          <textarea
            ref={textarea}
            rows={1}
            value={text}
            maxLength={MESSAGE_MAX_LENGTH}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Écrire un message…"
            className="w-full resize-none rounded-2xl border border-slate-200 bg-surface px-4 py-2.5 text-sm text-navy outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <button
          type="submit"
          disabled={!canSend}
          className="h-10 shrink-0 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          <span className="hidden md:inline">Envoyer</span>
          <span className="sr-only md:hidden">Envoyer</span>
        </button>
      </div>
    </form>
  );
}
