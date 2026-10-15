import type { Metadata } from 'next';
import { DigestsView } from '@/components/views/digests-view';

type Props = { params: Promise<{ kind: string; date: string }> };

export const metadata: Metadata = { title: 'Email digests' };

export default async function Page({ params }: Props) {
  const { kind, date } = await params;
  return <DigestsView kind={kind} date={date} />;
}
