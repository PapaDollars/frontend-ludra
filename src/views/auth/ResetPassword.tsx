'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import AnimatedBackground from '@/components/common/_others/AnimatedBackground';
import URL from '@/utilis/url/url_front';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <main className="relative min-h-screen flex items-center justify-center p-4">
        <AnimatedBackground />
        <div className="z-10 w-full max-w-md">
          <Card className="p-8 bg-white/90 backdrop-blur-sm text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Lien invalide</h2>
            <p className="text-gray-500 mb-6">Ce lien de réinitialisation est invalide ou a expiré.</p>
            <Link href={URL.auth.forgotPassword}>
              <Button variant="primary" className="w-full">Faire une nouvelle demande</Button>
            </Link>
          </Card>
        </div>
      </main>
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

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />

      <div className="z-10 w-full max-w-md">
        <Card className="p-8 bg-white/90 backdrop-blur-sm">

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Mot de passe mis à jour !</h2>
              <p className="text-gray-500 mb-6">
                Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion…
              </p>
              <Link href={URL.auth.login}>
                <Button variant="primary" className="w-full">Se connecter maintenant</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h1>
                <p className="text-gray-500">Choisissez un mot de passe sécurisé d&apos;au moins 8 caractères.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                      placeholder="Minimum 8 caractères"
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      disabled={isLoading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                      placeholder="Répétez le mot de passe"
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                  <Loader2 className={`h-5 w-5 mr-2 animate-spin ${isLoading ? '' : 'hidden'}`} />
                  <span>{isLoading ? 'Mise à jour…' : 'Réinitialiser le mot de passe'}</span>
                </Button>
                {error && (
                  <p className="mt-3 text-sm text-red-600 text-center">
                    {error}
                  </p>
                )}
              </form>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
