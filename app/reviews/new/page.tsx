import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loading } from '@/components/common/basics';
import { ReviewForm } from '@/components/views/review-form';

export const metadata: Metadata = { title: 'Request a code review' };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ReviewForm />
    </Suspense>
  );
}
