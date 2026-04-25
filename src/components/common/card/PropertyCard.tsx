'use client';

import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, House, Bath, Square, ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';

import { Property } from '@/types/property';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import URL from '@/utilis/url/url_front';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=300&fit=crop';

interface PropertyCardProps {
  property: Property;
  index?: number;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (propertyId: number) => void;
  showStatus?: boolean;
}

const PropertyCard = memo(({
  property,
  index = 0,
  showFavorite = false,
  isFavorite = false,
  onToggleFavorite,
  showStatus = true,
}: PropertyCardProps) => {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [imgSrc, setImgSrc] = useState(property.image || FALLBACK_IMAGE);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    onToggleFavorite?.(property.id);
  };

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    available: { label: 'Libre',   color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' },
    occupied:  { label: 'Occupé',  color: 'bg-red-100 text-red-800 border-red-200',       icon: '🔴' },
    pending:   { label: 'En cours',color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
  };

  const status = statusConfig[property.status] || statusConfig.available;

  return (
    <Card
      className="group overflow-hidden hover:scale-105 transition-all duration-300 animate-fade-in-up bg-white"
      style={{ animationDelay: `${index * 0.2}s` }}
    >
      <div className="relative">
        <img
          src={imgSrc}
          alt={property.title}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Badge Vedette */}
        {property.featured && !showStatus && (
          <div className="absolute top-4 left-4 bg-secondary text-white px-3 py-1 rounded-full text-sm font-medium">
            {t('featured_section.featured_badge')}
          </div>
        )}

        {/* Badge Statut */}
        {showStatus && (
          <div className={`absolute top-4 left-4 ${status.color} border px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1`}>
            <span>{status.icon}</span>
            {status.label}
          </div>
        )}

        {/* Bouton Favori */}
        {showFavorite && (
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 transition-all duration-300 ${
              isAnimating ? 'scale-125' : 'hover:scale-110'
            }`}
            aria-label={isFavorite ? t('common.remove_favorite') : t('common.add_favorite')}
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ${
                isFavorite ? 'text-red-500 fill-current scale-110' : 'text-gray-400 hover:text-red-500'
              } ${isAnimating ? 'scale-125' : ''}`}
            />
          </button>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wide">
            {t(`property_types.${property.type}`)}
          </span>
          <span className="text-xl font-bold text-primary">
            {property.price.toLocaleString('fr-FR')} FCFA
            <span className="text-sm font-normal text-gray-600">{t('featured_section.per_month')}</span>
          </span>
        </div>

        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1 min-h-[3.5rem]">
          {property.title}
        </h3>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm truncate">{property.location}</span>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-4">
          <div className="flex items-center space-x-1">
            <House className="h-4 w-4" />
            <span>{property.beds} {t(property.beds > 1 ? 'property_details.beds_plural' : 'property_details.beds')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Bath className="h-4 w-4" />
            <span>{property.baths} {t(property.baths > 1 ? 'property_details.baths_plural' : 'property_details.baths')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Square className="h-4 w-4" />
            <span>{property.area}{t('property_details.area')}</span>
          </div>
        </div>

        <Link href={URL.public.propertyDetail(property.id.toString())}>
          <Button className="w-full mt-4 group" variant="primary" size="md">
            {t('property_details.view_details')}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </Card>
  );
});

PropertyCard.displayName = 'PropertyCard';
export default PropertyCard;
