import api from '@/lib/api';
import { withMock } from '@/lib/mock';
import { mockListingContact, mockListingDetail } from '@/mocks/listing.mock';
import { applySaved } from '@/mocks/saved.mock';
import type { ApiResponse, ContactDetails, ListingDetail } from '@/types';

export const listingService = {
  /** GET /listings/:id — fiche publique (token optionnel : isFavorite, contact débloqué, viewerIsOwner). 404 si inconnue. */
  getById(id: string) {
    return withMock(
      () => applySaved(mockListingDetail(id)),
      async () => (await api.get<ApiResponse<ListingDetail>>(`/listings/${encodeURIComponent(id)}`)).data,
    );
  },

  /** GET /listings/:id/contact — auth ; 402 PAYMENT_REQUIRED tant que le déblocage n'est pas payé. */
  getContact(id: string) {
    return withMock(
      () => mockListingContact(id),
      async () => (await api.get<ApiResponse<ContactDetails>>(`/listings/${encodeURIComponent(id)}/contact`)).data,
    );
  },
};
