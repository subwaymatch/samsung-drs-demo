import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loading } from '@/components/common/basics';
import { ReviewForm } from '@/components/views/review-form';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: 'Edit ' + decodeURIComponent(id) };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <ReviewForm id={decodeURIComponent(id)} />
    </Suspense>
  );
}
