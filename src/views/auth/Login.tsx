'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { setTokens } from '@/lib/api';
import AnimatedBackground from '@/components/common/_others/AnimatedBackground';
import LoginForm from '@/components/auth/LoginForm';
import URL from '@/utilis/url/url_front';
import { useSafeSession } from '@/hooks/useSafeSession';

export default function LoginPage() {
  const { data: session, status } = useSafeSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;
    const role = session?.user?.role;
    if (role === 'admin') {
      router.replace(URL.admin.dashboard);
    } else if (role === 'landlord') {
      router.replace(URL.landlord.dashboard);
    } else {
      router.replace(URL.app.dashboard);
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
      <main className="relative min-h-screen flex items-center justify-center p-4">
        <AnimatedBackground />
        <div className="z-10 text-white">Chargement...</div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      <div className="z-10 w-full max-w-lg">
        <LoginForm onSuccess={handleSuccess} />
      </div>
    </main>
  );
}