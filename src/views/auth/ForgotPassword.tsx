'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Field } from '@/components/ui/Form';
import URL from '@/utilis/url/url_front';
import { AuthAlert, AuthButton, AuthCard, AuthStatus, IconInput } from './components/AuthUI';

const backToLogin = (
  <Link href={URL.auth.login} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
    <ArrowLeft className="w-4 h-4" /> Retour à la connexion
  </Link>
);

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard>
        <AuthStatus tone="success" title="Email envoyé !" action={backToLogin}>
          <p>
            Si un compte existe avec l&apos;adresse <strong className="text-navy break-all">{email}</strong>,
            vous recevrez un lien de réinitialisation dans quelques minutes.
          </p>
          <p className="mt-2 text-xs text-slate-400">Pensez à vérifier vos spams si vous ne voyez rien.</p>
        </AuthStatus>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe."
      footer={backToLogin}
    >
      {error && <AuthAlert>{error}</AuthAlert>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Adresse email" htmlFor="email">
          <IconInput
            icon={Mail}
            id="email"
            type="email"
            autoComplete="email"
            required
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.placeholder.email')}
          />
        </Field>
        <AuthButton loading={isLoading}>{isLoading ? 'Envoi en cours…' : 'Envoyer le lien'}</AuthButton>
      </form>
    </AuthCard>
  );
}
