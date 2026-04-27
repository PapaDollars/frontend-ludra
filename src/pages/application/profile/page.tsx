'use client';

import { useEffect, useState } from 'react';
import { useSafeSession } from '@/hooks/useSafeSession';
import { useTranslation } from 'react-i18next';
import ProfessionalProfile from '@/components/common/_others/ProfessionalProfile';
import { authService } from '@/services/auth.service';

export default function ProfilPage() {
  const { data: session, status } = useSafeSession();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) { setLoading(false); return; }
    authService.getMe()
      .then((data) => { setUser(data); setLoading(false); })
      .catch(() => {
        // Fallback : utiliser les données de la session si l'API échoue
        setUser({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          phone: (session.user as any).phone,
          role: (session.user as any).role,
          avatar: (session.user as any).avatar,
          city: (session.user as any).city,
          emailVerified: (session.user as any).emailVerified,
          phoneVerified: (session.user as any).phoneVerified,
        });
        setLoading(false);
      });
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('profile_user.not_connected')}</h1>
          <p className="text-gray-600 mb-6">{t('profile_user.please_login')}</p>
          <a href="/auth/login" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">{t('common.login')}</a>
        </div>
      </div>
    );
  }

  return <ProfessionalProfile user={user} isEditable={true} />;
}
