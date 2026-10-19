'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Field } from '@/components/ui/Form';
import URL from '@/utilis/url/url_front';
import { AuthAlert, AuthButton, AuthCard, AuthStatus, PasswordInput } from './components/AuthUI';

const linkButton = 'w-full h-11 rounded-lg bg-brand text-white text-sm font-semibold inline-flex items-center justify-center hover:bg-brand-700';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <AuthCard>
        <AuthStatus tone="error" title="Lien invalide"
          action={<Link href={URL.auth.forgotPassword} className={linkButton}>Faire une nouvelle demande</Link>}>
          Ce lien de réinitialisation est invalide ou a expiré.
        </AuthStatus>
      </AuthCard>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword(token, password, confirmPassword);
      setSuccess(true);
      setTimeout(() => router.push(URL.auth.login), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lien expiré ou invalide. Veuillez faire une nouvelle demande.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard>
        <AuthStatus tone="success" title="Mot de passe mis à jour !"
          action={<Link href={URL.auth.login} className={linkButton}>Se connecter maintenant</Link>}>
          Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion…
        </AuthStatus>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nouveau mot de passe" subtitle="Choisissez un mot de passe sécurisé d'au moins 8 caractères.">
      {error && <AuthAlert>{error}</AuthAlert>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nouveau mot de passe" htmlFor="new-password">
          <PasswordInput icon={Lock} id="new-password" autoComplete="new-password" required disabled={isLoading}
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 caractères" />
        </Field>
        <Field label="Confirmer le mot de passe" htmlFor="confirm-password">
          <PasswordInput icon={Lock} id="confirm-password" autoComplete="new-password" required disabled={isLoading}
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Répétez le mot de passe" />
        </Field>
        <AuthButton loading={isLoading}>{isLoading ? 'Mise à jour…' : 'Réinitialiser le mot de passe'}</AuthButton>
      </form>
    </AuthCard>
  );
}
