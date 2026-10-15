import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loading } from '@/components/common/basics';
import { DefectsList } from '@/components/views/defects-list';

export const metadata: Metadata = { title: 'Defects' };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <DefectsList />
    </Suspense>
  );
}
