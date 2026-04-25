'use client';

import { useEffect, useState } from 'react';
import { X, User, Phone, Mail, MapPin, House, Bath, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/ui/Button';
import { type Notification } from '@/services/notification.service';
import { propertyService } from '@/services/property.service';

interface ContactRequestModalProps {
  notification: Notification | null;
  onClose: () => void;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=300&fit=crop';

/** Extrait nom et téléphone depuis l'ancien format de message */
function extractFromMessage(message: string): { name: string; phone: string | null } {
  // Ancien format avec téléphone : "Nom (0612345) est intéressé(e)..."
  const withPhone = message.match(/^(.+?) \(([^)]+)\) est intéressé/);
  if (withPhone) return { name: withPhone[1].trim(), phone: withPhone[2].trim() };
  // Format sans téléphone : "Nom est intéressé(e)..."
  const noPhone = message.match(/^(.+?) est intéressé/);
  return { name: noPhone ? noPhone[1].trim() : '—', phone: null };
}

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Appartement', studio: 'Studio', house: 'Maison', room: 'Chambre', loft: 'Loft',
};

export default function ContactRequestModal({ notification, onClose }: ContactRequestModalProps) {
  const [property, setProperty] = useState<any>(null);
  const [loadingProp, setLoadingProp] = useState(false);

  useEffect(() => {
    if (!notification?.propertyId) return;
    setProperty(null);
    setLoadingProp(true);
    propertyService.getById(notification.propertyId)
      .then(setProperty)
      .catch(() => {})
      .finally(() => setLoadingProp(false));
  }, [notification?.propertyId]);

  if (!notification) return null;

  const extracted = extractFromMessage(notification.message);
  const contactName = notification.contactName || extracted.name;
  const contactPhone = notification.contactPhone || extracted.phone;
  const contactEmail = notification.contactEmail || null;

  const date = new Date(notification.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">📩</span>
            <h2 className="text-base font-bold text-gray-900">Demande de contact</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Propriété concernée ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Propriété concernée</p>
            {loadingProp ? (
              <div className="flex items-center justify-center h-24 bg-gray-50 rounded-xl">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : property ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <img
                  src={property.image || FALLBACK_IMG}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                  alt={property.title}
                  className="w-full h-36 object-cover"
                />
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                        {TYPE_LABELS[property.type] || property.type}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5">{property.title}</h3>
                    </div>
                    <p className="text-base font-bold text-primary whitespace-nowrap">
                      {property.price?.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs capitalize">{property.location}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <span className="flex items-center gap-1"><House className="h-3.5 w-3.5" />{property.beds} ch.</span>
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.baths} sdb.</span>
                    <span className="flex items-center gap-1"><Square className="h-3.5 w-3.5" />{property.area} m²</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-600 font-medium">{notification.propertyTitle || '—'}</p>
              </div>
            )}
          </div>

          {/* ── Demandeur ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Informations du demandeur</p>
            <div className="space-y-2">

              {/* Nom */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Nom</p>
                  <p className="text-sm font-bold text-gray-900">{contactName}</p>
                </div>
              </div>

              {/* Téléphone */}
              {contactPhone ? (
                <a href={`tel:${contactPhone}`}
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600">Téléphone — Appuyer pour appeler</p>
                    <p className="text-sm font-bold text-green-800">{contactPhone}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl opacity-60">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Téléphone</p>
                    <p className="text-sm text-gray-400 italic">Non renseigné</p>
                  </div>
                </div>
              )}

              {/* Email */}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`}
                  className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Email — Appuyer pour écrire</p>
                    <p className="text-sm font-bold text-blue-800">{contactEmail}</p>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Date + fermer */}
          <p className="text-xs text-gray-400 text-center">{date}</p>
          <Button variant="outline" className="w-full" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}
