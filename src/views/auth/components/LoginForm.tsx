'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Lock, Mail } from 'lucide-react';
import { Field } from '@/components/ui/Form';
import URL from '@/utilis/url/url_front';
import { AuthAlert, AuthButton, AuthCard, IconInput, PasswordInput } from './AuthUI';

interface LoginFormProps {
  onSuccess: (credentials: { emailOrPhone: string; password: string }) => Promise<void>;
  /** Message transmis par une autre page (ex. « Compte créé. Connectez-vous. »). */
  notice?: string | null;
}

export default function LoginForm({ onSuccess, notice }: LoginFormProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await onSuccess(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.validation.signin_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <AuthCard
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={<>{t('auth.login.noAccount')}{' '}<Link href={URL.auth.register} className="font-semibold text-brand hover:underline">{t('auth.login.signup')}</Link></>}
    >
      {notice && !error && <AuthAlert tone="success">{notice}</AuthAlert>}
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={t('auth.login.emailOrPhone')} htmlFor="emailOrPhone">
          <IconInput
            icon={Mail}
            id="emailOrPhone"
            name="emailOrPhone"
            autoComplete="username"
            required
            disabled={isLoading}
            value={formData.emailOrPhone}
            onChange={handleChange}
            placeholder={t('auth.placeholder.emailOrPhone')}
          />
        </Field>

        <Field label={t('auth.login.password')} htmlFor="password">
          <PasswordInput
            icon={Lock}
            id="password"
            name="password"
            autoComplete="current-password"
            required
            disabled={isLoading}
            value={formData.password}
            onChange={handleChange}
            placeholder={t('auth.placeholder.password')}
          />
        </Field>
        <Link href={URL.auth.forgotPassword} className="-mt-2 self-end text-xs font-medium text-brand hover:underline">
          {t('auth.login.forgotPassword')}
        </Link>

        <AuthButton loading={isLoading}>{isLoading ? 'Connexion en cours…' : t('auth.login.submit')}</AuthButton>
      </form>
    </AuthCard>
  );
}
