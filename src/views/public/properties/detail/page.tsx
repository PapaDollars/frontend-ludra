'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSafeSession } from '@/hooks/useSafeSession';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Star, House, Bath, Square, Wifi, Car,
  Shield, Trees, Dumbbell, Heart, Share2, Phone,
  Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';

import { propertyService } from '@/services/property.service';
import { favoriteService } from '@/services/favorite.service';
import { contactService } from '@/services/contact.service';
import { visitService } from '@/services/visit.service';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import Link from 'next/link';
import URL from '@/utilis/url/url_front';
import RouterBack from '@/components/common/ui/RouterBack';
import LoginModal from '@/components/common/modals/LoginModal';
import ContactConfirmModal from '@/components/common/modals/ContactConfirmModal';

export default function PropertyDetailPage() {
  const params = useParams();
  const { t } = useTranslation();
  const { data: session } = useSafeSession();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showContactConfirm, setShowContactConfirm] = useState(false);
  const [modalActionType, setModalActionType] = useState<'contact' | 'favorite' | 'schedule' | 'general'>('general');
  const [contactSent, setContactSent] = useState(false);
  const [visitSent, setVisitSent] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const propertyId = params?.id as string;

  useEffect(() => {
    if (!propertyId) return;
    propertyService.getById(propertyId)
      .then((data) => { setProperty(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [propertyId]);

  useEffect(() => {
    if (!session || !propertyId) return;
    favoriteService.getFavorites()
      .then((list) => setIsFavorite(list.some((p: any) => p.id === propertyId)))
      .catch(() => {});
  }, [session, propertyId]);

  const handleAction = async (actionType: 'contact' | 'favorite' | 'schedule') => {
    if (!session) {
      setModalActionType(actionType);
      setShowLoginModal(true);
      return;
    }

    if (actionType === 'contact') {
      // Afficher le modal de confirmation avant d'envoyer
      setShowContactConfirm(true);
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'favorite') {
        const res = await favoriteService.toggle(propertyId);
        setIsFavorite(res.isFavorite);
      } else if (actionType === 'schedule') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await visitService.request(propertyId, tomorrow.toISOString(), 'Je souhaite visiter ce logement.');
        setVisitSent(true);
      }
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmContact = async () => {
    setActionLoading(true);
    try {
      await contactService.send(
        propertyId,
        `Bonjour, je suis intéressé(e) par votre bien "${property?.title}". Merci de me contacter.`
      );
      setContactSent(true);
      setShowContactConfirm(false);
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('property_details.not_found')}</h1>
          <p className="text-gray-600 mb-6">{t('property_details.not_found_description')}</p>
          <Link href={URL.public.properties}><Button>{t('property_details.back_to_properties')}</Button></Link>
        </Card>
      </div>
    );
  }

  const images = property.images?.length ? property.images : [property.image].filter(Boolean);
  const currentImage = images[currentImageIndex] || property.image;
  const nextImage = () => setCurrentImageIndex((p) => (p === images.length - 1 ? 0 : p + 1));
  const prevImage = () => setCurrentImageIndex((p) => (p === 0 ? images.length - 1 : p - 1));

  const amenityIcons: Record<string, any> = {
    wifi: Wifi, parking: Car, security: Shield, garden: Trees,
    gym: Dumbbell, pool: Trees, ac: House, furnished: House, balcony: Trees, elevator: Shield,
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <RouterBack />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Galerie */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="relative">
                <img src={currentImage || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop'} alt={property.title} className="w-full h-96 object-cover" />
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg">
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_: any, i: number) => (
                        <button key={i} onClick={() => setCurrentImageIndex(i)}
                          className={`w-3 h-3 rounded-full transition-all ${i === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  {property.featured && <span className="bg-secondary text-white px-3 py-1 rounded-full text-sm font-medium">{t('featured_section.featured_badge')}</span>}
                </div>
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4">
                  {images.map((img: string, i: number) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)}
                      className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${i === currentImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'}`}>
                      <img src={img} alt={`${property.title} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Infos + actions */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-secondary font-semibold text-sm uppercase tracking-wide">{t(`property_types.${property.type}`)}</span>
                  <h1 className="text-2xl font-bold text-gray-900 mt-1">{property.title}</h1>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('favorite')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-500'}`} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Share2 className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="text-sm capitalize">
                    {t(`locations.${property.location.replace('locations.', '')}`, { defaultValue: property.location.replace('locations.', '') })}
                  </span>
                </div>
                {property.rating > 0 && (
                  <div className="flex items-center bg-primary/10 px-2 py-1 rounded-full">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold text-sm">{property.rating}</span>
                  </div>
                )}
              </div>

              <div className="text-3xl font-bold text-primary mb-6">
                {property.price?.toLocaleString('fr-FR')} FCFA
                <span className="text-sm font-normal text-gray-600 ml-2">{t('featured_section.per_month')}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200">
                <div className="text-center"><House className="h-6 w-6 mx-auto mb-1 text-gray-600" /><div className="font-semibold text-lg">{property.beds}</div><div className="text-sm text-gray-600">{t('property_details.beds')}</div></div>
                <div className="text-center"><Bath className="h-6 w-6 mx-auto mb-1 text-gray-600" /><div className="font-semibold text-lg">{property.baths}</div><div className="text-sm text-gray-600">{t('property_details.baths')}</div></div>
                <div className="text-center"><Square className="h-6 w-6 mx-auto mb-1 text-gray-600" /><div className="font-semibold text-lg">{property.area}</div><div className="text-sm text-gray-600">{t('property_details.area')}</div></div>
              </div>

              {/* Contact propriétaire (visible seulement si connecté) */}
              {session && property.landlord && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Propriétaire : {property.landlord.name}</p>
                  {property.landlord.phone && <p className="text-sm text-gray-600 flex items-center gap-1"><Phone className="h-4 w-4" />{property.landlord.phone}</p>}
                </div>
              )}

              <div className="space-y-3 mt-6">
                <Button className="w-full" size="lg" onClick={() => handleAction('contact')} disabled={actionLoading || contactSent}>
                  <Phone className="h-5 w-5 mr-2" />
                  {contactSent ? 'Message envoyé ✓' : t('property_details.contact_owner')}
                </Button>
                <Button variant="outline" className="w-full" size="lg" onClick={() => handleAction('schedule')} disabled={actionLoading || visitSent}>
                  <Calendar className="h-5 w-5 mr-2" />
                  {visitSent ? 'Visite demandée ✓' : t('property_details.schedule_visit')}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">{t('property_details.description')}</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{property.description}</p>
            {property.address && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">{t('property_details.address')}</h4>
                <p className="text-gray-700">{property.address}</p>
              </div>
            )}
            {property.amenities?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Équipements</h4>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a: string) => {
                    const Icon = amenityIcons[a];
                    return (
                      <span key={a} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        {Icon && <Icon className="h-4 w-4" />}{a}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('property_details.location')}</h3>
            <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="capitalize font-medium">
                  {t(`locations.${property.location.replace('locations.', '')}`, { defaultValue: property.location.replace('locations.', '') })}
                </p>
                {property.latitude && property.longitude && (
                  <p className="text-xs mt-2">{property.latitude}, {property.longitude}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} actionType={modalActionType} />

      <ContactConfirmModal
        isOpen={showContactConfirm}
        onConfirm={handleConfirmContact}
        onCancel={() => setShowContactConfirm(false)}
        loading={actionLoading}
        userName={(session as any)?.user?.name || ''}
        userPhone={(session as any)?.user?.phone || ''}
        propertyTitle={property?.title || ''}
      />
    </div>
  );
}
