import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { listingService } from '@/services/listing.service';
import type { ListingDetail } from '@/types';

export function useListing(id: string) {
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setListing(await listingService.getById(id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else setError(e instanceof Error ? e.message : "Impossible de charger l'annonce.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patch = useCallback((p: Partial<ListingDetail>) => {
    setListing((prev) => (prev ? { ...prev, ...p } : prev));
  }, []);

  return { listing, loading, notFound, error, reload: load, patch };
}
