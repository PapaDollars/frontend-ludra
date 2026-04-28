// app/auth/register/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeSession } from '@/hooks/useSafeSession';
import AnimatedBackground from '@/components/common/_others/AnimatedBackground';
import RegisterForm from '@/components/auth/RegisterForm';
import URL from '@/utilis/url/url_front';

export default function RegisterPage() {
  const { status } = useSafeSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(URL.app.dashboard);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
        <RegisterForm />
      </div>
    </main>
  );
}