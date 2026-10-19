'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSafeSession } from '@/hooks/useSafeSession';
import RegisterForm from './components/RegisterForm';
import URL from '@/utilis/url/url_front';

export default function RegisterPage() {
  const { status } = useSafeSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || URL.v2.feed;

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(redirectTo);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === 'loading') {
    return (
      <p className="text-sm text-slate-500">Chargement…</p>
    );
  }

  return (
    <RegisterForm redirectTo={redirectTo} />
  );
}