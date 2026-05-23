'use client';

import { useEffect, useState } from 'react';
import { X, MapPin, House, Bath, Square, CheckCircle, XCircle, Loader2, User, Phone } from 'lucide-react';
import { Button } from '@/components/common/ui/Button';
import { propertyService } from '@/services/property.service';
import { adminService } from '@/services/admin.service';

interface PendingPropertyModalProps {
  propertyId: string | null;
  onClose: () => void;
  onApproved: () => void;
}

const FALLBACK = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop';

export default function PendingPropertyModal({ propertyId, onClose, onApproved }: PendingPropertyModalProps) {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    setProperty(null);
    setLoading(true);
    propertyService.getById(propertyId)
      .then(setProperty)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (!propertyId) return null;

  const handleApprove = async () => {
    if (!propertyId) return;
    setActionLoading(true);
    try {
      await adminService.updatePropertyStatus(propertyId, { status: 'available' });
      onApproved();
      onClose();
    } catch (err) { alert(err instanceof Error ? err.message : String(err)); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!propertyId) return;
    setActionLoading(true);
    try {
      await adminService.updatePropertyStatus(propertyId, { isActive: false });
      onApproved();
      onClose();
    } catch (err) { alert(err instanceof Error ? err.message : String(err)); }
    finally { setActionLoading(false); }
  };

  const typeLabels: Record<string, string> = {
    apartment: 'Appartement', studio: 'Studio', house: 'Maison',
    room: 'Chambre', loft: 'Loft',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Propriété en attente d&apos;approbation</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !property ? (
          <div className="py-16 text-center text-gray-400">Propriété introuvable</div>
        ) : (
          <>
            {/* Image */}
            <div className="relative">
              <img
                src={property.image || FALLBACK}
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                alt={property.title}
                className="w-full h-52 object-cover"
              />
              <div className="absolute top-3 left-3 bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-xs font-semibold">
                🟡 En attente
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Titre + type */}
              <div>
                <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                  {typeLabels[property.type] || property.type}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">{property.title}</h3>
              </div>

              {/* Prix */}
              <div className="text-2xl font-bold text-primary">
                {property.price?.toLocaleString('fr-FR')} FCFA
                <span className="text-sm font-normal text-gray-500 ml-1">/mois</span>
              </div>

              {/* Localisation */}
              <div className="flex items-center text-gray-600 gap-1">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm capitalize">
                  {property.location.startsWith('locations.') ? property.location.replace('locations.', '') : property.location}
                </span>
                {property.address && <span className="text-sm text-gray-400">— {property.address}</span>}
              </div>

              {/* Caractéristiques */}
              <div className="flex items-center gap-6 py-3 border-y border-gray-100">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <House className="h-4 w-4" />{property.beds} chambre{property.beds > 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Bath className="h-4 w-4" />{property.baths} salle{property.baths > 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Square className="h-4 w-4" />{property.area} m²
                </div>
              </div>

              {/* Propriétaire */}
              {property.landlord && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Propriétaire</p>
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{property.landlord.name}</span>
                  </div>
                  {property.landlord.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{property.landlord.phone}</span>
                    </div>
                  )}
                  {property.landlord.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{property.landlord.city}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {property.description && (
                <p className="text-sm text-gray-600 line-clamp-3">{property.description}</p>
              )}

              {/* Images supplémentaires */}
              {property.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {property.images.slice(1, 5).map((img: string, i: number) => (
                    <img key={i} src={img} alt="" className="h-16 w-full object-cover rounded-lg" />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Désactiver
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  <Loader2 className={`h-4 w-4 animate-spin mr-2 ${actionLoading ? '' : 'hidden'}`} />
                  <CheckCircle className={`h-4 w-4 mr-2 ${actionLoading ? 'hidden' : ''}`} />
                  Approuver
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
