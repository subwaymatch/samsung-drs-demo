import type { Metadata } from 'next';
import { DefectForm } from '@/components/views/defect-form';

export const metadata: Metadata = { title: 'Report a defect' };

export default function Page() {
  return <DefectForm />;
}
