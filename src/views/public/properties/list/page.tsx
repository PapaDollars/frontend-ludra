'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

import { propertyService } from '@/services/property.service';
import PropertyCard from '@/components/common/card/PropertyCard';
import PropertyFilters from '@/components/common/_others/PropertyFilters';
import { Card } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';
import { favoriteService } from '@/services/favorite.service';
import Pagination from '@/components/common/_others/Pagination';
import { useSafeSession } from '@/hooks/useSafeSession';

const ITEMS_PER_PAGE = 12;

export default function PropertiesListPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { data: session } = useSafeSession();

  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    location: searchParams?.get('location') || '',
    type: searchParams?.get('type') || '',
    priceRange: searchParams?.get('priceRange') || '',
    beds: '',
    baths: '',
    status: '',
    landlord: '',
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const [minPrice, maxPrice] = filters.priceRange
        ? filters.priceRange.split('-').map(Number)
        : [undefined, undefined];

      const res = await propertyService.getProperties({
        search: filters.search || undefined,
        location: filters.location || undefined,
        type: filters.type || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        beds: filters.beds || undefined,
        baths: filters.baths || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy: 'newest',
      });
      setProperties(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  useEffect(() => {
    if (!session) return;
    favoriteService.getFavorites()
      .then((list) => setFavoriteIds(list.map((p: any) => p.id)))
      .catch(() => {});
  }, [session]);

  const handleToggleFavorite = async (propertyId: string) => {
    if (!session) return;
    try {
      const res = await favoriteService.toggle(propertyId);
      setFavoriteIds((prev) =>
        res.isFavorite ? [...prev, propertyId] : prev.filter((id) => id !== propertyId)
      );
    } catch {}
  };

  const resetFilters = () => {
    setFilters({ search: '', location: '', type: '', priceRange: '', beds: '', baths: '', status: '', landlord: '' });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasSearchFilters = filters.search || filters.location || filters.type || filters.priceRange;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {hasSearchFilters ? t('properties_page.search_results') : t('properties_page.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {hasSearchFilters ? t('properties_page.search_results_description') : t('properties_page.subtitle')}
          </p>
          {hasSearchFilters && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {filters.search && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">Recherche: &ldquo;{filters.search}&rdquo;</span>}
              {filters.location && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">Ville: {filters.location}</span>}
              {filters.type && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">Type: {t(`property_types.${filters.type}`)}</span>}
              {filters.priceRange && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">Prix: {filters.priceRange}</span>}
            </div>
          )}
        </div>

        <PropertyFilters
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={resetFilters}
          showStatusFilter={false}
          showViewToggle={true}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="mb-6">
          <p className="text-gray-600">{t('properties_page.results_count', { count: total })}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-72" />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
              {properties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  index={index}
                  showFavorite={true}
                  isFavorite={favoriteIds.includes(property.id)}
                  onToggleFavorite={() => handleToggleFavorite(property.id)}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={total}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          </>
        ) : (
          <Card className="text-center py-12">
            <div className="text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('properties_page.no_results')}</h3>
              <p>{t('properties_page.no_results_description')}</p>
              {hasSearchFilters && (
                <Button onClick={resetFilters} className="mt-4" variant="outline">
                  {t('properties_page.clear_filters')}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
