import api from '@/lib/api';
import { withMock } from '@/lib/mock';
import { mockServiceCategories, mockServiceProvider } from '@/mocks/services.mock';
import type { ApiResponse, ServiceCategory, ServiceProviderDetail } from '@/types';

export const servicesService = {
  /** GET /services/categories — catégories actives (administrables), avec nombre de prestataires. Public. */
  categories() {
    return withMock(
      () => mockServiceCategories(),
      async () => (await api.get<ApiResponse<ServiceCategory[]>>(`/services/categories`, { auth: false })).data,
    );
  },

  /** GET /services/providers/:id — profil prestataire (token optionnel). 404 si inconnu. */
  provider(id: string) {
    return withMock(
      () => mockServiceProvider(id),
      async () => (await api.get<ApiResponse<ServiceProviderDetail>>(`/services/providers/${encodeURIComponent(id)}`)).data,
    );
  },
};
