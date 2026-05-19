'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import AnimatedBackground from '@/components/common/_others/AnimatedBackground';
import URL from '@/utilis/url/url_front';

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

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />

      <div className="z-10 w-full max-w-md">
        <Card className="p-8 bg-white/90 backdrop-blur-sm">

          {sent ? (
            /* ── Confirmation ── */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Email envoyé !</h2>
              <p className="text-gray-500 mb-2 leading-relaxed">
                Si un compte existe avec l&apos;adresse <strong className="text-gray-700">{email}</strong>,
                vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Pensez à vérifier vos spams si vous ne voyez rien.
              </p>
              <Link href={URL.auth.login}>
                <Button variant="outline" className="w-full border-primary text-primary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            /* ── Formulaire ── */
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
                <p className="text-gray-500">
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={t('auth.placeholder.email')}
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    'Envoyer le lien'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href={URL.auth.login} className="text-sm text-primary font-medium hover:underline flex items-center justify-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
