import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loading } from '@/components/common/basics';
import { ReviewsList } from '@/components/views/reviews-list';

export const metadata: Metadata = { title: 'Code reviews' };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ReviewsList />
    </Suspense>
  );
}
