import type { Metadata } from 'next';
import { DefectDetail } from '@/components/views/defect-detail';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: decodeURIComponent(id) };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const key = decodeURIComponent(id);
  return <DefectDetail key={key} id={key} />;
}
