'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';

import { registerSchema, type RegisterForm as RegisterFormType } from '@/utilis/auth_validations';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import URL from '@/utilis/url/url_front';

export default function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormType>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormType) => {
    setIsLoading(true);
    setError('');

    try {
      // Créer le compte en tant que locataire (role='user' par défaut)
      await authService.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: 'user',
      });

      // Connexion automatique via NextAuth
      const result = await signIn('credentials', {
        emailOrPhone: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        router.push(URL.auth.login + '?message=Compte créé. Connectez-vous.');
        return;
      }

      router.push(URL.public.properties);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto"
    >
      <Card className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-1">{t('auth.register.title')}</h2>
            <p className="text-gray-500 text-sm">{t('auth.register.subtitle')}</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.register.name')}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder={t('auth.placeholder.name')}
                {...register('name')}
                disabled={isLoading}
              />
            </div>
            {errors.name && <span className="text-red-500 text-xs mt-1 block">{t(errors.name.message as string)}</span>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.register.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder={t('auth.placeholder.email')}
                {...register('email')}
                disabled={isLoading}
              />
            </div>
            {errors.email && <span className="text-red-500 text-xs mt-1 block">{t(errors.email.message as string)}</span>}
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.register.phone')}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="+237612345678"
                {...register('phone')}
                disabled={isLoading}
              />
            </div>
            {errors.phone && <span className="text-red-500 text-xs mt-1 block">{t(errors.phone.message as string)}</span>}
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.register.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder={t('auth.placeholder.password')}
                {...register('password')}
                disabled={isLoading}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <span className="text-red-500 text-xs mt-1 block">{t(errors.password.message as string)}</span>}
            <p className="text-xs text-gray-400 mt-1">Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre</p>
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.register.confirmPassword')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder={t('auth.placeholder.confirmPassword')}
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <span className="text-red-500 text-xs mt-1 block">{t(errors.confirmPassword.message as string)}</span>}
          </div>

          <Button type="submit" className="w-full py-3 text-base font-semibold bg-primary hover:bg-primary-600" disabled={isLoading}>
            {isLoading ? t('auth.register.loading') : t('auth.register.submit')}
          </Button>

          <p className="text-center text-sm text-gray-600">
            {t('auth.register.hasAccount')}{' '}
            <Link href={URL.auth.login} className="text-primary font-semibold hover:underline">{t('auth.register.signin')}</Link>
          </p>
        </form>
      </Card>
    </motion.div>
  );
}
