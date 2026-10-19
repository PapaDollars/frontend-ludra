import { Suspense } from 'react';
import Register from '@/views/auth/Register';

// useSearchParams impose une frontière Suspense en App Router.
export default function RegisterRoute() {
  return (
    <Suspense>
      <Register />
    </Suspense>
  );
}
