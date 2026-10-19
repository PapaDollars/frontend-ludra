import { Suspense } from 'react';
import ResetPassword from '@/views/auth/ResetPassword';

// useSearchParams impose une frontière Suspense en App Router.
export default function ResetPasswordRoute() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}
