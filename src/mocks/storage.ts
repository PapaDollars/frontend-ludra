// mocks/storage.ts — Persistance localStorage des mocks (démo uniquement)

export function persisted<T>(key: string, initial: () => T) {
  let value: T = initial();
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    }
  } catch { /* stockage indisponible */ }

  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* quota / navigation privée */ }
    },
  };
}
