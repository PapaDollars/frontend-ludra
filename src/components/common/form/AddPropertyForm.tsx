'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, MapPin, DollarSign, Bed, Bath, Square, Star, Upload, X, Plus, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import { propertyService } from '@/services/property.service';
import { LOCATIONS, PROPERTY_TYPES, AMENITIES } from '@/utilis/propertyData';

interface AddPropertyFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  landlords?: { id: string; name: string; email: string }[];
}


const AddPropertyForm = ({ onSuccess, onCancel, landlords }: AddPropertyFormProps) => {
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'apartment',
    price: '',
    location: '',
    beds: '',
    baths: '',
    area: '',
    address: '',
    description: '',
    latitude: '',
    longitude: '',
    featured: false,
    amenities: [] as string[],
    selectedLandlordId: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAmenityChange = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('title', formData.title.trim());
      fd.append('type', formData.type);
      fd.append('price', formData.price);
      fd.append('location', formData.location);
      fd.append('beds', formData.beds);
      fd.append('baths', formData.baths);
      if (formData.area) fd.append('area', formData.area);
      fd.append('address', formData.address.trim());
      if (formData.description) fd.append('description', formData.description.trim());
      if (formData.latitude) fd.append('latitude', formData.latitude);
      if (formData.longitude) fd.append('longitude', formData.longitude);
      fd.append('featured', String(formData.featured));
      if (formData.selectedLandlordId) fd.append('landlordId', formData.selectedLandlordId);
      fd.append('amenities', JSON.stringify(formData.amenities));

      images.forEach(img => fd.append('images', img));

      await propertyService.create(fd);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la propriété');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      <Card className="p-8 bg-card text-card-foreground shadow-xl">
        <div className="text-center mb-8">
          <p className="text-secondary text-lg font-semibold">{t('add_property.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sélecteur propriétaire (admin uniquement) */}
          {landlords !== undefined && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-semibold text-blue-800 mb-2">
                👤 Propriétaire du bien *
              </label>
              {landlords.length === 0 ? (
                <div className="text-sm text-blue-700 bg-blue-100 rounded-lg p-3">
                  Aucun compte propriétaire disponible.
                  <a href="/admin/users/add" className="font-semibold underline ml-1">
                    Créer un compte propriétaire d&apos;abord →
                  </a>
                </div>
              ) : (
                <>
                  <select
                    value={formData.selectedLandlordId}
                    onChange={(e) => setFormData(prev => ({ ...prev, selectedLandlordId: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-primary"
                  >
                    <option value="">Sélectionner un propriétaire...</option>
                    {landlords.map(l => (
                      <option key={l.id} value={l.id}>{l.name} — {l.email}</option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">
                    La propriété sera ajoutée au compte du propriétaire sélectionné.
                  </p>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Titre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary mb-2">{t('add_property.labels.title')} *</label>
              <input
                type="text" name="title" value={formData.title} onChange={handleInputChange} required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-tertiary text-primary"
                placeholder={t('add_property.placeholders.title')}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                <Home className="h-4 w-4 inline mr-2" />{t('add_property.labels.type')} *
              </label>
              <select name="type" value={formData.type} onChange={handleInputChange} required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-tertiary text-primary">
                {PROPERTY_TYPES.map(t2 => <option key={t2.value} value={t2.value}>{t(t2.label)}</option>)}
              </select>
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                <MapPin className="h-4 w-4 inline mr-2" />{t('add_property.labels.location')} *
              </label>
              <select name="location" value={formData.location} onChange={handleInputChange} required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-tertiary text-primary">
                <option value="">{t('add_property.placeholders.select_location')}</option>
                {LOCATIONS.map(l => <option key={l.value} value={l.value}>{t(l.label)}</option>)}
              </select>
            </div>

            {/* Prix */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary mb-2">
                <DollarSign className="h-4 w-4 inline mr-2" />{t('add_property.labels.price')} (FCFA/mois) *
              </label>
              <input
                type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-secondary bg-tertiary text-primary"
                placeholder="250000"
              />
            </div>

            {/* Chambres / Salles de bain / Surface */}
            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  <Bed className="h-4 w-4 inline mr-2" />{t('add_property.labels.beds')} *
                </label>
                <input type="number" name="beds" value={formData.beds} onChange={handleInputChange} required min="0" max="20"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-tertiary text-primary" placeholder="3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  <Bath className="h-4 w-4 inline mr-2" />{t('add_property.labels.baths')} *
                </label>
                <input type="number" name="baths" value={formData.baths} onChange={handleInputChange} required min="0" max="10"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-tertiary text-primary" placeholder="2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  <Square className="h-4 w-4 inline mr-2" />{t('add_property.labels.area')} (m²)
                </label>
                <input type="number" name="area" value={formData.area} onChange={handleInputChange} min="1"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-tertiary text-primary" placeholder="120" />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">{t('add_property.labels.address')} *</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} required
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-tertiary text-primary"
              placeholder={t('add_property.placeholders.address')} />
          </div>

          {/* GPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2"><Globe className="h-4 w-4 inline mr-2" />Latitude</label>
              <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-tertiary text-primary" placeholder="4.0511" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2"><Globe className="h-4 w-4 inline mr-2" />Longitude</label>
              <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-tertiary text-primary" placeholder="9.7000" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">{t('add_property.labels.description')}</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-tertiary text-primary"
              placeholder={t('add_property.placeholders.description')} />
          </div>

          {/* Équipements */}
          <div>
            <label className="block text-sm font-medium text-primary mb-3">{t('add_property.labels.amenities')}</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(a => (
                <button key={a.value} type="button" onClick={() => handleAmenityChange(a.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${formData.amenities.includes(a.value) ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
                  {t(a.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">{t('add_property.labels.images')}</label>
            <div className="border-2 border-dashed border-primary rounded-lg p-6 text-center bg-tertiary">
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-secondary mb-4">{t('add_property.upload_description')}</p>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" id="property-images" />
              <label htmlFor="property-images" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-700 cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />{t('add_property.upload_button')}
              </label>
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-primary" />
                    <button type="button" onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-secondary text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Principale</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vedette */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured-property"
              checked={false}
              onChange={() => setShowFeaturedModal(true)}
              className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="featured-property" className="ml-2 flex items-center text-sm text-primary cursor-pointer">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              {t('add_property.labels.featured')}
            </label>
          </div>

          {/* Modal "fonctionnalité à venir" */}
          {showFeaturedModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4"
              onClick={() => setShowFeaturedModal(false)}>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center"
                onClick={e => e.stopPropagation()}>
                <div className="text-5xl mb-4">🚧</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fonctionnalité à venir</h3>
                <p className="text-gray-500 mb-6">
                  La mise en vedette des propriétés sera disponible prochainement.
                  Restez connecté pour ne pas manquer cette nouveauté !
                </p>
                <Button variant="primary" className="w-full" onClick={() => setShowFeaturedModal(false)}>
                  D&apos;accord, compris
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="border border-primary text-primary hover:bg-primary-50">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-secondary text-secondary-foreground hover:bg-secondary-700 min-w-32">
              <Loader2 className={`h-4 w-4 mr-2 animate-spin ${isSubmitting ? '' : 'hidden'}`} />
              <Plus className={`h-4 w-4 mr-2 ${isSubmitting ? 'hidden' : ''}`} />
              <span>{isSubmitting ? t('common.creating') : t('add_property.submit_button')}</span>
            </Button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </p>
          )}
        </form>
      </Card>
    </div>
  );
};

export default AddPropertyForm;
