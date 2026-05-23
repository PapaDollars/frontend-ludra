'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';

import AddPropertyForm from '@/components/common/form/AddPropertyForm';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import { adminService } from '@/services/admin.service';
import { useRole } from '@/hooks/useRole';
import { useSafeSession } from '@/hooks/useSafeSession';
import URL from '@/utilis/url/url_front';

export default function AddPropertyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAdmin, isProprietaire, isLoading } = useRole();
  const { data: session } = useSafeSession();
  const [isSuccess, setIsSuccess] = useState(false);
  const [landlords, setLandlords] = useState<{ id: string; name: string; email: string }[] | undefined>(undefined);

  const adminPermissions: string[] = session?.user?.adminPermissions || [];
  const canAddProperty = !isAdmin || isProprietaire || adminPermissions.includes('add_property');

  useEffect(() => {
    if (!isAdmin || !canAddProperty) return;
    adminService.getLandlords()
      .then(setLandlords)
      .catch(() => setLandlords([]));
  }, [isAdmin, canAddProperty]);

  const handleSuccess = () => {
    // Admin → liste admin des propriétés ; Propriétaire → sa propre liste
    router.push(isAdmin ? URL.admin.properties + '?added=1' : URL.landlord.properties + '?added=1');
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAdmin && !canAddProperty) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center px-4">
        <Card className="p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-orange-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Accès non autorisé</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Vous n&apos;avez pas la permission d&apos;ajouter des propriétés pour un propriétaire.
            Contactez le compte propriétaire pour obtenir cet accès.
          </p>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {t('add_property.success_title')}
            </h1>
            <p className="text-gray-600 mb-8">
              {t('add_property.success_message')}
            </p>
            <Button onClick={() => router.push(URL.landlord.properties)}>
              {t('add_property.view_properties')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('add_property.page_title')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('add_property.page_subtitle')}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <AddPropertyForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          landlords={landlords}
        />
      </div>
    </div>
  );
}