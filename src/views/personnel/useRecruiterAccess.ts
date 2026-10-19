import { useCallback, useEffect, useState } from 'react';
import { candidateService } from '@/services/candidate.service';
import type { RecruiterAccess } from '@/types';

/** Forfait recruteur actif + droits (null tant que non chargé ou visiteur). */
export function useRecruiterAccess(enabled: boolean) {
  const [access, setAccess] = useState<RecruiterAccess | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) { setAccess(null); return; }
    try { setAccess(await candidateService.recruiterAccess()); } catch { setAccess(null); }
  }, [enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  return { access, refresh };
}
