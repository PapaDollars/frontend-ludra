import api from '@/lib/api';
import { withMock } from '@/lib/mock';
import { mockReport } from '@/mocks/listing.mock';
import type { ApiResponse, ReportInput } from '@/types';

export const reportService = {
  /** POST /reports { targetType, targetId, reason, details? } — auth ; alimente la file de modération (M16). */
  create(input: ReportInput) {
    return withMock(
      () => mockReport(input),
      async () => (await api.post<ApiResponse<{ received: boolean }>>(`/reports`, input)).data,
    );
  },
};
