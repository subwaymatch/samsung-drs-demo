import type { Metadata } from 'next';
import { DigestsView } from '@/components/views/digests-view';

export const metadata: Metadata = { title: 'Email digests' };

export default function Page() {
  return <DigestsView />;
}
