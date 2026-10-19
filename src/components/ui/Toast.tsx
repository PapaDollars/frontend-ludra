'use client';

import { useCallback, useEffect, useState } from 'react';

/** Toast minimal (une seule notification à la fois). */
export function useToast(durationMs = 2500) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), durationMs);
    return () => clearTimeout(id);
  }, [message, durationMs]);

  const show = useCallback((msg: string) => setMessage(msg), []);

  const node = message ? (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-50 rounded-full bg-navy text-white text-sm px-4 py-2 shadow-lg"
    >
      {message}
    </div>
  ) : null;

  return { show, node };
}
