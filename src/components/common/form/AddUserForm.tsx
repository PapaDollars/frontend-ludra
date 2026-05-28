'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Phone, MapPin, Shield,
  X, Plus, Camera, Loader2, AlertCircle, Send, CheckCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import { adminService } from '@/services/admin.service';
import { authService } from '@/services/auth.service';
import { useSafeSession } from '@/hooks/useSafeSession';

interface AddUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddUserForm = ({ onSuccess, onCancel }: AddUserFormProps) => {
  const { t } = useTranslation();
  const { data: session } = useSafeSession();
  const currentUserRole = (session?.user as any)?.role;
  const currentUserPerms: string[] = session?.user?.adminPermissions || [];
  const canAddAdmin = currentUserRole === 'proprietaire' || currentUserPerms.includes('add_admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [error, setError] = useState('');

  // OTP email verification
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      await authService.sendCode(formData.email);
      setOtpSent(true);
      setOtpValue('');
      setOtpCooldown(60);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Impossible d\'envoyer le code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length < 6) { setOtpError('Entrez les 6 chiffres'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      await authService.verifyEmailCode(formData.email, otpValue);
      setOtpVerified(true);
      setFormData(prev => ({ ...prev, emailVerified: true }));
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Code invalide ou expiré');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    // reset OTP state si l'email change
    if (otpSent || otpVerified) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpValue('');
      setOtpError('');
      setOtpCooldown(0);
      setFormData(prev => ({ ...prev, emailVerified: false }));
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Ludra1234',
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
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  required
                  disabled={otpVerified}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-tertiary text-primary ${otpVerified ? 'border-green-400 bg-green-50' : 'border-border'}`}
                  placeholder={t('admin_users.placeholders.email')}
                />
                {otpVerified && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>

              {/* Bouton envoyer le code */}
              {isValidEmail(formData.email) && !otpVerified && (
                <div className="mt-2">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      className="flex items-center gap-1.5 text-sm text-secondary font-medium hover:underline disabled:opacity-50"
                    >
                      {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Envoyer un code de vérification
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Code envoyé à <span className="font-medium">{formData.email}</span></p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpValue}
                          onChange={e => { setOtpValue(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                          placeholder="000000"
                          className="w-32 px-3 py-1.5 border border-border rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-primary focus:border-primary bg-tertiary text-primary"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpLoading || otpValue.length < 6}
                          className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpCooldown > 0 || otpLoading}
                          className="px-3 py-1.5 text-sm text-gray-500 hover:text-primary disabled:opacity-40 flex items-center gap-1"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          {otpCooldown > 0 ? `${otpCooldown}s` : 'Renvoyer'}
                        </button>
                      </div>
                      {otpError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> {otpError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {otpVerified && (
                <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Email vérifié
                </p>
              )}
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

            {/* Mot de passe par défaut — lecture seule, visible uniquement par l'admin */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-primary mb-2">
                Mot de passe par défaut
              </label>
              <div className="flex items-center gap-3 px-3 py-2 border border-border rounded-lg bg-amber-50 border-amber-200">
                <span className="font-mono text-base font-bold text-amber-800 tracking-widest flex-1">Ludra1234</span>
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Provisoire</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Communiquez ce mot de passe à l&apos;utilisateur. Il pourra le modifier depuis son profil.</p>
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="emailVerified"
                checked={formData.emailVerified}
                readOnly
                disabled
                className="rounded border-gray-300 text-primary focus:ring-primary cursor-not-allowed opacity-70"
                id="email-verified"
              />
              <label htmlFor="email-verified" className={`text-sm ${otpVerified ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                {t('admin_users.labels.emailVerified')}
                {!otpVerified && <span className="ml-1 text-xs">(vérification OTP requise)</span>}
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