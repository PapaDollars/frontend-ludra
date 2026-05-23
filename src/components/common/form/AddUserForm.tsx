'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Phone, MapPin, Shield,
  X, Plus, Camera, Loader2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import { adminService } from '@/services/admin.service';
import { useSafeSession } from '@/hooks/useSafeSession';

interface AddUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddUserForm = ({ onSuccess, onCancel }: AddUserFormProps) => {
  const { t } = useTranslation();
  const { data: session } = useSafeSession();
  const currentUserRole = (session?.user as any)?.role;
  const currentUserPerms: string[] = (session?.user as any)?.adminPermissions || [];
  const canAddAdmin = currentUserRole === 'proprietaire' || currentUserPerms.includes('add_admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    city: '',
    emailVerified: false,
    phoneVerified: false,
    isActive: true,
    adminPermissions: [] as string[],
  });

  const ADMIN_PERMISSIONS = [
    { value: 'manage_users',      label: 'Gestion des utilisateurs (voir, modifier, désactiver)' },
    { value: 'manage_properties', label: 'Gestion des propriétés (approuver, modifier, supprimer)' },
    { value: 'add_property',      label: 'Ajouter une propriété pour un propriétaire' },
    { value: 'add_admin',         label: 'Ajouter un administrateur' },
  ];

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      adminPermissions: prev.adminPermissions.includes(perm)
        ? prev.adminPermissions.filter(p => p !== perm)
        : [...prev.adminPermissions, perm],
    }));
  };

  const roles = [
    { value: 'user', label: 'admin_users.roles.user' },
    { value: 'landlord', label: 'admin_users.roles.landlord' },
    ...(canAddAdmin ? [{ value: 'admin', label: 'admin_users.roles.admin' }] : []),
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatar(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await adminService.createUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        city: formData.city,
        ...(formData.role === 'admin' && { adminPermissions: formData.adminPermissions }),
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      <Card className="p-8 bg-card text-card-foreground shadow-xl">
        <div className="text-center mb-8">
          <p className="text-secondary text-lg font-semibold">
            {t('admin_users.add_user_subtitle')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                  />
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 bg-secondary text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-dashed border-primary">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="user-avatar"
            />
            <label
              htmlFor="user-avatar"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-700 cursor-pointer"
            >
              <Camera className="h-4 w-4 mr-2" />
              {avatarPreview ? t('admin_users.change_avatar') : t('admin_users.upload_avatar')}
            </label>
          </div>

          {/* Section Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom complet */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary mb-2">
                <User className="h-4 w-4 inline mr-2" />
                {t('admin_users.labels.name')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-tertiary text-primary"
                placeholder={t('admin_users.placeholders.name')}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                {t('admin_users.labels.email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-tertiary text-primary"
                placeholder={t('admin_users.placeholders.email')}
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                <Phone className="h-4 w-4 inline mr-2" />
                {t('admin_users.labels.phone')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-tertiary text-primary"
                placeholder={t('admin_users.placeholders.phone')}
              />
            </div>

            {/* Rôle */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary mb-2">
                <Shield className="h-4 w-4 inline mr-2" />
                {t('admin_users.labels.role')} *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-tertiary text-primary"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {t(role.label)}
                  </option>
                ))}
              </select>

              {/* Panneau info selon le rôle sélectionné */}
              {formData.role === 'admin' && (
                <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-semibold text-orange-800 mb-3">
                    🔐 Sélectionne les permissions de cet administrateur :
                  </p>
                  <div className="space-y-2">
                    {ADMIN_PERMISSIONS.map(perm => (
                      <label key={perm.value} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.adminPermissions.includes(perm.value)}
                          onChange={() => togglePermission(perm.value)}
                          className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-sm text-orange-800 group-hover:text-orange-900">
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-orange-600 mt-3 font-medium border-t border-orange-200 pt-2">
                    ⚡ Seul le compte propriétaire (ludra.home@gmail.com) peut supprimer un administrateur.
                  </p>
                </div>
              )}
            </div>

            {/* Date de naissance */}
            {/* <div>
              <label className="block text-sm font-medium text-primary mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                {t('admin_users.labels.dateOfBirth')}
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-tertiary text-primary"
              />
            </div> */}
          </div>

          {/* Ville */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              {t('admin_users.labels.city')}
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-primary"
              placeholder={t('admin_users.placeholders.city')}
            />
          </div>

          {/* Vérifications et statut */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="emailVerified"
                checked={formData.emailVerified}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                id="email-verified"
              />
              <label htmlFor="email-verified" className="ml-2 text-sm text-primary">
                {t('admin_users.labels.emailVerified')}
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="phoneVerified"
                checked={formData.phoneVerified}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                id="phone-verified"
              />
              <label htmlFor="phone-verified" className="ml-2 text-sm text-primary">
                {t('admin_users.labels.phoneVerified')}
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                id="is-active"
              />
              <label htmlFor="is-active" className="ml-2 text-sm text-primary">
                {t('admin_users.labels.isActive')}
              </label>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border border-primary text-primary hover:bg-primary-50"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-secondary text-secondary-foreground hover:bg-secondary-700 min-w-32"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {t('common.creating')}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin_users.add_user_button')}
                </>
              )}
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

export default AddUserForm;