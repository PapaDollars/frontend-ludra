import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import URL from '@/utilis/url/url_front';
import { useRole } from '@/hooks/useRole';
import { savedService } from '@/services/saved.service';
import type { FeedItem } from '@/types';
import { itemHref } from './components/FeedCard';

/** Actions communes des cartes : enregistrer (optimiste) et partager. */
export function useItemActions(
  updateItem: (id: string, patch: Partial<FeedItem>) => void,
  showToast: (msg: string) => void,
) {
  const router = useRouter();
  const { isAuthenticated } = useRole();

  const onToggleSave = useCallback(async (item: FeedItem) => {
    if (!isAuthenticated) {
      router.push(URL.auth.loginThen(window.location.pathname + window.location.search));
      return;
    }
    updateItem(item.id, { isFavorite: !item.isFavorite });
    try {
      const res = await savedService.toggle(item.id, item.universe, item.isFavorite);
      updateItem(item.id, { isFavorite: res.isFavorite });
      showToast(res.isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
    } catch {
      updateItem(item.id, { isFavorite: item.isFavorite });
      showToast("Impossible d'enregistrer pour le moment");
    }
  }, [isAuthenticated, router, updateItem, showToast]);

  const onShare = useCallback(async (item: FeedItem) => {
    const url = `${window.location.origin}${itemHref(item)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Lien copié');
      }
    } catch { /* partage annulé */ }
  }, [showToast]);

  return { onToggleSave, onShare };
}
