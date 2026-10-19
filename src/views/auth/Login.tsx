'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { setTokens } from '@/lib/api';
import LoginForm from './components/LoginForm';
import URL from '@/utilis/url/url_front';
import { useSafeSession } from '@/hooks/useSafeSession';

export default function LoginPage() {
  const { data: session, status } = useSafeSession();
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  // Lu après montage : évite une frontière Suspense pour useSearchParams.
  useEffect(() => { setNotice(new URLSearchParams(window.location.search).get('message')); }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const role = session?.user?.role;
    // Retour vers la page d'origine (ex. "Enregistrer" sur le feed) — chemins internes uniquement.
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.startsWith('/auth')) {
      router.replace(redirect);
    } else if (role === 'admin') {
      router.replace(URL.admin.dashboard);
    } else if (role === 'landlord') {
      router.replace(URL.v2.account);
    } else {
      router.replace(URL.v2.feed);
    }
  // status suffit — session est recréé à chaque poll NextAuth et causerait une boucle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleSuccess = async (credentials: { emailOrPhone: string; password: string }) => {
    const result = await signIn('credentials', {
      emailOrPhone: credentials.emailOrPhone,
      password: credentials.password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error.startsWith('ACCOUNT_DISABLED:')) {
        throw new Error(result.error.replace('ACCOUNT_DISABLED:', ''));
      }
      throw new Error('Email/téléphone ou mot de passe incorrect');
    }

    // Stocker les tokens dans localStorage pour que api.ts puisse les utiliser
    const freshSession = await getSession() as any;
    if (freshSession?.accessToken) {
      setTokens(freshSession.accessToken, freshSession.refreshToken || '');
    }
  };

  if (status === 'loading') {
    return (
      <p className="text-sm text-slate-500">Chargement…</p>
    );
  }

  return (
    <LoginForm onSuccess={handleSuccess} notice={notice} />
  );
}