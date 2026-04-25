// Ce hook est conservé pour la compatibilité avec les composants existants.
// Les pages principales (FavoritesPage, PropertiesListPage) appellent favoriteService directement.
// Ce hook gère l'état local optimiste pour une UX instantanée.

import { create } from 'zustand';

interface FavoritesStore {
  favorites: string[];
  setFavorites: (ids: string[]) => void;
  toggleFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
}

export const useFavorites = create<FavoritesStore>()((set, get) => ({
  favorites: [],

  setFavorites: (ids) => set({ favorites: ids }),

  toggleFavorite: (propertyId) => {
    const { favorites } = get();
    set({
      favorites: favorites.includes(propertyId)
        ? favorites.filter((id) => id !== propertyId)
        : [...favorites, propertyId],
    });
  },

  isFavorite: (propertyId) => get().favorites.includes(propertyId),
}));
