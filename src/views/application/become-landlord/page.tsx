'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, User, Camera, CheckCircle, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';
import api from '@/lib/api';
import URL from '@/utilis/url/url_front';
import { useSafeSession } from '@/hooks/useSafeSession';

const schema = z.object({
  fullName: z.string().min(3, 'Le nom complet est requis (prénom + nom)').refine(
    (v) => v.trim().split(/\s+/).length >= 2,
    'Entrez votre prénom ET votre nom de famille'
  ),
  confirmed: z.boolean().refine(
    (value) => value === true,
    'Vous devez confirmer que les informations correspondent à votre CNI'
  ),
});

type FormData = z.infer<typeof schema>;

export default function BecomeLandlordPage() {
  const { data: session, status } = useSafeSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(session?.user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: session?.user?.name || '' },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(URL.auth.login);
      return;
    }

    if (session?.user?.role === 'landlord') {
      router.replace(URL.landlord.dashboard);
      return;
    }

    if (session?.user?.role === 'admin') {
      router.replace(URL.admin.dashboard);
    }
  }, [status, session?.user?.role, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role === 'landlord' || session?.user?.role === 'admin') {
    return null;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    // Use FileReader for preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    if (!avatar && !session?.user?.avatar) {
      setError('Une photo de profil est obligatoire pour devenir propriétaire.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('fullName', data.fullName.trim());
      if (avatar) {
        formData.append('avatar', avatar);
      }

      await api.patch('/users/become-landlord', formData);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-10 text-center bg-white">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Compte mis à niveau !</h2>
          <p className="text-gray-600 mb-2">
            Votre compte a été transformé en compte <strong>propriétaire</strong>.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Reconnectez-vous pour accéder à votre espace propriétaire et commencer à publier vos biens.
          </p>
          <Button
            className="w-full bg-primary hover:bg-primary-700"
            onClick={() => signOut({ callbackUrl: URL.auth.login + '?upgraded=true' })}
          >
            Se reconnecter
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* En-tête */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Devenir propriétaire</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Pour publier des biens sur Ludra, nous devons vérifier votre identité.
            Ces informations doivent correspondre à votre carte nationale d&apos;identité.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Photo de profil */}
          <Card className="p-6 bg-white border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Photo de profil
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Ajoutez une photo claire de votre visage. Elle sera visible sur vos annonces.
            </p>

            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary text-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {avatarPreview ? 'Changer la photo' : 'Ajouter une photo'}
                </Button>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG ou WebP — max 5 MB</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </Card>

          {/* Nom complet */}
          <Card className="p-6 bg-white border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Nom complet
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Entrez votre nom tel qu&apos;il apparaît sur votre carte nationale d&apos;identité.
            </p>

            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-gray-900"
              placeholder="Prénom Nom de famille"
              {...register('fullName')}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.fullName.message}
              </p>
            )}
          </Card>

          {/* Confirmation CNI */}
          <Card className="p-6 bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-amber-900 mb-3">Vérification d&apos;identité</h2>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-amber-400 text-primary focus:ring-primary"
                    {...register('confirmed')}
                    disabled={isLoading}
                  />
                  <span className="text-sm text-amber-800 leading-relaxed">
                    Je certifie que les informations ci-dessus (nom complet et photo de profil)
                    correspondent exactement à celles figurant sur ma carte nationale d&apos;identité en cours de validité.
                    Je comprends que toute fausse déclaration entraînera la suspension de mon compte.
                  </span>
                </label>
                {errors.confirmed && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.confirmed.message}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 text-base font-semibold bg-secondary hover:bg-secondary-700"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Vérification en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Building2 className="h-5 w-5" />
                Devenir propriétaire
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
