import type { Metadata } from 'next';
import { DefectForm } from '@/components/views/defect-form';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: 'Edit ' + decodeURIComponent(id) };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <DefectForm id={decodeURIComponent(id)} />;
}
