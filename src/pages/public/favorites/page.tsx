'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { favoriteService } from '@/services/favorite.service';
import PropertyCard from '@/components/common/card/PropertyCard';
import { Card } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';
import URL from '@/utilis/url/url_front';
import Pagination, { ITEMS_PER_PAGE } from '@/components/common/_others/Pagination';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    favoriteService.getFavorites()
      .then((list) => { setProperties(list); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  const handleToggleFavorite = async (propertyId: string) => {
    try {
      await favoriteService.remove(propertyId);
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch {}
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = properties.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
          <p className="text-gray-600 mb-6">Connectez-vous pour accéder à vos favoris.</p>
          <Link href={URL.auth.login}><Button>Se connecter</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={URL.public.properties} className="inline-flex items-center text-primary hover:text-primary-600 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />{t('favorites.back_to_properties')}
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">{t('favorites.title')}</h1>
            <p className="text-xl text-gray-600 mt-2">{t('favorites.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Heart className="h-8 w-8" />
            <span className="text-2xl font-bold">{properties.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-72" />)}
          </div>
        ) : paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  index={index}
                  showFavorite={true}
                  isFavorite={true}
                  onToggleFavorite={() => handleToggleFavorite(property.id)}
                />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalItems={properties.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={handlePageChange} className="mt-8" />
          </>
        ) : (
          <Card className="text-center py-16">
            <div className="text-gray-500">
              <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-2xl font-semibold mb-4">{t('favorites.no_favorites')}</h3>
              <p className="text-lg mb-6 max-w-md mx-auto">{t('favorites.no_favorites_description')}</p>
              <Link href={URL.public.properties}><Button size="lg">{t('favorites.explore_properties')}</Button></Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
