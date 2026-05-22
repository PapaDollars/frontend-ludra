'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';

import AddPropertyForm from '@/components/common/form/AddPropertyForm';
import { Button } from '@/components/common/ui/Button';
import { adminService } from '@/services/admin.service';
import { useRole } from '@/hooks/useRole';
import URL from '@/utilis/url/url_front';

export default function AddPropertyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAdmin } = useRole();
  const [isSuccess, setIsSuccess] = useState(false);
  const [landlords, setLandlords] = useState<{ id: string; name: string; email: string }[] | undefined>(undefined);

  useEffect(() => {
    if (!isAdmin) return;
    adminService.getLandlords()
      .then(setLandlords)
      .catch(() => setLandlords([]));
  }, [isAdmin]);

  const handleSuccess = () => {
    router.push(URL.landlord.properties + '?added=1');
  };

  const handleCancel = () => {
    router.back();
  };

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