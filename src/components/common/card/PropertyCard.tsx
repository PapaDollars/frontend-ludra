'use client';

import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, House, Bath, Square, ArrowRight, Heart, MoreVertical, Edit, Trash2, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';

import { Property } from '@/types/property';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import URL from '@/utilis/url/url_front';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=300&fit=crop';

interface PropertyCardProps {
  property: Property;
  index?: number;
  // Favoris
  showFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (propertyId: number) => void;
  // Statut
  showStatus?: boolean;
  // Actions (admin / landlord)
  showActions?: boolean;
  onEdit?: (property: Property) => void;
  onDelete?: (propertyId: number) => void;
  onApprove?: (propertyId: string) => void;
  onReject?: (propertyId: string) => void;
  onReactivate?: (propertyId: string) => void;
  onStatusToggle?: (propertyId: string, newStatus: 'available' | 'occupied') => void;
}

const PropertyCard = memo(({
  property,
  index = 0,
  showFavorite = false,
  isFavorite = false,
  onToggleFavorite,
  showStatus = true,
  showActions = false,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onReactivate,
  onStatusToggle,
}: PropertyCardProps) => {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imgSrc, setImgSrc] = useState(property.image || FALLBACK_IMAGE);

  const isInactive = (property as any).isActive === false;

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    available: { label: 'Libre',    color: 'bg-green-100 text-green-800 border-green-200',   icon: '🟢' },
    occupied:  { label: 'Occupé',   color: 'bg-red-100 text-red-800 border-red-200',         icon: '🔴' },
    pending:   { label: 'En cours', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
    inactive:  { label: 'Désactivée', color: 'bg-gray-200 text-gray-600 border-gray-300',    icon: '⚫' },
  };

  const statusKey = isInactive ? 'inactive' : (property.status || 'pending');
  const status = statusConfig[statusKey] || statusConfig.pending;
  const canToggleStatus = !isInactive && property.status !== 'pending' && !!onStatusToggle;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    onToggleFavorite?.(property.id);
  };

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 animate-fade-in-up bg-white relative ${isInactive ? 'opacity-60' : 'hover:scale-105'}`}
      style={{ animationDelay: `${index * 0.2}s` }}
    >
      {/* ── Image ── */}
      <div className="relative">
        <img
          src={imgSrc}
          alt={property.title}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          className={`w-full h-40 object-cover ${isInactive ? '' : 'group-hover:scale-110'} transition-transform duration-300`}
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
            className={`absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 transition-all duration-300 ${isAnimating ? 'scale-125' : 'hover:scale-110'}`}
            aria-label={isFavorite ? t('common.remove_favorite') : t('common.add_favorite')}
          >
            <Heart className={`h-5 w-5 transition-all duration-300 ${isFavorite ? 'text-red-500 fill-current scale-110' : 'text-gray-400 hover:text-red-500'} ${isAnimating ? 'scale-125' : ''}`} />
          </button>
        )}

        {/* Menu d'actions (admin/landlord) */}
        {showActions && (
          <div className="absolute top-4 right-4">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:scale-110 transition-all duration-300"
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>

            {showMenu && <div className="fixed inset-0 z-[5]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); }} />}

            {showMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border py-2 z-10 min-w-[180px]">
                {property.status === 'pending' && onApprove && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onApprove(String(property.id)); }}
                    className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-2 font-medium">
                    <CheckCircle className="h-4 w-4" />Approuver
                  </button>
                )}
                {!isInactive && onReject && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onReject(String(property.id)); }}
                    className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />Désactiver
                  </button>
                )}
                {isInactive && onReactivate && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onReactivate(String(property.id)); }}
                    className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-2 font-medium">
                    <CheckCircle className="h-4 w-4" />Réactiver
                  </button>
                )}
                {canToggleStatus && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onStatusToggle!(String(property.id), property.status === 'available' ? 'occupied' : 'available'); }}
                    className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <ToggleRight className={`h-4 w-4 ${property.status === 'available' ? '' : 'hidden'}`} />
                    <ToggleLeft className={`h-4 w-4 ${property.status === 'available' ? 'hidden' : ''}`} />
                    <span>{property.status === 'available' ? 'Marquer occupé' : 'Marquer libre'}</span>
                  </button>
                )}
                {!isInactive && onEdit && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onEdit(property); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                    <Edit className="h-4 w-4" />{t('common.edit')}
                  </button>
                )}
                {(!isInactive || onReactivate) && onDelete && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onDelete(property.id); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />{t('common.delete')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Contenu ── */}
      <div className="p-6">
        {/* Bandeau désactivée */}
        {isInactive && (
          <div className="mb-3 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600 text-center font-medium">
            ⚫ Cette propriété a été désactivée par l&apos;administration — aucune action n&apos;est possible.
          </div>
        )}

        <div className="flex justify-between items-start mb-3">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wide">
            {t(`property_types.${property.type}`)}
          </span>
          <span className="text-xl font-bold text-primary">
            {property.price.toLocaleString('fr-FR')} FCFA
            <span className="text-sm font-normal text-gray-600">{t('featured_section.per_month')}</span>
          </span>
        </div>

        <h3 className="text-lg font-semibold text-primary hover:text-secondary transition-colors line-clamp-1 mb-2">
          {property.title
            .replace(/[^\p{L}\p{N}\s.,!?;:'"()\-]/gu, '')
            .trim()
            .toLowerCase()
            .replace(/^\p{L}/u, c => c.toUpperCase())}
        </h3>

        {/* Propriétaire + Localisation sur la même ligne */}
        <div className="flex items-center justify-between mb-2 gap-2">
          {property.landlord ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                {property.landlord.avatar ? (
                  <img src={property.landlord.avatar} alt={property.landlord.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
                    {property.landlord.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 truncate">{property.landlord.name}</span>
            </div>
          ) : <span />}

          <div className="flex items-center text-gray-600 flex-shrink-0">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="text-xs truncate max-w-[100px]">
              {t(`locations.${property.location.replace('locations.', '')}`, { defaultValue: property.location.replace('locations.', '') })}
            </span>
          </div>
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

        {!isInactive && (
          <Link href={URL.public.propertyDetail(property.id.toString())}>
            <Button className="w-full mt-4 group" variant="primary" size="md">
              {t('property_details.view_details')}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
});

PropertyCard.displayName = 'PropertyCard';
export default PropertyCard;
